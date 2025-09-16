import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { config } from '../config/environment';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

export function hashApiKey(apiKey: string): string {
  return bcrypt.hashSync(apiKey, config.BCRYPT_ROUNDS);
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export function generateUserId(): string {
  return randomUUID();
}
