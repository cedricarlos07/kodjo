import nodemailer from 'nodemailer';
import { storage } from '../storage';

/**
 * Service pour l'envoi d'emails
 */
export class EmailService {
  private static instance: EmailService;
  private initialized: boolean = false;
  private transporter: nodemailer.Transporter | null = null;
  private defaultFrom: string = '';

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialise le service d'email avec les paramètres fournis
   */
  initialize(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    defaultFrom?: string;
  }): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
      });

      this.defaultFrom = config.defaultFrom || config.auth.user;
      this.initialized = true;
      console.log('Email service initialized');
    } catch (error) {
      console.error('Error initializing email service:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private checkInitialized(): void {
    if (!this.initialized || !this.transporter) {
      throw new Error('Email service not initialized');
    }
  }

  /**
   * Envoie un email
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<void> {
    this.checkInitialized();

    try {
      const { to, subject, text, html, from, attachments } = options;

      await this.transporter!.sendMail({
        from: from || this.defaultFrom,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        attachments,
      });

      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Envoie un rappel de cours par email
   */
  async sendCourseReminder(options: {
    courseId: number;
    to: string | string[];
    subject?: string;
    templateId?: number;
    variables?: Record<string, string>;
  }): Promise<void> {
    this.checkInitialized();

    try {
      const { courseId, to, subject, templateId, variables } = options;

      // Récupérer les informations du cours
      const course = await storage.getCourse(courseId);
      if (!course) {
        throw new Error(`Course with ID ${courseId} not found`);
      }

      // Récupérer le modèle de notification
      let template;
      if (templateId) {
        template = await storage.getNotificationTemplate(templateId);
      } else {
        // Utiliser un modèle par défaut pour les rappels de cours
        const templates = await storage.getNotificationTemplatesByType('course_reminder');
        template = templates.length > 0 ? templates[0] : null;
      }

      if (!template) {
        throw new Error('No template found for course reminder');
      }

      // Préparer les variables pour le modèle
      const defaultVariables = {
        courseName: course.name,
        courseDay: course.dayOfWeek,
        courseTime: course.time,
        courseLevel: course.level || '',
        courseInstructor: course.instructor || course.professorName || '',
        zoomLink: course.zoomLink || '',
        zoomId: course.zoomId || '',
      };

      // Fusionner les variables par défaut avec les variables personnalisées
      const mergedVariables = { ...defaultVariables, ...variables };

      // Remplacer les variables dans le contenu du modèle
      let content = template.content;
      Object.entries(mergedVariables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      });

      // Envoyer l'email
      await this.sendEmail({
        to,
        subject: subject || `Rappel de cours: ${course.name}`,
        html: content,
      });

      console.log(`Course reminder email sent for course ${course.name}`);
    } catch (error) {
      console.error('Error sending course reminder email:', error);
      throw error;
    }
  }

  /**
   * Envoie un rapport par email
   */
  async sendReport(options: {
    to: string | string[];
    subject: string;
    reportName: string;
    reportData: any;
    format?: 'pdf' | 'csv' | 'html';
    message?: string;
  }): Promise<void> {
    this.checkInitialized();

    try {
      const { to, subject, reportName, reportData, format = 'html', message } = options;

      let attachments = [];
      let html = message || `<p>Veuillez trouver ci-joint le rapport ${reportName}.</p>`;

      // Si le format est HTML, inclure le rapport dans le corps de l'email
      if (format === 'html') {
        html = `
          <h1>${reportName}</h1>
          <p>${message || ''}</p>
          <div>
            ${this.generateHtmlReport(reportData)}
          </div>
        `;
      } else {
        // Sinon, ajouter le rapport en pièce jointe
        const attachment = await this.generateReportAttachment(reportName, reportData, format);
        attachments.push(attachment);
      }

      // Envoyer l'email
      await this.sendEmail({
        to,
        subject,
        html,
        attachments,
      });

      console.log(`Report email sent: ${reportName}`);
    } catch (error) {
      console.error('Error sending report email:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport HTML à partir des données
   */
  private generateHtmlReport(data: any): string {
    try {
      // Si les données sont un tableau d'objets
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return '<p>Aucune donnée disponible</p>';
        }

        // Créer un tableau HTML
        const headers = Object.keys(data[0]);
        
        let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
        
        // En-têtes du tableau
        html += '<tr>';
        headers.forEach(header => {
          html += `<th style="background-color: #f2f2f2;">${header}</th>`;
        });
        html += '</tr>';
        
        // Lignes de données
        data.forEach(row => {
          html += '<tr>';
          headers.forEach(header => {
            html += `<td>${row[header] !== undefined && row[header] !== null ? row[header] : ''}</td>`;
          });
          html += '</tr>';
        });
        
        html += '</table>';
        return html;
      }
      
      // Si les données sont un objet
      if (typeof data === 'object' && data !== null) {
        let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
        
        // Lignes de données
        Object.entries(data).forEach(([key, value]) => {
          html += '<tr>';
          html += `<th style="background-color: #f2f2f2; text-align: left;">${key}</th>`;
          html += `<td>${value !== undefined && value !== null ? value : ''}</td>`;
          html += '</tr>';
        });
        
        html += '</table>';
        return html;
      }
      
      // Si les données sont une chaîne ou un autre type
      return `<p>${data}</p>`;
    } catch (error) {
      console.error('Error generating HTML report:', error);
      return '<p>Erreur lors de la génération du rapport</p>';
    }
  }

  /**
   * Génère une pièce jointe de rapport au format spécifié
   */
  private async generateReportAttachment(reportName: string, data: any, format: 'pdf' | 'csv'): Promise<any> {
    try {
      if (format === 'csv') {
        // Générer un CSV
        let csv = '';
        
        // Si les données sont un tableau d'objets
        if (Array.isArray(data) && data.length > 0) {
          // En-têtes
          const headers = Object.keys(data[0]);
          csv += headers.join(',') + '\\n';
          
          // Lignes de données
          data.forEach(row => {
            const values = headers.map(header => {
              const value = row[header] !== undefined && row[header] !== null ? row[header].toString() : '';
              // Échapper les virgules et les guillemets
              return `"${value.replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\\n';
          });
        } else if (typeof data === 'object' && data !== null) {
          // Si les données sont un objet
          Object.entries(data).forEach(([key, value]) => {
            csv += `"${key}","${value !== undefined && value !== null ? value.toString().replace(/"/g, '""') : ''}"\\n`;
          });
        }
        
        return {
          filename: `${reportName}.csv`,
          content: csv,
          contentType: 'text/csv',
        };
      } else if (format === 'pdf') {
        // Pour la génération de PDF, nous aurions besoin d'une bibliothèque comme PDFKit
        // Pour cet exemple, nous retournons simplement un message d'erreur
        return {
          filename: `${reportName}.txt`,
          content: 'La génération de PDF n\'est pas encore implémentée côté serveur.',
          contentType: 'text/plain',
        };
      }
      
      throw new Error(`Format non pris en charge: ${format}`);
    } catch (error) {
      console.error('Error generating report attachment:', error);
      throw error;
    }
  }
}

export const emailService = EmailService.getInstance();
