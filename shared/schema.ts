import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  lastLogin: timestamp("last_login"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
});

// Course model
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseNumber: integer("course_number"), // Numéro du cours (1-86)
  name: text("name").notNull(),
  instructor: text("instructor").notNull(),
  professorName: text("professor_name"), // Le prof réel (Mina Lepsanovic, Maimouna Koffi, etc.)
  level: text("level"), // BBG, ABG, IG, ZBG, IAG
  schedule: text("schedule"), // MW, TT, FS, SS
  dayOfWeek: text("day_of_week").notNull(),
  time: text("time").notNull(), // Format: "HH:MM" ou "XXh XX France"
  zoomLink: text("zoom_link").notNull(),
  zoomId: text("zoom_id"), // Ajout du zoom ID
  telegramGroup: text("telegram_group"),
  startDateTime: text("start_date_time"), // Date/heure de début
  duration: integer("duration"), // Durée en minutes
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

// Zoom Attendance model
export const zoomAttendance = pgTable("zoom_attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  joinTime: timestamp("join_time").notNull(),
  leaveTime: timestamp("leave_time"),
  duration: integer("duration"), // in minutes
  pointsAwarded: integer("points_awarded").default(0),
  date: timestamp("date").notNull(),
});

export const insertZoomAttendanceSchema = createInsertSchema(zoomAttendance).omit({
  id: true,
  duration: true,
  pointsAwarded: true,
});

// Telegram Message model
export const telegramMessages = pgTable("telegram_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull(),
  pointsAwarded: integer("points_awarded").default(0),
});

export const insertTelegramMessageSchema = createInsertSchema(telegramMessages).omit({
  id: true,
  pointsAwarded: true,
});

// Scheduled Message model
export const scheduledMessages = pgTable("scheduled_messages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  active: boolean("active").default(true),
});

export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages).omit({
  id: true,
  sentAt: true,
});

// User Ranking model
export const userRankings = pgTable("user_rankings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  attendancePoints: integer("attendance_points").default(0),
  messagePoints: integer("message_points").default(0),
  totalPoints: integer("total_points").default(0),
  lastActivity: timestamp("last_activity"),
  period: text("period").notNull(), // "daily", "weekly", "monthly"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
});

export const insertUserRankingSchema = createInsertSchema(userRankings).omit({
  id: true,
  totalPoints: true,
});

// Log model
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // "INFO", "WARNING", "ERROR"
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  userId: integer("user_id").references(() => users.id),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
});

// Scenario model (for automation)
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  pythonCode: text("python_code"),
  schedule: text("schedule"), // Cron expression
  actions: text("actions"), // JSON string of actions to perform
  isCustomCode: boolean("is_custom_code").default(false),
  active: boolean("active").default(true),
  lastRun: timestamp("last_run"),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("robot"),
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  lastRun: true,
});

// User Points model - Tracks individual point awards
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(), // "attendance", "participation", "homework", "bonus", etc.
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date for temporary points
});

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({
  id: true,
});

// Point Rules model
export const pointRules = pgTable("point_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  activityType: text("activity_type").notNull(), // "attendance", "message", "participation", "homework", "bonus", etc.
  pointsAmount: integer("points_amount").notNull(),
  conditions: text("conditions"), // JSON string of conditions (e.g., minimum duration for attendance)
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPointRuleSchema = createInsertSchema(pointRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Reminder Templates model
export const reminderTemplates = pgTable("reminder_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "course_reminder", "course_reminder_1h", "course_reminder_15min", "course_canceled", "course_rescheduled", "homework_reminder", etc.
  content: text("content").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  courseLevel: text("course_level"),
  isDefault: boolean("is_default").default(false),
  sendEmail: boolean("send_email").default(true),
  sendTelegram: boolean("send_telegram").default(true),
  emailSubject: text("email_subject"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertReminderTemplateSchema = createInsertSchema(reminderTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});



// App Settings model
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  simulationMode: boolean("simulation_mode").default(false),
  testGroup: text("test_group"),
  telegramToken: text("telegram_token"),
  telegramChatId: text("telegram_chat_id"),
  zoomApiKey: text("zoom_api_key"),
  zoomApiSecret: text("zoom_api_secret"),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
});

// Course Enrollment (join table for users and courses)
export const courseEnrollments = pgTable("course_enrollments", {
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.courseId] }),
  };
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type ZoomAttendance = typeof zoomAttendance.$inferSelect;
export type InsertZoomAttendance = z.infer<typeof insertZoomAttendanceSchema>;

export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type InsertTelegramMessage = z.infer<typeof insertTelegramMessageSchema>;

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = z.infer<typeof insertScheduledMessageSchema>;

export type UserRanking = typeof userRankings.$inferSelect;
export type InsertUserRanking = z.infer<typeof insertUserRankingSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;

export type PointRule = typeof pointRules.$inferSelect;
export type InsertPointRule = z.infer<typeof insertPointRuleSchema>;

export type ReminderTemplate = typeof reminderTemplates.$inferSelect;
export type InsertReminderTemplate = z.infer<typeof insertReminderTemplateSchema>;

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
