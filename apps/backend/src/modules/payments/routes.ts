import crypto from 'crypto';
import { OrderStatus, PaymentStatus, TicketStatus, WalletTransactionType } from '@prisma/client';
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { safeEqual, signQrPayload } from '../../utils/qr.js';

export const paymentRouter = Router();

paymentRouter.post('/webhook', async (req, res) => {
  const signature = String(req.headers['x-provider-signature'] ?? '');
  const raw = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', env.WEBHOOK_SECRET).update(raw).digest('hex');

  if (!safeEqual(signature, expected)) return res.status(401).json({ message: 'Invalid signature' });

  const body = z.object({ orderId: z.string().uuid(), status: z.enum(['SUCCESS', 'FAILED']), providerRef: z.string() }).parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: body.orderId }, include: { event: true, items: true } });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (body.status === 'FAILED') {
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: PaymentStatus.FAILED, webhookPayload: req.body } });
    await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED } });
    return res.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId: order.id },
      data: { status: PaymentStatus.SUCCESS, providerRef: body.providerRef, webhookPayload: req.body, confirmedAt: new Date() }
    });

    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } });

    const organizer = await tx.organizer.findUnique({ where: { id: order.event.organizerId }, include: { wallet: true } });
    const wallet = organizer?.wallet ?? (organizer ? await tx.wallet.create({ data: { organizerId: organizer.id } }) : null);

    if (wallet) {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: order.organizerEarnings } } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.CREDIT,
          amount: order.organizerEarnings,
          description: `Ticket sales credit ${order.id}`,
          reference: order.id
        }
      });
    }

    const existing = await tx.ticket.count({ where: { orderId: order.id } });
    if (!existing) {
      const tickets = order.items.flatMap((item) =>
        Array.from({ length: item.quantity }).map(() => {
          const ticketUuid = uuid();
          const payload = `${ticketUuid}:${order.eventId}:${order.userId}`;
          return {
            id: ticketUuid,
            orderId: order.id,
            ticketCategoryId: item.ticketCategoryId,
            eventId: order.eventId,
            userId: order.userId,
            ticketCode: `CT-${ticketUuid.slice(0, 8).toUpperCase()}`,
            qrPayload: payload,
            qrSignature: signQrPayload(payload, env.QR_HMAC_SECRET),
            status: TicketStatus.UNUSED
          };
        })
      );
      await tx.ticket.createMany({ data: tickets });
    }
  });

  res.json({ ok: true });
});
