import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import encounterRoutes from './routes/encounters';
import documentRoutes from './routes/documents';
import followUpRoutes from './routes/followups';
import reportRoutes from './routes/reports';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.APP_URL ? process.env.APP_URL.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/encounters', authMiddleware, encounterRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/follow-ups', authMiddleware, followUpRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`AyurCare AI server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export { prisma };
