import { storage } from "../storage";
import { simulationService } from "./simulationService";
import { insertScheduledMessageSchema } from "@shared/schema";

interface NotificationConfig {
  token: string;
  chatId: string;
  simulationMode: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private token: string = "";
  private chatId: string = "";
  private simulationMode: boolean = true;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  initialize(config: NotificationConfig): void {
    this.token = config.token;
    this.chatId = config.chatId;
    this.simulationMode = config.simulationMode;
    this.initialized = true;
    console.log(`Notification service initialized (Simulation mode: ${this.simulationMode ? 'ON' : 'OFF'})`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async sendNotification(courseId: number, message: string): Promise<void> {
    this.checkInitialized();

    try {
      if (this.simulationMode) {
        console.log(`[SIMULATION] Sending notification for course ${courseId}: ${message}`);
      } else {
        if (!this.token || !this.chatId) {
          throw new Error("Telegram token or chat ID not configured");
        }

        // Ici, nous utiliserions normalement l'API Telegram pour envoyer un message
        console.log(`Sending notification for course ${courseId}: ${message}`);
      }

      // Enregistrer le message dans la base de données
      const messageData = {
        courseId,
        content: message,
        sentAt: new Date()
      };
      
      await storage.recordNotification(messageData);
      await simulationService.updateSimulationData(courseId);
    } catch (error) {
      console.error("Error sending notification:", error);
      throw new Error("Failed to send notification");
    }
  }

  async scheduleNotification(courseId: number, message: string, scheduledTime: Date): Promise<void> {
    this.checkInitialized();

    try {
      const messageData = insertScheduledMessageSchema.parse({
        courseId,
        content: message,
        scheduledTime,
        status: 'pending'
      });

      await storage.createScheduledMessage(messageData);
      console.log(`Notification scheduled for course ${courseId} at ${scheduledTime}`);
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw new Error("Failed to schedule notification");
    }
  }

  async getRecentNotifications(courseId: number, limit: number = 5): Promise<any[]> {
    this.checkInitialized();
    return await storage.getRecentNotifications(courseId, limit);
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error("Notification service not initialized");
    }
  }
}

export const notificationService = NotificationService.getInstance(); 