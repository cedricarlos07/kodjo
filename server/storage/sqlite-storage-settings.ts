import { SQLiteStorage } from './sqlite-storage';
import { AppSettings, InsertAppSettings } from '@shared/schema';
import { encryptionService } from '../services/encryptionService';

// Méthodes pour la gestion des paramètres de l'application
export const settingsMethods = {
  // Méthode pour créer des paramètres d'application
  async createAppSettings(this: SQLiteStorage, settings: InsertAppSettings): Promise<AppSettings> {
    const now = new Date().toISOString();

    // Valider les tokens et API keys
    if (settings.telegramToken && !encryptionService.validateTelegramToken(settings.telegramToken)) {
      throw new Error('Invalid Telegram token format');
    }

    if (settings.zoomApiKey && !encryptionService.validateZoomApiKey(settings.zoomApiKey)) {
      throw new Error('Invalid Zoom API key format');
    }

    if (settings.zoomApiSecret && !encryptionService.validateZoomApiSecret(settings.zoomApiSecret)) {
      throw new Error('Invalid Zoom API secret format');
    }

    // Chiffrer les données sensibles
    const encryptedTelegramToken = encryptionService.encrypt(settings.telegramToken || null);
    const encryptedZoomApiKey = encryptionService.encrypt(settings.zoomApiKey || null);
    const encryptedZoomApiSecret = encryptionService.encrypt(settings.zoomApiSecret || null);
    const encryptedEmailPassword = encryptionService.encrypt(settings.emailPassword || null);

    const result = this.db.prepare(`
      INSERT INTO app_settings (
        telegramToken, telegramWebhookUrl, zoomApiKey, zoomApiSecret,
        simulationMode, testGroup, emailSmtpServer, emailUsername,
        emailPassword, emailFromAddress, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      encryptedTelegramToken,
      settings.telegramWebhookUrl || null,
      encryptedZoomApiKey,
      encryptedZoomApiSecret,
      settings.simulationMode ? 1 : 0,
      settings.testGroup || null,
      settings.emailSmtpServer || null,
      settings.emailUsername || null,
      encryptedEmailPassword,
      settings.emailFromAddress || null,
      now,
      null
    );

    const id = result.lastInsertRowid as number;

    // Retourner les données avec les valeurs masquées pour les données sensibles
    return {
      id,
      telegramToken: settings.telegramToken ? encryptionService.maskSensitiveData(settings.telegramToken) : null,
      telegramWebhookUrl: settings.telegramWebhookUrl || null,
      zoomApiKey: settings.zoomApiKey ? encryptionService.maskSensitiveData(settings.zoomApiKey) : null,
      zoomApiSecret: settings.zoomApiSecret ? encryptionService.maskSensitiveData(settings.zoomApiSecret) : null,
      simulationMode: settings.simulationMode !== undefined ? settings.simulationMode : true,
      testGroup: settings.testGroup || null,
      emailSmtpServer: settings.emailSmtpServer || null,
      emailUsername: settings.emailUsername || null,
      emailPassword: settings.emailPassword ? encryptionService.maskSensitiveData(settings.emailPassword) : null,
      emailFromAddress: settings.emailFromAddress || null,
      createdAt: new Date(now),
      updatedAt: null
    };
  },

  // Méthode pour obtenir les paramètres de l'application
  async getAppSettings(this: SQLiteStorage): Promise<AppSettings | undefined> {
    const settings = this.db.prepare('SELECT * FROM app_settings ORDER BY id DESC LIMIT 1').get() as any;

    if (!settings) return undefined;

    // Déchiffrer les données sensibles pour un usage interne
    const telegramToken = encryptionService.decrypt(settings.telegramToken);
    const zoomApiKey = encryptionService.decrypt(settings.zoomApiKey);
    const zoomApiSecret = encryptionService.decrypt(settings.zoomApiSecret);
    const emailPassword = encryptionService.decrypt(settings.emailPassword);

    // Stocker les valeurs déchiffrées dans un objet interne pour un usage par les services
    const internalSettings = {
      ...settings,
      telegramToken,
      zoomApiKey,
      zoomApiSecret,
      emailPassword,
      simulationMode: !!settings.simulationMode,
      createdAt: settings.createdAt ? new Date(settings.createdAt) : null,
      updatedAt: settings.updatedAt ? new Date(settings.updatedAt) : null
    };

    // Stocker les paramètres internes dans une propriété statique pour un accès facile par les services
    (this.constructor as any).internalSettings = internalSettings;

    // Retourner les données avec les valeurs masquées pour les données sensibles
    return {
      ...settings,
      telegramToken: telegramToken ? encryptionService.maskSensitiveData(telegramToken) : null,
      zoomApiKey: zoomApiKey ? encryptionService.maskSensitiveData(zoomApiKey) : null,
      zoomApiSecret: zoomApiSecret ? encryptionService.maskSensitiveData(zoomApiSecret) : null,
      emailPassword: emailPassword ? encryptionService.maskSensitiveData(emailPassword) : null,
      simulationMode: !!settings.simulationMode,
      createdAt: settings.createdAt ? new Date(settings.createdAt) : null,
      updatedAt: settings.updatedAt ? new Date(settings.updatedAt) : null
    };
  },

  // Méthode pour mettre à jour les paramètres de l'application
  async updateAppSettings(this: SQLiteStorage, id: number, settingsData: Partial<AppSettings>): Promise<AppSettings | undefined> {
    const settings = await this.getAppSettings();
    if (!settings || settings.id !== id) return undefined;

    // Valider les tokens et API keys
    if (settingsData.telegramToken && !encryptionService.validateTelegramToken(settingsData.telegramToken)) {
      throw new Error('Invalid Telegram token format');
    }

    if (settingsData.zoomApiKey && !encryptionService.validateZoomApiKey(settingsData.zoomApiKey)) {
      throw new Error('Invalid Zoom API key format');
    }

    if (settingsData.zoomApiSecret && !encryptionService.validateZoomApiSecret(settingsData.zoomApiSecret)) {
      throw new Error('Invalid Zoom API secret format');
    }

    // Construire la requête de mise à jour dynamiquement
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(settingsData)) {
      if (value !== undefined) {
        if (key === 'simulationMode') {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else if (key === 'telegramToken' || key === 'zoomApiKey' || key === 'zoomApiSecret' || key === 'emailPassword') {
          // Chiffrer les données sensibles
          fields.push(`${key} = ?`);
          values.push(encryptionService.encrypt(value as string));
        } else if (key !== 'id' && key !== 'createdAt') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    if (fields.length === 1) return settings; // Seulement updatedAt

    values.push(id);

    this.db.prepare(`
      UPDATE app_settings
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    return this.getAppSettings();
  }
};
