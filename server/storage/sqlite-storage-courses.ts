import { SQLiteStorage } from './sqlite-storage';
import { Course, InsertCourse, CourseEnrollment, InsertCourseEnrollment } from '@shared/schema';

// Méthodes pour la gestion des cours
export const courseMethods = {
  // Méthode pour créer un cours
  async createCourse(this: SQLiteStorage, course: InsertCourse): Promise<Course> {
    const result = this.db.prepare(`
      INSERT INTO courses (
        name, instructor, dayOfWeek, time, zoomLink, 
        courseNumber, professorName, level, schedule, 
        telegramGroup, zoomId, startDateTime, duration
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      course.name,
      course.instructor,
      course.dayOfWeek,
      course.time,
      course.zoomLink,
      course.courseNumber || null,
      course.professorName || null,
      course.level || null,
      course.schedule || null,
      course.telegramGroup || null,
      course.zoomId || null,
      course.startDateTime || null,
      course.duration || null
    );
    
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      name: course.name,
      instructor: course.instructor,
      dayOfWeek: course.dayOfWeek,
      time: course.time,
      zoomLink: course.zoomLink,
      courseNumber: course.courseNumber || null,
      professorName: course.professorName || null,
      level: course.level || null,
      schedule: course.schedule || null,
      telegramGroup: course.telegramGroup || null,
      zoomId: course.zoomId || null,
      startDateTime: course.startDateTime || null,
      duration: course.duration || null
    };
  },

  // Méthode pour obtenir un cours par son ID
  async getCourse(this: SQLiteStorage, id: number): Promise<Course | undefined> {
    const course = this.db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as Course | undefined;
    return course;
  },

  // Méthode pour obtenir un cours par son nom
  async getCourseByName(this: SQLiteStorage, name: string): Promise<Course | undefined> {
    const course = this.db.prepare('SELECT * FROM courses WHERE name = ?').get(name) as Course | undefined;
    return course;
  },

  // Méthode pour obtenir tous les cours
  async getAllCourses(this: SQLiteStorage): Promise<Course[]> {
    return this.db.prepare('SELECT * FROM courses').all() as Course[];
  },

  // Méthode pour mettre à jour un cours
  async updateCourse(this: SQLiteStorage, id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;
    
    // Construire la requête de mise à jour dynamiquement
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(courseData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return course;
    
    values.push(id);
    
    this.db.prepare(`
      UPDATE courses
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.getCourse(id);
  },

  // Méthode pour supprimer un cours
  async deleteCourse(this: SQLiteStorage, id: number): Promise<void> {
    this.db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  },

  // Méthode pour obtenir les cours à venir
  async getUpcomingCourses(this: SQLiteStorage): Promise<Course[]> {
    // Dans une implémentation réelle, on filtrerait par date/heure
    return this.getAllCourses();
  },

  // Méthode pour inscrire un utilisateur à un cours
  async enrollUserInCourse(this: SQLiteStorage, enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    // Vérifier si l'inscription existe déjà
    const existingEnrollment = this.db.prepare(`
      SELECT * FROM course_enrollments 
      WHERE userId = ? AND courseId = ?
    `).get(enrollment.userId, enrollment.courseId) as CourseEnrollment | undefined;
    
    if (existingEnrollment) {
      return existingEnrollment;
    }
    
    // Créer une nouvelle inscription
    this.db.prepare(`
      INSERT INTO course_enrollments (userId, courseId, enrolledAt)
      VALUES (?, ?, ?)
    `).run(
      enrollment.userId,
      enrollment.courseId,
      enrollment.enrolledAt.toISOString()
    );
    
    return {
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt
    };
  },

  // Méthode pour obtenir les inscriptions pour un cours
  async getEnrollmentsForCourse(this: SQLiteStorage, courseId: number): Promise<CourseEnrollment[]> {
    return this.db.prepare(`
      SELECT * FROM course_enrollments 
      WHERE courseId = ?
    `).all(courseId) as CourseEnrollment[];
  },

  // Méthode pour obtenir les inscriptions pour un utilisateur
  async getEnrollmentsForUser(this: SQLiteStorage, userId: number): Promise<CourseEnrollment[]> {
    return this.db.prepare(`
      SELECT * FROM course_enrollments 
      WHERE userId = ?
    `).all(userId) as CourseEnrollment[];
  },

  // Méthode pour obtenir les cours pour un utilisateur
  async getCoursesForUser(this: SQLiteStorage, userId: number): Promise<Course[]> {
    return this.db.prepare(`
      SELECT c.* FROM courses c
      JOIN course_enrollments e ON c.id = e.courseId
      WHERE e.userId = ?
    `).all(userId) as Course[];
  },

  // Méthode pour désinscrire un utilisateur d'un cours
  async unenrollUserFromCourse(this: SQLiteStorage, userId: number, courseId: number): Promise<void> {
    this.db.prepare(`
      DELETE FROM course_enrollments 
      WHERE userId = ? AND courseId = ?
    `).run(userId, courseId);
  }
};
