import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { IStorage } from '../storage';
import {
  User, InsertUser, Course, InsertCourse,
  ZoomAttendance, InsertZoomAttendance,
  TelegramMessage, InsertTelegramMessage,
  ScheduledMessage, InsertScheduledMessage,
  UserRanking, InsertUserRanking,
  Log, InsertLog, Scenario, InsertScenario,
  AppSettings, InsertAppSettings,
  CourseEnrollment, InsertCourseEnrollment,
  PointRule, InsertPointRule,
  ReminderTemplate, InsertReminderTemplate
} from "@shared/schema";
import bcrypt from 'bcrypt';
import { encryptionService } from '../services/encryptionService';
import { subDays, format, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ZoomMeeting, ZoomParticipant, UserPoints, InsertUserPoints } from '../storage';

// Assurez-vous que le répertoire data existe
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'edutrack.db');

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Activer les clés étrangères
    this.db.pragma('foreign_keys = ON');

    // Créer les tables si elles n'existent pas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        fullName TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        lastLogin TEXT,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        instructor TEXT NOT NULL,
        dayOfWeek TEXT NOT NULL,
        time TEXT NOT NULL,
        zoomLink TEXT,
        courseNumber TEXT,
        professorName TEXT,
        level TEXT,
        schedule TEXT,
        telegramGroup TEXT,
        zoomId TEXT,
        startDateTime TEXT,
        duration INTEGER
      );

      CREATE TABLE IF NOT EXISTS zoom_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        courseId INTEGER NOT NULL,
        meetingId TEXT NOT NULL,
        joinTime TEXT NOT NULL,
        leaveTime TEXT,
        duration INTEGER,
        pointsAwarded INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS telegram_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        courseId INTEGER NOT NULL,
        messageId TEXT NOT NULL,
        content TEXT NOT NULL,
        sentAt TEXT NOT NULL,
        pointsAwarded INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        courseId INTEGER NOT NULL,
        content TEXT NOT NULL,
        scheduledFor TEXT NOT NULL,
        sentAt TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS user_rankings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        attendancePoints INTEGER NOT NULL,
        messagePoints INTEGER NOT NULL,
        totalPoints INTEGER NOT NULL,
        period TEXT NOT NULL,
        periodStart TEXT NOT NULL,
        periodEnd TEXT NOT NULL,
        lastActivity TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS user_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        points INTEGER NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        source TEXT,
        details TEXT
      );

      CREATE TABLE IF NOT EXISTS scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        description TEXT,
        cronSchedule TEXT,
        active BOOLEAN NOT NULL DEFAULT 1,
        code TEXT NOT NULL,
        lastRun TEXT
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegramToken TEXT,
        telegramWebhookUrl TEXT,
        zoomApiKey TEXT,
        zoomApiSecret TEXT,
        simulationMode BOOLEAN NOT NULL DEFAULT 1,
        testGroup TEXT,
        emailSmtpServer TEXT,
        emailUsername TEXT,
        emailPassword TEXT,
        emailFromAddress TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS course_enrollments (
        userId INTEGER NOT NULL,
        courseId INTEGER NOT NULL,
        enrolledAt TEXT NOT NULL,
        PRIMARY KEY (userId, courseId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS point_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        activityType TEXT NOT NULL,
        pointsAmount INTEGER NOT NULL,
        conditions TEXT,
        active BOOLEAN NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS reminder_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        courseId INTEGER,
        courseLevel TEXT,
        isDefault BOOLEAN NOT NULL DEFAULT 0,
        sendEmail BOOLEAN NOT NULL DEFAULT 1,
        sendTelegram BOOLEAN NOT NULL DEFAULT 1,
        emailSubject TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS zoom_meetings (
        courseId INTEGER PRIMARY KEY,
        meetingId TEXT NOT NULL,
        status TEXT NOT NULL,
        startTime TEXT,
        endTime TEXT,
        participants TEXT,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );
    `);

    // Vérifier si la base de données est vide
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0) {
      console.log('Base de données vide, initialisation avec des données d\'exemple...');
      this.initializeSampleData();
    }
  }

  // Méthode pour créer un utilisateur directement (sans async/await)
  private createUserDirect(insertUser: InsertUser): User {
    // Hacher le mot de passe si ce n'est pas déjà fait
    let password = insertUser.password;
    if (!password.startsWith('$2b$')) {
      // Utiliser hashSync au lieu de hash pour éviter async/await
      password = bcrypt.hashSync(password, 10);
    }

    const result = this.db.prepare(`
      INSERT INTO users (username, password, fullName, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      insertUser.username,
      password,
      insertUser.fullName,
      insertUser.email,
      insertUser.role
    );

    const id = result.lastInsertRowid as number;

    return {
      id,
      username: insertUser.username,
      password,
      fullName: insertUser.fullName,
      email: insertUser.email,
      role: insertUser.role,
      lastLogin: null,
      avatar: null
    };
  }

  // Méthode pour créer une règle de points directement (sans async/await)
  private createPointRuleDirect(rule: any): any {
    const now = new Date().toISOString();

    const result = this.db.prepare(`
      INSERT INTO point_rules (
        name, description, activityType, pointsAmount,
        conditions, active, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rule.name,
      rule.description || null,
      rule.activityType,
      rule.pointsAmount,
      rule.conditions || null,
      rule.active ? 1 : 0,
      now,
      null
    );

    const id = result.lastInsertRowid as number;

    return {
      id,
      name: rule.name,
      description: rule.description || null,
      activityType: rule.activityType,
      pointsAmount: rule.pointsAmount,
      conditions: rule.conditions || null,
      active: rule.active !== undefined ? rule.active : true,
      createdAt: new Date(now),
      updatedAt: null
    };
  }

  // Méthode pour créer un modèle de rappel directement (sans async/await)
  private createReminderTemplateDirect(template: any): any {
    // Si ce modèle est défini comme par défaut, désactiver les autres modèles par défaut du même type
    if (template.isDefault) {
      this.db.prepare(`
        UPDATE reminder_templates
        SET isDefault = 0
        WHERE type = ? AND isDefault = 1
      `).run(template.type);
    }

    const now = new Date().toISOString();

    const result = this.db.prepare(`
      INSERT INTO reminder_templates (
        name, type, content, courseId, courseLevel,
        isDefault, sendEmail, sendTelegram, emailSubject,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.name,
      template.type,
      template.content,
      template.courseId || null,
      template.courseLevel || null,
      template.isDefault ? 1 : 0,
      template.sendEmail !== undefined ? (template.sendEmail ? 1 : 0) : 1,
      template.sendTelegram !== undefined ? (template.sendTelegram ? 1 : 0) : 1,
      template.emailSubject || null,
      now,
      null
    );

    const id = result.lastInsertRowid as number;

    return {
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
      createdAt: new Date(now),
      updatedAt: null
    };
  }

  // Méthode pour créer des paramètres d'application directement (sans async/await)
  private createAppSettingsDirect(settings: any): any {
    const now = new Date().toISOString();

    // Chiffrer les données sensibles
    const encryptedTelegramToken = encryptionService.encrypt(settings.telegramToken || null);
    const encryptedZoomApiKey = encryptionService.encrypt(settings.zoomApiKey || null);
    const encryptedZoomApiSecret = encryptionService.encrypt(settings.zoomApiSecret || null);
    const encryptedEmailPassword = encryptionService.encrypt(settings.emailPassword || null);

    const result = this.db.prepare(`
      INSERT INTO app_settings (
        telegramToken, telegramWebhookUrl, zoomApiKey, zoomApiSecret,
        simulationMode, testGroup, emailSmtpServer, emailUsername,
        emailPassword, emailFromAddress, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      encryptedTelegramToken,
      settings.telegramWebhookUrl || null,
      encryptedZoomApiKey,
      encryptedZoomApiSecret,
      settings.simulationMode ? 1 : 0,
      settings.testGroup || null,
      settings.emailSmtpServer || null,
      settings.emailUsername || null,
      encryptedEmailPassword,
      settings.emailFromAddress || null,
      now,
      null
    );

    const id = result.lastInsertRowid as number;

    // Retourner les données avec les valeurs masquées pour les données sensibles
    return {
      id,
      telegramToken: settings.telegramToken ? encryptionService.maskSensitiveData(settings.telegramToken) : null,
      telegramWebhookUrl: settings.telegramWebhookUrl || null,
      zoomApiKey: settings.zoomApiKey ? encryptionService.maskSensitiveData(settings.zoomApiKey) : null,
      zoomApiSecret: settings.zoomApiSecret ? encryptionService.maskSensitiveData(settings.zoomApiSecret) : null,
      simulationMode: settings.simulationMode !== undefined ? settings.simulationMode : true,
      testGroup: settings.testGroup || null,
      emailSmtpServer: settings.emailSmtpServer || null,
      emailUsername: settings.emailUsername || null,
      emailPassword: settings.emailPassword ? encryptionService.maskSensitiveData(settings.emailPassword) : null,
      emailFromAddress: settings.emailFromAddress || null,
      createdAt: new Date(now),
      updatedAt: null
    };
  }





  // Méthode pour initialiser des données d'exemple
  private initializeSampleData() {
    // Créer un utilisateur admin
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@edutrack.com",
      role: "admin"
    };
    this.createUserDirect(adminUser);

    // Créer un utilisateur étudiant
    const studentUser: InsertUser = {
      username: "student",
      password: "student123",
      fullName: "Student User",
      email: "student@example.com",
      role: "student"
    };
    this.createUserDirect(studentUser);

    // Créer un utilisateur instructeur
    const instructorUser: InsertUser = {
      username: "instructor",
      password: "instructor123",
      fullName: "Instructor User",
      email: "instructor@example.com",
      role: "instructor"
    };
    this.createUserDirect(instructorUser);

    // Créer des règles de points par défaut
    this.createPointRuleDirect({
      name: "Présence au cours",
      description: "Points attribués pour la présence à un cours Zoom",
      activityType: "attendance",
      pointsAmount: 10,
      conditions: JSON.stringify({ minDuration: 30 }),
      active: true
    });

    this.createPointRuleDirect({
      name: "Message dans le groupe",
      description: "Points attribués pour l'envoi de messages dans les groupes Telegram",
      activityType: "message",
      pointsAmount: 1,
      conditions: null,
      active: true
    });

    this.createPointRuleDirect({
      name: "Participation active",
      description: "Points attribués pour la participation active pendant les cours",
      activityType: "participation",
      pointsAmount: 5,
      conditions: null,
      active: true
    });

    this.createPointRuleDirect({
      name: "Devoir complété",
      description: "Points attribués pour la réalisation de devoirs",
      activityType: "homework",
      pointsAmount: 15,
      conditions: null,
      active: true
    });

    this.createPointRuleDirect({
      name: "Bonus spécial",
      description: "Points bonus attribués manuellement par les administrateurs",
      activityType: "bonus",
      pointsAmount: 20,
      conditions: null,
      active: true
    });

    // Créer des modèles de rappels par défaut
    this.createReminderTemplateDirect({
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

    this.createReminderTemplateDirect({
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

    // Créer des paramètres d'application par défaut
    this.createAppSettingsDirect({
      telegramToken: "",
      telegramWebhookUrl: "",
      zoomApiKey: "",
      zoomApiSecret: "",
      simulationMode: true,
      testGroup: "Test Group",
      emailSmtpServer: "",
      emailUsername: "",
      emailPassword: "",
      emailFromAddress: ""
    });
  }

  // Méthode pour sauvegarder la base de données
  async backup(backupPath?: string): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const backupFile = backupPath || path.join(DATA_DIR, `edutrack_backup_${timestamp}.db`);

    // Fermer la base de données
    this.db.close();

    // Copier le fichier de base de données
    fs.copyFileSync(DB_PATH, backupFile);

    // Rouvrir la base de données
    this.db = new Database(DB_PATH);

    return backupFile;
  }

  // Méthode pour restaurer la base de données
  async restore(backupPath: string): Promise<void> {
    // Vérifier si le fichier de sauvegarde existe
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Le fichier de sauvegarde ${backupPath} n'existe pas.`);
    }

    // Fermer la base de données
    this.db.close();

    // Copier le fichier de sauvegarde vers le fichier de base de données
    fs.copyFileSync(backupPath, DB_PATH);

    // Rouvrir la base de données
    this.db = new Database(DB_PATH);
  }

  // Méthode pour exporter les données au format JSON
  async exportData(): Promise<string> {
    const data = {
      users: await this.getAllUsers(),
      courses: await this.getAllCourses(),
      zoomAttendance: this.db.prepare('SELECT * FROM zoom_attendance').all(),
      telegramMessages: this.db.prepare('SELECT * FROM telegram_messages').all(),
      scheduledMessages: this.db.prepare('SELECT * FROM scheduled_messages').all(),
      userRankings: this.db.prepare('SELECT * FROM user_rankings').all(),
      userPoints: this.db.prepare('SELECT * FROM user_points').all(),
      logs: this.db.prepare('SELECT * FROM logs').all(),
      scenarios: this.db.prepare('SELECT * FROM scenarios').all(),
      appSettings: this.db.prepare('SELECT * FROM app_settings').all(),
      courseEnrollments: this.db.prepare('SELECT * FROM course_enrollments').all(),
      pointRules: this.db.prepare('SELECT * FROM point_rules').all(),
      reminderTemplates: this.db.prepare('SELECT * FROM reminder_templates').all(),
      zoomMeetings: this.db.prepare('SELECT * FROM zoom_meetings').all()
    };

    return JSON.stringify(data, null, 2);
  }

  // Méthode pour importer des données au format JSON
  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Vider toutes les tables
    this.db.exec(`
      DELETE FROM zoom_meetings;
      DELETE FROM reminder_templates;
      DELETE FROM point_rules;
      DELETE FROM course_enrollments;
      DELETE FROM app_settings;
      DELETE FROM scenarios;
      DELETE FROM logs;
      DELETE FROM user_points;
      DELETE FROM user_rankings;
      DELETE FROM scheduled_messages;
      DELETE FROM telegram_messages;
      DELETE FROM zoom_attendance;
      DELETE FROM courses;
      DELETE FROM users;
    `);

    // Réinitialiser les séquences d'auto-incrémentation
    this.db.exec(`
      DELETE FROM sqlite_sequence;
    `);

    // Importer les données
    for (const user of data.users) {
      this.db.prepare(`
        INSERT INTO users (id, username, password, fullName, email, role, lastLogin, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        user.username,
        user.password,
        user.fullName,
        user.email,
        user.role,
        user.lastLogin,
        user.avatar
      );
    }

    // Importer les autres données...
    // (Code similaire pour chaque table)
  }
}
