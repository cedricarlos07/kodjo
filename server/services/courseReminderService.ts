import { storage } from "../storage";
import { telegramService } from "./telegram";
import { Course } from "@shared/schema";
import { format, addHours, addMinutes, isAfter, isBefore, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Service pour gérer les rappels de cours
 */
export class CourseReminderService {
  private static instance: CourseReminderService;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): CourseReminderService {
    if (!CourseReminderService.instance) {
      CourseReminderService.instance = new CourseReminderService();
    }
    return CourseReminderService.instance;
  }

  initialize(): void {
    this.initialized = true;
    console.log("Course reminder service initialized");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error("Course reminder service not initialized");
    }
  }

  /**
   * Génère les rappels pour tous les cours à venir dans les prochaines 24 heures
   */
  async generateUpcomingCourseReminders(): Promise<number> {
    this.checkInitialized();
    
    try {
      // Récupérer tous les cours
      const courses = await storage.getAllCourses();
      
      // Date actuelle
      const now = new Date();
      
      // Date limite (24 heures à partir de maintenant)
      const limitDate = addHours(now, 24);
      
      let reminderCount = 0;
      
      // Pour chaque cours, vérifier s'il a lieu dans les prochaines 24 heures
      for (const course of courses) {
        const nextCourseDate = this.getNextCourseDate(course);
        
        // Si le cours a lieu dans les prochaines 24 heures
        if (nextCourseDate && isAfter(nextCourseDate, now) && isBefore(nextCourseDate, limitDate)) {
          // Créer un rappel 1 heure avant le cours
          const reminderDate = addMinutes(nextCourseDate, -60);
          
          // Si la date de rappel est dans le futur
          if (isAfter(reminderDate, now)) {
            await this.scheduleReminderForCourse(course, reminderDate);
            reminderCount++;
          }
          
          // Créer un rappel 15 minutes avant le cours
          const lastReminderDate = addMinutes(nextCourseDate, -15);
          
          // Si la date de rappel est dans le futur
          if (isAfter(lastReminderDate, now)) {
            await this.scheduleLastReminderForCourse(course, lastReminderDate);
            reminderCount++;
          }
        }
      }
      
      console.log(`Generated ${reminderCount} course reminders`);
      return reminderCount;
    } catch (error) {
      console.error("Error generating course reminders:", error);
      throw error;
    }
  }

  /**
   * Planifie un rappel pour un cours
   */
  private async scheduleReminderForCourse(course: Course, reminderDate: Date): Promise<void> {
    try {
      // Formater la date et l'heure du cours
      const courseDate = this.getNextCourseDate(course);
      if (!courseDate) return;
      
      const formattedDate = format(courseDate, "EEEE d MMMM", { locale: fr });
      const formattedTime = course.time;
      
      // Créer le message de rappel
      const message = this.formatReminderMessage(course, formattedDate, formattedTime);
      
      // Planifier le message
      await storage.createScheduledMessage({
        title: `Rappel de cours: ${course.name}`,
        content: message,
        courseId: course.id,
        scheduledFor: reminderDate,
        active: true
      });
      
      console.log(`Scheduled reminder for course ${course.name} at ${reminderDate.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling reminder for course ${course.name}:`, error);
      throw error;
    }
  }

  /**
   * Planifie un dernier rappel (15 minutes avant) pour un cours
   */
  private async scheduleLastReminderForCourse(course: Course, reminderDate: Date): Promise<void> {
    try {
      // Formater la date et l'heure du cours
      const courseDate = this.getNextCourseDate(course);
      if (!courseDate) return;
      
      const formattedDate = format(courseDate, "EEEE d MMMM", { locale: fr });
      const formattedTime = course.time;
      
      // Créer le message de rappel
      const message = this.formatLastReminderMessage(course, formattedDate, formattedTime);
      
      // Planifier le message
      await storage.createScheduledMessage({
        title: `Dernier rappel: ${course.name}`,
        content: message,
        courseId: course.id,
        scheduledFor: reminderDate,
        active: true
      });
      
      console.log(`Scheduled last reminder for course ${course.name} at ${reminderDate.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling last reminder for course ${course.name}:`, error);
      throw error;
    }
  }

  /**
   * Formate le message de rappel pour un cours
   */
  private formatReminderMessage(course: Course, date: string, time: string): string {
    return `📚 **RAPPEL DE COURS** 📚

Bonjour à tous !

Votre cours **${course.name}** avec ${course.professorName || course.instructor} aura lieu **${date}** à **${time}**.

🔗 **Lien Zoom** : ${course.zoomLink}
🆔 **ID** : ${course.zoomId || "N/A"}

Préparez-vous et soyez à l'heure ! 😊

À bientôt !`;
  }

  /**
   * Formate le message de dernier rappel pour un cours
   */
  private formatLastReminderMessage(course: Course, date: string, time: string): string {
    return `⏰ **DERNIER RAPPEL - COURS DANS 15 MINUTES** ⏰

Votre cours **${course.name}** avec ${course.professorName || course.instructor} commence dans **15 minutes** !

🔗 **Lien Zoom** : ${course.zoomLink}
🆔 **ID** : ${course.zoomId || "N/A"}

Connectez-vous dès maintenant pour être prêt à commencer ! 🚀`;
  }

  /**
   * Obtient la prochaine date du cours
   */
  private getNextCourseDate(course: Course): Date | null {
    try {
      // Jours de la semaine en français et en anglais
      const frenchDays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const englishDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      // Convertir le jour de la semaine en index (0-6)
      let dayIndex: number;
      
      // Vérifier si le jour est en français ou en anglais
      const frenchIndex = frenchDays.findIndex(day => course.dayOfWeek.includes(day));
      const englishIndex = englishDays.findIndex(day => course.dayOfWeek.includes(day));
      
      if (frenchIndex !== -1) {
        dayIndex = frenchIndex;
      } else if (englishIndex !== -1) {
        dayIndex = englishIndex;
      } else {
        console.error(`Invalid day of week: ${course.dayOfWeek}`);
        return null;
      }
      
      // Date actuelle
      const now = new Date();
      
      // Calculer le nombre de jours jusqu'au prochain jour de cours
      const currentDay = now.getDay();
      let daysUntilNext = dayIndex - currentDay;
      
      if (daysUntilNext < 0) {
        daysUntilNext += 7;
      } else if (daysUntilNext === 0) {
        // Si c'est aujourd'hui, vérifier si l'heure du cours est déjà passée
        const courseHour = this.parseTimeString(course.time);
        const currentHour = now.getHours() * 60 + now.getMinutes();
        
        if (courseHour <= currentHour) {
          // Le cours d'aujourd'hui est déjà passé, prendre celui de la semaine prochaine
          daysUntilNext = 7;
        }
      }
      
      // Calculer la date du prochain cours
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntilNext);
      
      // Définir l'heure du cours
      const courseTime = this.parseTimeString(course.time);
      nextDate.setHours(Math.floor(courseTime / 60), courseTime % 60, 0, 0);
      
      return nextDate;
    } catch (error) {
      console.error(`Error getting next course date for ${course.name}:`, error);
      return null;
    }
  }

  /**
   * Parse une chaîne d'heure au format "HH:MM" ou "XXh XX France"
   * et retourne le nombre de minutes depuis minuit
   */
  private parseTimeString(timeString: string): number {
    try {
      let hours = 0;
      let minutes = 0;
      
      // Format "HH:MM"
      if (timeString.includes(':')) {
        const [hoursStr, minutesStr] = timeString.split(':');
        hours = parseInt(hoursStr, 10);
        minutes = parseInt(minutesStr, 10);
      }
      // Format "XXh XX France"
      else if (timeString.includes('h')) {
        const parts = timeString.split('h');
        hours = parseInt(parts[0].trim(), 10);
        
        if (parts[1]) {
          const minutesPart = parts[1].trim().split(' ')[0];
          minutes = parseInt(minutesPart, 10);
        }
      }
      // Format inconnu
      else {
        console.warn(`Unknown time format: ${timeString}, defaulting to 12:00`);
        hours = 12;
        minutes = 0;
      }
      
      return hours * 60 + minutes;
    } catch (error) {
      console.error(`Error parsing time string: ${timeString}`, error);
      return 12 * 60; // Par défaut, midi
    }
  }

  /**
   * Envoie les rappels planifiés qui sont dus
   */
  async sendDueReminders(): Promise<number> {
    this.checkInitialized();
    
    try {
      // Récupérer les messages planifiés qui sont dus
      const now = new Date();
      const dueMessages = await storage.getPendingScheduledMessages(now);
      
      let sentCount = 0;
      
      // Pour chaque message dû
      for (const message of dueMessages) {
        // Récupérer le cours associé
        const course = await storage.getCourse(message.courseId);
        
        if (course && course.telegramGroup) {
          // Envoyer le message via Telegram
          await telegramService.sendMessageToGroup(
            course.telegramGroup,
            message.content,
            1 // ID utilisateur par défaut (admin)
          );
          
          // Marquer le message comme envoyé
          await storage.markScheduledMessageAsSent(message.id);
          
          sentCount++;
        }
      }
      
      console.log(`Sent ${sentCount} due reminders`);
      return sentCount;
    } catch (error) {
      console.error("Error sending due reminders:", error);
      throw error;
    }
  }
}

export const courseReminderService = CourseReminderService.getInstance();
