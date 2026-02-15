import { TicketStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AuthRequest, requireAuth, requireRole } from '../../middleware/auth.js';
import { scanRateLimiter } from '../../middleware/rateLimit.js';
import { safeEqual, signQrPayload } from '../../utils/qr.js';

export const scannerRouter = Router();

scannerRouter.post('/verify', requireAuth, requireRole('ORGANIZER', 'ADMIN'), scanRateLimiter, async (req: AuthRequest, res) => {
  const body = z.object({ ticketCode: z.string(), qrPayload: z.string(), qrSignature: z.string() }).parse(req.body);

  const ticket = await prisma.ticket.findUnique({ where: { ticketCode: body.ticketCode } });
  if (!ticket) return res.status(404).json({ code: 'INVALID', color: 'red', message: 'Invalid Ticket' });

  const expected = signQrPayload(body.qrPayload, env.QR_HMAC_SECRET);
  if (!safeEqual(expected, body.qrSignature) || !safeEqual(ticket.qrSignature, body.qrSignature)) {
    return res.status(400).json({ code: 'INVALID', color: 'red', message: 'Invalid Ticket' });
  }

  if (ticket.status === TicketStatus.USED) {
    return res.status(200).json({ code: 'USED', color: 'orange', message: 'Already Used', ticket });
  }

  if (ticket.status !== TicketStatus.UNUSED) {
    return res.status(400).json({ code: 'INVALID', color: 'red', message: 'Invalid Ticket' });
  }

  const updated = await prisma.ticket.update({ where: { id: ticket.id }, data: { status: TicketStatus.USED, usedAt: new Date() } });
  await prisma.ticketScan.create({
    data: {
      ticketId: ticket.id,
      scannedByUserId: req.auth!.userId,
      isValid: true,
      responseCode: 'VALID'
    }
  });

  return res.json({ code: 'VALID', color: 'green', message: 'Valid Ticket', ticket: updated });
});
