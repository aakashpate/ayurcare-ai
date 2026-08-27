import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const createPatientSchema = z.object({
  fullName: z.string().min(1),
  age: z.number().int().min(0).max(150),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  consentGiven: z.boolean(),
  clinicId: z.string().optional()
});

const updatePatientSchema = createPatientSchema.partial();

async function generatePatientCode(): Promise<string> {
  const year = new Date().getFullYear();
  const lastPatient = await prisma.patient.findFirst({
    where: { patientCode: { startsWith: `AYU-${year}-` } },
    orderBy: { patientCode: 'desc' }
  });

  let nextNumber = 1;
  if (lastPatient) {
    const lastNumber = parseInt(lastPatient.patientCode.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `AYU-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { patientCode: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } }
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          encounters: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { chiefComplaint: true, status: true, createdAt: true }
          },
          followUps: {
            where: { status: 'SCHEDULED' },
            take: 1,
            select: { scheduledAt: true }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);

    res.json({
      patients,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        encounters: {
          orderBy: { createdAt: 'desc' },
          include: {
            biomedicalAssessment: true,
            ayurvedicAssessment: true,
            vitals: true,
            redFlags: true,
            prakritiAssessment: true
          }
        },
        documents: true,
        prakritiAssessments: true,
        followUps: {
          orderBy: { scheduledAt: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createPatientSchema.parse(req.body);
    const patientCode = await generatePatientCode();

    const patient = await prisma.patient.create({
      data: {
        ...data,
        patientCode,
        consentAt: data.consentGiven ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_PATIENT',
        entityType: 'Patient',
        entityId: patient.id,
        metadata: JSON.stringify({ patientCode })
      }
    });

    res.status(201).json({ patient });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updatePatientSchema.parse(req.body);

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_PATIENT',
        entityType: 'Patient',
        entityId: patient.id,
        metadata: JSON.stringify({ changes: Object.keys(data) })
      }
    });

    res.json({ patient });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

export default router;
