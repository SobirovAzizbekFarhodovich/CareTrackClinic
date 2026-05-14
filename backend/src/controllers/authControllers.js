import crypto from 'crypto';
import db from '../database/data.js';

const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';
const USER_ROLES = ['admin', 'clinician', 'receptionist'];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');

  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedPasswordHash) {
  const [algorithm, iterations, salt, hash] = storedPasswordHash.split('$');

  if (algorithm !== 'pbkdf2' || !iterations || !salt || !hash) {
    return false;
  }

  const passwordHash = crypto
    .pbkdf2Sync(password, salt, Number(iterations), HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');
  const storedHashBuffer = Buffer.from(hash, 'hex');
  const passwordHashBuffer = Buffer.from(passwordHash, 'hex');

  if (storedHashBuffer.length !== passwordHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedHashBuffer, passwordHashBuffer);
}

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
       VALUES ($1, $2, $3, $4, COALESCE($5::user_role, 'receptionist'::user_role))
       RETURNING id, first_name, last_name, email, role, is_active, created_at`,
      [firstName, lastName, normalizedEmail, hashPassword(password), role]
    );

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Registration failed:', error);
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

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}
