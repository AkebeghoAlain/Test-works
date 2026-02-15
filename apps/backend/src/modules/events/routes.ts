import { EventStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { AuthRequest, requireAuth, requireRole } from '../../middleware/auth.js';

const categorySchema = z.object({
  name: z.string().min(2),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  maxPerUser: z.number().int().positive().default(3),
  saleStart: z.string().datetime(),
  saleEnd: z.string().datetime(),
  currency: z.string().default('XAF')
});

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  venueName: z.string().min(2),
  venueAddress: z.string().min(3),
  city: z.string().min(2),
  country: z.string().default('Cameroon'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  bannerImageUrl: z.string().url().optional(),
  capacity: z.number().int().positive(),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  categories: z.array(categorySchema).default([])
});

export const eventRouter = Router();

eventRouter.get('/', async (_req, res) => {
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
    data: {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      organizerId: organizer.id,
      ticketCategories: {
        create: body.categories.map((category) => ({
          ...category,
          saleStart: new Date(category.saleStart),
          saleEnd: new Date(category.saleEnd)
        }))
      }
    },
    include: { ticketCategories: true }
  });

  res.status(201).json(event);
});

eventRouter.patch('/:id', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req: AuthRequest, res) => {
  const body = eventSchema.partial().parse(req.body);
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (req.auth!.role !== 'ADMIN') {
    const organizer = await prisma.organizer.findUnique({ where: { userId: req.auth!.userId } });
    if (!organizer || organizer.id !== event.organizerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined
    }
  });

  return res.json(updated);
});

eventRouter.delete('/:id', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req: AuthRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (req.auth!.role !== 'ADMIN') {
    const organizer = await prisma.organizer.findUnique({ where: { userId: req.auth!.userId } });
    if (!organizer || organizer.id !== event.organizerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
