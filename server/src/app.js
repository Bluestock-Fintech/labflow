import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes.js';
import librariesRoutes from './modules/libraries/libraries.routes.js';
import facilitiesRoutes from './modules/facilities/facilities.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/libraries', librariesRoutes);
app.use('/api/v1/facilities', facilitiesRoutes);
app.use('/api/v1/public/libraries', publicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/customers', customersRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

app.use(errorHandler);

if (!process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`LabFlow API listening on :${port}`));
}

export default app;
