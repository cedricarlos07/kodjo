import { SQLiteStorage } from './sqlite-storage';
import { User, InsertUser } from '@shared/schema';
import bcrypt from 'bcrypt';

// Méthodes pour la gestion des utilisateurs
export const userMethods = {
  // Méthode pour obtenir un utilisateur par son ID
  async getUser(this: SQLiteStorage, id: number): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return user;
  },

  // Méthode pour obtenir un utilisateur par son nom d'utilisateur
  async getUserByUsername(this: SQLiteStorage, username: string): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    return user;
  },

  // Méthode pour créer un utilisateur
  async createUser(this: SQLiteStorage, insertUser: InsertUser): Promise<User> {
    // Hacher le mot de passe si ce n'est pas déjà fait
    let password = insertUser.password;
    if (!password.startsWith('$2b$')) {
      password = await bcrypt.hash(password, 10);
    }
    
    const result = this.db.prepare(`
      INSERT INTO users (username, password, fullName, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      insertUser.username,
      password,
      insertUser.fullName,
      insertUser.email,
      insertUser.role
    );
    
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      username: insertUser.username,
      password,
      fullName: insertUser.fullName,
      email: insertUser.email,
      role: insertUser.role,
      lastLogin: null,
      avatar: null
    };
  },

  // Méthode pour obtenir tous les utilisateurs
  async getAllUsers(this: SQLiteStorage): Promise<User[]> {
    return this.db.prepare('SELECT * FROM users').all() as User[];
  },

  // Méthode pour mettre à jour un utilisateur
  async updateUser(this: SQLiteStorage, id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // Si le mot de passe est fourni et n'est pas déjà haché, le hacher
    if (userData.password && !userData.password.startsWith('$2b$')) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    // Construire la requête de mise à jour dynamiquement
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return user;
    
    values.push(id);
    
    this.db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.getUser(id);
  },

  // Méthode pour mettre à jour la date de dernière connexion d'un utilisateur
  async updateUserLastLogin(this: SQLiteStorage, id: number): Promise<void> {
    this.db.prepare(`
      UPDATE users
      SET lastLogin = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);
  }
};
