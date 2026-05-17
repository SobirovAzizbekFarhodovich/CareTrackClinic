import db from '../database/data.js';
import { verifyToken } from '../utils/jwt.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const payload = verifyToken(authHeader.slice(7));
    const user = await db.oneOrNone(
      `SELECT id, first_name, last_name, email, role, is_active
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
}
