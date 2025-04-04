import { storage } from "../storage";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";

/**
 * Service pour générer des statistiques et des rapports
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  initialize(): void {
    this.initialized = true;
    console.log("Analytics service initialized");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error("Analytics service not initialized");
    }
  }

  /**
   * Obtient les statistiques générales de la plateforme
   */
  async getPlatformStats(startDate: Date, endDate: Date): Promise<any> {
    this.checkInitialized();
    
    try {
      // Récupérer les données nécessaires
      const users = await storage.getAllUsers();
      const courses = await storage.getAllCourses();
      const attendance = await storage.getAllZoomAttendance();
      const messages = await storage.getAllTelegramMessages();
      const userPoints = await storage.getAllUserPoints();
      
      // Filtrer les données par date
      const filteredAttendance = attendance.filter(a => 
        isWithinInterval(new Date(a.timestamp), { start: startDate, end: endDate })
      );
      
      const filteredMessages = messages.filter(m => 
        isWithinInterval(new Date(m.timestamp), { start: startDate, end: endDate })
      );
      
      const filteredUserPoints = userPoints.filter(p => 
        isWithinInterval(new Date(p.timestamp), { start: startDate, end: endDate })
      );
      
      // Calculer les statistiques
      const totalUsers = users.length;
      const totalCourses = courses.length;
      const totalAttendance = filteredAttendance.length;
      const totalMessages = filteredMessages.length;
      
      // Utilisateurs actifs (ceux qui ont au moins une présence ou un message)
      const activeUserIds = new Set([
        ...filteredAttendance.map(a => a.userId),
        ...filteredMessages.map(m => m.userId)
      ]);
      const activeUsers = activeUserIds.size;
      
      // Taux de présence moyen
      const courseAttendanceMap = new Map();
      for (const course of courses) {
        courseAttendanceMap.set(course.id, { total: 0, present: 0 });
      }
      
      for (const a of filteredAttendance) {
        const courseStats = courseAttendanceMap.get(a.courseId);
        if (courseStats) {
          courseStats.total += 1;
          if (a.duration >= 30) { // Considérer présent si au moins 30 minutes
            courseStats.present += 1;
          }
        }
      }
      
      let totalAttendanceRate = 0;
      let courseCount = 0;
      for (const stats of courseAttendanceMap.values()) {
        if (stats.total > 0) {
          totalAttendanceRate += (stats.present / stats.total) * 100;
          courseCount += 1;
        }
      }
      
      const averageAttendanceRate = courseCount > 0 ? totalAttendanceRate / courseCount : 0;
      
      // Total des points
      const totalPoints = filteredUserPoints.reduce((sum, p) => sum + p.points, 0);
      
      return {
        totalUsers,
        totalCourses,
        totalAttendance,
        totalMessages,
        activeUsers,
        averageAttendanceRate: Math.round(averageAttendanceRate * 10) / 10,
        totalPoints
      };
    } catch (error) {
      console.error("Error getting platform stats:", error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de présence
   */
  async getAttendanceStats(startDate: Date, endDate: Date): Promise<any> {
    this.checkInitialized();
    
    try {
      // Récupérer les données nécessaires
      const users = await storage.getAllUsers();
      const courses = await storage.getAllCourses();
      const attendance = await storage.getAllZoomAttendance();
      
      // Filtrer les données par date
      const filteredAttendance = attendance.filter(a => 
        isWithinInterval(new Date(a.timestamp), { start: startDate, end: endDate })
      );
      
      // Statistiques de présence par cours
      const courseAttendanceMap = new Map();
      for (const course of courses) {
        courseAttendanceMap.set(course.id, { 
          courseName: course.name,
          total: 0, 
          present: 0 
        });
      }
      
      for (const a of filteredAttendance) {
        const courseStats = courseAttendanceMap.get(a.courseId);
        if (courseStats) {
          courseStats.total += 1;
          if (a.duration >= 30) { // Considérer présent si au moins 30 minutes
            courseStats.present += 1;
          }
        }
      }
      
      const courseAttendance = Array.from(courseAttendanceMap.values())
        .filter(stats => stats.total > 0)
        .map(stats => ({
          courseName: stats.courseName,
          attendanceRate: Math.round((stats.present / stats.total) * 100),
          totalSessions: stats.total
        }))
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .slice(0, 5);
      
      // Statistiques de présence par utilisateur
      const userAttendanceMap = new Map();
      for (const user of users) {
        userAttendanceMap.set(user.id, { 
          userName: user.fullName,
          total: 0, 
          present: 0 
        });
      }
      
      for (const a of filteredAttendance) {
        const userStats = userAttendanceMap.get(a.userId);
        if (userStats) {
          userStats.total += 1;
          if (a.duration >= 30) { // Considérer présent si au moins 30 minutes
            userStats.present += 1;
          }
        }
      }
      
      const userAttendance = Array.from(userAttendanceMap.values())
        .filter(stats => stats.total > 0)
        .map(stats => ({
          userName: stats.userName,
          attendanceRate: Math.round((stats.present / stats.total) * 100),
          totalSessions: stats.total
        }))
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .slice(0, 5);
      
      // Présence par jour de la semaine
      const dayMap = new Map();
      const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      for (const day of days) {
        dayMap.set(day, 0);
      }
      
      for (const a of filteredAttendance) {
        const date = new Date(a.timestamp);
        const day = days[date.getDay()];
        dayMap.set(day, dayMap.get(day) + 1);
      }
      
      const attendanceByDay = Array.from(dayMap.entries())
        .map(([day, count]) => ({ day, count }));
      
      // Présence par heure
      const hourMap = new Map();
      for (let hour = 0; hour < 24; hour++) {
        hourMap.set(hour, 0);
      }
      
      for (const a of filteredAttendance) {
        const date = new Date(a.timestamp);
        const hour = date.getHours();
        hourMap.set(hour, hourMap.get(hour) + 1);
      }
      
      const attendanceByTime = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }));
      
      return {
        courseAttendance,
        userAttendance,
        attendanceByDay,
        attendanceByTime
      };
    } catch (error) {
      console.error("Error getting attendance stats:", error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques d'engagement
   */
  async getEngagementStats(startDate: Date, endDate: Date): Promise<any> {
    this.checkInitialized();
    
    try {
      // Récupérer les données nécessaires
      const users = await storage.getAllUsers();
      const courses = await storage.getAllCourses();
      const messages = await storage.getAllTelegramMessages();
      
      // Filtrer les données par date
      const filteredMessages = messages.filter(m => 
        isWithinInterval(new Date(m.timestamp), { start: startDate, end: endDate })
      );
      
      // Messages par utilisateur
      const userMessageMap = new Map();
      for (const user of users) {
        userMessageMap.set(user.id, { 
          userName: user.fullName,
          messageCount: 0 
        });
      }
      
      for (const m of filteredMessages) {
        const userStats = userMessageMap.get(m.userId);
        if (userStats) {
          userStats.messageCount += 1;
        }
      }
      
      const messagesByUser = Array.from(userMessageMap.values())
        .filter(stats => stats.messageCount > 0)
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);
      
      // Messages par groupe
      const groupMessageMap = new Map();
      for (const course of courses) {
        if (course.telegramGroup) {
          groupMessageMap.set(course.telegramGroup, { 
            groupName: course.name,
            messageCount: 0 
          });
        }
      }
      
      for (const m of filteredMessages) {
        if (m.groupId) {
          const groupStats = groupMessageMap.get(m.groupId);
          if (groupStats) {
            groupStats.messageCount += 1;
          }
        }
      }
      
      const messagesByGroup = Array.from(groupMessageMap.values())
        .filter(stats => stats.messageCount > 0)
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);
      
      // Messages par jour de la semaine
      const dayMap = new Map();
      const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      for (const day of days) {
        dayMap.set(day, 0);
      }
      
      for (const m of filteredMessages) {
        const date = new Date(m.timestamp);
        const day = days[date.getDay()];
        dayMap.set(day, dayMap.get(day) + 1);
      }
      
      const messagesByDay = Array.from(dayMap.entries())
        .map(([day, count]) => ({ day, count }));
      
      // Messages par heure
      const hourMap = new Map();
      for (let hour = 0; hour < 24; hour++) {
        hourMap.set(hour, 0);
      }
      
      for (const m of filteredMessages) {
        const date = new Date(m.timestamp);
        const hour = date.getHours();
        hourMap.set(hour, hourMap.get(hour) + 1);
      }
      
      const messagesByHour = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }));
      
      return {
        messagesByUser,
        messagesByGroup,
        messagesByDay,
        messagesByHour
      };
    } catch (error) {
      console.error("Error getting engagement stats:", error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de performance
   */
  async getPerformanceStats(startDate: Date, endDate: Date): Promise<any> {
    this.checkInitialized();
    
    try {
      // Récupérer les données nécessaires
      const users = await storage.getAllUsers();
      const userPoints = await storage.getAllUserPoints();
      const rankings = await storage.getAllUserRankings();
      
      // Filtrer les données par date
      const filteredUserPoints = userPoints.filter(p => 
        isWithinInterval(new Date(p.timestamp), { start: startDate, end: endDate })
      );
      
      // Top performers
      const userPointsMap = new Map();
      for (const user of users) {
        userPointsMap.set(user.id, { 
          userName: user.fullName,
          points: 0,
          rank: 0
        });
      }
      
      for (const p of filteredUserPoints) {
        const userStats = userPointsMap.get(p.userId);
        if (userStats) {
          userStats.points += p.points;
        }
      }
      
      // Ajouter les rangs
      const sortedUsers = Array.from(userPointsMap.values())
        .filter(stats => stats.points > 0)
        .sort((a, b) => b.points - a.points);
      
      for (let i = 0; i < sortedUsers.length; i++) {
        sortedUsers[i].rank = i + 1;
      }
      
      const topPerformers = sortedUsers.slice(0, 5);
      
      // Points par catégorie
      const categoryMap = new Map();
      const categories = ["Présence", "Messages", "Participation", "Devoirs", "Bonus"];
      for (const category of categories) {
        categoryMap.set(category, 0);
      }
      
      for (const p of filteredUserPoints) {
        let category = "Bonus"; // Par défaut
        
        if (p.reason) {
          if (p.reason.includes("présence") || p.reason.includes("attendance")) {
            category = "Présence";
          } else if (p.reason.includes("message")) {
            category = "Messages";
          } else if (p.reason.includes("participation")) {
            category = "Participation";
          } else if (p.reason.includes("devoir") || p.reason.includes("homework")) {
            category = "Devoirs";
          }
        }
        
        categoryMap.set(category, categoryMap.get(category) + p.points);
      }
      
      const pointsByCategory = Array.from(categoryMap.entries())
        .map(([category, points]) => ({ category, points }));
      
      // Tendance des points
      const dateMap = new Map();
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      const endMonth = endDate.getMonth();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === endYear ? endMonth : 11;
        
        for (let month = monthStart; month <= monthEnd; month++) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-01`;
          dateMap.set(dateKey, 0);
        }
      }
      
      for (const p of filteredUserPoints) {
        const date = new Date(p.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        
        if (dateMap.has(dateKey)) {
          dateMap.set(dateKey, dateMap.get(dateKey) + p.points);
        }
      }
      
      const pointsTrend = Array.from(dateMap.entries())
        .map(([date, points]) => ({ date, points }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        topPerformers,
        pointsByCategory,
        pointsTrend
      };
    } catch (error) {
      console.error("Error getting performance stats:", error);
      throw error;
    }
  }

  /**
   * Génère un rapport complet au format JSON
   */
  async generateFullReport(startDate: Date, endDate: Date): Promise<any> {
    this.checkInitialized();
    
    try {
      const platformStats = await this.getPlatformStats(startDate, endDate);
      const attendanceStats = await this.getAttendanceStats(startDate, endDate);
      const engagementStats = await this.getEngagementStats(startDate, endDate);
      const performanceStats = await this.getPerformanceStats(startDate, endDate);
      
      return {
        reportGeneratedAt: new Date(),
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        platformStats,
        attendanceStats,
        engagementStats,
        performanceStats
      };
    } catch (error) {
      console.error("Error generating full report:", error);
      throw error;
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
