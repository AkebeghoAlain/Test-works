import { Prisma } from '@prisma/client';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { signAccessToken, signRefreshToken } from '../../utils/jwt.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  role: z.enum(['USER', 'ORGANIZER']).default('USER')
});

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const body = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        phone: body.phone,
        role: body.role
      }
    });

    if (body.role === 'ORGANIZER') {
      await prisma.organizer.create({
        data: { userId: user.id, businessName: `${body.fullName} Events` }
      });
    }

    return res.status(201).json({ id: user.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Email or phone already exists' });
    }
    throw error;
  }
});

authRouter.post('/login', async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.suspendedAt) return res.status(403).json({ message: 'Account suspended' });

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  return res.json({ accessToken, refreshToken, role: user.role, phoneVerified: Boolean(user.phoneVerifiedAt) });
});

authRouter.post('/phone/verify-otp', async (req, res) => {
  const body = z.object({ userId: z.string().uuid(), otp: z.string().length(6) }).parse(req.body);
  if (body.otp !== '123456') return res.status(400).json({ message: 'Invalid OTP' });

  await prisma.user.update({ where: { id: body.userId }, data: { phoneVerifiedAt: new Date() } });
  return res.json({ verified: true });
});
