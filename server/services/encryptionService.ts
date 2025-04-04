import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Classe pour gérer le chiffrement et le déchiffrement des données sensibles
export class EncryptionService {
  private encryptionKey: string;
  private keyFilePath: string;

  constructor() {
    this.keyFilePath = path.join(process.cwd(), 'data', 'encryption_key.txt');
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  // Méthode pour obtenir ou créer une clé de chiffrement
  private getOrCreateEncryptionKey(): string {
    try {
      // Vérifier si le répertoire data existe
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Vérifier si le fichier de clé existe
      if (fs.existsSync(this.keyFilePath)) {
        // Lire la clé depuis le fichier
        return fs.readFileSync(this.keyFilePath, 'utf8').trim();
      } else {
        // Générer une nouvelle clé
        const newKey = crypto.randomBytes(32).toString('hex');
        // Sauvegarder la clé dans le fichier
        fs.writeFileSync(this.keyFilePath, newKey);
        return newKey;
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de la clé de chiffrement:', error);
      // Utiliser une clé par défaut en cas d'erreur (à éviter en production)
      return process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    }
  }

  // Méthode pour chiffrer une chaîne de caractères
  encrypt(text: string | null): string | null {
    if (!text) return null;
    try {
      return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error);
      return text; // Retourner le texte non chiffré en cas d'erreur
    }
  }

  // Méthode pour déchiffrer une chaîne de caractères
  decrypt(encryptedText: string | null): string | null {
    if (!encryptedText) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      return encryptedText; // Retourner le texte chiffré en cas d'erreur
    }
  }

  // Méthode pour masquer une chaîne de caractères (pour les réponses API)
  maskSensitiveData(text: string | null): string | null {
    if (!text) return null;
    if (text.length <= 8) {
      return '*'.repeat(text.length);
    }
    // Afficher les 4 premiers et les 4 derniers caractères, masquer le reste
    return text.substring(0, 4) + '*'.repeat(text.length - 8) + text.substring(text.length - 4);
  }

  // Méthode pour valider un token Telegram
  validateTelegramToken(token: string | null): boolean {
    if (!token) return false;
    // Format d'un token Telegram: <bot_id>:<token>
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenRegex.test(token);
  }

  // Méthode pour valider une API key Zoom
  validateZoomApiKey(apiKey: string | null): boolean {
    if (!apiKey) return false;
    // Les API keys Zoom sont généralement des chaînes alphanumériques
    const apiKeyRegex = /^[A-Za-z0-9_-]{10,}$/;
    return apiKeyRegex.test(apiKey);
  }

  // Méthode pour valider un API secret Zoom
  validateZoomApiSecret(apiSecret: string | null): boolean {
    if (!apiSecret) return false;
    // Les API secrets Zoom sont généralement des chaînes alphanumériques
    const apiSecretRegex = /^[A-Za-z0-9_-]{10,}$/;
    return apiSecretRegex.test(apiSecret);
  }
}

// Exporter une instance du service de chiffrement
export const encryptionService = new EncryptionService();
