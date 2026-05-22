import crypto from 'crypto';
import db from '../database/data.js';
import { createToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const REGISTERABLE_USER_ROLES = ['admin', 'receptionist'];
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_MINUTES = 15;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function resetPasswordWithToken({ id, resetToken, password }) {
  const resetTokenHash = hashResetToken(resetToken);
  const user = await db.oneOrNone(
    `SELECT id
     FROM users
     WHERE id = $1
       AND password_reset_token_hash = $2
       AND password_reset_expires_at > NOW()
       AND is_active = TRUE`,
    [id, resetTokenHash]
  );

  if (!user) {
    return null;
  }

  await db.none(
    `UPDATE users
     SET password_hash = $2,
         password_reset_token_hash = NULL,
         password_reset_expires_at = NULL
     WHERE id = $1`,
    [user.id, hashPassword(password)]
  );

  return user;
}

export async function createUser(req, res) {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const normalizedEmail = email && email.trim().toLowerCase();

    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    if (role && !REGISTERABLE_USER_ROLES.includes(role)) {
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

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'User creation failed', error: error.message });
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

export async function updateProfile(req, res) {
  try {
    const { firstName, lastName, email } = req.body;
    const normalizedEmail = email && email.trim().toLowerCase();

    if (!firstName && !lastName && !normalizedEmail) {
      return res.status(400).json({ message: 'At least one profile field is required' });
    }

    if (normalizedEmail) {
      const existingUser = await db.oneOrNone(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [normalizedEmail, req.user.id]
      );

      if (existingUser) {
        return res.status(409).json({ message: 'Email is already in use' });
      }
    }

    const user = await db.one(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           email = COALESCE($4, email)
       WHERE id = $1
       RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at`,
      [req.user.id, firstName, lastName, normalizedEmail]
    );

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await db.oneOrNone(
      'SELECT id, password_hash FROM users WHERE id = $1 AND is_active = TRUE',
      [req.user.id]
    );

    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await db.none(
      `UPDATE users
       SET password_hash = $2,
           password_reset_token_hash = NULL,
           password_reset_expires_at = NULL
       WHERE id = $1`,
      [req.user.id, hashPassword(newPassword)]
    );

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Password change failed', error: error.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = email && email.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await db.oneOrNone(
      'SELECT id, email FROM users WHERE email = $1 AND is_active = TRUE',
      [normalizedEmail]
    );

    if (!user) {
      return res.status(200).json({ message: 'If this email exists, password reset instructions will be sent' });
    }

    const resetToken = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    await db.none(
      `UPDATE users
       SET password_reset_token_hash = $2,
           password_reset_expires_at = NOW() + ($3 || ' minutes')::INTERVAL
       WHERE id = $1`,
      [user.id, resetTokenHash, PASSWORD_RESET_TOKEN_MINUTES]
    );

    return res.status(200).json({
      message: 'Password reset token generated',
      id: user.id,
      resetToken,
      expiresInMinutes: PASSWORD_RESET_TOKEN_MINUTES,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Forgot password failed', error: error.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { id, password, resetToken } = req.body;

    if (!id || !password || !resetToken) {
      return res.status(400).json({ message: 'User id, password and reset token are required' });
    }

    const user = await resetPasswordWithToken({ id, resetToken, password });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
}

export async function deleteUser(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Admin cannot delete own account' });
    }

    const user = await db.oneOrNone(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'User delete failed', error: error.message });
  }
}
