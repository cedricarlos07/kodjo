import { SQLiteStorage } from './sqlite-storage';
import { ReminderTemplate, InsertReminderTemplate } from '@shared/schema';

// Méthodes pour la gestion des modèles de rappels
export const reminderMethods = {
  // Méthode pour créer un modèle de rappel
  async createReminderTemplate(this: SQLiteStorage, template: InsertReminderTemplate): Promise<ReminderTemplate> {
    // Si ce modèle est défini comme par défaut, désactiver les autres modèles par défaut du même type
    if (template.isDefault) {
      this.db.prepare(`
        UPDATE reminder_templates
        SET isDefault = 0
        WHERE type = ? AND isDefault = 1
      `).run(template.type);
    }
    
    const now = new Date().toISOString();
    
    const result = this.db.prepare(`
      INSERT INTO reminder_templates (
        name, type, content, courseId, courseLevel,
        isDefault, sendEmail, sendTelegram, emailSubject,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.name,
      template.type,
      template.content,
      template.courseId || null,
      template.courseLevel || null,
      template.isDefault ? 1 : 0,
      template.sendEmail !== undefined ? (template.sendEmail ? 1 : 0) : 1,
      template.sendTelegram !== undefined ? (template.sendTelegram ? 1 : 0) : 1,
      template.emailSubject || null,
      now,
      null
    );
    
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      name: template.name,
      type: template.type,
      content: template.content,
      courseId: template.courseId || null,
      courseLevel: template.courseLevel || null,
      isDefault: template.isDefault !== undefined ? template.isDefault : false,
      sendEmail: template.sendEmail !== undefined ? template.sendEmail : true,
      sendTelegram: template.sendTelegram !== undefined ? template.sendTelegram : true,
      emailSubject: template.emailSubject || null,
      createdAt: new Date(now),
      updatedAt: null
    };
  },

  // Méthode pour obtenir un modèle de rappel par son ID
  async getReminderTemplate(this: SQLiteStorage, id: number): Promise<ReminderTemplate | undefined> {
    const template = this.db.prepare('SELECT * FROM reminder_templates WHERE id = ?').get(id) as any;
    
    if (!template) return undefined;
    
    return {
      ...template,
      isDefault: !!template.isDefault,
      sendEmail: !!template.sendEmail,
      sendTelegram: !!template.sendTelegram,
      createdAt: template.createdAt ? new Date(template.createdAt) : null,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : null
    };
  },

  // Méthode pour obtenir tous les modèles de rappels
  async getAllReminderTemplates(this: SQLiteStorage): Promise<ReminderTemplate[]> {
    const templates = this.db.prepare('SELECT * FROM reminder_templates').all() as any[];
    
    return templates.map(template => ({
      ...template,
      isDefault: !!template.isDefault,
      sendEmail: !!template.sendEmail,
      sendTelegram: !!template.sendTelegram,
      createdAt: template.createdAt ? new Date(template.createdAt) : null,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : null
    }));
  },

  // Méthode pour obtenir les modèles de rappels par type
  async getReminderTemplatesByType(this: SQLiteStorage, type: string): Promise<ReminderTemplate[]> {
    const templates = this.db.prepare('SELECT * FROM reminder_templates WHERE type = ?').all(type) as any[];
    
    return templates.map(template => ({
      ...template,
      isDefault: !!template.isDefault,
      sendEmail: !!template.sendEmail,
      sendTelegram: !!template.sendTelegram,
      createdAt: template.createdAt ? new Date(template.createdAt) : null,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : null
    }));
  },

  // Méthode pour obtenir les modèles de rappels par niveau
  async getReminderTemplatesByLevel(this: SQLiteStorage, level: string): Promise<ReminderTemplate[]> {
    const templates = this.db.prepare('SELECT * FROM reminder_templates WHERE courseLevel = ?').all(level) as any[];
    
    return templates.map(template => ({
      ...template,
      isDefault: !!template.isDefault,
      sendEmail: !!template.sendEmail,
      sendTelegram: !!template.sendTelegram,
      createdAt: template.createdAt ? new Date(template.createdAt) : null,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : null
    }));
  },

  // Méthode pour obtenir le modèle de rappel par défaut pour un type
  async getDefaultReminderTemplate(this: SQLiteStorage, type: string): Promise<ReminderTemplate | undefined> {
    const template = this.db.prepare('SELECT * FROM reminder_templates WHERE type = ? AND isDefault = 1').get(type) as any;
    
    if (!template) return undefined;
    
    return {
      ...template,
      isDefault: !!template.isDefault,
      sendEmail: !!template.sendEmail,
      sendTelegram: !!template.sendTelegram,
      createdAt: template.createdAt ? new Date(template.createdAt) : null,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : null
    };
  },

  // Méthode pour obtenir le modèle de rappel pour un cours
  async getReminderTemplateForCourse(this: SQLiteStorage, courseId: number, type: string): Promise<ReminderTemplate | undefined> {
    // Chercher d'abord un modèle spécifique pour ce cours
    const courseSpecificTemplate = this.db.prepare(`
      SELECT * FROM reminder_templates 
      WHERE courseId = ? AND type = ?
    `).get(courseId, type) as any;
    
    if (courseSpecificTemplate) {
      return {
        ...courseSpecificTemplate,
        isDefault: !!courseSpecificTemplate.isDefault,
        sendEmail: !!courseSpecificTemplate.sendEmail,
        sendTelegram: !!courseSpecificTemplate.sendTelegram,
        createdAt: courseSpecificTemplate.createdAt ? new Date(courseSpecificTemplate.createdAt) : null,
        updatedAt: courseSpecificTemplate.updatedAt ? new Date(courseSpecificTemplate.updatedAt) : null
      };
    }
    
    // Si aucun modèle spécifique n'est trouvé, chercher un modèle pour le niveau du cours
    const course = await this.getCourse(courseId);
    if (course && course.level) {
      const levelSpecificTemplate = this.db.prepare(`
        SELECT * FROM reminder_templates 
        WHERE courseLevel = ? AND type = ?
      `).get(course.level, type) as any;
      
      if (levelSpecificTemplate) {
        return {
          ...levelSpecificTemplate,
          isDefault: !!levelSpecificTemplate.isDefault,
          sendEmail: !!levelSpecificTemplate.sendEmail,
          sendTelegram: !!levelSpecificTemplate.sendTelegram,
          createdAt: levelSpecificTemplate.createdAt ? new Date(levelSpecificTemplate.createdAt) : null,
          updatedAt: levelSpecificTemplate.updatedAt ? new Date(levelSpecificTemplate.updatedAt) : null
        };
      }
    }
    
    // Si aucun modèle spécifique n'est trouvé, utiliser le modèle par défaut
    return this.getDefaultReminderTemplate(type);
  },

  // Méthode pour mettre à jour un modèle de rappel
  async updateReminderTemplate(this: SQLiteStorage, id: number, templateData: Partial<ReminderTemplate>): Promise<ReminderTemplate | undefined> {
    const template = await this.getReminderTemplate(id);
    if (!template) return undefined;
    
    // Si ce modèle est défini comme par défaut, désactiver les autres modèles par défaut du même type
    if (templateData.isDefault && templateData.isDefault !== false) {
      this.db.prepare(`
        UPDATE reminder_templates
        SET isDefault = 0
        WHERE type = ? AND isDefault = 1 AND id != ?
      `).run(template.type, id);
    }
    
    // Construire la requête de mise à jour dynamiquement
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(templateData)) {
      if (value !== undefined) {
        if (key === 'isDefault' || key === 'sendEmail' || key === 'sendTelegram') {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else if (key !== 'id' && key !== 'createdAt') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }
    
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    
    if (fields.length === 1) return template; // Seulement updatedAt
    
    values.push(id);
    
    this.db.prepare(`
      UPDATE reminder_templates
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.getReminderTemplate(id);
  },

  // Méthode pour supprimer un modèle de rappel
  async deleteReminderTemplate(this: SQLiteStorage, id: number): Promise<void> {
    this.db.prepare('DELETE FROM reminder_templates WHERE id = ?').run(id);
  }
};
