import { IStorage } from "../storage";
import { InsertLog, InsertScheduledMessage, InsertScenario } from "@shared/schema";
import { telegramService } from "./telegram";
import { zoomService } from "./zoom";
import { courseReminderService } from "./courseReminderService";
import pkg from 'xlsx';
import path from 'path';
import { readFileSync } from 'fs';

const { readFile, utils } = pkg;

interface ScenariosServiceConfig {
  storage: IStorage;
  simulationMode: boolean;
}

class ScenariosService {
  private storage: IStorage | null = null;
  private initialized: boolean = false;
  private simulationMode: boolean = true;
  private intervals: Record<string, NodeJS.Timeout> = {};

  initialize(config: ScenariosServiceConfig): void {
    this.storage = config.storage;
    this.simulationMode = config.simulationMode;
    this.initialized = true;

    // Initialize all scenarios immediately
    this.initializeScenarios().then(() => {
      console.log("Scenarios service initialized");
    }).catch(error => {
      console.error("Error initializing scenarios:", error);
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async initializeScenarios(): Promise<void> {
    this.checkInitialized();

    // First, make sure we have all our predefined scenarios
    await this.ensurePredefinedScenarios();

    // Get all active scenarios
    const scenarios = await this.storage!.getActiveScenarios();

    console.log(`Found ${scenarios.length} active scenarios`);

    // For each scenario, set up the appropriate scheduler
    scenarios.forEach(scenario => {
      if (scenario.schedule) {
        this.scheduleScenario(scenario.id, scenario.name, scenario.schedule);
      }
    });
  }

  private async ensurePredefinedScenarios(): Promise<void> {
    // Définir les actions pour chaque scénario
    const courseUpdateActions = JSON.stringify([
      {
        type: "excel_processing",
        params: {
          filePath: "data/courses.xlsx",
          sheet: "Courses"
        }
      },
      {
        type: "database_update",
        params: {
          table: "courses",
          matchField: "name"
        }
      },
      {
        type: "notification",
        params: {
          channel: "telegram",
          message: "Mise à jour des cours terminée. {{updatedCount}} cours mis à jour."
        }
      }
    ]);

    const zoomLinksActions = JSON.stringify([
      {
        type: "zoom_api",
        params: {
          action: "create_meetings",
          filter: "next_week"
        }
      },
      {
        type: "database_update",
        params: {
          table: "courses",
          updateField: "zoomLink"
        }
      },
      {
        type: "notification",
        params: {
          channel: "telegram",
          message: "{{count}} liens Zoom ont été générés pour la semaine."
        }
      }
    ]);

    const messageGenerationActions = JSON.stringify([
      {
        type: "message_generation",
        params: {
          template: "reminder",
          period: "next_week"
        }
      },
      {
        type: "database_create",
        params: {
          table: "scheduled_messages"
        }
      },
      {
        type: "notification",
        params: {
          channel: "telegram",
          message: "{{count}} messages ont été programmés pour la semaine."
        }
      }
    ]);

    const dailyMessagesActions = JSON.stringify([
      {
        type: "database_query",
        params: {
          table: "scheduled_messages",
          filter: "today",
          status: "pending"
        }
      },
      {
        type: "message_send",
        params: {
          channel: "telegram"
        }
      },
      {
        type: "database_update",
        params: {
          table: "scheduled_messages",
          updateField: "sentAt"
        }
      }
    ]);

    const rankingsActions = JSON.stringify([
      {
        type: "ranking_calculation",
        params: {
          period: "daily"
        }
      },
      {
        type: "message_format",
        params: {
          template: "ranking",
          top: 5
        }
      },
      {
        type: "message_send",
        params: {
          channel: "telegram"
        }
      }
    ]);

    // Définir les actions pour les rappels de cours
    const generateCourseRemindersActions = JSON.stringify([
      {
        type: "function_call",
        params: {
          function: "runGenerateCourseRemindersJob"
        }
      },
      {
        type: "notification",
        params: {
          channel: "log",
          message: "Génération des rappels de cours terminée."
        }
      }
    ]);

    const sendCourseRemindersActions = JSON.stringify([
      {
        type: "function_call",
        params: {
          function: "runSendCourseRemindersJob"
        }
      },
      {
        type: "notification",
        params: {
          channel: "log",
          message: "Envoi des rappels de cours terminé."
        }
      }
    ]);

    const predefinedScenarios: InsertScenario[] = [
      {
        name: "course_update",
        displayName: "Mise à jour des Cours",
        description: "Met à jour les horaires des cours depuis un fichier Excel",
        schedule: "0 0 * * 0", // Dimanche à minuit
        active: true,
        color: "#4f46e5", // Indigo
        icon: "book",
        pythonCode: null,
        actions: courseUpdateActions,
        isCustomCode: false
      },
      {
        name: "zoom_links",
        displayName: "Création des Liens Zoom",
        description: "Génère les liens Zoom pour les cours",
        schedule: "30 0 * * 0", // Dimanche à minuit 30
        active: true,
        color: "#0ea5e9", // Sky blue
        icon: "video",
        pythonCode: null,
        actions: zoomLinksActions,
        isCustomCode: false
      },
      {
        name: "message_generation",
        displayName: "Génération des Messages",
        description: "Prépare les messages Telegram pour la semaine",
        schedule: "0 1 * * 0", // Dimanche à 1h du matin
        active: true,
        color: "#10b981", // Emerald
        icon: "message-square",
        pythonCode: null,
        actions: messageGenerationActions,
        isCustomCode: false
      },
      {
        name: "daily_messages",
        displayName: "Envoi des Messages Quotidiens",
        description: "Envoie les messages planifiés du jour",
        schedule: "0 8 * * *", // Tous les jours à 8h
        active: true,
        color: "#f59e0b", // Amber
        icon: "send",
        pythonCode: null,
        actions: dailyMessagesActions,
        isCustomCode: false
      },
      {
        name: "daily_rankings",
        displayName: "Envoi des Classements Quotidiens",
        description: "Envoie les classements des étudiants",
        schedule: "0 20 * * *", // Tous les jours à 20h
        active: true,
        color: "#ec4899", // Pink
        icon: "trophy",
        pythonCode: null,
        actions: rankingsActions,
        isCustomCode: false
      },
      {
        name: "generate_course_reminders",
        displayName: "Génération des Rappels de Cours",
        description: "Génère les rappels automatiques pour les cours à venir",
        schedule: "0 0 * * *", // Tous les jours à minuit
        active: true,
        color: "#06b6d4", // Cyan
        icon: "bell",
        pythonCode: null,
        actions: generateCourseRemindersActions,
        isCustomCode: false
      },
      {
        name: "send_course_reminders",
        displayName: "Envoi des Rappels de Cours",
        description: "Envoie les rappels de cours planifiés qui sont dus",
        schedule: "*/15 * * * *", // Toutes les 15 minutes
        active: true,
        color: "#14b8a6", // Teal
        icon: "bell-ring",
        pythonCode: null,
        actions: sendCourseRemindersActions,
        isCustomCode: false
      },
      {
        name: "custom_code_example",
        displayName: "Exemple de Code Personnalisé",
        description: "Un exemple de scénario utilisant du code Python personnalisé",
        schedule: "0 12 * * *", // Tous les jours à midi
        active: false,
        color: "#8b5cf6", // Violet
        icon: "code",
        pythonCode: "# Ce code Python sera exécuté lorsque le scénario sera lancé\n# Accès aux modèles et utilitaires\ndef run_scenario():\n    try:\n        # Accès aux modèles\n        courses = get_all_courses()\n        \n        # Accès aux utilitaires\n        bot = init_telegram_bot()\n        \n        # Logique personnalisée\n        message = \"Récapitulatif des cours:\\n\"\n        for course in courses:\n            message += f\"- {course.name} ({course.day_of_week} à {course.time})\\n\"\n        \n        # Envoi du message\n        bot.send_message(message)\n        \n        return True, \"Scénario exécuté avec succès\"\n    except Exception as e:\n        return False, f\"Erreur: {str(e)}\"",
        actions: null,
        isCustomCode: true
      }
    ];

    for (const scenarioData of predefinedScenarios) {
      // Check if this scenario already exists
      const existingScenarios = await this.storage!.getAllScenarios();
      const exists = existingScenarios.some(s => s.name === scenarioData.name);

      if (!exists) {
        await this.storage!.createScenario(scenarioData);
        console.log(`Created predefined scenario: ${scenarioData.name}`);
      }
    }
  }

  private scheduleScenario(id: number, name: string, cronExpression: string): void {
    // For MVP, instead of using a proper cron library, we'll use a simple interval
    // In a production app, we'd use node-cron or similar to properly handle cron expressions

    let intervalMs = 3600000; // Default to 1 hour

    // Extract rough interval from cron expression, very simplified
    if (cronExpression.includes("* * *")) {
      // If minutes are specified and not '*', run more frequently
      intervalMs = 60000; // 1 minute
    } else if (cronExpression.includes("* *")) {
      // If hours are specified and not '*', run hourly
      intervalMs = 3600000; // 1 hour
    } else {
      // Otherwise, run daily (for weekly and monthly schedules too, in MVP)
      intervalMs = 86400000; // 24 hours
    }

    // Clear any existing interval for this scenario
    if (this.intervals[id]) {
      clearInterval(this.intervals[id]);
    }

    console.log(`Scheduling scenario ${name} (${id}) to run every ${intervalMs/60000} minutes`);

    // Set up the new interval
    this.intervals[id] = setInterval(async () => {
      const shouldRun = await this.shouldRunScenario(id, cronExpression);
      if (shouldRun) {
        console.log(`Running scheduled scenario: ${name}`);
        await this.runScenario(id);
      }
    }, intervalMs);
  }

  private async shouldRunScenario(id: number, cronExpression: string): Promise<boolean> {
    // In a real implementation, we would properly parse the cron expression
    // For MVP, we'll just do a very basic check

    const scenario = await this.storage!.getScenario(id);
    if (!scenario || !scenario.active) {
      return false;
    }

    const now = new Date();
    const lastRun = scenario.lastRun ? new Date(scenario.lastRun) : null;

    // If it's never been run, run it
    if (!lastRun) {
      return true;
    }

    // Basic checks for typical cron expressions
    if (cronExpression.includes("* * * * *")) {
      // Every minute - check if it's been at least a minute
      return now.getTime() - lastRun.getTime() >= 60000;
    } else if (cronExpression.match(/\d+ \* \* \* \*/)) {
      // Specific minute every hour - check if it's been at least an hour
      return now.getTime() - lastRun.getTime() >= 3600000;
    } else if (cronExpression.match(/\d+ \d+ \* \* \*/)) {
      // Specific time every day - check if it's been at least a day
      return now.getTime() - lastRun.getTime() >= 86400000;
    } else if (cronExpression.match(/\d+ \d+ \* \* [0-6]/)) {
      // Specific time on specific days of week - check if it's been at least a day
      return now.getTime() - lastRun.getTime() >= 86400000;
    }

    // Default - if we're unsure, err on the side of not running
    return false;
  }

  async runScenario(id: number): Promise<void> {
    this.checkInitialized();

    try {
      const scenario = await this.storage!.getScenario(id);

      if (!scenario) {
        throw new Error(`Scenario ${id} not found`);
      }

      // Log that we're starting the scenario
      await this.logScenarioEvent(id, "INFO", `Starting scenario: ${scenario.displayName || scenario.name}`);

      // Si le scénario utilise du code personnalisé
      if (scenario.isCustomCode && scenario.pythonCode) {
        await this.runCustomPythonCode(id, scenario.pythonCode);
      }
      // Si le scénario utilise des actions prédéfinies
      else if (scenario.actions) {
        await this.executeScenarioActions(id, scenario);
      }
      // Retrocompatibilité avec les scénarios existants
      else {
        // Exécuter basé sur le nom (ancienne méthode)
        switch (scenario.name) {
          case "Mise à jour des Cours":
          case "course_update":
            await this.runUpdateCoursesJob();
            break;
          case "Création des Liens Zoom":
          case "zoom_links":
            await this.runCreateZoomLinksJob();
            break;
          case "Génération des Messages":
          case "message_generation":
            await this.runGenerateMessagesJob();
            break;
          case "Envoi des Messages Quotidiens":
          case "daily_messages":
            await this.runSendDailyMessagesJob();
            break;
          case "Envoi des Classements Quotidiens":
          case "daily_rankings":
            await this.runSendDailyRankingsJob();
            break;
          case "Génération des Rappels de Cours":
          case "generate_course_reminders":
            await this.runGenerateCourseRemindersJob();
            break;
          case "Envoi des Rappels de Cours":
          case "send_course_reminders":
            await this.runSendCourseRemindersJob();
            break;
          default:
            throw new Error(`Scénario inconnu: ${scenario.name}`);
        }
      }

      // Update the last run time for the scenario
      await this.storage!.updateScenarioLastRun(id);

      // Log that we've completed the scenario
      await this.logScenarioEvent(id, "INFO", `Scénario terminé: ${scenario.displayName || scenario.name}`);
    } catch (error) {
      console.error(`Erreur lors de l'exécution du scénario ${id}:`, error);
      await this.logScenarioEvent(id, "ERROR", `Erreur dans le scénario: ${error}`);
    }
  }

  /**
   * Exécute les actions d'un scénario basé sur sa définition d'actions JSON
   */
  private async executeScenarioActions(id: number, scenario: any): Promise<void> {
    try {
      if (!scenario.actions) {
        throw new Error("Le scénario ne contient pas d'actions");
      }

      const actions = JSON.parse(scenario.actions);

      for (const action of actions) {
        await this.logScenarioEvent(id, "INFO", `Exécution de l'action: ${action.type}`);

        switch (action.type) {
          case "excel_processing":
            // Traitement de fichier Excel
            await this.runUpdateCoursesJob();
            break;

          case "zoom_api":
            // Opérations avec l'API Zoom
            await this.runCreateZoomLinksJob();
            break;

          case "message_generation":
            // Génération de messages
            await this.runGenerateMessagesJob();
            break;

          case "message_send":
            // Envoi de messages
            await this.runSendDailyMessagesJob();
            break;

          case "ranking_calculation":
            // Calcul de classements
            await this.runSendDailyRankingsJob();
            break;

          case "notification":
            // Envoi de notifications
            await this.sendNotification(action.params);
            break;

          default:
            await this.logScenarioEvent(id, "WARNING", `Type d'action non pris en charge: ${action.type}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution des actions du scénario:", error);
      throw error;
    }
  }

  /**
   * Envoie une notification via le canal spécifié
   */
  private async sendNotification(params: any): Promise<void> {
    try {
      if (!params || !params.channel || !params.message) {
        throw new Error("Paramètres de notification incomplets");
      }

      const message = params.message.replace(/{{(\w+)}}/g, (match: string, variable: string) => {
        // Dans un cas réel, on remplacerait les variables par des valeurs calculées
        return "0"; // Valeur par défaut pour l'exemple
      });

      switch (params.channel.toLowerCase()) {
        case "telegram":
          await telegramService.sendMessage(message);
          break;
        default:
          console.warn(`Canal de notification non pris en charge: ${params.channel}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error);
      throw error;
    }
  }

  // Specific job implementations
  private async runUpdateCoursesJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Démarrage de la mise à jour des cours depuis Excel");

      // Utilisation de notre nouveau système de traitement Excel
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const fs = require('fs');
      const execFilePromise = promisify(execFile);

      // Chemin vers le fichier Excel
      const excelFilePath = path.resolve('attached_assets', 'Kodjo English - Classes Schedules (2).xlsx');

      // Chemin vers le script Python de traitement
      const pythonScriptPath = path.resolve('scripts', 'excel', 'excel_processor.py');

      // Fichier JSON temporaire pour stocker les résultats
      const tempJsonPath = path.resolve('temp_courses.json');

      await this.logScenarioEvent(null, "INFO", `Traitement du fichier Excel: ${excelFilePath}`);

      // Vérifier si le fichier Excel existe
      if (!fs.existsSync(excelFilePath)) {
        throw new Error(`Fichier Excel non trouvé: ${excelFilePath}`);
      }

      // Vérifier si le script Python existe
      if (!fs.existsSync(pythonScriptPath)) {
        throw new Error(`Script Python non trouvé: ${pythonScriptPath}`);
      }

      // Exécuter le script Python
      try {
        await this.logScenarioEvent(null, "INFO", "Exécution du script Python de traitement");
        const { stdout, stderr } = await execFilePromise('python3', [pythonScriptPath, excelFilePath, tempJsonPath]);

        if (stderr) {
          console.warn("Avertissements lors du traitement Python:", stderr);
        }

        await this.logScenarioEvent(null, "INFO", `Script Python terminé: ${stdout}`);
      } catch (err) {
        throw new Error(`Erreur lors de l'exécution du script Python: ${err.message}`);
      }

      // Vérifier si le fichier JSON a été créé
      if (!fs.existsSync(tempJsonPath)) {
        throw new Error("Le fichier JSON temporaire n'a pas été créé par le script Python");
      }

      // Charger les données du JSON
      let courses;
      try {
        const jsonContent = fs.readFileSync(tempJsonPath, 'utf8');
        courses = JSON.parse(jsonContent);
        await this.logScenarioEvent(null, "INFO", `${courses.length} cours chargés depuis le JSON`);
      } catch (err) {
        throw new Error(`Erreur lors du chargement du fichier JSON: ${err.message}`);
      }

      // Mise à jour des cours dans la base de données
      await this.updateCourses(courses);

      // Suppression du fichier temporaire
      try {
        fs.unlinkSync(tempJsonPath);
      } catch (err) {
        console.warn(`Avertissement: Impossible de supprimer le fichier temporaire: ${err.message}`);
      }

      await this.logScenarioEvent(null, "INFO", `Mise à jour terminée: ${courses.length} cours`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour des cours:", error);
      await this.logScenarioEvent(null, "ERROR", `Échec de la mise à jour des cours: ${error}`);
      throw error;
    }
  }

  private async updateCourses(courses: any[]): Promise<void> {
    // Get all existing courses
    const existingCourses = await this.storage!.getAllCourses();

    // Create or update each course
    for (const courseData of courses) {
      // Try to find an existing course with the same name
      const existingCourse = existingCourses.find(c => c.name === courseData.name);

      if (existingCourse) {
        // Update existing course
        await this.storage!.updateCourse(existingCourse.id, {
          professorName: courseData.professorName,
          level: courseData.level,
          schedule: courseData.schedule,
          dayOfWeek: courseData.dayOfWeek,
          time: courseData.time
        });
      } else {
        // Create new course
        await this.storage!.createCourse(courseData);
      }
    }
  }

  private async runCreateZoomLinksJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Generating Zoom links for courses");

      // Get all courses
      const courses = await this.storage!.getAllCourses();
      let updatedCount = 0;

      // For each course, create or update the Zoom link
      for (const course of courses) {
        // In a real scenario, we'd check if the course needs a new link
        // For MVP, we'll just update all courses

        const zoomLink = await zoomService.createMeeting(
          course.id,
          course.name,
          `${course.dayOfWeek} ${course.time}`
        );

        // Update the course with the new Zoom link
        await this.storage!.updateCourse(course.id, { zoomLink });
        updatedCount++;
      }

      await this.logScenarioEvent(null, "INFO", `Updated Zoom links for ${updatedCount} courses`);
    } catch (error) {
      console.error("Error in create Zoom links job:", error);
      await this.logScenarioEvent(null, "ERROR", `Failed to create Zoom links: ${error}`);
      throw error;
    }
  }

  private async runGenerateMessagesJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Generating scheduled messages for the week");

      // Get all courses
      const courses = await this.storage!.getAllCourses();
      let messageCount = 0;

      // Get the dates for the coming week
      const today = new Date();
      const weekDates = this.getWeekDates(today);

      // For each course, create scheduled messages for each day it runs in the next week
      for (const course of courses) {
        // Determine which days this course runs
        const courseDays = this.getCourseDays(course.schedule);

        // For each day the course runs, create a scheduled message
        for (const day of courseDays) {
          // Find the next occurrence of this day in the coming week
          const courseDate = weekDates.find(date => date.getDay() === day);

          if (courseDate) {
            // Set the message to be sent at 8:00 AM on the course day
            const scheduledFor = new Date(courseDate);
            scheduledFor.setHours(8, 0, 0, 0);

            // Only schedule if it's in the future
            if (scheduledFor > today) {
              const message: InsertScheduledMessage = {
                title: `Rappel de cours: ${course.name}`,
                content: `Bonjour! N'oubliez pas votre cours d'anglais aujourd'hui à ${course.time}. Lien Zoom: ${course.zoomLink}`,
                courseId: course.id,
                scheduledFor,
                active: true
              };

              await this.storage!.createScheduledMessage(message);
              messageCount++;
            }
          }
        }
      }

      await this.logScenarioEvent(null, "INFO", `Created ${messageCount} scheduled messages for the week`);
    } catch (error) {
      console.error("Error in generate messages job:", error);
      await this.logScenarioEvent(null, "ERROR", `Failed to generate messages: ${error}`);
      throw error;
    }
  }

  private getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    // Start from today, get 7 days
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  private getCourseDays(schedule: string | null): number[] {
    if (!schedule) return [];

    // Convert schedule code to days of the week (0 = Sunday, 1 = Monday, etc.)
    const dayMap: Record<string, number[]> = {
      'MW': [1, 3], // Monday and Wednesday
      'TT': [2, 4], // Tuesday and Thursday
      'FS': [5, 6], // Friday and Saturday
      'SS': [0, 6]  // Sunday and Saturday
    };

    return dayMap[schedule] || [];
  }

  private async runSendDailyMessagesJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Sending daily scheduled messages");

      // Get all pending scheduled messages for today
      const pendingMessages = await this.storage!.getPendingScheduledMessages();
      let sentCount = 0;

      // For each message, send it
      for (const message of pendingMessages) {
        try {
          // Send the message
          await telegramService.sendScheduledMessage(message.id);
          sentCount++;
        } catch (error) {
          console.error(`Error sending message ${message.id}:`, error);
          await this.logScenarioEvent(null, "ERROR", `Failed to send message ${message.id}: ${error}`);
        }
      }

      await this.logScenarioEvent(null, "INFO", `Sent ${sentCount} scheduled messages`);
    } catch (error) {
      console.error("Error in send daily messages job:", error);
      await this.logScenarioEvent(null, "ERROR", `Failed to send daily messages: ${error}`);
      throw error;
    }
  }

  private async runSendDailyRankingsJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Sending daily rankings");

      // Get today's courses
      const today = new Date();
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

      const courses = await this.storage!.getAllCourses();
      const todayCourses = courses.filter(course => course.dayOfWeek === dayOfWeek);

      if (todayCourses.length === 0) {
        await this.logScenarioEvent(null, "INFO", `No courses scheduled for today (${dayOfWeek})`);
        return;
      }

      // Get the admin user for sending messages
      const adminUser = await this.storage!.getUserByUsername("admin");

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      // For each course today, send the rankings
      for (const course of todayCourses) {
        // Get the top 5 weekly rankings
        const weeklyRankings = await this.storage!.getTopRankings("weekly", 5);

        if (weeklyRankings.length === 0) {
          continue;
        }

        // Create the rankings message
        let message = `📊 *Classement hebdomadaire* 📊\n\n`;

        for (let i = 0; i < weeklyRankings.length; i++) {
          const ranking = weeklyRankings[i];
          try {
            const user = await this.storage!.getUser(ranking.userId);
            const userName = user ? user.fullName : `Étudiant ${ranking.userId}`;
            // Use non-null assertion for totalPoints since we validate it has data
            const points = ranking.totalPoints || 0;
            message += `${i + 1}. ${userName}: ${points} points\n`;
          } catch (error) {
            console.error(`Error getting user ${ranking.userId}:`, error);
            const points = ranking.totalPoints || 0;
            message += `${i + 1}. Étudiant ${ranking.userId}: ${points} points\n`;
          }
        }

        // Send the message to the course's Telegram group
        if (course.telegramGroup) {
          try {
            await telegramService.sendMessage(
              course.id,
              adminUser.id,
              message
            );
          } catch (error) {
            console.error(`Error sending rankings to course ${course.id}:`, error);
            await this.logScenarioEvent(null, "ERROR", `Failed to send rankings to course ${course.id}: ${error}`);
          }
        }
      }

      await this.logScenarioEvent(null, "INFO", `Sent rankings for ${todayCourses.length} courses`);
    } catch (error) {
      console.error("Error in send daily rankings job:", error);
      await this.logScenarioEvent(null, "ERROR", `Failed to send daily rankings: ${error}`);
      throw error;
    }
  }

  private async runCustomPythonCode(id: number, code: string): Promise<void> {
    // In a real implementation, we would have a mechanism to safely execute Python code
    // For MVP, we'll just log that we would run the code
    await this.logScenarioEvent(id, "INFO", `Would execute Python code: ${code.substring(0, 50)}...`);
  }

  private async logScenarioEvent(scenarioId: number | null, level: string, message: string): Promise<void> {
    try {
      const logData: InsertLog = {
        level,
        message,
        timestamp: new Date(),
        userId: null,
        scenarioId
      };

      await this.storage!.createLog(logData);
    } catch (error) {
      console.error("Error creating log:", error);
    }
  }

  /**
   * Génère les rappels de cours pour les prochaines 24 heures
   */
  async runGenerateCourseRemindersJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Generating course reminders");

      // Initialiser le service de rappels de cours s'il ne l'est pas déjà
      if (!courseReminderService.isInitialized()) {
        courseReminderService.initialize();
      }

      // Générer les rappels pour les cours à venir
      const reminderCount = await courseReminderService.generateUpcomingCourseReminders();

      await this.logScenarioEvent(null, "INFO", `Generated ${reminderCount} course reminders`);
    } catch (error) {
      await this.logScenarioEvent(null, "ERROR", `Error generating course reminders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoie les rappels de cours planifiés qui sont dus
   */
  async runSendCourseRemindersJob(): Promise<void> {
    try {
      await this.logScenarioEvent(null, "INFO", "Sending due course reminders");

      // Initialiser le service de rappels de cours s'il ne l'est pas déjà
      if (!courseReminderService.isInitialized()) {
        courseReminderService.initialize();
      }

      // Envoyer les rappels planifiés qui sont dus
      const sentCount = await courseReminderService.sendDueReminders();

      await this.logScenarioEvent(null, "INFO", `Sent ${sentCount} due course reminders`);
    } catch (error) {
      await this.logScenarioEvent(null, "ERROR", `Error sending course reminders: ${error.message}`);
      throw error;
    }
  }

  private checkInitialized(): void {
    if (!this.initialized || !this.storage) {
      throw new Error("Scenarios service not initialized");
    }
  }
}

export const scenariosService = new ScenariosService();