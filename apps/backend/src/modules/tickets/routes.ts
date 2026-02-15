import { OrderStatus, PaymentMethod, TicketStatus } from '@prisma/client';
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AuthRequest, requireAuth, requireRole } from '../../middleware/auth.js';
import { signQrPayload } from '../../utils/qr.js';

export const ticketRouter = Router();

const orderSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(z.object({ categoryId: z.string().uuid(), quantity: z.number().int().min(1).max(3) })).min(1),
  paymentMethod: z.nativeEnum(PaymentMethod)
});

ticketRouter.post('/orders', requireAuth, async (req: AuthRequest, res) => {
  const body = orderSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: body.eventId } });
    if (!event || event.status !== 'PUBLISHED') throw new Error('Event unavailable');

    let total = 0;
    const processedItems: Array<{ categoryId: string; quantity: number; price: number }> = [];

    for (const item of body.items) {
      const category = await tx.ticketCategory.findUnique({ where: { id: item.categoryId } });
      if (!category || category.eventId !== body.eventId) throw new Error('Category not found');

      const now = new Date();
      if (now < category.saleStart || now > category.saleEnd) throw new Error('Sales not active for category');
      if (item.quantity > category.maxPerUser) throw new Error('Exceeded max per user');

      const priorPurchases = await tx.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          ticketCategoryId: item.categoryId,
          order: {
            userId: req.auth!.userId,
            status: { in: [OrderStatus.PAID, OrderStatus.PENDING] }
          }
        }
      });
      const alreadyBought = priorPurchases._sum.quantity ?? 0;
      if (alreadyBought + item.quantity > category.maxPerUser) throw new Error('Purchase limit reached for this category');

      if (category.soldCount + item.quantity > category.quantity) throw new Error('Sold out');
      total += Number(category.price) * item.quantity;
      processedItems.push({ categoryId: item.categoryId, quantity: item.quantity, price: Number(category.price) });

      await tx.ticketCategory.update({
        where: { id: item.categoryId },
        data: { soldCount: { increment: item.quantity } }
      });
    }

    const platformFee = (total * env.PLATFORM_FEE_PERCENT) / 100;
    const order = await tx.order.create({
      data: {
        userId: req.auth!.userId,
        eventId: body.eventId,
        totalAmount: total,
        platformFee,
        organizerEarnings: total - platformFee,
        status: OrderStatus.PENDING,
        items: {
          create: processedItems.map((i) => ({
            ticketCategoryId: i.categoryId,
            quantity: i.quantity,
            unitPrice: i.price,
            subtotal: i.price * i.quantity
          }))
        }
      }
    });

    await tx.payment.create({ data: { orderId: order.id, method: body.paymentMethod } });
    return order;
  });

  res.status(201).json(result);
});

ticketRouter.get('/my', requireAuth, async (req: AuthRequest, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { userId: req.auth!.userId },
    include: { event: true, ticketCategory: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tickets);
});

ticketRouter.post('/issue/:orderId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: true } });
  if (!order || order.status !== OrderStatus.PAID) return res.status(400).json({ message: 'Order not paid' });

  const existing = await prisma.ticket.count({ where: { orderId: order.id } });
  if (existing > 0) return res.json({ message: 'Already issued' });

  const rows: Array<Record<string, unknown>> = [];
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketUuid = uuid();
      const payload = `${ticketUuid}:${order.eventId}:${order.userId}`;
      rows.push({
        id: ticketUuid,
        orderId: order.id,
        ticketCategoryId: item.ticketCategoryId,
        eventId: order.eventId,
        userId: order.userId,
        ticketCode: `CT-${ticketUuid.slice(0, 8).toUpperCase()}`,
        qrPayload: payload,
        qrSignature: signQrPayload(payload, env.QR_HMAC_SECRET),
        status: TicketStatus.UNUSED
      });
    }
  }

  await prisma.ticket.createMany({ data: rows as never[] });
  res.status(201).json({ issued: rows.length });
});
