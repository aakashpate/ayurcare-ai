import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const createFollowUpSchema = z.object({
  patientId: z.string(),
  encounterId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  reason: z.string().optional()
});

const updateFollowUpSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED']).optional(),
  severity: z.number().int().min(1).max(10).optional(),
  symptoms: z.string().optional(),
  progressNotes: z.string().optional(),
  updatedTreatment: z.string().optional(),
  nextReviewAt: z.string().datetime().optional()
});

router.get('/due', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUps = await prisma.followUp.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: today
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true,
            phone: true,
            age: true,
            gender: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 50
    });

    res.json({ followUps });
  } catch (error) {
    console.error('Get due follow-ups error:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

router.get('/patient/:patientId', async (req: AuthRequest, res: Response) => {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json({ followUps });
  } catch (error) {
    console.error('Get patient follow-ups error:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createFollowUpSchema.parse(req.body);

    const followUp = await prisma.followUp.create({
      data,
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_FOLLOW_UP',
        entityType: 'FollowUp',
        entityId: followUp.id,
        metadata: JSON.stringify({ patientId: data.patientId, scheduledAt: data.scheduledAt })
      }
    });

    res.status(201).json({ followUp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create follow-up error:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateFollowUpSchema.parse(req.body);

    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data,
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_FOLLOW_UP',
        entityType: 'FollowUp',
        entityId: followUp.id,
        metadata: JSON.stringify({ changes: Object.keys(data) })
      }
    });

    res.json({ followUp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update follow-up error:', error);
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
});

export default router;
