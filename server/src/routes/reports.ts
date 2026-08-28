import { Router, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';

const router = Router();

router.get('/:encounterId/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.encounterId },
      include: {
        patient: true,
        biomedicalAssessment: true,
        ayurvedicAssessment: true,
        vitals: true,
        redFlags: true,
        prakritiAssessment: true,
        followUps: true
      }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ayurcare-${encounter.patient.patientCode}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('AyurCare AI', { align: 'center' });
    doc.fontSize(12).text('Clinical Documentation', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(10).fillColor('red').text('AI-generated information — physician review required', { align: 'center' });
    doc.fillColor('black');
    doc.moveDown();

    doc.fontSize(14).text('Patient Information');
    doc.fontSize(10);
    doc.text(`Name: ${encounter.patient.fullName}`);
    doc.text(`Patient ID: ${encounter.patient.patientCode}`);
    doc.text(`Age: ${encounter.patient.age} years`);
    doc.text(`Gender: ${encounter.patient.gender}`);
    doc.text(`Visit Date: ${encounter.createdAt.toLocaleDateString()}`);
    doc.text(`Visit Type: ${encounter.visitType}`);
    doc.moveDown();

    if (encounter.chiefComplaint) {
      doc.fontSize(14).text('Chief Complaint');
      doc.fontSize(10).text(encounter.chiefComplaint);
      if (encounter.duration) doc.text(`Duration: ${encounter.duration}`);
      if (encounter.severity) doc.text(`Severity: ${encounter.severity}/10`);
      doc.moveDown();
    }

    if (encounter.biomedicalAssessment) {
      doc.fontSize(14).text('Biomedical Assessment');
      doc.fontSize(10);
      const b = encounter.biomedicalAssessment;
      if (b.pastMedicalHistory) doc.text(`Past History: ${b.pastMedicalHistory}`);
      if (b.medications) doc.text(`Medications: ${b.medications}`);
      if (b.allergies) doc.text(`Allergies: ${b.allergies}`);
      if (b.familyHistory) doc.text(`Family History: ${b.familyHistory}`);
      if (b.examinationFindings) doc.text(`Examination: ${b.examinationFindings}`);
      doc.moveDown();
    }

    if (encounter.ayurvedicAssessment) {
      doc.fontSize(14).text('Ayurvedic Assessment');
      doc.fontSize(10);
      const a = encounter.ayurvedicAssessment;
      if (a.prakriti) doc.text(`Prakriti: ${a.prakriti}`);
      if (a.vikriti) doc.text(`Vikriti: ${a.vikriti}`);
      if (a.agni) doc.text(`Agni: ${a.agni}`);
      if (a.ahara) doc.text(`Ahara: ${a.ahara}`);
      if (a.nidra) doc.text(`Nidra: ${a.nidra}`);
      if (a.bowelPattern) doc.text(`Bowel Pattern: ${a.bowelPattern}`);
      doc.moveDown();
    }

    if (encounter.vitals) {
      doc.fontSize(14).text('Vital Signs');
      doc.fontSize(10);
      const v = encounter.vitals;
      if (v.systolicBP && v.diastolicBP) doc.text(`Blood Pressure: ${v.systolicBP}/${v.diastolicBP} mmHg`);
      if (v.pulse) doc.text(`Pulse: ${v.pulse} bpm`);
      if (v.temperature) doc.text(`Temperature: ${v.temperature}°C`);
      if (v.weight) doc.text(`Weight: ${v.weight} kg`);
      if (v.height) doc.text(`Height: ${v.height} cm`);
      if (v.spo2) doc.text(`SpO2: ${v.spo2}%`);
      doc.moveDown();
    }

    if (encounter.redFlags.length > 0) {
      doc.fontSize(14).text('Safety Flags');
      doc.fontSize(10);
      for (const flag of encounter.redFlags) {
        doc.text(`[${flag.level}] ${flag.reason}`);
      }
      doc.moveDown();
    }

    if (encounter.generatedSummary) {
      doc.fontSize(14).text('AI-Generated Summary');
      doc.fontSize(10).text(encounter.generatedSummary);
      doc.moveDown();
    }

    doc.fontSize(8).fillColor('gray');
    doc.text('Disclaimer: AyurCare AI assists with information collection and clinical documentation. It does not provide a final diagnosis or replace professional clinical judgment.', { align: 'center' });
    doc.moveDown();
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.get('/:encounterId/qr', async (req: AuthRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.encounterId },
      include: { patient: true }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    const QRCode = await import('qrcode');
    const qrData = JSON.stringify({
      patientId: encounter.patient.patientCode,
      encounterId: encounter.id,
      type: 'ayurcare_lookup'
    });

    const qrImage = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2
    });

    res.json({ qr: qrImage, data: qrData });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

export default router;
