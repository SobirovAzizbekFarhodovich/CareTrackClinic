import crypto from 'crypto';

const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 32;
const HASH_DIGEST = 'sha256';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');

  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, storedPasswordHash) {
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
