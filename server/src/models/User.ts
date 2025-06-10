import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'waiter' | 'kitchen_staff';
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [user.username, user.email, hashedPassword, user.role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret as jwt.Secret,
      { expiresIn }
    );
  }
} 