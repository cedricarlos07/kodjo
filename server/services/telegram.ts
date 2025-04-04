import { storage } from "../storage";
import { InsertTelegramMessage } from "@shared/schema";
import { encryptionService } from "./encryptionService";
import { StorageFactory } from "../storage-factory";
import { simulationModeService } from "./simulationModeService";

interface TelegramServiceConfig {
  token: string;
  chatId: string;
  simulationMode: boolean;
}

class TelegramService {
  private token: string = "";
  private chatId: string = "";
  private simulationMode: boolean = true;
  private initialized: boolean = false;

  async initialize(config?: TelegramServiceConfig): Promise<void> {
    // Si des paramètres sont fournis, les utiliser
    if (config) {
      this.token = config.token;
      this.chatId = config.chatId;
      this.simulationMode = config.simulationMode;
    } else {
      // Sinon, utiliser les paramètres de la base de données
      const storage = StorageFactory.getInstance();
      const settings = await storage.getAppSettings();

      // Utiliser les paramètres internes pour accéder aux valeurs déchiffrées
      const internalSettings = (storage.constructor as any).internalSettings;

      if (internalSettings && internalSettings.telegramToken) {
        this.token = internalSettings.telegramToken;
      }

      if (settings) {
        this.chatId = settings.testGroup || "";
        this.simulationMode = settings.simulationMode !== undefined ? settings.simulationMode : true;
      }
    }

    this.initialized = true;
    console.log(`Telegram service initialized (Simulation mode: ${this.simulationMode ? 'ON' : 'OFF'})`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async sendMessage(courseId: number, userId: number, message: string): Promise<void> {
    this.checkInitialized();

    try {
      if (this.simulationMode) {
        console.log(`[SIMULATION] Sending Telegram message for course ${courseId}: ${message}`);
      } else {
        if (!this.token || !this.chatId) {
          throw new Error("Telegram token or chat ID not configured");
        }

        // Valider le token Telegram
        if (!encryptionService.validateTelegramToken(this.token)) {
          throw new Error("Invalid Telegram token format");
        }

        // Here we would normally call the Telegram API to send a message
        // For MVP, we'll just log that we would send a message
        console.log(`Sending Telegram message for course ${courseId}: ${message}`);

        // In a real implementation, we would use the node-telegram-bot-api to send a message
        // const TelegramBot = require('node-telegram-bot-api');
        // const bot = new TelegramBot(this.token, { polling: false });
        // await bot.sendMessage(this.chatId, message);
      }

      // Record the message in the database
      const messageData: InsertTelegramMessage = {
        userId,
        courseId,
        content: message,
        sentAt: new Date()
      };

      await storage.recordTelegramMessage(messageData);
    } catch (error) {
      console.error("Error sending Telegram message:", error);
      throw new Error("Failed to send Telegram message");
    }
  }

  async sendScheduledMessage(messageId: number): Promise<void> {
    this.checkInitialized();

    try {
      const message = await storage.getScheduledMessage(messageId);

      if (!message) {
        throw new Error(`Scheduled message ${messageId} not found`);
      }

      const course = await storage.getCourse(message.courseId);

      if (!course) {
        throw new Error(`Course ${message.courseId} not found`);
      }

      // We'll use the admin user ID for scheduled messages
      const adminUser = await storage.getUserByUsername("admin");

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      if (this.simulationMode) {
        console.log(`[SIMULATION] Sending scheduled Telegram message: ${message.title}`);
        console.log(`Message content: ${message.content}`);
        console.log(`For course: ${course.name}`);
      } else {
        if (!this.token || !this.chatId) {
          throw new Error("Telegram token or chat ID not configured");
        }

        // Here we would normally call the Telegram API to send a message
        console.log(`Sending scheduled Telegram message: ${message.title}`);
        console.log(`Message content: ${message.content}`);
        console.log(`For course: ${course.name}`);

        // In a real implementation, we would use the node-telegram-bot-api to send a message
      }

      // Record the message in the database
      const messageData: InsertTelegramMessage = {
        userId: adminUser.id,
        courseId: message.courseId,
        content: `${message.title}: ${message.content}`,
        sentAt: new Date()
      };

      await storage.recordTelegramMessage(messageData);

      // Mark the scheduled message as sent
      await storage.markScheduledMessageAsSent(messageId);
    } catch (error) {
      console.error("Error sending scheduled Telegram message:", error);
      throw new Error("Failed to send scheduled Telegram message");
    }
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error("Telegram service not initialized");
    }
  }

  // Get bot information
  getBotInfo(): any {
    this.checkInitialized();

    // In a real implementation, we would use the Telegram API to get bot info
    // For now, return simulated data
    return {
      id: 123456789,
      first_name: "KodjoEnglishBot",
      username: "kodjo_english_bot",
      is_bot: true,
      status: this.simulationMode ? "simulation" : "active"
    };
  }

  // Check if simulation mode is enabled
  isSimulationMode(): boolean {
    return this.simulationMode;
  }

  // Simulate sending a message to a specific group
  async simulateMessage(groupId: string, message: string, userId: number): Promise<any> {
    this.checkInitialized();

    try {
      // If groupId is "test", use the test group ID from simulation mode service
      const targetGroupId = groupId === "test" ?
        await this.getTestGroupId() :
        groupId;

      console.log(`[SIMULATION] Sending message to group ${targetGroupId}: ${message}`);

      // Record the simulation in logs
      await storage.createLog({
        type: "simulation",
        userId,
        message: `Telegram simulation to group ${targetGroupId}`,
        details: message,
        timestamp: new Date()
      });

      return {
        success: true,
        message: "Message simulated successfully",
        timestamp: new Date().toISOString(),
        target: targetGroupId,
        content: message
      };
    } catch (error) {
      console.error("Error simulating Telegram message:", error);
      throw new Error("Failed to simulate Telegram message");
    }
  }

  // Get the test group ID from simulation mode service or settings
  private async getTestGroupId(): Promise<string> {
    // Initialize simulation mode service if not already initialized
    if (!simulationModeService.isInitialized()) {
      await simulationModeService.initialize();
    }

    // Get test group ID from simulation mode service
    const testGroupId = simulationModeService.getTestGroupId();

    // If test group ID is not set, use the default chat ID from Telegram service
    if (!testGroupId || testGroupId === "test") {
      return this.chatId || "test";
    }

    return testGroupId;
  }
}

export const telegramService = new TelegramService();
