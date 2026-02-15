import crypto from 'crypto';
import { OrderStatus, PaymentStatus, WalletTransactionType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';

export const paymentRouter = Router();

paymentRouter.post('/webhook', async (req, res) => {
  const signature = req.headers['x-provider-signature'];
  const raw = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', env.WEBHOOK_SECRET).update(raw).digest('hex');

  if (signature !== expected) return res.status(401).json({ message: 'Invalid signature' });

  const body = z.object({ orderId: z.string().uuid(), status: z.enum(['SUCCESS', 'FAILED']), providerRef: z.string() }).parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: body.orderId }, include: { event: true } });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (body.status === 'SUCCESS') {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId: order.id },
        data: { status: PaymentStatus.SUCCESS, providerRef: body.providerRef, webhookPayload: req.body, confirmedAt: new Date() }
      });
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } });

      const organizer = await tx.organizer.findUnique({ where: { id: order.event.organizerId }, include: { wallet: true } });
      if (organizer?.wallet) {
        await tx.wallet.update({ where: { id: organizer.wallet.id }, data: { balance: { increment: order.organizerEarnings } } });
        await tx.walletTransaction.create({
          data: {
            walletId: organizer.wallet.id,
            type: WalletTransactionType.CREDIT,
            amount: order.organizerEarnings,
            description: `Ticket sales credit ${order.id}`,
            reference: order.id
          }
        });
      }
    });
  }

  res.json({ ok: true });
});
