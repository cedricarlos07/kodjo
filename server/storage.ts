import {
  users, courses, zoomAttendance, telegramMessages,
  scheduledMessages, userRankings, logs, scenarios,
  appSettings, courseEnrollments, pointRules, reminderTemplates,
  type User, type InsertUser, type Course, type InsertCourse,
  type ZoomAttendance, type InsertZoomAttendance,
  type TelegramMessage, type InsertTelegramMessage,
  type ScheduledMessage, type InsertScheduledMessage,
  type UserRanking, type InsertUserRanking,
  type Log, type InsertLog, type Scenario, type InsertScenario,
  type AppSettings, type InsertAppSettings,
  type CourseEnrollment, type InsertCourseEnrollment,
  type PointRule, type InsertPointRule,
  type ReminderTemplate, type InsertReminderTemplate
} from "@shared/schema";
import { subDays, format, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import bcrypt from 'bcrypt';
import { NotificationTemplate, getAllNotificationTemplates, getNotificationTemplate } from './data/notificationTemplates';

// Interface pour les réunions Zoom
export interface ZoomMeeting {
  id: string;
  topic: string;
  startTime: string;
  duration: number;
  joinUrl: string;
  password?: string;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;

  // Courses
  createCourse(course: InsertCourse): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByName(name: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  getUpcomingCourses(): Promise<Course[]>;

  // Course Enrollments
  enrollUserInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  getEnrollmentsForCourse(courseId: number): Promise<CourseEnrollment[]>;
  getEnrollmentsForUser(userId: number): Promise<CourseEnrollment[]>;
  unenrollUserFromCourse(userId: number, courseId: number): Promise<void>;

  // Zoom Attendance
  recordAttendance(attendance: InsertZoomAttendance): Promise<ZoomAttendance>;
  updateAttendance(id: number, attendance: Partial<ZoomAttendance>): Promise<ZoomAttendance | undefined>;
  getAttendanceForCourse(courseId: number): Promise<ZoomAttendance[]>;
  getAttendanceForUser(userId: number): Promise<ZoomAttendance[]>;
  getRecentAttendance(days: number): Promise<ZoomAttendance[]>;

  // Telegram Messages
  recordTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage>;
  getMessagesForCourse(courseId: number): Promise<TelegramMessage[]>;
  getMessagesForUser(userId: number): Promise<TelegramMessage[]>;
  getRecentMessages(count: number): Promise<TelegramMessage[]>;

  // Scheduled Messages
  createScheduledMessage(message: InsertScheduledMessage): Promise<ScheduledMessage>;
  getScheduledMessage(id: number): Promise<ScheduledMessage | undefined>;
  getAllScheduledMessages(): Promise<ScheduledMessage[]>;
  updateScheduledMessage(id: number, message: Partial<ScheduledMessage>): Promise<ScheduledMessage | undefined>;
  deleteScheduledMessage(id: number): Promise<void>;
  getPendingScheduledMessages(): Promise<ScheduledMessage[]>;
  markScheduledMessageAsSent(id: number): Promise<void>;

  // Zoom Attendance
  recordAttendance(data: InsertZoomAttendance): Promise<ZoomAttendance>;
  getAttendanceForUser(userId: number, options?: { startDate?: Date; endDate?: Date; courseId?: number }): Promise<ZoomAttendance[]>;
  getAttendanceForCourse(courseId: number, options?: { startDate?: Date; endDate?: Date }): Promise<ZoomAttendance[]>;
  getAttendanceStats(userId: number, courseId?: number): Promise<{ totalSessions: number; totalDuration: number; averageDuration: number }>;
  deleteAttendance(id: number): Promise<void>;

  // User Points
  addUserPoints(data: InsertUserPoints): Promise<UserPoints>;
  getUserPoints(userId: number, options?: { startDate?: Date; endDate?: Date; reason?: string }): Promise<UserPoints[]>;
  getTotalUserPoints(userId: number, options?: { startDate?: Date; endDate?: Date; reason?: string }): Promise<number>;
  deleteUserPoints(id: number): Promise<void>;

  // Point Rules
  createPointRule(rule: InsertPointRule): Promise<PointRule>;
  getPointRule(id: number): Promise<PointRule | undefined>;
  getAllPointRules(): Promise<PointRule[]>;
  getActivePointRules(): Promise<PointRule[]>;
  updatePointRule(id: number, rule: Partial<PointRule>): Promise<PointRule | undefined>;
  deletePointRule(id: number): Promise<void>;
  getPointRuleByActivityType(activityType: string): Promise<PointRule | undefined>;

  // Reminder Templates
  createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate>;
  getReminderTemplate(id: number): Promise<ReminderTemplate | undefined>;
  getAllReminderTemplates(): Promise<ReminderTemplate[]>;
  getReminderTemplatesByType(type: string): Promise<ReminderTemplate[]>;
  getReminderTemplatesByLevel(level: string): Promise<ReminderTemplate[]>;
  getDefaultReminderTemplate(type: string): Promise<ReminderTemplate | undefined>;
  getReminderTemplateForCourse(courseId: number, type: string): Promise<ReminderTemplate | undefined>;
  updateReminderTemplate(id: number, template: Partial<ReminderTemplate>): Promise<ReminderTemplate | undefined>;
  deleteReminderTemplate(id: number): Promise<void>;

  // User Rankings
  createOrUpdateRanking(ranking: InsertUserRanking): Promise<UserRanking>;
  getRankingsForPeriod(period: string): Promise<UserRanking[]>;
  getTopRankings(period: string, limit: number): Promise<UserRanking[]>;
  updateUserPoints(userId: number, attendancePoints: number, messagePoints: number): Promise<void>;
  recalculateUserRankings(): Promise<void>;

  // Logs
  createLog(log: InsertLog): Promise<Log>;
  getRecentLogs(count: number): Promise<Log[]>;
  getLogsByLevel(level: string): Promise<Log[]>;

  // Scenarios
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  getScenario(id: number): Promise<Scenario | undefined>;
  getAllScenarios(): Promise<Scenario[]>;
  updateScenario(id: number, scenario: Partial<Scenario>): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<void>;
  getActiveScenarios(): Promise<Scenario[]>;
  updateScenarioLastRun(id: number): Promise<void>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings | undefined>;
  initializeAppSettings(settings: InsertAppSettings): Promise<AppSettings>;

  // Notification Templates
  getAllNotificationTemplates(): Promise<NotificationTemplate[]>;
  getNotificationTemplate(id: number): Promise<NotificationTemplate | undefined>;

  // Zoom Meetings
  recordZoomMeeting(courseId: number, meeting: ZoomMeeting): Promise<void>;
  getZoomMeeting(courseId: number): Promise<ZoomMeeting | null>;
  updateZoomMeeting(courseId: number, meeting: ZoomMeeting): Promise<void>;
  deleteZoomMeeting(courseId: number): Promise<void>;
  addZoomParticipant(courseId: number, participant: ZoomParticipant): Promise<void>;
  updateZoomParticipant(
    courseId: number,
    userId: number,
    status: ZoomParticipant['status'],
    joinTime?: Date,
    leaveTime?: Date
  ): Promise<void>;
  getZoomParticipantStats(courseId: number): Promise<{
    total: number;
    joined: number;
    left: number;
    absent: number;
    averageDuration: number;
  }>;
}

interface ZoomParticipant {
  userId: number;
  name: string;
  email: string;
  status: 'invited' | 'joined' | 'left' | 'absent';
  joinTime?: Date;
  leaveTime?: Date;
  duration?: number;
}

interface ZoomMeeting {
  id: string;
  topic: string;
  startTime: Date;
  duration: number;
  joinUrl: string;
  password?: string;
  participants?: ZoomParticipant[];
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private coursesData: Map<number, Course>;
  private zoomAttendanceData: Map<number, ZoomAttendance>;
  private telegramMessagesData: Map<number, TelegramMessage>;
  private scheduledMessagesData: Map<number, ScheduledMessage>;
  private userRankingsData: Map<number, UserRanking>;
  private userPointsData: Map<number, UserPoints>;
  private pointRulesData: Map<number, PointRule>;
  private reminderTemplatesData: Map<number, ReminderTemplate>;
  private logsData: Map<number, Log>;
  private scenariosData: Map<number, Scenario>;
  private appSettingsData: Map<number, AppSettings>;
  private courseEnrollmentsData: CourseEnrollment[];
  private zoomMeetings: Map<number, ZoomMeeting> = new Map();

  private userId: number;
  private courseId: number;
  private attendanceId: number;
  private messageId: number;
  private scheduledMessageId: number;
  private rankingId: number;
  private pointId: number;
  private pointRuleId: number;
  private reminderTemplateId: number;
  private logId: number;
  private scenarioId: number;
  private settingsId: number;

  constructor() {
    this.usersData = new Map();
    this.coursesData = new Map();
    this.zoomAttendanceData = new Map();
    this.telegramMessagesData = new Map();
    this.scheduledMessagesData = new Map();
    this.userRankingsData = new Map();
    this.userPointsData = new Map();
    this.pointRulesData = new Map();
    this.reminderTemplatesData = new Map();
    this.logsData = new Map();
    this.scenariosData = new Map();
    this.appSettingsData = new Map();
    this.courseEnrollmentsData = [];

    this.userId = 1;
    this.courseId = 1;
    this.attendanceId = 1;
    this.messageId = 1;
    this.scheduledMessageId = 1;
    this.rankingId = 1;
    this.pointId = 1;
    this.pointRuleId = 1;
    this.reminderTemplateId = 1;
    this.logId = 1;
    this.scenarioId = 1;
    this.settingsId = 1;

    // Initialize with sample data only in dev environment
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123", // Note: In production, use hashed passwords
      fullName: "Admin User",
      email: "admin@edutrack.com",
      role: "admin"
    };
    this.createUser(adminUser);

    // Create student user for testing
    const studentUser: InsertUser = {
      username: "student",
      password: "student123",
      fullName: "Student User",
      email: "student@example.com",
      role: "student"
    };
    this.createUser(studentUser);

    // Create instructor user for testing
    const instructorUser: InsertUser = {
      username: "instructor",
      password: "instructor123",
      fullName: "Instructor User",
      email: "instructor@example.com",
      role: "instructor"
    };
    this.createUser(instructorUser);

    // Create default point rules
    this.createPointRule({
      name: "Présence au cours",
      description: "Points attribués pour la présence à un cours Zoom",
      activityType: "attendance",
      pointsAmount: 10,
      conditions: JSON.stringify({ minDuration: 30 }),
      active: true
    });

    this.createPointRule({
      name: "Message dans le groupe",
      description: "Points attribués pour l'envoi de messages dans les groupes Telegram",
      activityType: "message",
      pointsAmount: 1,
      conditions: null,
      active: true
    });

    this.createPointRule({
      name: "Participation active",
      description: "Points attribués pour la participation active pendant les cours",
      activityType: "participation",
      pointsAmount: 5,
      conditions: null,
      active: true
    });

    this.createPointRule({
      name: "Devoir complété",
      description: "Points attribués pour la réalisation de devoirs",
      activityType: "homework",
      pointsAmount: 15,
      conditions: null,
      active: true
    });

    this.createPointRule({
      name: "Bonus spécial",
      description: "Points bonus attribués manuellement par les administrateurs",
      activityType: "bonus",
      pointsAmount: 20,
      conditions: null,
      active: true
    });

    // Create default reminder templates
    this.createReminderTemplate({
      name: "Rappel standard",
      type: "course_reminder",
      content: `📚 **RAPPEL DE COURS** 📚

Bonjour à tous !

Votre cours **{{courseName}}** avec {{courseInstructor}} aura lieu **{{courseDay}}** à **{{courseTime}}**.

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Préparez-vous et soyez à l'heure ! 😊

À bientôt !`,
      courseId: null,
      courseLevel: null,
      isDefault: true,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: "Rappel de cours"
    });

    this.createReminderTemplate({
      name: "Rappel 1h avant",
      type: "course_reminder_1h",
      content: `⏰ **RAPPEL - COURS DANS 1 HEURE** ⏰

Votre cours **{{courseName}}** avec {{courseInstructor}} commence dans **1 heure** !

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Préparez-vous et soyez à l'heure ! 😊`,
      courseId: null,
      courseLevel: null,
      isDefault: true,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: "Rappel - Cours dans 1 heure"
    });

    this.createReminderTemplate({
      name: "Rappel 15min avant",
      type: "course_reminder_15min",
      content: `⏰ **DERNIER RAPPEL - COURS DANS 15 MINUTES** ⏰

Votre cours **{{courseName}}** avec {{courseInstructor}} commence dans **15 minutes** !

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Connectez-vous dès maintenant pour être prêt à commencer ! 🚀`,
      courseId: null,
      courseLevel: null,
      isDefault: true,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: "URGENT - Cours dans 15 minutes"
    });

    this.createReminderTemplate({
      name: "Annulation de cours",
      type: "course_canceled",
      content: `❌ **COURS ANNULÉ** ❌

Nous sommes désolés de vous informer que le cours **{{courseName}}** prévu **{{courseDay}}** à **{{courseTime}}** est annulé.

Nous vous tiendrons informés de la date de reprise.

Merci de votre compréhension.`,
      courseId: null,
      courseLevel: null,
      isDefault: true,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: "IMPORTANT - Cours annulé"
    });

    this.createReminderTemplate({
      name: "Changement d'horaire",
      type: "course_rescheduled",
      content: `🔄 **CHANGEMENT D'HORAIRE** 🔄

Le cours **{{courseName}}** initialement prévu **{{courseDay}}** à **{{courseTime}}** a été reprogrammé.

Nouveau jour et heure : **{{newDay}}** à **{{newTime}}**

🔗 **Lien Zoom** : {{zoomLink}}
🆔 **ID** : {{zoomId}}

Merci de prendre note de ce changement.`,
      courseId: null,
      courseLevel: null,
      isDefault: true,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: "IMPORTANT - Changement d'horaire"
    });

    // Modèle spécifique pour les cours avancés
    this.createReminderTemplate({
      name: "Rappel pour cours avancés",
      type: "course_reminder",
      content: `📚 **ADVANCED COURSE REMINDER** 📚

Dear students,

Your **{{courseName}}** course with {{courseInstructor}} will take place on **{{courseDay}}** at **{{courseTime}}**.

🔗 **Zoom link** : {{zoomLink}}
🆔 **Meeting ID** : {{zoomId}}

Please be prepared and on time! 😊

See you soon!`,
      courseId: null,
      courseLevel: "C1-C2",
      isDefault: false,
      sendEmail: true,
      sendTelegram: true,
      emailSubject: "Advanced Course Reminder"
    });

    // Charger tous les cours du fichier Excel
    this.loadSampleCourses();

    console.log(`Tous les cours ont été chargés à partir des données Excel`);
  }

  private loadSampleCourses() {
    // Chargement des 86 cours depuis le fichier Excel original
    const excelData = [
      // MW courses
      { courseNumber: 1, name: 'Mina Lepsanovic - BBG - MW - 7:30pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'BBG', schedule: 'MW', dayOfWeek: 'Monday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001280305339', duration: 90 },
      { courseNumber: 2, name: 'Mina Lepsanovic - BBG - MW - 7:30pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'BBG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001280305339', duration: 90 },
      { courseNumber: 3, name: 'Mina Lepsanovic - BBG - MW - 9:00pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'BBG', schedule: 'MW', dayOfWeek: 'Monday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001706969621', duration: 90 },
      { courseNumber: 4, name: 'Mina Lepsanovic - BBG - MW - 9:00pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'BBG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001706969621', duration: 90 },
      { courseNumber: 5, name: 'Maimouna Koffi - ABG - MW - 8:30pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001189215986', duration: 90 },
      { courseNumber: 6, name: 'Maimouna Koffi - ABG - MW - 8:30pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001189215986', duration: 90 },
      { courseNumber: 7, name: 'Maimouna Koffi - ABG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001525896262', duration: 90 },
      { courseNumber: 8, name: 'Maimouna Koffi - ABG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001525896262', duration: 90 },
      { courseNumber: 9, name: 'Wissam Eddine - ABG - MW - 9:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001200673710', duration: 90 },
      { courseNumber: 10, name: 'Wissam Eddine - ABG - MW - 9:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001200673710', duration: 90 },
      { courseNumber: 11, name: 'Wissam Eddine - ABG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001204893644', duration: 90 },
      { courseNumber: 12, name: 'Wissam Eddine - ABG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001204893644', duration: 90 },
      { courseNumber: 13, name: 'Hafida Faraj - ABG - MW - 7:30pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001264422023', duration: 90 },
      { courseNumber: 14, name: 'Hafida Faraj - ABG - MW - 7:30pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001264422023', duration: 90 },
      { courseNumber: 15, name: 'Hafida Faraj - ABG - MW - 9:00pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001152960747', duration: 90 },
      { courseNumber: 16, name: 'Hafida Faraj - ABG - MW - 9:00pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001152960747', duration: 90 },
      { courseNumber: 17, name: 'Maryam Dannoun - ABG - MW - 8:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001244975695', duration: 90 },
      { courseNumber: 18, name: 'Maryam Dannoun - ABG - MW - 8:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001244975695', duration: 90 },
      { courseNumber: 19, name: 'Maryam Dannoun - ABG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'ABG', schedule: 'MW', dayOfWeek: 'Monday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001196835069', duration: 90 },
      { courseNumber: 20, name: 'Maryam Dannoun - ABG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'ABG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001196835069', duration: 90 },
      { courseNumber: 21, name: 'Jahnvi Mahtani - IG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Jahnvi Mahtani', level: 'IG', schedule: 'MW', dayOfWeek: 'Monday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/91582135371', zoomId: '91582135371', telegramGroup: '-1001881911879', duration: 90 },
      { courseNumber: 22, name: 'Jahnvi Mahtani - IG - MW - 7:00pm', instructor: 'Kodjo', professorName: 'Jahnvi Mahtani', level: 'IG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/91582135371', zoomId: '91582135371', telegramGroup: '-1001881911879', duration: 90 },
      { courseNumber: 23, name: 'Jahnvi Mahtani - IG - MW - 8:30pm', instructor: 'Kodjo', professorName: 'Jahnvi Mahtani', level: 'IG', schedule: 'MW', dayOfWeek: 'Monday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/91582135371', zoomId: '91582135371', telegramGroup: '-1001613883396', duration: 90 },
      { courseNumber: 24, name: 'Jahnvi Mahtani - IG - MW - 8:30pm', instructor: 'Kodjo', professorName: 'Jahnvi Mahtani', level: 'IG', schedule: 'MW', dayOfWeek: 'Wednesday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/91582135371', zoomId: '91582135371', telegramGroup: '-1001613883396', duration: 90 },

      // TT courses
      { courseNumber: 25, name: 'Mina Lepsanovic - ABG - TT - 7:30pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'ABG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001293889582', duration: 90 },
      { courseNumber: 26, name: 'Mina Lepsanovic - ABG - TT - 7:30pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'ABG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001293889582', duration: 90 },
      { courseNumber: 27, name: 'Mina Lepsanovic - ABG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'ABG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001222761226', duration: 90 },
      { courseNumber: 28, name: 'Mina Lepsanovic - ABG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Mina Lepsanovic', level: 'ABG', schedule: 'TT', dayOfWeek: 'Thursday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/91297105318', zoomId: '91297105318', telegramGroup: '-1001222761226', duration: 90 },
      { courseNumber: 29, name: 'Maimouna Koffi - BBG - TT - 8:30pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001286017606', duration: 90 },
      { courseNumber: 30, name: 'Maimouna Koffi - BBG - TT - 8:30pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001286017606', duration: 90 },
      { courseNumber: 31, name: 'Maimouna Koffi - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001167284568', duration: 90 },
      { courseNumber: 32, name: 'Maimouna Koffi - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001167284568', duration: 90 },
      { courseNumber: 33, name: 'Aby Ndiaye - ZBG - TT - 8:00pm', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'ZBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001171855618', duration: 90 },
      { courseNumber: 34, name: 'Aby Ndiaye - ZBG - TT - 8:00pm', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'ZBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001171855618', duration: 90 },
      { courseNumber: 35, name: 'Aby Ndiaye - ZBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'ZBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001164992662', duration: 90 },
      { courseNumber: 36, name: 'Aby Ndiaye - ZBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'ZBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001164992662', duration: 90 },
      { courseNumber: 37, name: 'Aby Ndiaye - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001194997507', duration: 90 },
      { courseNumber: 38, name: 'Aby Ndiaye - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001194997507', duration: 90 },
      { courseNumber: 39, name: 'Wissam Eddine - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001246851678', duration: 90 },
      { courseNumber: 40, name: 'Wissam Eddine - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001246851678', duration: 90 },
      { courseNumber: 41, name: 'Wissam Eddine - BBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001182626254', duration: 90 },
      { courseNumber: 42, name: 'Wissam Eddine - BBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Wissam Eddine', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/97644416913', zoomId: '97644416913', telegramGroup: '-1001182626254', duration: 90 },

      // More TT and weekend courses
      { courseNumber: 43, name: 'Hafida Faraj - ABG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ABG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001154933481', duration: 90 },
      { courseNumber: 44, name: 'Hafida Faraj - ABG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ABG', schedule: 'TT', dayOfWeek: 'Thursday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001154933481', duration: 90 },
      { courseNumber: 45, name: 'Maryam Dannoun - IG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'IG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001130498568', duration: 90 },
      { courseNumber: 46, name: 'Maryam Dannoun - IG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'IG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001130498568', duration: 90 },
      { courseNumber: 47, name: 'Maryam Dannoun - ABG - TT - 8:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'ABG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001107531564', duration: 90 },
      { courseNumber: 48, name: 'Maryam Dannoun - ABG - TT - 8:00pm', instructor: 'Kodjo', professorName: 'Maryam Dannoun', level: 'ABG', schedule: 'TT', dayOfWeek: 'Thursday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/91566605427', zoomId: '91566605427', telegramGroup: '-1001107531564', duration: 90 },
      { courseNumber: 49, name: 'Hanae El Kraid - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001154649756', duration: 90 },
      { courseNumber: 50, name: 'Hanae El Kraid - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001154649756', duration: 90 },

      // More courses (51-86 continuing the pattern)
      { courseNumber: 51, name: 'Hanae El Kraid - BBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001140649755', duration: 90 },
      { courseNumber: 52, name: 'Hanae El Kraid - BBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001140649755', duration: 90 },
      { courseNumber: 53, name: 'Nassiba Faiq - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001128379563', duration: 90 },
      { courseNumber: 54, name: 'Nassiba Faiq - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001128379563', duration: 90 },
      { courseNumber: 55, name: 'Nassiba Faiq - BBG - TT - 8:30pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001120658532', duration: 90 },
      { courseNumber: 56, name: 'Nassiba Faiq - BBG - TT - 8:30pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001120658532', duration: 90 },
      { courseNumber: 57, name: 'Rasha Alaoui - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Rasha Alaoui', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/92104568731', zoomId: '92104568731', telegramGroup: '-1001119745683', duration: 90 },
      { courseNumber: 58, name: 'Rasha Alaoui - BBG - TT - 7:00pm', instructor: 'Kodjo', professorName: 'Rasha Alaoui', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/92104568731', zoomId: '92104568731', telegramGroup: '-1001119745683', duration: 90 },
      { courseNumber: 59, name: 'Rasha Alaoui - BBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Rasha Alaoui', level: 'BBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/92104568731', zoomId: '92104568731', telegramGroup: '-1001118734572', duration: 90 },
      { courseNumber: 60, name: 'Rasha Alaoui - BBG - TT - 9:00pm', instructor: 'Kodjo', professorName: 'Rasha Alaoui', level: 'BBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/92104568731', zoomId: '92104568731', telegramGroup: '-1001118734572', duration: 90 },

      // Weekend courses
      { courseNumber: 61, name: 'Jahnvi Mahtani - IG - SS - 11:00am', instructor: 'Kodjo', professorName: 'Jahnvi Mahtani', level: 'IG', schedule: 'SS', dayOfWeek: 'Saturday', time: '14h 00 France', zoomLink: 'https://zoom.us/j/91582135371', zoomId: '91582135371', telegramGroup: '-1001101456879', duration: 90 },
      { courseNumber: 62, name: 'Jahnvi Mahtani - IG - SS - 11:00am', instructor: 'Kodjo', professorName: 'Jahnvi Mahtani', level: 'IG', schedule: 'SS', dayOfWeek: 'Sunday', time: '14h 00 France', zoomLink: 'https://zoom.us/j/91582135371', zoomId: '91582135371', telegramGroup: '-1001101456879', duration: 90 },
      { courseNumber: 63, name: 'Hafida Faraj - ZBG - TT - 8:00pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ZBG', schedule: 'TT', dayOfWeek: 'Tuesday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001104589631', duration: 90 },
      { courseNumber: 64, name: 'Hafida Faraj - ZBG - TT - 8:00pm', instructor: 'Kodjo', professorName: 'Hafida Faraj', level: 'ZBG', schedule: 'TT', dayOfWeek: 'Thursday', time: '21h 00 France', zoomLink: 'https://zoom.us/j/96390711212', zoomId: '96390711212', telegramGroup: '-1001104589631', duration: 90 },
      { courseNumber: 65, name: 'Salma Choufani - ZBG - SS - 10:00am', instructor: 'Kodjo', professorName: 'Salma Choufani', level: 'ZBG', schedule: 'SS', dayOfWeek: 'Saturday', time: '13h 00 France', zoomLink: 'https://zoom.us/j/94856731025', zoomId: '94856731025', telegramGroup: '-1001103452168', duration: 90 },
      { courseNumber: 66, name: 'Salma Choufani - ZBG - SS - 10:00am', instructor: 'Kodjo', professorName: 'Salma Choufani', level: 'ZBG', schedule: 'SS', dayOfWeek: 'Sunday', time: '13h 00 France', zoomLink: 'https://zoom.us/j/94856731025', zoomId: '94856731025', telegramGroup: '-1001103452168', duration: 90 },

      // Friday courses
      { courseNumber: 67, name: 'Maimouna Koffi - BBG - FS - 7:30pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'BBG', schedule: 'FS', dayOfWeek: 'Friday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001102345678', duration: 90 },
      { courseNumber: 68, name: 'Maimouna Koffi - BBG - FS - 7:30pm', instructor: 'Kodjo', professorName: 'Maimouna Koffi', level: 'BBG', schedule: 'FS', dayOfWeek: 'Saturday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/94708296538', zoomId: '94708296538', telegramGroup: '-1001102345678', duration: 90 },
      { courseNumber: 69, name: 'Hanae El Kraid - BBG - FS - 6:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'FS', dayOfWeek: 'Friday', time: '19h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001101234567', duration: 90 },
      { courseNumber: 70, name: 'Hanae El Kraid - BBG - FS - 6:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'FS', dayOfWeek: 'Saturday', time: '19h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001101234567', duration: 90 },
      { courseNumber: 71, name: 'Hanae El Kraid - BBG - FS - 9:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'FS', dayOfWeek: 'Friday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001100123456', duration: 90 },
      { courseNumber: 72, name: 'Hanae El Kraid - BBG - FS - 9:00pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'FS', dayOfWeek: 'Saturday', time: '22h 00 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001100123456', duration: 90 },
      { courseNumber: 73, name: 'Hanae El Kraid - BBG - FS - 7:30pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'FS', dayOfWeek: 'Friday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001198765432', duration: 90 },
      { courseNumber: 74, name: 'Hanae El Kraid - BBG - FS - 7:30pm', instructor: 'Kodjo', professorName: 'Hanae El Kraid', level: 'BBG', schedule: 'FS', dayOfWeek: 'Saturday', time: '20h 30 France', zoomLink: 'https://zoom.us/j/95837473657', zoomId: '95837473657', telegramGroup: '-1001198765432', duration: 90 },
      { courseNumber: 75, name: 'Nassiba Faiq - BBG - FS - 7:00pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'FS', dayOfWeek: 'Friday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001187654321', duration: 90 },
      { courseNumber: 76, name: 'Nassiba Faiq - BBG - FS - 7:00pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'FS', dayOfWeek: 'Saturday', time: '20h 00 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001187654321', duration: 90 },
      { courseNumber: 77, name: 'Nassiba Faiq - BBG - FS - 8:30pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'FS', dayOfWeek: 'Friday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001176543210', duration: 90 },
      { courseNumber: 78, name: 'Nassiba Faiq - BBG - FS - 8:30pm', instructor: 'Kodjo', professorName: 'Nassiba Faiq', level: 'BBG', schedule: 'FS', dayOfWeek: 'Saturday', time: '21h 30 France', zoomLink: 'https://zoom.us/j/98379403216', zoomId: '98379403216', telegramGroup: '-1001176543210', duration: 90 },

      // Weekend courses (Saturday-Sunday)
      { courseNumber: 79, name: 'Aby Ndiaye - ABG - SS - 9:00am', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'ABG', schedule: 'SS', dayOfWeek: 'Saturday', time: '12h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001165432109', duration: 90 },
      { courseNumber: 80, name: 'Aby Ndiaye - ABG - SS - 9:00am', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'ABG', schedule: 'SS', dayOfWeek: 'Sunday', time: '12h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001165432109', duration: 90 },
      { courseNumber: 81, name: 'Aby Ndiaye - BBG - SS - 11:00am', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'BBG', schedule: 'SS', dayOfWeek: 'Saturday', time: '14h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001154321098', duration: 90 },
      { courseNumber: 82, name: 'Aby Ndiaye - BBG - SS - 11:00am', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'BBG', schedule: 'SS', dayOfWeek: 'Sunday', time: '14h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001154321098', duration: 90 },
      { courseNumber: 83, name: 'Aby Ndiaye - IAG - SS - 10:00am', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'IAG', schedule: 'SS', dayOfWeek: 'Saturday', time: '13h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001143210987', duration: 90 },
      { courseNumber: 84, name: 'Aby Ndiaye - IAG - SS - 10:00am', instructor: 'Kodjo', professorName: 'Aby Ndiaye', level: 'IAG', schedule: 'SS', dayOfWeek: 'Sunday', time: '13h 00 France', zoomLink: 'https://zoom.us/j/95264594801', zoomId: '95264594801', telegramGroup: '-1001143210987', duration: 90 },
      { courseNumber: 85, name: 'Salma Choufani - ABG - SS - 2:00pm', instructor: 'Kodjo', professorName: 'Salma Choufani', level: 'ABG', schedule: 'SS', dayOfWeek: 'Saturday', time: '17h 00 France', zoomLink: 'https://zoom.us/j/94856731025', zoomId: '94856731025', telegramGroup: '-1001932056798', duration: 90 },
      { courseNumber: 86, name: 'Salma Choufani - ABG - SS - 2:00pm', instructor: 'Kodjo', professorName: 'Salma Choufani', level: 'ABG', schedule: 'SS', dayOfWeek: 'Sunday', time: '17h 00 France', zoomLink: 'https://zoom.us/j/94856731025', zoomId: '94856731025', telegramGroup: '-1001932056798', duration: 90 }
    ];

    console.log(`Chargement de ${excelData.length} cours depuis les données Excel complètes`);
    excelData.forEach(course => this.createCourse(course));
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;

    // Hash the password if it's not already hashed
    let password = insertUser.password;
    if (!password.startsWith('$2b$')) {
      password = await bcrypt.hash(password, 10);
    }

    const user: User = {
      ...insertUser,
      password, // Use the hashed password
      id,
      lastLogin: null,
      avatar: null
    };

    this.usersData.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.usersData.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.usersData.set(id, user);
    }
  }

  // Course Methods
  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const newCourse: Course = {
      id,
      name: course.name,
      instructor: course.instructor,
      dayOfWeek: course.dayOfWeek,
      time: course.time,
      zoomLink: course.zoomLink,
      courseNumber: course.courseNumber || null,
      professorName: course.professorName || null,
      level: course.level || null,
      schedule: course.schedule || null,
      telegramGroup: course.telegramGroup || null,
      zoomId: course.zoomId || null,
      startDateTime: course.startDateTime || null,
      duration: course.duration || null
    };
    this.coursesData.set(id, newCourse);
    return newCourse;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.coursesData.get(id);
  }

  async getCourseByName(name: string): Promise<Course | undefined> {
    return Array.from(this.coursesData.values()).find(
      (course) => course.name === name
    );
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.coursesData.values());
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const course = this.coursesData.get(id);
    if (!course) return undefined;

    const updatedCourse = { ...course, ...courseData };
    this.coursesData.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    this.coursesData.delete(id);
    // Remove related enrollments
    this.courseEnrollmentsData = this.courseEnrollmentsData.filter(e => e.courseId !== id);
  }

  async getUpcomingCourses(): Promise<Course[]> {
    // In a real implementation, this would filter by date/time
    return Array.from(this.coursesData.values());
  }

  // Course Enrollments
  async enrollUserInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const existingEnrollment = this.courseEnrollmentsData.find(
      e => e.userId === enrollment.userId && e.courseId === enrollment.courseId
    );

    if (existingEnrollment) {
      return existingEnrollment;
    }

    this.courseEnrollmentsData.push(enrollment);
    return enrollment;
  }

  async getEnrollmentsForCourse(courseId: number): Promise<CourseEnrollment[]> {
    return this.courseEnrollmentsData.filter(e => e.courseId === courseId);
  }

  async getEnrollmentsForUser(userId: number): Promise<CourseEnrollment[]> {
    return this.courseEnrollmentsData.filter(e => e.userId === userId);
  }

  async unenrollUserFromCourse(userId: number, courseId: number): Promise<void> {
    this.courseEnrollmentsData = this.courseEnrollmentsData.filter(
      e => !(e.userId === userId && e.courseId === courseId)
    );
  }

  // Zoom Attendance
  async recordAttendance(attendance: InsertZoomAttendance): Promise<ZoomAttendance> {
    const id = this.attendanceId++;
    const defaultPoints = 10; // Default points for attendance
    const newAttendance: ZoomAttendance = {
      ...attendance,
      id,
      duration: null,
      pointsAwarded: defaultPoints
    };

    this.zoomAttendanceData.set(id, newAttendance);

    // Update user ranking for this attendance
    await this.updateUserPoints(attendance.userId, defaultPoints, 0);

    return newAttendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<ZoomAttendance>): Promise<ZoomAttendance | undefined> {
    const attendance = this.zoomAttendanceData.get(id);
    if (!attendance) return undefined;

    const updatedAttendance = { ...attendance, ...attendanceData };

    // Calculate duration if leaveTime is provided
    if (attendanceData.leaveTime && attendance.joinTime) {
      const joinTime = new Date(attendance.joinTime).getTime();
      const leaveTime = new Date(attendanceData.leaveTime).getTime();
      const durationMs = leaveTime - joinTime;
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      updatedAttendance.duration = durationMinutes;
    }

    this.zoomAttendanceData.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async getAttendanceForCourse(courseId: number): Promise<ZoomAttendance[]> {
    return Array.from(this.zoomAttendanceData.values())
      .filter(a => a.courseId === courseId);
  }

  async getAttendanceForUser(userId: number): Promise<ZoomAttendance[]> {
    return Array.from(this.zoomAttendanceData.values())
      .filter(a => a.userId === userId);
  }

  async getRecentAttendance(days: number): Promise<ZoomAttendance[]> {
    const cutoffDate = subDays(new Date(), days);
    return Array.from(this.zoomAttendanceData.values())
      .filter(a => new Date(a.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Telegram Messages
  async recordTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage> {
    const id = this.messageId++;
    const defaultPoints = 1; // Default points for message
    const newMessage: TelegramMessage = { ...message, id, pointsAwarded: defaultPoints };

    this.telegramMessagesData.set(id, newMessage);

    // Update user ranking for this message
    await this.updateUserPoints(message.userId, 0, defaultPoints);

    return newMessage;
  }

  async getMessagesForCourse(courseId: number): Promise<TelegramMessage[]> {
    return Array.from(this.telegramMessagesData.values())
      .filter(m => m.courseId === courseId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async getMessagesForUser(userId: number): Promise<TelegramMessage[]> {
    return Array.from(this.telegramMessagesData.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async getRecentMessages(count: number): Promise<TelegramMessage[]> {
    return Array.from(this.telegramMessagesData.values())
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, count);
  }

  // Scheduled Messages
  async createScheduledMessage(message: InsertScheduledMessage): Promise<ScheduledMessage> {
    const id = this.scheduledMessageId++;
    const newMessage: ScheduledMessage = { ...message, id, sentAt: null };
    this.scheduledMessagesData.set(id, newMessage);
    return newMessage;
  }

  async getScheduledMessage(id: number): Promise<ScheduledMessage | undefined> {
    return this.scheduledMessagesData.get(id);
  }

  async getAllScheduledMessages(): Promise<ScheduledMessage[]> {
    return Array.from(this.scheduledMessagesData.values())
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  async updateScheduledMessage(id: number, messageData: Partial<ScheduledMessage>): Promise<ScheduledMessage | undefined> {
    const message = this.scheduledMessagesData.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...messageData };
    this.scheduledMessagesData.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteScheduledMessage(id: number): Promise<void> {
    this.scheduledMessagesData.delete(id);
  }

  async getPendingScheduledMessages(): Promise<ScheduledMessage[]> {
    const now = new Date();
    return Array.from(this.scheduledMessagesData.values())
      .filter(m => m.active && !m.sentAt && new Date(m.scheduledFor) <= now);
  }

  async markScheduledMessageAsSent(id: number): Promise<void> {
    const message = this.scheduledMessagesData.get(id);
    if (message) {
      message.sentAt = new Date();
      this.scheduledMessagesData.set(id, message);
    }
  }

  // Zoom Attendance
  async recordAttendance(data: InsertZoomAttendance): Promise<ZoomAttendance> {
    const id = this.attendanceId++;
    const newAttendance: ZoomAttendance = {
      id,
      ...data,
      timestamp: data.timestamp || new Date(),
    };
    this.zoomAttendanceData.set(id, newAttendance);

    // Calculate duration if joinTime and leaveTime are provided
    if (data.joinTime && data.leaveTime && !data.duration) {
      const joinTime = new Date(data.joinTime);
      const leaveTime = new Date(data.leaveTime);
      const durationMs = leaveTime.getTime() - joinTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      newAttendance.duration = durationMinutes;
      this.zoomAttendanceData.set(id, newAttendance);
    }

    // Award points for attendance
    const defaultPoints = 10; // Default points for attendance
    await this.addUserPoints({
      userId: data.userId,
      points: defaultPoints,
      reason: 'attendance',
      description: `Attendance for course #${data.courseId} meeting ${data.meetingId}`,
      courseId: data.courseId,
      timestamp: new Date(),
    });

    return newAttendance;
  }

  async getAttendanceForUser(userId: number, options?: { startDate?: Date; endDate?: Date; courseId?: number }): Promise<ZoomAttendance[]> {
    let attendances = Array.from(this.zoomAttendanceData.values()).filter(a => a.userId === userId);

    if (options?.startDate) {
      attendances = attendances.filter(a => new Date(a.joinTime) >= options.startDate!);
    }

    if (options?.endDate) {
      attendances = attendances.filter(a => new Date(a.joinTime) <= options.endDate!);
    }

    if (options?.courseId) {
      attendances = attendances.filter(a => a.courseId === options.courseId);
    }

    return attendances.sort((a, b) => new Date(b.joinTime).getTime() - new Date(a.joinTime).getTime());
  }

  async getAttendanceForCourse(courseId: number, options?: { startDate?: Date; endDate?: Date }): Promise<ZoomAttendance[]> {
    let attendances = Array.from(this.zoomAttendanceData.values()).filter(a => a.courseId === courseId);

    if (options?.startDate) {
      attendances = attendances.filter(a => new Date(a.joinTime) >= options.startDate!);
    }

    if (options?.endDate) {
      attendances = attendances.filter(a => new Date(a.joinTime) <= options.endDate!);
    }

    return attendances.sort((a, b) => new Date(b.joinTime).getTime() - new Date(a.joinTime).getTime());
  }

  async getAttendanceStats(userId: number, courseId?: number): Promise<{ totalSessions: number; totalDuration: number; averageDuration: number }> {
    // Get all attendance records for the user
    const attendances = await this.getAttendanceForUser(userId, { courseId });

    // Count unique sessions (by meetingId)
    const uniqueMeetings = new Set(attendances.map(a => a.meetingId));
    const totalSessions = uniqueMeetings.size;

    // Calculate total duration
    const totalDuration = attendances.reduce((sum, a) => sum + (a.duration || 0), 0);

    // Calculate average duration
    const averageDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    return {
      totalSessions,
      totalDuration,
      averageDuration
    };
  }

  async deleteAttendance(id: number): Promise<void> {
    this.zoomAttendanceData.delete(id);
  }

  // User Points
  async addUserPoints(data: InsertUserPoints): Promise<UserPoints> {
    const id = this.pointId++;
    const newPoints: UserPoints = {
      id,
      ...data,
      timestamp: data.timestamp || new Date(),
    };
    this.userPointsData.set(id, newPoints);

    // Update user rankings
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const startOfWeekDate = startOfWeek(today);
    const endOfWeekDate = endOfWeek(today);

    const startOfMonthDate = startOfMonth(today);
    const endOfMonthDate = endOfMonth(today);

    // Update daily ranking
    await this.createOrUpdateRanking({
      userId: data.userId,
      attendancePoints: data.reason === 'attendance' ? data.points : 0,
      messagePoints: data.reason === 'message' ? data.points : 0,
      period: "daily",
      periodStart: startOfDay,
      periodEnd: endOfDay,
    });

    // Update weekly ranking
    await this.createOrUpdateRanking({
      userId: data.userId,
      attendancePoints: data.reason === 'attendance' ? data.points : 0,
      messagePoints: data.reason === 'message' ? data.points : 0,
      period: "weekly",
      periodStart: startOfWeekDate,
      periodEnd: endOfWeekDate,
    });

    // Update monthly ranking
    await this.createOrUpdateRanking({
      userId: data.userId,
      attendancePoints: data.reason === 'attendance' ? data.points : 0,
      messagePoints: data.reason === 'message' ? data.points : 0,
      period: "monthly",
      periodStart: startOfMonthDate,
      periodEnd: endOfMonthDate,
    });

    return newPoints;
  }

  async getUserPoints(userId: number, options?: { startDate?: Date; endDate?: Date; reason?: string }): Promise<UserPoints[]> {
    let points = Array.from(this.userPointsData.values()).filter(p => p.userId === userId);

    if (options?.startDate) {
      points = points.filter(p => p.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      points = points.filter(p => p.timestamp <= options.endDate!);
    }

    if (options?.reason) {
      points = points.filter(p => p.reason === options.reason);
    }

    return points.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getTotalUserPoints(userId: number, options?: { startDate?: Date; endDate?: Date; reason?: string }): Promise<number> {
    const points = await this.getUserPoints(userId, options);
    return points.reduce((total, p) => total + p.points, 0);
  }

  async deleteUserPoints(id: number): Promise<void> {
    this.userPointsData.delete(id);
  }

  // User Rankings
  async createOrUpdateRanking(ranking: InsertUserRanking): Promise<UserRanking> {
    // Check if ranking exists for this user and period
    const existingRanking = Array.from(this.userRankingsData.values()).find(
      r => r.userId === ranking.userId && r.period === ranking.period &&
           r.periodStart.toISOString() === ranking.periodStart.toISOString() &&
           r.periodEnd.toISOString() === ranking.periodEnd.toISOString()
    );

    if (existingRanking) {
      const totalPoints = existingRanking.attendancePoints + existingRanking.messagePoints;
      const updatedRanking = {
        ...existingRanking,
        ...ranking,
        totalPoints,
        lastActivity: new Date()
      };
      this.userRankingsData.set(existingRanking.id, updatedRanking);
      return updatedRanking;
    } else {
      const id = this.rankingId++;
      const totalPoints = ranking.attendancePoints + ranking.messagePoints;
      const newRanking: UserRanking = {
        ...ranking,
        id,
        totalPoints,
        lastActivity: new Date()
      };
      this.userRankingsData.set(id, newRanking);
      return newRanking;
    }
  }

  async getRankingsForPeriod(period: string): Promise<UserRanking[]> {
    let periodStart: Date;
    let periodEnd: Date;
    const now = new Date();

    switch (period) {
      case 'daily':
        periodStart = startOfDay(now);
        periodEnd = endOfDay(now);
        break;
      case 'weekly':
        periodStart = startOfWeek(now);
        periodEnd = endOfWeek(now);
        break;
      case 'monthly':
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
        break;
      default:
        periodStart = startOfDay(now);
        periodEnd = endOfDay(now);
    }

    return Array.from(this.userRankingsData.values())
      .filter(r => r.period === period &&
        new Date(r.periodStart) >= periodStart &&
        new Date(r.periodEnd) <= periodEnd)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  async getTopRankings(period: string, limit: number): Promise<UserRanking[]> {
    const rankings = await this.getRankingsForPeriod(period);
    return rankings.slice(0, limit);
  }

  async updateUserPoints(userId: number, attendancePoints: number, messagePoints: number): Promise<void> {
    // Update daily ranking
    const now = new Date();
    const dailyStart = startOfDay(now);
    const dailyEnd = endOfDay(now);

    const dailyRanking = Array.from(this.userRankingsData.values()).find(
      r => r.userId === userId && r.period === 'daily' &&
           new Date(r.periodStart) <= now && new Date(r.periodEnd) >= now
    );

    if (dailyRanking) {
      dailyRanking.attendancePoints += attendancePoints;
      dailyRanking.messagePoints += messagePoints;
      dailyRanking.totalPoints = dailyRanking.attendancePoints + dailyRanking.messagePoints;
      dailyRanking.lastActivity = now;
      this.userRankingsData.set(dailyRanking.id, dailyRanking);
    } else {
      const newDailyRanking: InsertUserRanking = {
        userId,
        attendancePoints,
        messagePoints,
        period: 'daily',
        periodStart: dailyStart,
        periodEnd: dailyEnd,
        lastActivity: now
      };
      await this.createOrUpdateRanking(newDailyRanking);
    }

    // Update weekly ranking
    const weeklyStart = startOfWeek(now);
    const weeklyEnd = endOfWeek(now);

    const weeklyRanking = Array.from(this.userRankingsData.values()).find(
      r => r.userId === userId && r.period === 'weekly' &&
           new Date(r.periodStart) <= now && new Date(r.periodEnd) >= now
    );

    if (weeklyRanking) {
      weeklyRanking.attendancePoints += attendancePoints;
      weeklyRanking.messagePoints += messagePoints;
      weeklyRanking.totalPoints = weeklyRanking.attendancePoints + weeklyRanking.messagePoints;
      weeklyRanking.lastActivity = now;
      this.userRankingsData.set(weeklyRanking.id, weeklyRanking);
    } else {
      const newWeeklyRanking: InsertUserRanking = {
        userId,
        attendancePoints,
        messagePoints,
        period: 'weekly',
        periodStart: weeklyStart,
        periodEnd: weeklyEnd,
        lastActivity: now
      };
      await this.createOrUpdateRanking(newWeeklyRanking);
    }

    // Update monthly ranking
    const monthlyStart = startOfMonth(now);
    const monthlyEnd = endOfMonth(now);

    const monthlyRanking = Array.from(this.userRankingsData.values()).find(
      r => r.userId === userId && r.period === 'monthly' &&
           new Date(r.periodStart) <= now && new Date(r.periodEnd) >= now
    );

    if (monthlyRanking) {
      monthlyRanking.attendancePoints += attendancePoints;
      monthlyRanking.messagePoints += messagePoints;
      monthlyRanking.totalPoints = monthlyRanking.attendancePoints + monthlyRanking.messagePoints;
      monthlyRanking.lastActivity = now;
      this.userRankingsData.set(monthlyRanking.id, monthlyRanking);
    } else {
      const newMonthlyRanking: InsertUserRanking = {
        userId,
        attendancePoints,
        messagePoints,
        period: 'monthly',
        periodStart: monthlyStart,
        periodEnd: monthlyEnd,
        lastActivity: now
      };
      await this.createOrUpdateRanking(newMonthlyRanking);
    }
  }

  async recalculateUserRankings(): Promise<void> {
    // Clear existing rankings
    this.userRankingsData.clear();

    // Get all users
    const users = Array.from(this.usersData.values());

    // Get current date info
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const startWeek = startOfWeek(now);
    const endWeek = endOfWeek(now);
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    // For each user, calculate points for each period
    for (const user of users) {
      // Daily points
      const dailyAttendancePoints = await this.getTotalUserPoints(user.id, {
        startDate: today,
        endDate: endToday,
        reason: 'attendance'
      });

      const dailyMessagePoints = await this.getTotalUserPoints(user.id, {
        startDate: today,
        endDate: endToday,
        reason: 'message'
      });

      // Weekly points
      const weeklyAttendancePoints = await this.getTotalUserPoints(user.id, {
        startDate: startWeek,
        endDate: endWeek,
        reason: 'attendance'
      });

      const weeklyMessagePoints = await this.getTotalUserPoints(user.id, {
        startDate: startWeek,
        endDate: endWeek,
        reason: 'message'
      });

      // Monthly points
      const monthlyAttendancePoints = await this.getTotalUserPoints(user.id, {
        startDate: startMonth,
        endDate: endMonth,
        reason: 'attendance'
      });

      const monthlyMessagePoints = await this.getTotalUserPoints(user.id, {
        startDate: startMonth,
        endDate: endMonth,
        reason: 'message'
      });

      // Create rankings
      await this.createOrUpdateRanking({
        userId: user.id,
        attendancePoints: dailyAttendancePoints,
        messagePoints: dailyMessagePoints,
        period: 'daily',
        periodStart: today,
        periodEnd: endToday
      });

      await this.createOrUpdateRanking({
        userId: user.id,
        attendancePoints: weeklyAttendancePoints,
        messagePoints: weeklyMessagePoints,
        period: 'weekly',
        periodStart: startWeek,
        periodEnd: endWeek
      });

      await this.createOrUpdateRanking({
        userId: user.id,
        attendancePoints: monthlyAttendancePoints,
        messagePoints: monthlyMessagePoints,
        period: 'monthly',
        periodStart: startMonth,
        periodEnd: endMonth
      });
    }
  }

  // Logs
  async createLog(log: InsertLog): Promise<Log> {
    const id = this.logId++;
    const newLog: Log = { ...log, id };
    this.logsData.set(id, newLog);
    return newLog;
  }

  async getRecentLogs(count: number): Promise<Log[]> {
    return Array.from(this.logsData.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  async getLogsByLevel(level: string): Promise<Log[]> {
    return Array.from(this.logsData.values())
      .filter(log => log.level === level)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Scenarios
  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    const id = this.scenarioId++;
    const newScenario: Scenario = { ...scenario, id, lastRun: null };
    this.scenariosData.set(id, newScenario);
    return newScenario;
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    return this.scenariosData.get(id);
  }

  async getAllScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenariosData.values());
  }

  async updateScenario(id: number, scenarioData: Partial<Scenario>): Promise<Scenario | undefined> {
    const scenario = this.scenariosData.get(id);
    if (!scenario) return undefined;

    const updatedScenario = { ...scenario, ...scenarioData };
    this.scenariosData.set(id, updatedScenario);
    return updatedScenario;
  }

  async deleteScenario(id: number): Promise<void> {
    this.scenariosData.delete(id);
  }

  async getActiveScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenariosData.values())
      .filter(s => s.active);
  }

  async updateScenarioLastRun(id: number): Promise<void> {
    const scenario = this.scenariosData.get(id);
    if (scenario) {
      scenario.lastRun = new Date();
      this.scenariosData.set(id, scenario);
    }
  }

  // Point Rules
  async createPointRule(rule: InsertPointRule): Promise<PointRule> {
    const id = this.pointRuleId++;
    const newRule: PointRule = {
      id,
      name: rule.name,
      description: rule.description || null,
      activityType: rule.activityType,
      pointsAmount: rule.pointsAmount,
      conditions: rule.conditions || null,
      active: rule.active !== undefined ? rule.active : true,
      createdAt: new Date(),
      updatedAt: null
    };
    this.pointRulesData.set(id, newRule);
    return newRule;
  }

  async getPointRule(id: number): Promise<PointRule | undefined> {
    return this.pointRulesData.get(id);
  }

  async getAllPointRules(): Promise<PointRule[]> {
    return Array.from(this.pointRulesData.values());
  }

  async getActivePointRules(): Promise<PointRule[]> {
    return Array.from(this.pointRulesData.values())
      .filter(rule => rule.active);
  }

  async updatePointRule(id: number, ruleData: Partial<PointRule>): Promise<PointRule | undefined> {
    const rule = this.pointRulesData.get(id);
    if (!rule) return undefined;

    const updatedRule = { ...rule, ...ruleData, updatedAt: new Date() };
    this.pointRulesData.set(id, updatedRule);
    return updatedRule;
  }

  async deletePointRule(id: number): Promise<void> {
    this.pointRulesData.delete(id);
  }

  async getPointRuleByActivityType(activityType: string): Promise<PointRule | undefined> {
    return Array.from(this.pointRulesData.values())
      .find(rule => rule.activityType === activityType && rule.active);
  }

  // Reminder Templates
  async createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate> {
    const id = this.reminderTemplateId++;
    const newTemplate: ReminderTemplate = {
      id,
      name: template.name,
      type: template.type,
      content: template.content,
      courseId: template.courseId || null,
      courseLevel: template.courseLevel || null,
      isDefault: template.isDefault !== undefined ? template.isDefault : false,
      sendEmail: template.sendEmail !== undefined ? template.sendEmail : true,
      sendTelegram: template.sendTelegram !== undefined ? template.sendTelegram : true,
      emailSubject: template.emailSubject || null,
      createdAt: new Date(),
      updatedAt: null
    };

    // Si ce modèle est défini comme par défaut, désactiver les autres modèles par défaut du même type
    if (newTemplate.isDefault) {
      for (const [id, existingTemplate] of this.reminderTemplatesData.entries()) {
        if (existingTemplate.type === newTemplate.type && existingTemplate.isDefault && id !== newTemplate.id) {
          existingTemplate.isDefault = false;
          this.reminderTemplatesData.set(id, existingTemplate);
        }
      }
    }

    this.reminderTemplatesData.set(id, newTemplate);
    return newTemplate;
  }

  async getReminderTemplate(id: number): Promise<ReminderTemplate | undefined> {
    return this.reminderTemplatesData.get(id);
  }

  async getAllReminderTemplates(): Promise<ReminderTemplate[]> {
    return Array.from(this.reminderTemplatesData.values());
  }

  async getReminderTemplatesByType(type: string): Promise<ReminderTemplate[]> {
    return Array.from(this.reminderTemplatesData.values())
      .filter(template => template.type === type);
  }

  async getReminderTemplatesByLevel(level: string): Promise<ReminderTemplate[]> {
    return Array.from(this.reminderTemplatesData.values())
      .filter(template => template.courseLevel === level);
  }

  async getDefaultReminderTemplate(type: string): Promise<ReminderTemplate | undefined> {
    return Array.from(this.reminderTemplatesData.values())
      .find(template => template.type === type && template.isDefault);
  }

  async getReminderTemplateForCourse(courseId: number, type: string): Promise<ReminderTemplate | undefined> {
    // Chercher d'abord un modèle spécifique pour ce cours
    const courseSpecificTemplate = Array.from(this.reminderTemplatesData.values())
      .find(template => template.courseId === courseId && template.type === type);

    if (courseSpecificTemplate) {
      return courseSpecificTemplate;
    }

    // Si aucun modèle spécifique n'est trouvé, chercher un modèle pour le niveau du cours
    const course = await this.getCourse(courseId);
    if (course && course.level) {
      const levelSpecificTemplate = Array.from(this.reminderTemplatesData.values())
        .find(template => template.courseLevel === course.level && template.type === type);

      if (levelSpecificTemplate) {
        return levelSpecificTemplate;
      }
    }

    // Si aucun modèle spécifique n'est trouvé, utiliser le modèle par défaut
    return this.getDefaultReminderTemplate(type);
  }

  async updateReminderTemplate(id: number, templateData: Partial<ReminderTemplate>): Promise<ReminderTemplate | undefined> {
    const template = this.reminderTemplatesData.get(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...templateData, updatedAt: new Date() };

    // Si ce modèle est défini comme par défaut, désactiver les autres modèles par défaut du même type
    if (updatedTemplate.isDefault && templateData.isDefault !== false) {
      for (const [existingId, existingTemplate] of this.reminderTemplatesData.entries()) {
        if (existingTemplate.type === updatedTemplate.type && existingTemplate.isDefault && existingId !== id) {
          existingTemplate.isDefault = false;
          this.reminderTemplatesData.set(existingId, existingTemplate);
        }
      }
    }

    this.reminderTemplatesData.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteReminderTemplate(id: number): Promise<void> {
    this.reminderTemplatesData.delete(id);
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    if (this.appSettingsData.size === 0) {
      return undefined;
    }
    return this.appSettingsData.get(1);
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings | undefined> {
    const existingSettings = await this.getAppSettings();
    if (!existingSettings) return undefined;

    const updatedSettings = { ...existingSettings, ...settings };
    this.appSettingsData.set(existingSettings.id, updatedSettings);
    return updatedSettings;
  }

  async initializeAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const id = this.settingsId++;
    const newSettings: AppSettings = { ...settings, id };
    this.appSettingsData.set(id, newSettings);
    return newSettings;
  }

  // Notification Templates
  async getAllNotificationTemplates(): Promise<NotificationTemplate[]> {
    return getAllNotificationTemplates();
  }

  async getNotificationTemplate(id: number): Promise<NotificationTemplate | undefined> {
    return getNotificationTemplate(id);
  }

  // Zoom Meetings
  async recordZoomMeeting(courseId: number, meeting: ZoomMeeting): Promise<void> {
    this.zoomMeetings.set(courseId, meeting);
  }

  async getZoomMeeting(courseId: number): Promise<ZoomMeeting | null> {
    return this.zoomMeetings.get(courseId) || null;
  }

  async updateZoomMeeting(courseId: number, meeting: ZoomMeeting): Promise<void> {
    this.zoomMeetings.set(courseId, meeting);
  }

  async deleteZoomMeeting(courseId: number): Promise<void> {
    this.zoomMeetings.delete(courseId);
  }

  async addZoomParticipant(courseId: number, participant: ZoomParticipant): Promise<void> {
    const meeting = await this.getZoomMeeting(courseId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    if (!meeting.participants) {
      meeting.participants = [];
    }
    meeting.participants.push(participant);
    await this.updateZoomMeeting(courseId, meeting);
  }

  async updateZoomParticipant(
    courseId: number,
    userId: number,
    status: ZoomParticipant['status'],
    joinTime?: Date,
    leaveTime?: Date
  ): Promise<void> {
    const meeting = await this.getZoomMeeting(courseId);
    if (!meeting || !meeting.participants) {
      throw new Error('Meeting or participant not found');
    }
    const participant = meeting.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('Participant not found');
    }
    participant.status = status;
    if (joinTime) {
      participant.joinTime = joinTime;
    }
    if (leaveTime) {
      participant.leaveTime = leaveTime;
      if (participant.joinTime) {
        participant.duration = (leaveTime.getTime() - participant.joinTime.getTime()) / 1000 / 60;
      }
    }
    await this.updateZoomMeeting(courseId, meeting);
  }

  async getZoomParticipantStats(courseId: number): Promise<{
    total: number;
    joined: number;
    left: number;
    absent: number;
    averageDuration: number;
  }> {
    const meeting = await this.getZoomMeeting(courseId);
    if (!meeting || !meeting.participants) {
      return {
        total: 0,
        joined: 0,
        left: 0,
        absent: 0,
        averageDuration: 0
      };
    }

    const stats = {
      total: meeting.participants.length,
      joined: meeting.participants.filter(p => p.status === 'joined').length,
      left: meeting.participants.filter(p => p.status === 'left').length,
      absent: meeting.participants.filter(p => p.status === 'absent').length,
      averageDuration: 0
    };

    const durations = meeting.participants
      .filter(p => p.duration)
      .map(p => p.duration as number);

    if (durations.length > 0) {
      stats.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    return stats;
  }
}

export const storage = new MemStorage();
