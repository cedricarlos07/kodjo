import { SQLiteStorage } from './sqlite-storage';
import { userMethods } from './sqlite-storage-users';
import { courseMethods } from './sqlite-storage-courses';
import { reminderMethods } from './sqlite-storage-reminders';
import { settingsMethods } from './sqlite-storage-settings';

// Créer une instance de SQLiteStorage avec toutes les méthodes
class SQLiteStorageImpl extends SQLiteStorage {
  // Ajouter les méthodes des utilisateurs
  getUser = userMethods.getUser;
  getUserByUsername = userMethods.getUserByUsername;
  createUser = userMethods.createUser;
  getAllUsers = userMethods.getAllUsers;
  updateUser = userMethods.updateUser;
  updateUserLastLogin = userMethods.updateUserLastLogin;
  
  // Ajouter les méthodes des cours
  createCourse = courseMethods.createCourse;
  getCourse = courseMethods.getCourse;
  getCourseByName = courseMethods.getCourseByName;
  getAllCourses = courseMethods.getAllCourses;
  updateCourse = courseMethods.updateCourse;
  deleteCourse = courseMethods.deleteCourse;
  getUpcomingCourses = courseMethods.getUpcomingCourses;
  enrollUserInCourse = courseMethods.enrollUserInCourse;
  getEnrollmentsForCourse = courseMethods.getEnrollmentsForCourse;
  getEnrollmentsForUser = courseMethods.getEnrollmentsForUser;
  getCoursesForUser = courseMethods.getCoursesForUser;
  unenrollUserFromCourse = courseMethods.unenrollUserFromCourse;
  
  // Ajouter les méthodes des modèles de rappels
  createReminderTemplate = reminderMethods.createReminderTemplate;
  getReminderTemplate = reminderMethods.getReminderTemplate;
  getAllReminderTemplates = reminderMethods.getAllReminderTemplates;
  getReminderTemplatesByType = reminderMethods.getReminderTemplatesByType;
  getReminderTemplatesByLevel = reminderMethods.getReminderTemplatesByLevel;
  getDefaultReminderTemplate = reminderMethods.getDefaultReminderTemplate;
  getReminderTemplateForCourse = reminderMethods.getReminderTemplateForCourse;
  updateReminderTemplate = reminderMethods.updateReminderTemplate;
  deleteReminderTemplate = reminderMethods.deleteReminderTemplate;
  
  // Ajouter les méthodes des paramètres de l'application
  createAppSettings = settingsMethods.createAppSettings;
  getAppSettings = settingsMethods.getAppSettings;
  updateAppSettings = settingsMethods.updateAppSettings;
  
  // Ajouter les autres méthodes nécessaires...
  // (Vous pouvez ajouter d'autres méthodes ici)
}

// Exporter une instance de SQLiteStorageImpl
export const sqliteStorage = new SQLiteStorageImpl();
