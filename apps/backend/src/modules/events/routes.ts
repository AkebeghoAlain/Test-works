import { EventStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { AuthRequest, requireAuth, requireRole } from '../../middleware/auth.js';

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  venueName: z.string(),
  venueAddress: z.string(),
  city: z.string(),
  country: z.string().default('Cameroon'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  bannerImageUrl: z.string().url().optional(),
  capacity: z.number().int().positive(),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT)
});

export const eventRouter = Router();

eventRouter.get('/', async (_, res) => {
  const events = await prisma.event.findMany({
    where: { status: EventStatus.PUBLISHED },
    include: { ticketCategories: true },
    orderBy: { startDate: 'asc' }
  });
  res.json(events);
});

eventRouter.post('/', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req: AuthRequest, res) => {
  const body = eventSchema.parse(req.body);
  const organizer = await prisma.organizer.findUnique({ where: { userId: req.auth!.userId } });
  if (!organizer) return res.status(404).json({ message: 'Organizer profile missing' });

  const event = await prisma.event.create({
    data: { ...body, startDate: new Date(body.startDate), endDate: new Date(body.endDate), organizerId: organizer.id }
  });
  res.status(201).json(event);
});

eventRouter.patch('/:id', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req: AuthRequest, res) => {
  const body = eventSchema.partial().parse(req.body);
  const event = await prisma.event.update({ where: { id: req.params.id }, data: body as never });
  res.json(event);
});

eventRouter.delete('/:id', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
