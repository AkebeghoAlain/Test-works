import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { adminRouter } from './modules/admin/routes.js';
import { analyticsRouter } from './modules/analytics/routes.js';
import { authRouter } from './modules/auth/routes.js';
import { eventRouter } from './modules/events/routes.js';
import { paymentRouter } from './modules/payments/routes.js';
import { scannerRouter } from './modules/scanner/routes.js';
import { ticketRouter } from './modules/tickets/routes.js';
import { walletRouter } from './modules/wallet/routes.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(422).json({ message: 'Validation failed', issues: error.flatten() });
  }
  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`Backend running on ${env.PORT}`);
});
