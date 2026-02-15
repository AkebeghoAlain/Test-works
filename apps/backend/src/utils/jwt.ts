import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (subject: string, role: string) =>
  jwt.sign({ role }, env.JWT_ACCESS_SECRET, { subject, expiresIn: env.JWT_ACCESS_TTL });

export const signRefreshToken = (subject: string) =>
  jwt.sign({}, env.JWT_REFRESH_SECRET, { subject, expiresIn: env.JWT_REFRESH_TTL });
