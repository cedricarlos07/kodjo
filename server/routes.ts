import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { StorageFactory } from "./storage-factory";

// Obtenir l'instance de stockage
const storage = StorageFactory.getInstance();
import { insertUserSchema, insertCourseSchema, insertScheduledMessageSchema } from "@shared/schema";
import { telegramService } from "./services/telegram";
import { zoomService } from "./services/zoom";
import { schedulerService } from "./services/scheduler";
import { simulationModeService } from "./services/simulationModeService";
import { analyticsService } from "./services/analyticsService";
import { courseReminderService } from "./services/courseReminderService";
import { scenariosService } from "./services/scenarios";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import path from "path";
import fs from "fs";
import { courseService } from "./services/courseService";
import { simulationService } from "./services/simulationService";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

// Create a rate limiter for login attempts
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
  skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup session management
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "edutrack-secret-" + Math.random().toString(36).substring(2, 15),
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production" || process.env.SECURE_COOKIES === "true",
        httpOnly: true, // Prevents client-side JS from reading the cookie
        sameSite: "strict", // Prevents the cookie from being sent in cross-site requests
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Setup authentication
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        // Check if the password is already hashed (starts with $2b$)
        let passwordMatches = false;

        if (user.password.startsWith('$2b$')) {
          // Password is hashed, use bcrypt to compare
          passwordMatches = await bcrypt.compare(password, user.password);
        } else {
          // Password is not hashed yet (legacy), compare directly
          // This is for backward compatibility during migration
          passwordMatches = user.password === password;

          // If password matches, hash it for future use
          if (passwordMatches) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await storage.updateUser(user.id, { password: hashedPassword });
            console.log(`Hashed password for user ${username}`);
          }
        }

        if (!passwordMatches) {
          return done(null, false, { message: "Incorrect password" });
        }

        // Update last login time
        await storage.updateUser(user.id, { lastLogin: new Date() });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Initialize services
  await initializeServices();

  // Authentication routes with rate limiting
  app.post("/api/auth/login", loginRateLimiter, passport.authenticate("local"), (req: Request, res: Response) => {
    if (req.user) {
      const user = req.user as any;
      storage.updateUserLastLogin(user.id);
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
    }
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.status(200).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can create users
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can list users
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const users = await storage.getAllUsers();
      res.status(200).json(
        users.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        }))
      );
    } catch (error) {
      handleError(error, res);
    }
  });

  // Course routes
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const courses = await courseService.getAllCourses();
      res.status(200).json(courses);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/courses/upcoming", async (req: Request, res: Response) => {
    try {
      const courses = await courseService.getUpcomingCourses();
      res.status(200).json(courses);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await courseService.getCourse(courseId);
      res.status(200).json(course);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/courses/:id/stats", async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const stats = await courseService.getCourseStats(courseId);
      res.status(200).json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/courses", async (req: Request, res: Response) => {
    try {
      const course = await courseService.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await courseService.updateCourse(courseId, req.body);
      res.status(200).json(course);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/courses/:id", async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      await courseService.deleteCourse(courseId);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  // Course enrollment routes
  app.post("/api/courses/:courseId/enroll/:userId", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can enroll users
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const courseId = parseInt(req.params.courseId);
      const userId = parseInt(req.params.userId);

      const course = await storage.getCourse(courseId);
      const user = await storage.getUser(userId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const enrollment = await storage.enrollUserInCourse({ courseId, userId });
      res.status(201).json(enrollment);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/courses/:courseId/enroll/:userId", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can unenroll users
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const courseId = parseInt(req.params.courseId);
      const userId = parseInt(req.params.userId);

      const course = await storage.getCourse(courseId);
      const user = await storage.getUser(userId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.unenrollUserFromCourse(userId, courseId);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/courses/:courseId/enrollments", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const enrollments = await storage.getEnrollmentsForCourse(courseId);

      // Get user details for each enrollment
      const enrolledStudents = await Promise.all(
        enrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          return user ? {
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email
          } : null;
        })
      );

      res.status(200).json(enrolledStudents.filter(Boolean));
    } catch (error) {
      handleError(error, res);
    }
  });

  // Scheduled messages routes
  app.post("/api/scheduled-messages", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can create scheduled messages
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const messageData = insertScheduledMessageSchema.parse(req.body);
      const message = await storage.createScheduledMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/scheduled-messages", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messages = await storage.getAllScheduledMessages();
      res.status(200).json(messages);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put("/api/scheduled-messages/:id", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can update scheduled messages
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      const message = await storage.getScheduledMessage(messageId);

      if (!message) {
        return res.status(404).json({ message: "Scheduled message not found" });
      }

      const messageData = insertScheduledMessageSchema.partial().parse(req.body);
      const updatedMessage = await storage.updateScheduledMessage(messageId, messageData);
      res.status(200).json(updatedMessage);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/scheduled-messages/:id", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can delete scheduled messages
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      const message = await storage.getScheduledMessage(messageId);

      if (!message) {
        return res.status(404).json({ message: "Scheduled message not found" });
      }

      await storage.deleteScheduledMessage(messageId);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  // Attendance routes
  app.get("/api/attendance/recent", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const days = parseInt(req.query.days as string) || 1;
      const attendanceRecords = await storage.getRecentAttendance(days);

      // Enrich with course and user information
      const enrichedAttendance = await Promise.all(
        attendanceRecords.map(async (record) => {
          const course = await storage.getCourse(record.courseId);
          const user = await storage.getUser(record.userId);

          return {
            ...record,
            courseName: course?.name || "Unknown Course",
            courseInstructor: course?.instructor || "Unknown Instructor",
            userName: user?.fullName || "Unknown User"
          };
        })
      );

      // Group by course for the response
      const groupedByDayCourse = enrichedAttendance.reduce((acc, record) => {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        const key = `${dateStr}-${record.courseId}`;

        if (!acc[key]) {
          acc[key] = {
            courseId: record.courseId,
            courseName: record.courseName,
            courseInstructor: record.courseInstructor,
            date: record.date,
            attendanceRecords: [],
            totalStudents: 0,
            presentStudents: 0,
            averageDuration: 0,
            totalPoints: 0
          };
        }

        acc[key].attendanceRecords.push(record);
        acc[key].totalStudents++;
        if (record.duration) {
          acc[key].presentStudents++;
          acc[key].averageDuration += record.duration;
          acc[key].totalPoints += record.pointsAwarded || 0;
        }

        return acc;
      }, {} as Record<string, any>);

      // Calculate averages and format response
      const response = Object.values(groupedByDayCourse).map(group => {
        if (group.presentStudents > 0) {
          group.averageDuration = Math.round(group.averageDuration / group.presentStudents);
        }
        return group;
      });

      res.status(200).json(response);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Rankings routes
  app.get("/api/rankings/:period", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const period = req.params.period;
      if (!['daily', 'weekly', 'monthly'].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Must be 'daily', 'weekly', or 'monthly'" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const rankings = await storage.getTopRankings(period, limit);

      // Enrich with user information
      const enrichedRankings = await Promise.all(
        rankings.map(async (ranking) => {
          const user = await storage.getUser(ranking.userId);

          // Get the user's course
          const enrollments = await storage.getEnrollmentsForUser(ranking.userId);
          let courseName = "Multiple Courses";

          if (enrollments.length === 1) {
            const course = await storage.getCourse(enrollments[0].courseId);
            if (course) {
              courseName = course.name;
            }
          }

          return {
            ...ranking,
            userName: user?.fullName || "Unknown User",
            userAvatar: user?.avatar,
            courseName
          };
        })
      );

      res.status(200).json(enrichedRankings);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Notification (Telegram) routes

  // Simulate notification
  app.post("/api/notifications/simulate", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { templateId, groupId, useTestGroup, variables } = req.body;

      // Validate inputs
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      if (!useTestGroup && !groupId) {
        return res.status(400).json({ message: "Group ID is required when not using test group" });
      }

      // Get template
      const template = await storage.getNotificationTemplate(parseInt(templateId));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Process template content with variables
      let content = template.content;
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value as string);
        });
      }

      // Determine target group ID
      const targetGroupId = useTestGroup ? "test" : groupId;

      // Use Telegram service to simulate the message
      const simulationResult = await telegramService.simulateMessage(
        targetGroupId,
        content,
        (req.user as any).id
      );

      // Return the simulation result
      res.status(200).json({
        success: true,
        message: "Notification simulated successfully",
        simulationDetails: {
          templateName: template.name,
          groupId: simulationResult.target,
          content: simulationResult.content,
          timestamp: simulationResult.timestamp
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get notification templates
  app.get("/api/notification-templates", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const templates = await storage.getAllNotificationTemplates();
      res.status(200).json(templates);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get telegram groups
  app.get("/api/telegram-groups", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get all courses with telegram groups
      const courses = await storage.getAllCourses();
      const telegramGroups = courses
        .filter(course => course.telegramGroup) // Filter courses with telegram groups
        .map(course => ({
          id: course.id,
          name: course.name,
          chatId: course.telegramGroup,
          description: `${course.level} - ${course.schedule} - ${course.time}`,
          courseLevel: course.level,
          courseSchedule: course.schedule,
          instructor: course.instructor
        }));

      // Add test group
      telegramGroups.unshift({
        id: 0,
        name: "Groupe de test",
        chatId: "test",
        description: "Groupe utilisé pour les tests et simulations",
        courseLevel: null,
        courseSchedule: null,
        instructor: null
      });

      res.status(200).json(telegramGroups);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/notifications/recent", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const count = parseInt(req.query.count as string) || 5;
      const messages = await storage.getRecentMessages(count);

      // Enrich with course and user information
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const course = await storage.getCourse(message.courseId);
          const user = await storage.getUser(message.userId);

          return {
            ...message,
            courseName: course?.name || "Unknown Course",
            courseGroup: course?.telegramGroup || "Unknown Group",
            userName: user?.fullName || "Unknown User"
          };
        })
      );

      res.status(200).json(enrichedMessages);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Logs routes
  app.get("/api/logs", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can view logs
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const count = parseInt(req.query.count as string) || 50;
      const logs = await storage.getRecentLogs(count);
      res.status(200).json(logs);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Database Backup and Restore API
  app.post("/api/database/backup", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Vérifier si le stockage est SQLite
      if (StorageFactory.getStorageType() !== 'sqlite') {
        return res.status(400).json({ message: "Backup is only available with SQLite storage" });
      }

      const backupPath = await (storage as any).backup();
      res.status(200).json({ message: "Database backup created successfully", backupPath });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/database/restore", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Vérifier si le stockage est SQLite
      if (StorageFactory.getStorageType() !== 'sqlite') {
        return res.status(400).json({ message: "Restore is only available with SQLite storage" });
      }

      const { backupPath } = req.body;
      if (!backupPath) {
        return res.status(400).json({ message: "Backup path is required" });
      }

      await (storage as any).restore(backupPath);
      res.status(200).json({ message: "Database restored successfully" });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/database/storage-type", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const storageType = StorageFactory.getStorageType();
      res.status(200).json({ storageType });
    } catch (error) {
      handleError(error, res);
    }
  });

  // App settings routes
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can get settings
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      let settings = await storage.getAppSettings();

      if (!settings) {
        // Initialize with default settings if none exist
        settings = await storage.createAppSettings({
          simulationMode: true,
          testGroup: "Test Group",
          telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
          telegramWebhookUrl: "",
          zoomApiKey: process.env.ZOOM_API_KEY || "",
          zoomApiSecret: process.env.ZOOM_API_SECRET || "",
          emailSmtpServer: "",
          emailUsername: "",
          emailPassword: "",
          emailFromAddress: ""
        });
      }

      // Les tokens et API keys sont déjà masqués par la méthode getAppSettings
      res.status(200).json(settings);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put("/api/settings", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can update settings
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      let settings = await storage.getAppSettings();

      if (!settings) {
        // Initialize with default settings if none exist
        settings = await storage.createAppSettings({
          simulationMode: true,
          testGroup: "Test Group",
          telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
          telegramWebhookUrl: "",
          zoomApiKey: process.env.ZOOM_API_KEY || "",
          zoomApiSecret: process.env.ZOOM_API_SECRET || "",
          emailSmtpServer: "",
          emailUsername: "",
          emailPassword: "",
          emailFromAddress: ""
        });
      }

      // Mettre à jour les paramètres
      const updatedSettings = await storage.updateAppSettings(settings.id, req.body);

      // Réinitialiser les services avec les nouveaux paramètres
      await initializeServices();

      // Les tokens et API keys sont déjà masqués par la méthode updateAppSettings
      res.status(200).json(updatedSettings);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Analytics API routes
  app.get("/api/stats/platform", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can access analytics
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get platform stats
      const stats = await analyticsService.getPlatformStats(start, end);

      res.status(200).json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/stats/attendance", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can access analytics
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get attendance stats
      const stats = await analyticsService.getAttendanceStats(start, end);

      res.status(200).json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/stats/engagement", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can access analytics
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get engagement stats
      const stats = await analyticsService.getEngagementStats(start, end);

      res.status(200).json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/stats/performance", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can access analytics
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get performance stats
      const stats = await analyticsService.getPerformanceStats(start, end);

      res.status(200).json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/stats/report", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can access analytics
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { startDate, endDate, format } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Parse dates
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Generate full report
      const report = await analyticsService.generateFullReport(start, end);

      // Return report in requested format (default: JSON)
      if (format === "csv") {
        // TODO: Implement CSV export
        res.status(501).json({ message: "CSV export not implemented yet" });
      } else {
        res.status(200).json(report);
      }
    } catch (error) {
      handleError(error, res);
    }
  });

  // Stats for the dashboard
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const users = await storage.getAllUsers();
      const courses = await storage.getAllCourses();

      // Count students (users with role 'user')
      const activeStudents = users.filter(user => user.role === 'user').length;

      // Count active courses
      const activeCourses = courses.length;

      // Count today's sessions (courses scheduled for today)
      const today = new Date().getDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todaySessions = courses.filter(course => course.dayOfWeek === days[today]).length;

      // Count notifications sent
      const recentMessages = await storage.getRecentMessages(1000);
      const notificationsSent = recentMessages.length;

      res.status(200).json({
        activeStudents,
        activeCourses,
        todaySessions,
        notificationsSent
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Test endpoint
  app.get("/api/test", (req: Request, res: Response) => {
    res.status(200).json({ message: "Server is working correctly", timestamp: new Date().toISOString() });
  });

  // Bot status endpoint
  app.get("/api/bot/status", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get bot status from Telegram service
      const { telegramService } = await import("./services/telegram");
      const botInfo = telegramService.getBotInfo();
      const simulationMode = telegramService.isSimulationMode();

      // Get app settings
      const settings = await storage.getAppSettings();

      // Les tokens et API keys sont déjà masqués par la méthode getAppSettings
      res.status(200).json({
        botInfo,
        simulationMode,
        settings: {
          telegramToken: settings?.telegramToken ? "[CONFIGURED]" : "[NOT CONFIGURED]",
          telegramWebhookUrl: settings?.telegramWebhookUrl || null,
          zoomApiKey: settings?.zoomApiKey ? "[CONFIGURED]" : "[NOT CONFIGURED]",
          zoomApiSecret: settings?.zoomApiSecret ? "[CONFIGURED]" : "[NOT CONFIGURED]",
          testGroup: settings?.testGroup || null,
          simulationMode: settings?.simulationMode
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Scenarios (automation) routes
  app.post("/api/scenarios", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can create scenarios
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const scenario = await storage.createScenario(req.body);
      res.status(201).json(scenario);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/scenarios", async (req: Request, res: Response) => {
    try {
      // Accessible to authenticated users
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const scenarios = await storage.getAllScenarios();
      res.status(200).json(scenarios);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put("/api/scenarios/:id", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can update scenarios
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const scenarioId = parseInt(req.params.id);
      const scenario = await storage.getScenario(scenarioId);

      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      const updatedScenario = await storage.updateScenario(scenarioId, req.body);
      res.status(200).json(updatedScenario);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/scenarios/:id", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can delete scenarios
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const scenarioId = parseInt(req.params.id);
      const scenario = await storage.getScenario(scenarioId);

      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      await storage.deleteScenario(scenarioId);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/scenarios/:id/run", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can run scenarios
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const scenarioId = parseInt(req.params.id);
      const scenario = await storage.getScenario(scenarioId);

      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      // Import the scenarios service
      const { scenariosService } = await import("./services/scenarios");

      // Make sure the service is initialized
      if (!scenariosService.isInitialized()) {
        return res.status(500).json({ message: "Scenarios service not initialized" });
      }

      // Run the scenario
      await scenariosService.runScenario(scenarioId);

      res.status(200).json({ success: true, message: `Scenario "${scenario.name}" executed successfully` });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Import Excel file
  app.post("/api/import/excel", async (req: Request, res: Response) => {
    try {
      // Ensure only admins can import Excel files
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Import modules for Excel processing
      const { spawn } = await import('child_process');
      const fs = await import('fs');
      const pathModule = await import('path');

      // Get the file path from the request body
      const filePath = req.body.filePath || pathModule.resolve('attached_assets', 'Kodjo English - Classes Schedules (2).xlsx');

      console.log(`Importing Excel file from: ${filePath}`);

      // Fonction pour exécuter le script Python
      const processExcelFile = (excelPath: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          console.log(`Traitement du fichier Excel: ${excelPath}`);

          const args = [pathModule.resolve('./scripts/excel/excel_processor.py'), excelPath];

          const pythonProcess = spawn('python', args, { stdio: ['pipe', 'pipe', 'pipe'] });

          let outputData = '';
          let errorData = '';

          pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
          });

          pythonProcess.on('close', (code) => {
            if (code !== 0) {
              console.error(`Erreur lors du traitement du fichier Excel: ${errorData}`);
              return reject(new Error(`Erreur lors du traitement Python: ${errorData}`));
            }

            // Extract the output path from the formatted output
            const outputPathMatch = outputData.match(/OUTPUT_PATH=(.+)$/m);

            if (!outputPathMatch) {
              console.error("Format de sortie incorrect du script Python");
              return reject(new Error("Format de sortie incorrect du script Python"));
            }

            const outputPath = outputPathMatch[1].trim();
            console.log(`Fichier JSON généré: ${outputPath}`);
            resolve(outputPath);
          });
        });
      };

      // Process the Excel file
      const jsonPath = await processExcelFile(filePath);

      // Load the courses from the JSON file
      const loadCoursesFromJson = async (jsonPath: string) => {
        try {
          const data = await fs.promises.readFile(jsonPath, 'utf8');
          return JSON.parse(data);
        } catch (error) {
          console.error(`Erreur lors de la lecture du fichier JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
          throw error;
        }
      };
      const courses = await loadCoursesFromJson(jsonPath);

      // Update the courses in the database
      const updateCoursesInDatabase = async (courses: any[]) => {
        console.log(`Mise à jour de ${courses.length} cours dans la base de données`);

        const results = {
          created: 0,
          updated: 0,
          errors: 0
        };

        for (const course of courses) {
          try {
            // Vérifier si le cours existe déjà
            const existingCourse = await storage.getCourseByName(course.name);

            if (existingCourse) {
              // Mettre à jour le cours existant
              await storage.updateCourse(existingCourse.id, course);
              results.updated++;
              console.log(`Cours mis à jour: ${course.name}`);
            } else {
              // Créer un nouveau cours
              await storage.createCourse(course);
              results.created++;
              console.log(`Cours créé: ${course.name}`);
            }
          } catch (error) {
            console.error(`Erreur lors de la mise à jour du cours ${course.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            results.errors++;
          }
        }

        return results;
      };
      const results = await updateCoursesInDatabase(courses);

      // Clean up temporary files
      try {
        if (fs.existsSync(jsonPath)) {
          fs.unlinkSync(jsonPath);
        }
      } catch (err) {
        console.warn("Warning: Could not delete temporary file:", err);
      }

      // Return the results
      return res.status(200).json({
        success: true,
        message: `Excel import completed successfully: ${results.created + results.updated + results.errors} courses processed`,
        details: results
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Routes Zoom
  app.get('/api/courses/:courseId/zoom', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const meeting = await zoomService.getMeeting(courseId);
      res.json(meeting);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post('/api/courses/:courseId/zoom', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { topic, startTime, duration, participants } = req.body;
      const meeting = await zoomService.createMeeting(
        courseId,
        topic,
        new Date(startTime),
        duration,
        participants
      );
      res.json(meeting);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put('/api/courses/:courseId/zoom', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const meetingData = req.body;
      const meeting = await zoomService.updateMeeting(courseId, meetingData);
      res.json(meeting);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete('/api/courses/:courseId/zoom', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      await zoomService.deleteMeeting(courseId);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  // Routes pour les participants Zoom
  app.post('/api/courses/:courseId/zoom/participants', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const participant = req.body;
      await zoomService.addParticipant(courseId, participant);
      res.status(201).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put('/api/courses/:courseId/zoom/participants/:userId', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = parseInt(req.params.userId);
      const { status, joinTime, leaveTime } = req.body;
      await zoomService.updateParticipantStatus(
        courseId,
        userId,
        status,
        joinTime ? new Date(joinTime) : undefined,
        leaveTime ? new Date(leaveTime) : undefined
      );
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get('/api/courses/:courseId/zoom/stats', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const stats = await zoomService.getParticipantStats(courseId);
      res.json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  return httpServer;
}

// Helper function to check if the request is from an admin
function isAdmin(req: Request): boolean {
  if (!req.isAuthenticated()) {
    return false;
  }
  const user = req.user as any;
  return user.role === 'admin';
}

// Helper function to handle errors
function handleError(error: any, res: Response): void {
  console.error("Error:", error);

  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    res.status(400).json({ message: validationError.message });
  } else {
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

// Initialize services
async function initializeServices(): Promise<void> {
  const settings = await storage.getAppSettings();

  // Initialize simulation mode service
  await simulationModeService.initialize();

  // Initialize Telegram service avec les paramètres déchiffrés
  await telegramService.initialize();

  // Initialize Zoom service avec les paramètres déchiffrés
  await zoomService.initialize();

  // Initialize scheduler service
  schedulerService.initialize(storage);

  // Initialize scenarios service
  const { scenariosService } = await import("./services/scenarios");
  scenariosService.initialize({
    storage,
    simulationMode: settings?.simulationMode === null ? true : (settings?.simulationMode || true)
  });

  // Initialize analytics service
  analyticsService.initialize();

  // Initialize course reminder service
  courseReminderService.initialize();
}

export default function setupRoutes(app: Express, port: number) {
  // Detailed Rankings API
  app.get("/api/rankings", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const period = req.query.period as string || "daily";
      const rankings = await storage.getRankingsForPeriod(period);

      // Get user details for each ranking
      const rankingsWithUsers = await Promise.all(
        rankings.map(async (ranking) => {
          const user = await storage.getUser(ranking.userId);
          return {
            ...ranking,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                  role: user.role,
                }
              : undefined,
          };
        })
      );

      res.json(rankingsWithUsers);
    } catch (error) {
      handleError(error, res);
    }
  });

  // User Points API
  app.get("/api/user-points", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const reason = req.query.reason as string;

      const points = await storage.getUserPoints(userId, { startDate, endDate, reason });

      // Get course details for each point
      const pointsWithDetails = await Promise.all(
        points.map(async (point) => {
          const course = point.courseId ? await storage.getCourse(point.courseId) : null;
          const user = await storage.getUser(point.userId);
          return {
            ...point,
            course: course
              ? {
                  id: course.id,
                  name: course.name,
                }
              : undefined,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                }
              : undefined,
          };
        })
      );

      res.json(pointsWithDetails);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Add User Points API
  app.post("/api/user-points", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { userId, points, reason, description, courseId } = req.body;

      if (!userId || !points || !reason) {
        return res.status(400).json({ message: "User ID, points, and reason are required" });
      }

      const newPoints = await storage.addUserPoints({
        userId,
        points,
        reason,
        description,
        courseId,
        timestamp: new Date(),
      });

      res.status(201).json(newPoints);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Recalculate Rankings API
  app.post("/api/rankings/recalculate", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.recalculateUserRankings();

      res.status(200).json({ message: "Rankings recalculated successfully" });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Point Rules API
  app.get("/api/point-rules", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const rules = await storage.getAllPointRules();
      res.status(200).json(rules);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Reminder Templates API
  app.get("/api/reminder-templates", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const templates = await storage.getAllReminderTemplates();
      res.status(200).json(templates);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/reminder-templates/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const template = await storage.getReminderTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.status(200).json(template);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/reminder-templates/type/:type", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const type = req.params.type;
      const templates = await storage.getReminderTemplatesByType(type);
      res.status(200).json(templates);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/reminder-templates/level/:level", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const level = req.params.level;
      const templates = await storage.getReminderTemplatesByLevel(level);
      res.status(200).json(templates);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/reminder-templates/default/:type", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const type = req.params.type;
      const template = await storage.getDefaultReminderTemplate(type);

      if (!template) {
        return res.status(404).json({ message: "Default template not found" });
      }

      res.status(200).json(template);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/reminder-templates/course/:courseId/:type", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const courseId = parseInt(req.params.courseId);
      const type = req.params.type;
      const template = await storage.getReminderTemplateForCourse(courseId, type);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.status(200).json(template);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/reminder-templates", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { name, type, content, courseId, courseLevel, isDefault, sendEmail, sendTelegram, emailSubject } = req.body;

      if (!name || !type || !content) {
        return res.status(400).json({ message: "Name, type, and content are required" });
      }

      const newTemplate = await storage.createReminderTemplate({
        name,
        type,
        content,
        courseId,
        courseLevel,
        isDefault,
        sendEmail,
        sendTelegram,
        emailSubject
      });

      res.status(201).json(newTemplate);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put("/api/reminder-templates/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const id = parseInt(req.params.id);
      const template = await storage.getReminderTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const updatedTemplate = await storage.updateReminderTemplate(id, req.body);
      res.status(200).json(updatedTemplate);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/reminder-templates/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const id = parseInt(req.params.id);
      const template = await storage.getReminderTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      await storage.deleteReminderTemplate(id);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/point-rules/active", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const rules = await storage.getActivePointRules();
      res.status(200).json(rules);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/point-rules/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const rule = await storage.getPointRule(id);

      if (!rule) {
        return res.status(404).json({ message: "Point rule not found" });
      }

      res.status(200).json(rule);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/point-rules", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { name, description, activityType, pointsAmount, conditions, active } = req.body;

      if (!name || !activityType || pointsAmount === undefined) {
        return res.status(400).json({ message: "Name, activity type, and points amount are required" });
      }

      const newRule = await storage.createPointRule({
        name,
        description,
        activityType,
        pointsAmount,
        conditions,
        active
      });

      res.status(201).json(newRule);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.put("/api/point-rules/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const id = parseInt(req.params.id);
      const rule = await storage.getPointRule(id);

      if (!rule) {
        return res.status(404).json({ message: "Point rule not found" });
      }

      const updatedRule = await storage.updatePointRule(id, req.body);
      res.status(200).json(updatedRule);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/point-rules/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const id = parseInt(req.params.id);
      const rule = await storage.getPointRule(id);

      if (!rule) {
        return res.status(404).json({ message: "Point rule not found" });
      }

      await storage.deletePointRule(id);
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  });

  // Attendance API
  app.get("/api/attendance", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // If user is not admin, they can only see their own attendance
      if ((req.user as any).role !== "admin" && userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Not authorized to view this user's attendance" });
      }

      let attendanceData;
      if (userId) {
        attendanceData = await storage.getAttendanceForUser(userId, { startDate, endDate, courseId });
      } else if (courseId) {
        attendanceData = await storage.getAttendanceForCourse(courseId, { startDate, endDate });
      } else {
        return res.status(400).json({ message: "Either userId or courseId is required" });
      }

      // Get user and course details for each attendance record
      const attendanceWithDetails = await Promise.all(
        attendanceData.map(async (attendance) => {
          const user = await storage.getUser(attendance.userId);
          const course = await storage.getCourse(attendance.courseId);
          return {
            ...attendance,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  fullName: user.fullName,
                }
              : undefined,
            course: course
              ? {
                  id: course.id,
                  name: course.name,
                }
              : undefined,
          };
        })
      );

      res.json(attendanceWithDetails);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Attendance Stats API
  app.get("/api/attendance/stats", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // If user is not admin, they can only see their own stats
      if ((req.user as any).role !== "admin" && userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Not authorized to view this user's stats" });
      }

      const stats = await storage.getAttendanceStats(userId, courseId);
      res.json(stats);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Record Attendance API
  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { userId, courseId, meetingId, joinTime, leaveTime, duration, attentionScore } = req.body;

      if (!userId || !courseId || !meetingId || !joinTime) {
        return res.status(400).json({ message: "userId, courseId, meetingId, and joinTime are required" });
      }

      const attendance = await storage.recordAttendance({
        userId,
        courseId,
        meetingId,
        joinTime: new Date(joinTime),
        leaveTime: leaveTime ? new Date(leaveTime) : undefined,
        duration,
        attentionScore,
        timestamp: new Date(),
      });

      res.status(201).json(attendance);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
