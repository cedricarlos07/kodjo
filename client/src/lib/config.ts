/**
 * Configuration globale de l'application
 */

// URL de base de l'API
export const API_BASE_URL = 'http://localhost:3000';

// Autres configurations
export const APP_NAME = 'KODJO ENGLISH BOT';
export const APP_VERSION = '1.0.0';

// Configuration des délais
export const TIMEOUT = {
  DEFAULT: 10000, // 10 secondes
  LONG: 30000,    // 30 secondes
};

// Configuration des routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  COURSES: '/courses',
  USERS: '/utilisateurs',
  NOTIFICATIONS: '/notifications',
  RANKINGS: '/rankings',
  AUTOMATION: '/automation',
  SETTINGS: '/settings',
  LOGS: '/logs',
  SCENARIOS: '/scenarios',
  NOTIFICATION_TEMPLATES: '/notification-templates',
  ZOOM_LINKS: '/zoom-links',
  NOTIFICATION_SIMULATOR: '/notification-simulator',
  POINT_RULES: '/point-rules',
  ANALYTICS: '/analytics',
  REMINDER_TEMPLATES: '/reminder-templates',
};

// Configuration des API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    USER: `${API_BASE_URL}/api/auth/user`,
  },
  COURSES: {
    LIST: `${API_BASE_URL}/api/courses`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/courses/${id}`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/users/${id}`,
  },
  STATS: `${API_BASE_URL}/api/stats`,
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/api/notifications`,
    SEND: `${API_BASE_URL}/api/notifications/send`,
    TEMPLATES: `${API_BASE_URL}/api/notification-templates`,
  },
  SCENARIOS: {
    LIST: `${API_BASE_URL}/api/scenarios`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/scenarios/${id}`,
    RUN: (id: number) => `${API_BASE_URL}/api/scenarios/${id}/run`,
  },
  ZOOM: {
    LIST: `${API_BASE_URL}/api/zoom-links`,
  },
  SIMULATOR: {
    SEND: `${API_BASE_URL}/api/simulator/send`,
  },
  POINT_RULES: {
    LIST: `${API_BASE_URL}/api/point-rules`,
    ACTIVE: `${API_BASE_URL}/api/point-rules/active`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/point-rules/${id}`,
  },
  ANALYTICS: {
    PLATFORM: `${API_BASE_URL}/api/stats/platform`,
    ATTENDANCE: `${API_BASE_URL}/api/stats/attendance`,
    ENGAGEMENT: `${API_BASE_URL}/api/stats/engagement`,
    PERFORMANCE: `${API_BASE_URL}/api/stats/performance`,
    REPORT: `${API_BASE_URL}/api/stats/report`,
  },
  REMINDER_TEMPLATES: {
    LIST: `${API_BASE_URL}/api/reminder-templates`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/reminder-templates/${id}`,
    BY_TYPE: (type: string) => `${API_BASE_URL}/api/reminder-templates/type/${type}`,
    BY_LEVEL: (level: string) => `${API_BASE_URL}/api/reminder-templates/level/${level}`,
    DEFAULT: (type: string) => `${API_BASE_URL}/api/reminder-templates/default/${type}`,
    FOR_COURSE: (courseId: number, type: string) => `${API_BASE_URL}/api/reminder-templates/course/${courseId}/${type}`,
  },
};
