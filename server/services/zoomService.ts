import { storage } from "../storage";
import { simulationService } from "./simulationService";

interface ZoomConfig {
  apiKey: string;
  apiSecret: string;
  simulationMode: boolean;
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

interface ZoomParticipant {
  userId: number;
  name: string;
  email: string;
  status: 'invited' | 'joined' | 'left' | 'absent';
  joinTime?: Date;
  leaveTime?: Date;
  duration?: number;
}

export class ZoomService {
  private static instance: ZoomService;
  private apiKey: string = "";
  private apiSecret: string = "";
  private simulationMode: boolean = true;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): ZoomService {
    if (!ZoomService.instance) {
      ZoomService.instance = new ZoomService();
    }
    return ZoomService.instance;
  }

  initialize(config: ZoomConfig): void {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.simulationMode = config.simulationMode;
    this.initialized = true;
    console.log(`Zoom service initialized (Simulation mode: ${this.simulationMode ? 'ON' : 'OFF'})`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async createMeeting(courseId: number, topic: string, startTime: Date, duration: number = 60, participants?: ZoomParticipant[]): Promise<ZoomMeeting> {
    this.checkInitialized();

    try {
      if (this.simulationMode) {
        console.log(`[SIMULATION] Creating Zoom meeting for course ${courseId}`);
        const meeting: ZoomMeeting = {
          id: `sim-${Date.now()}`,
          topic,
          startTime,
          duration,
          joinUrl: `https://zoom.us/j/sim-${Date.now()}`,
          participants
        };
        await storage.recordZoomMeeting(courseId, meeting);
        return meeting;
      } else {
        if (!this.apiKey || !this.apiSecret) {
          throw new Error("Zoom API credentials not configured");
        }

        console.log(`Creating Zoom meeting for course ${courseId}`);
        const meeting: ZoomMeeting = {
          id: `zoom-${Date.now()}`,
          topic,
          startTime,
          duration,
          joinUrl: `https://zoom.us/j/${courseId}`,
          password: Math.random().toString(36).substring(2, 8),
          participants: participants?.map(p => ({ ...p, status: 'invited' }))
        };
        await storage.recordZoomMeeting(courseId, meeting);
        return meeting;
      }
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      throw new Error("Failed to create Zoom meeting");
    }
  }

  async getMeeting(courseId: number): Promise<ZoomMeeting | null> {
    this.checkInitialized();
    return await storage.getZoomMeeting(courseId);
  }

  async updateMeeting(courseId: number, meetingData: Partial<ZoomMeeting>): Promise<ZoomMeeting> {
    this.checkInitialized();

    try {
      const existingMeeting = await this.getMeeting(courseId);
      if (!existingMeeting) {
        throw new Error("Meeting not found");
      }

      const updatedMeeting = { ...existingMeeting, ...meetingData };
      await storage.updateZoomMeeting(courseId, updatedMeeting);
      return updatedMeeting;
    } catch (error) {
      console.error("Error updating Zoom meeting:", error);
      throw new Error("Failed to update Zoom meeting");
    }
  }

  async deleteMeeting(courseId: number): Promise<void> {
    this.checkInitialized();

    try {
      await storage.deleteZoomMeeting(courseId);
    } catch (error) {
      console.error("Error deleting Zoom meeting:", error);
      throw new Error("Failed to delete Zoom meeting");
    }
  }

  async addParticipant(courseId: number, participant: ZoomParticipant): Promise<void> {
    this.checkInitialized();

    try {
      const meeting = await this.getMeeting(courseId);
      if (!meeting) {
        throw new Error("Meeting not found");
      }

      const updatedParticipants = [
        ...(meeting.participants || []),
        { ...participant, status: 'invited' }
      ];

      await this.updateMeeting(courseId, { participants: updatedParticipants });
    } catch (error) {
      console.error("Error adding participant:", error);
      throw new Error("Failed to add participant");
    }
  }

  async updateParticipantStatus(courseId: number, userId: number, status: ZoomParticipant['status'], joinTime?: Date, leaveTime?: Date): Promise<void> {
    this.checkInitialized();

    try {
      const meeting = await this.getMeeting(courseId);
      if (!meeting) {
        throw new Error("Meeting not found");
      }

      const updatedParticipants = meeting.participants?.map(p => {
        if (p.userId === userId) {
          return {
            ...p,
            status,
            joinTime: joinTime || p.joinTime,
            leaveTime: leaveTime || p.leaveTime,
            duration: leaveTime && p.joinTime ? 
              Math.floor((new Date(leaveTime).getTime() - new Date(p.joinTime).getTime()) / (1000 * 60)) : 
              p.duration
          };
        }
        return p;
      });

      await this.updateMeeting(courseId, { participants: updatedParticipants });
    } catch (error) {
      console.error("Error updating participant status:", error);
      throw new Error("Failed to update participant status");
    }
  }

  async getParticipantStats(courseId: number): Promise<{
    total: number;
    joined: number;
    left: number;
    absent: number;
    averageDuration: number;
  }> {
    this.checkInitialized();

    try {
      const meeting = await this.getMeeting(courseId);
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
        .map(p => p.duration || 0);
      
      if (durations.length > 0) {
        stats.averageDuration = Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length
        );
      }

      return stats;
    } catch (error) {
      console.error("Error getting participant stats:", error);
      throw new Error("Failed to get participant stats");
    }
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error("Zoom service not initialized");
    }
  }
}

export const zoomService = ZoomService.getInstance(); 