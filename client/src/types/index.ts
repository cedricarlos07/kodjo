// Auth types
export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "user";
  lastActive: string;
  telegramId?: string;
}

// Course types
export interface Course {
  id: number;
  name: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  zoomLink: string;
  telegramGroup?: string;
  createdBy: number;
}

// Scheduled Message types
export interface ScheduledMessage {
  id: number;
  courseId?: number;
  title: string;
  message: string;
  scheduleTime: string;
  repeat: "none" | "daily" | "weekly";
  sent: boolean;
  createdBy: number;
}

// Zoom Attendance types
export interface ZoomAttendance {
  id: number;
  courseId: number;
  userId: number;
  joinTime: string;
  leaveTime?: string;
  duration?: number;
  points: number;
}

// User Ranking types
export interface UserRanking {
  id: number;
  userId: number;
  messagePoints: number;
  attendancePoints: number;
  totalPoints: number;
  lastUpdated: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
  };
}

// Scenario (Automation) types
export interface Scenario {
  id: number;
  name: string;
  description?: string;
  trigger: string;
  action: string;
  enabled: boolean;
  customCode?: string;
  createdBy: number;
}

// Log types
export interface Log {
  id: number;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  source?: string;
  timestamp: string;
  scenarioId?: number;
}

// App Settings types
export interface AppSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

// Telegram Message types
export interface TelegramMessage {
  id: number;
  userId?: number;
  groupId: string;
  message: string;
  timestamp: string;
  points: number;
}

// Course Enrollment types
export interface CourseEnrollment {
  id: number;
  courseId: number;
  userId: number;
}

// Dashboard statistics
export interface DashboardStats {
  activeStudents: number;
  activeCourses: number;
  todaySessions: number;
  notificationsSent: number;
}

// Course with enrollment stats
export interface CourseWithStats extends Course {
  enrolledStudents: number;
  status: "ready" | "pending" | "completed";
}

// Attendance with stats
export interface AttendanceWithStats {
  course: {
    name: string;
    instructor: string;
  };
  date: string;
  time: string;
  stats: string;
  percentage: number;
  averageDuration: string;
  durationPercentage: string;
  pointsAwarded: number;
}
