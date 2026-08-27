import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.UPLOAD_MAX_MB || '10') * 1024 * 1024)
  }
});

async function extractDocumentData(filePath: string, mimeType: string): Promise<{
  text: string;
  structuredData: any;
  confidence: number;
}> {
  if (process.env.OCR_PROVIDER === 'mock' || !process.env.OCR_API_KEY) {
    return {
      text: `[Demo OCR Extraction] This is simulated extraction from ${path.basename(filePath)}.\n\nIn a production environment, this would contain the actual text extracted from the document using OCR technology.\n\nExtracted information would include:\n- Patient name\n- Medications\n- Diagnoses\n- Lab results\n- Doctor recommendations`,
      structuredData: {
        patientName: 'Extracted Patient Name',
        medications: ['Medication 1', 'Medication 2'],
        diagnoses: ['Condition 1'],
        labResults: [],
        doctor: 'Dr. Extracted',
        date: new Date().toISOString().split('T')[0]
      },
      confidence: 0.85
    };
  }

  return {
    text: 'OCR extraction not configured',
    structuredData: null,
    confidence: 0
  };
}

router.post('/upload', upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { patientId, encounterId } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const extraction = await extractDocumentData(req.file.path, req.file.mimetype);

    const document = await prisma.medicalDocument.create({
      data: {
        patientId,
        encounterId: encounterId || null,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        storagePath: req.file.path,
        extractionStatus: 'COMPLETED',
        extractedText: extraction.text,
        extractedStructuredData: JSON.stringify(extraction.structuredData)
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'MedicalDocument',
        entityId: document.id,
        metadata: JSON.stringify({ filename: req.file.originalname, size: req.file.size })
      }
    });

    res.status(201).json({
      document,
      extraction: {
        text: extraction.text,
        structuredData: extraction.structuredData,
        confidence: extraction.confidence
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.medicalDocument.findUnique({
      where: { id: req.params.id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.get('/patient/:patientId', async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.medicalDocument.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get patient documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;
