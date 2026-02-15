import { WithdrawalStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { AuthRequest, requireAuth, requireRole } from '../../middleware/auth.js';

export const walletRouter = Router();

walletRouter.get('/me', requireAuth, requireRole('ORGANIZER'), async (req: AuthRequest, res) => {
  const organizer = await prisma.organizer.findUnique({
    where: { userId: req.auth!.userId },
    include: { wallet: { include: { transactions: { take: 50, orderBy: { createdAt: 'desc' } } } } }
  });
  res.json(organizer?.wallet);
});

walletRouter.post('/withdrawals', requireAuth, requireRole('ORGANIZER'), async (req: AuthRequest, res) => {
  const body = z.object({ amount: z.number().positive() }).parse(req.body);
  const organizer = await prisma.organizer.findUnique({ where: { userId: req.auth!.userId }, include: { wallet: true } });
  if (!organizer?.wallet) return res.status(404).json({ message: 'Wallet not found' });
  if (Number(organizer.wallet.balance) < body.amount) return res.status(400).json({ message: 'Insufficient balance' });

  const withdrawal = await prisma.withdrawal.create({
    data: { walletId: organizer.wallet.id, amount: body.amount, status: WithdrawalStatus.PENDING }
  });
  res.status(201).json(withdrawal);
});
