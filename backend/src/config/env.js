import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');

  for (const line of env.split('\n')) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export const config = {
  port: process.env.PORT || 3000,
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  jwtSecret: process.env.JWT_SECRET || 'development_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  db: process.env.DATABASE_URL || {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'care_track_clinic',
    user: process.env.PGUSER || 'azizbek',
    password: process.env.PGPASSWORD || '12345',
  },
};
