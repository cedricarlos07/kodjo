import { storage } from "../storage";
import { simulationService } from "./simulationService";
import { insertCourseSchema } from "@shared/schema";

export interface CourseStats {
  attendance: number;
  notifications: number;
  students: number;
}

export class CourseService {
  private static instance: CourseService;

  private constructor() {}

  static getInstance(): CourseService {
    if (!CourseService.instance) {
      CourseService.instance = new CourseService();
    }
    return CourseService.instance;
  }

  async createCourse(courseData: any) {
    const validatedData = insertCourseSchema.parse(courseData);
    const course = await storage.createCourse(validatedData);
    await simulationService.initializeSimulationData();
    return course;
  }

  async getCourse(courseId: number) {
    const course = await storage.getCourse(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }
    return course;
  }

  async getAllCourses() {
    return await storage.getAllCourses();
  }

  async getUpcomingCourses() {
    const courses = await storage.getAllCourses();
    return courses.filter(course => new Date(course.startDate) > new Date());
  }

  async getCourseStats(courseId: number): Promise<CourseStats> {
    const [attendance, notifications, students] = await Promise.all([
      simulationService.simulateCourseAttendance(courseId),
      simulationService.simulateCourseNotifications(courseId),
      simulationService.simulateCourseStudents(courseId)
    ]);

    return {
      attendance,
      notifications,
      students
    };
  }

  async updateCourse(courseId: number, courseData: any) {
    const validatedData = insertCourseSchema.partial().parse(courseData);
    const course = await storage.updateCourse(courseId, validatedData);
    await simulationService.updateSimulationData(courseId);
    return course;
  }

  async deleteCourse(courseId: number) {
    await storage.deleteCourse(courseId);
    await simulationService.updateSimulationData(courseId);
  }
}

export const courseService = CourseService.getInstance(); 