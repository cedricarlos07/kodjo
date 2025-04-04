import { IStorage } from "../storage";
import { telegramService } from "./telegram";

class SchedulerService {
  private storage: IStorage | null = null;
  private interval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private checkIntervalMs: number = 60000; // Check every minute

  initialize(storage: IStorage): void {
    this.storage = storage;
    this.initialized = true;

    // Start checking for scheduled messages
    this.startScheduler();

    console.log("Scheduler service initialized");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  startScheduler(): void {
    this.checkInitialized();

    // Clear any existing interval
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Set up the interval to check for pending scheduled messages
    this.interval = setInterval(async () => {
      try {
        await this.checkScheduledMessages();
      } catch (error) {
        console.error("Error checking scheduled messages:", error);
      }
    }, this.checkIntervalMs);

    console.log("Scheduler started");
  }

  stopScheduler(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("Scheduler stopped");
    }
  }

  private async checkScheduledMessages(): Promise<void> {
    this.checkInitialized();

    const pendingMessages = await this.storage!.getPendingScheduledMessages();

    console.log(`Found ${pendingMessages.length} pending scheduled messages`);

    for (const message of pendingMessages) {
      try {
        await telegramService.sendScheduledMessage(message.id);
        console.log(`Sent scheduled message ${message.id}: ${message.title}`);
      } catch (error) {
        console.error(`Error sending scheduled message ${message.id}:`, error);
        
        // Log the error
        await this.storage!.createLog({
          level: "ERROR",
          message: `Failed to send scheduled message ${message.id}: ${error}`,
          timestamp: new Date(),
          userId: null,
          scenarioId: null
        });
      }
    }
  }

  private checkInitialized(): void {
    if (!this.initialized || !this.storage) {
      throw new Error("Scheduler service not initialized");
    }
  }
}

export const schedulerService = new SchedulerService();
