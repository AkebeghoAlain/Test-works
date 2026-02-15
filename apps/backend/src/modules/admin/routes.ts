import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.post('/organizers/:id/approve', async (req, res) => {
  await prisma.organizer.update({ where: { id: req.params.id }, data: { approvedAt: new Date() } });
  res.json({ approved: true });
});

adminRouter.get('/events', async (_, res) => res.json(await prisma.event.findMany()));
adminRouter.get('/transactions', async (_, res) => res.json(await prisma.payment.findMany()));

adminRouter.post('/users/:id/suspend', async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { suspendedAt: new Date() } });
  res.json({ suspended: true });
});

adminRouter.post('/refunds', async (req, res) => {
  const body = z.object({ orderId: z.string().uuid(), amount: z.number().positive(), reason: z.string().min(5) }).parse(req.body);
  const refund = await prisma.refund.create({ data: body });
  await prisma.order.update({ where: { id: body.orderId }, data: { status: 'REFUNDED' } });
  res.status(201).json(refund);
});
