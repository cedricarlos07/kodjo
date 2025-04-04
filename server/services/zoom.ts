import { storage } from "../storage";
import { InsertZoomAttendance } from "@shared/schema";
import { encryptionService } from "./encryptionService";
import { StorageFactory } from "../storage-factory";

interface ZoomServiceConfig {
  apiKey: string;
  apiSecret: string;
  simulationMode: boolean;
}

class ZoomService {
  private apiKey: string = "";
  private apiSecret: string = "";
  private simulationMode: boolean = true;
  private initialized: boolean = false;

  async initialize(config?: ZoomServiceConfig): Promise<void> {
    // Si des paramètres sont fournis, les utiliser
    if (config) {
      this.apiKey = config.apiKey;
      this.apiSecret = config.apiSecret;
      this.simulationMode = config.simulationMode;
    } else {
      // Sinon, utiliser les paramètres de la base de données
      const storage = StorageFactory.getInstance();
      const settings = await storage.getAppSettings();

      // Utiliser les paramètres internes pour accéder aux valeurs déchiffrées
      const internalSettings = (storage.constructor as any).internalSettings;

      if (internalSettings) {
        this.apiKey = internalSettings.zoomApiKey || "";
        this.apiSecret = internalSettings.zoomApiSecret || "";
      }

      if (settings) {
        this.simulationMode = settings.simulationMode !== undefined ? settings.simulationMode : true;
      }
    }

    this.initialized = true;
    console.log(`Zoom service initialized (Simulation mode: ${this.simulationMode ? 'ON' : 'OFF'})`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async createMeeting(courseId: number, topic: string, startTime: string): Promise<string> {
    this.checkInitialized();

    if (this.simulationMode) {
      // In simulation mode, return a fake Zoom link
      return `https://zoom.us/j/${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    try {
      // Valider les API keys
      if (!this.apiKey || !this.apiSecret) {
        throw new Error("Zoom API key or secret not configured");
      }

      if (!encryptionService.validateZoomApiKey(this.apiKey)) {
        throw new Error("Invalid Zoom API key format");
      }

      if (!encryptionService.validateZoomApiSecret(this.apiSecret)) {
        throw new Error("Invalid Zoom API secret format");
      }

      // Here we would normally call the Zoom API to create a meeting
      // For MVP, we'll just log that we would create a meeting
      console.log(`Creating Zoom meeting for course ${courseId}: ${topic} at ${startTime}`);

      // In a real implementation, we would use the Zoom API client to create a meeting
      // const zoomClient = new ZoomClient(this.apiKey, this.apiSecret);
      // const meeting = await zoomClient.createMeeting({
      //   topic,
      //   type: 2, // Scheduled meeting
      //   start_time: startTime,
      //   duration: 60, // 1 hour
      //   timezone: 'UTC',
      //   settings: {
      //     host_video: true,
      //     participant_video: true,
      //     join_before_host: true,
      //     mute_upon_entry: false,
      //     watermark: false,
      //     use_pmi: false,
      //     approval_type: 0,
      //     audio: 'both',
      //     auto_recording: 'none'
      //   }
      // });
      // return meeting.join_url;

      // For now, return a dummy Zoom link
      return `https://zoom.us/j/${Math.floor(10000000 + Math.random() * 90000000)}`;
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      throw new Error("Failed to create Zoom meeting");
    }
  }

  async recordAttendance(userId: number, courseId: number, joinTime: Date): Promise<void> {
    this.checkInitialized();

    try {
      const attendanceData: InsertZoomAttendance = {
        userId,
        courseId,
        joinTime,
        date: new Date()
      };

      await storage.recordAttendance(attendanceData);
      console.log(`Recorded attendance for user ${userId} in course ${courseId}`);
    } catch (error) {
      console.error("Error recording attendance:", error);
      throw new Error("Failed to record attendance");
    }
  }

  async updateAttendance(attendanceId: number, leaveTime: Date): Promise<void> {
    this.checkInitialized();

    try {
      await storage.updateAttendance(attendanceId, { leaveTime });
      console.log(`Updated attendance ${attendanceId} with leave time`);
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw new Error("Failed to update attendance");
    }
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error("Zoom service not initialized");
    }
  }
}

export const zoomService = new ZoomService();
