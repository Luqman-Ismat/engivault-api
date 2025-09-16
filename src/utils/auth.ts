import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/environment';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  return uuidv4().replace(/-/g, '');
}

export function hashApiKey(apiKey: string): string {
  return bcrypt.hashSync(apiKey, config.BCRYPT_ROUNDS);
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export function generateUserId(): string {
  return uuidv4();
}
