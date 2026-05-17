import db from '../database/data.js';
import { createToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const USER_ROLES = ['admin', 'clinician', 'receptionist'];

export async function register(req, res) {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const normalizedEmail = email && email.trim().toLowerCase();

    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    if (role && !USER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    const existingUser = await db.oneOrNone(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = await db.one(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'receptionist')::user_role)
       RETURNING id, first_name, last_name, email, role, is_active, created_at`,
      [firstName, lastName, normalizedEmail, hashPassword(password), role]
    );

    const token = createToken(user);

    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email && email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db.oneOrNone(
      `SELECT id, first_name, last_name, email, password_hash, role, is_active
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    delete user.password_hash;
    const token = createToken(user);

    return res.status(200).json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}
