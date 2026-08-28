import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { generateRedFlags } from '../services/redFlags';
import { generateClinicalSummary } from '../services/ai';

const router = Router();

const createEncounterSchema = z.object({
  patientId: z.string(),
  visitType: z.enum(['INITIAL', 'FOLLOW_UP']).optional(),
  chiefComplaint: z.string().optional(),
  duration: z.string().optional(),
  severity: z.number().int().min(1).max(10).optional(),
  language: z.string().optional()
});

const updateEncounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  duration: z.string().optional(),
  severity: z.number().int().min(1).max(10).optional(),
  language: z.string().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED']).optional()
});

const interviewResponseSchema = z.object({
  questionKey: z.string(),
  questionText: z.string(),
  response: z.string(),
  language: z.string().optional(),
  source: z.enum(['TEXT', 'VOICE', 'CLINICIAN']).optional()
});

const biomedicalSchema = z.object({
  symptoms: z.any().optional(),
  pastMedicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  familyHistory: z.string().optional(),
  examinationFindings: z.string().optional()
});

const ayurvedicSchema = z.object({
  prakriti: z.string().optional(),
  vikriti: z.string().optional(),
  doshaAssessment: z.any().optional(),
  agni: z.string().optional(),
  ahara: z.string().optional(),
  nidra: z.string().optional(),
  bowelPattern: z.string().optional(),
  additionalNotes: z.string().optional()
});

const vitalsSchema = z.object({
  systolicBP: z.number().optional(),
  diastolicBP: z.number().optional(),
  pulse: z.number().optional(),
  temperature: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  spo2: z.number().optional()
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        biomedicalAssessment: true,
        ayurvedicAssessment: true,
        vitals: true,
        interviewResponses: true,
        redFlags: true,
        documents: true,
        prakritiAssessment: true
      }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    res.json({ encounter });
  } catch (error) {
    console.error('Get encounter error:', error);
    res.status(500).json({ error: 'Failed to fetch encounter' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createEncounterSchema.parse(req.body);

    const encounter = await prisma.encounter.create({
      data: {
        ...data,
        clinicianId: req.user?.id
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_ENCOUNTER',
        entityType: 'Encounter',
        entityId: encounter.id,
        metadata: JSON.stringify({ patientId: data.patientId })
      }
    });

    res.status(201).json({ encounter });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create encounter error:', error);
    res.status(500).json({ error: 'Failed to create encounter' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateEncounterSchema.parse(req.body);

    const encounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data
    });

    res.json({ encounter });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update encounter error:', error);
    res.status(500).json({ error: 'Failed to update encounter' });
  }
});

router.post('/:id/responses', async (req: AuthRequest, res: Response) => {
  try {
    const response = interviewResponseSchema.parse(req.body);

    const interviewResponse = await prisma.interviewResponse.create({
      data: {
        encounterId: req.params.id,
        ...response
      }
    });

    res.status(201).json({ interviewResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Save response error:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

router.get('/:id/next-question', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id },
      include: { interviewResponses: true }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const { getNextQuestion } = await import('../services/questionEngine');
    const nextQuestion = getNextQuestion(
      encounter.chiefComplaint || '',
      encounter.interviewResponses.map(r => ({ key: r.questionKey, value: r.response })),
      encounter.language || 'en'
    );

    res.json({ question: nextQuestion });
  } catch (error) {
    console.error('Get next question error:', error);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

router.put('/:id/biomedical', async (req: AuthRequest, res: Response) => {
  try {
    const data = biomedicalSchema.parse(req.body);
    if (data.symptoms && typeof data.symptoms === 'object') {
      data.symptoms = JSON.stringify(data.symptoms);
    }

    const assessment = await prisma.biomedicalAssessment.upsert({
      where: { encounterId: req.params.id },
      update: data,
      create: {
        encounterId: req.params.id,
        ...data
      }
    });

    res.json({ assessment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Save biomedical error:', error);
    res.status(500).json({ error: 'Failed to save biomedical assessment' });
  }
});

router.put('/:id/ayurvedic', async (req: AuthRequest, res: Response) => {
  try {
    const data = ayurvedicSchema.parse(req.body);
    if (data.doshaAssessment && typeof data.doshaAssessment === 'object') {
      data.doshaAssessment = JSON.stringify(data.doshaAssessment);
    }

    const assessment = await prisma.ayurvedicAssessment.upsert({
      where: { encounterId: req.params.id },
      update: data,
      create: {
        encounterId: req.params.id,
        ...data
      }
    });

    res.json({ assessment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Save ayurvedic error:', error);
    res.status(500).json({ error: 'Failed to save ayurvedic assessment' });
  }
});

router.put('/:id/vitals', async (req: AuthRequest, res: Response) => {
  try {
    const data = vitalsSchema.parse(req.body);

    const vitals = await prisma.vital.upsert({
      where: { encounterId: req.params.id },
      update: data,
      create: {
        encounterId: req.params.id,
        ...data
      }
    });

    res.json({ vitals });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Save vitals error:', error);
    res.status(500).json({ error: 'Failed to save vitals' });
  }
});

router.post('/:id/generate-summary', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        biomedicalAssessment: true,
        ayurvedicAssessment: true,
        vitals: true,
        interviewResponses: true,
        redFlags: true,
        documents: true
      }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const summary = await generateClinicalSummary(encounter);

    const updatedEncounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data: { generatedSummary: summary }
    });

    res.json({ summary, encounter: updatedEncounter });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.patch('/:id/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { summary } = z.object({ summary: z.string() }).parse(req.body);

    const encounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data: { generatedSummary: summary }
    });

    res.json({ encounter });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update summary error:', error);
    res.status(500).json({ error: 'Failed to update summary' });
  }
});

router.post('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data: { summaryApproved: true, status: 'APPROVED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'APPROVE_SUMMARY',
        entityType: 'Encounter',
        entityId: encounter.id
      }
    });

    res.json({ encounter });
  } catch (error) {
    console.error('Approve encounter error:', error);
    res.status(500).json({ error: 'Failed to approve encounter' });
  }
});

router.get('/:id/red-flags', async (req: AuthRequest, res: Response) => {
  try {
    const redFlags = await prisma.redFlag.findMany({
      where: { encounterId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ redFlags });
  } catch (error) {
    console.error('Get red flags error:', error);
    res.status(500).json({ error: 'Failed to fetch red flags' });
  }
});

router.post('/:id/check-red-flags', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id },
      include: {
        biomedicalAssessment: true,
        ayurvedicAssessment: true,
        vitals: true,
        interviewResponses: true
      }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const flags = generateRedFlags(encounter);

    for (const flag of flags) {
      await prisma.redFlag.create({
        data: {
          encounterId: req.params.id,
          ...flag
        }
      });
    }

    res.json({ redFlags: flags });
  } catch (error) {
    console.error('Check red flags error:', error);
    res.status(500).json({ error: 'Failed to check red flags' });
  }
});

router.put('/:id/finalize', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'FINALIZE_ENCOUNTER',
        entityType: 'Encounter',
        entityId: encounter.id
      }
    });

    res.json({ encounter });
  } catch (error) {
    console.error('Finalize encounter error:', error);
    res.status(500).json({ error: 'Failed to finalize encounter' });
  }
});

export default router;
