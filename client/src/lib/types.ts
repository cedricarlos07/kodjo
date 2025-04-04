// Define frontend-specific types here

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "user";
  avatarUrl?: string;
  lastLogin?: string;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export interface CourseItem {
  id: number;
  name: string;
  instructor: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  zoomLink: string;
  zoomMeetingId?: string;
  telegramGroup?: string;
  telegramGroupId?: string;
}

export interface StudentItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  enrollments?: CourseEnrollment[];
}

export interface CourseEnrollment {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: string;
}

export interface RankingItem {
  ranking: {
    id: number;
    userId: number;
    totalPoints: number;
    messagePoints: number;
    attendancePoints: number;
    lastActivity?: string;
    rankingType: "daily" | "weekly" | "monthly";
    rankingDate: string;
  };
  user: UserProfile;
}

export interface NotificationItem {
  id: number;
  userId?: number;
  telegramGroupId: string;
  messageText: string;
  messageId?: string;
  sentTime: string;
  pointsAwarded: number;
}

export interface ScheduledNotificationItem {
  id: number;
  courseId: number;
  message: string;
  scheduledTime: string;
  recurring: boolean;
  cronPattern?: string;
  status: "pending" | "sent" | "error";
  lastSent?: string;
}

export interface AttendanceItem {
  id: number;
  courseId: number;
  userId: number;
  joinTime: string;
  leaveTime?: string;
  duration?: number;
  pointsAwarded: number;
  sessionDate: string;
}

export interface AttendanceStatistics {
  courseId: number;
  courseName: string;
  instructor: string;
  date: string;
  time: string;
  totalStudents: number;
  presentStudents: number;
  percentagePresent: number;
  averageDuration: number;
  percentageDuration: number;
  totalPointsAwarded: number;
}

export interface ScenarioItem {
  id: number;
  name: string;
  description?: string;
  triggerType: "schedule" | "event";
  triggerValue?: string;
  actions: ScenarioAction[];
  isActive: boolean;
  createdBy: number;
}

export interface ScenarioAction {
  type: string;
  [key: string]: any;
}

export interface LogItem {
  id: number;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  source?: string;
  scenarioId?: number;
}

export interface AppSettingItem {
  id: number;
  key: string;
  value: string;
  description?: string;
}
