import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { AuthRequest, requireAuth, requireRole } from '../../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.get('/organizer', requireAuth, requireRole('ORGANIZER'), async (req: AuthRequest, res) => {
  const organizer = await prisma.organizer.findUnique({ where: { userId: req.auth!.userId } });
  if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

  const events = await prisma.event.findMany({
    where: { organizerId: organizer.id },
    include: { orders: true, ticketCategories: true }
  });

  const totalRevenue = events.flatMap((e) => e.orders).reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const sold = events.flatMap((e) => e.ticketCategories).reduce((acc, c) => acc + c.soldCount, 0);
  const capacity = events.flatMap((e) => e.ticketCategories).reduce((acc, c) => acc + c.quantity, 0);

  res.json({
    totalRevenue,
    ticketsSold: sold,
    ticketsRemaining: capacity - sold,
    categoryBreakdown: events.flatMap((e) => e.ticketCategories)
  });
});
