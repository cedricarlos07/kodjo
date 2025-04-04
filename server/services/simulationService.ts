import { storage } from "../storage";

interface SimulationData {
  courseId: number;
  attendance: number;
  notifications: number;
  students: number;
}

export class SimulationService {
  private static instance: SimulationService;
  private simulationData: Map<number, SimulationData> = new Map();

  private constructor() {}

  static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  async initializeSimulationData(): Promise<void> {
    const courses = await storage.getAllCourses();
    courses.forEach(course => {
      this.simulationData.set(course.id, {
        courseId: course.id,
        attendance: Math.floor(Math.random() * 100),
        notifications: Math.floor(Math.random() * 10),
        students: Math.floor(Math.random() * 50) + 10
      });
    });
  }

  async simulateCourseAttendance(courseId: number): Promise<number> {
    const data = this.simulationData.get(courseId);
    if (!data) {
      throw new Error(`Course ${courseId} not found in simulation data`);
    }
    return data.attendance;
  }

  async simulateCourseNotifications(courseId: number): Promise<number> {
    const data = this.simulationData.get(courseId);
    if (!data) {
      throw new Error(`Course ${courseId} not found in simulation data`);
    }
    return data.notifications;
  }

  async simulateCourseStudents(courseId: number): Promise<number> {
    const data = this.simulationData.get(courseId);
    if (!data) {
      throw new Error(`Course ${courseId} not found in simulation data`);
    }
    return data.students;
  }

  async updateSimulationData(courseId: number): Promise<void> {
    const data = this.simulationData.get(courseId);
    if (data) {
      this.simulationData.set(courseId, {
        ...data,
        attendance: Math.floor(Math.random() * 100),
        notifications: Math.floor(Math.random() * 10),
        students: data.students + (Math.random() > 0.5 ? 1 : -1)
      });
    }
  }
}

export const simulationService = SimulationService.getInstance(); 