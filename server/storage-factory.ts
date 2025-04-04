import { IStorage } from './storage';
import { storage as memStorage } from './storage';
import { sqliteStorage } from './storage/index';

// Type de stockage
export type StorageType = 'memory' | 'sqlite';

// Classe factory pour le stockage
export class StorageFactory {
  private static instance: IStorage;
  private static storageType: StorageType = 'memory';

  // Méthode pour obtenir l'instance de stockage
  static getInstance(type?: StorageType): IStorage {
    if (type && type !== this.storageType) {
      this.storageType = type;
      this.instance = this.createStorage(type);
    }

    if (!this.instance) {
      this.instance = this.createStorage(this.storageType);
    }

    return this.instance;
  }

  // Méthode pour créer une instance de stockage
  private static createStorage(type: StorageType): IStorage {
    switch (type) {
      case 'sqlite':
        console.log('Using SQLite storage');
        return sqliteStorage;
      case 'memory':
      default:
        console.log('Using memory storage');
        return memStorage;
    }
  }

  // Méthode pour obtenir le type de stockage actuel
  static getStorageType(): StorageType {
    return this.storageType;
  }

  // Méthode pour définir le type de stockage
  static setStorageType(type: StorageType): void {
    this.storageType = type;
    this.instance = this.createStorage(type);
  }
}
