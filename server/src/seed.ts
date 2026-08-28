import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const clinic = await prisma.clinic.upsert({
    where: { code: 'DEMO-001' },
    update: {},
    create: {
      name: 'AyurCare Demo Clinic',
      code: 'DEMO-001',
      address: '123 Wellness Street, New Delhi, India',
      phone: '+91-11-12345678'
    }
  });

  const adminPassword = await bcrypt.hash('demo123', 10);
  const doctorPassword = await bcrypt.hash('demo123', 10);
  const patientPassword = await bcrypt.hash('demo123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ayurcare.ai' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ayurcare.ai',
      passwordHash: adminPassword,
      role: 'ADMIN',
      clinicId: clinic.id
    }
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@ayurcare.ai' },
    update: {},
    create: {
      name: 'Dr. Priya Sharma',
      email: 'doctor@ayurcare.ai',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      clinicId: clinic.id
    }
  });

  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@ayurcare.ai' },
    update: {},
    create: {
      name: 'Rohan Sharma',
      email: 'patient@ayurcare.ai',
      passwordHash: patientPassword,
      role: 'PATIENT',
      clinicId: clinic.id
    }
  });

  const students = [];
  for (let i = 1; i <= 2; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student${i}@ayurcare.ai` },
      update: {},
      create: {
        name: `Student ${i}`,
        email: `student${i}@ayurcare.ai`,
        passwordHash: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
        clinicId: clinic.id
      }
    });
    students.push(student);
  }

  const demoPatients = [
    { fullName: 'Rohan Sharma', age: 45, gender: 'MALE', phone: '+91-9876543210', email: 'rohan@email.com' },
    { fullName: 'Priya Patel', age: 32, gender: 'FEMALE', phone: '+91-9876543211', email: 'priya@email.com' },
    { fullName: 'Amit Singh', age: 58, gender: 'MALE', phone: '+91-9876543212' },
    { fullName: 'Sunita Devi', age: 28, gender: 'FEMALE', phone: '+91-9876543213', email: 'sunita@email.com' },
    { fullName: 'Rajesh Kumar', age: 65, gender: 'MALE', phone: '+91-9876543214' },
    { fullName: 'Meena Gupta', age: 41, gender: 'FEMALE', phone: '+91-9876543215', email: 'meena@email.com' },
    { fullName: 'Vikram Reddy', age: 53, gender: 'MALE', phone: '+91-9876543216' },
    { fullName: 'Anita Joshi', age: 37, gender: 'FEMALE', phone: '+91-9876543217', email: 'anita@email.com' },
    { fullName: 'Suresh Nair', age: 71, gender: 'MALE', phone: '+91-9876543218' },
    { fullName: 'Kavita Malhotra', age: 29, gender: 'FEMALE', phone: '+91-9876543219', email: 'kavita@email.com' }
  ];

  const patients = [];
  for (let i = 0; i < demoPatients.length; i++) {
    const year = new Date().getFullYear();
    const patientCode = `AYU-${year}-${(i + 1).toString().padStart(4, '0')}`;
    
    const patient = await prisma.patient.upsert({
      where: { patientCode },
      update: {},
      create: {
        ...demoPatients[i],
        patientCode,
        consentGiven: true,
        consentAt: new Date(),
        clinicId: clinic.id
      }
    });
    patients.push(patient);
  }

  const chiefComplaints = [
    'Severe headache with nausea for 3 days',
    'Chronic lower back pain for 2 weeks',
    'Digestive issues - bloating and irregular bowel movements',
    'Joint pain in knees, worse in morning',
    'Recurring cough and cold for 1 week',
    'High blood pressure with dizziness',
    'General weakness and fatigue',
    'Skin rash with itching',
    'Difficulty sleeping for past month',
    'Abdominal pain after meals'
  ];

  const encounters = [];
  for (let i = 0; i < Math.min(patients.length, chiefComplaints.length); i++) {
    const existingEncounters = await prisma.encounter.findMany({
      where: { patientId: patients[i].id },
      take: 1
    });
    
    if (existingEncounters.length > 0) {
      encounters.push(existingEncounters[0]);
      continue;
    }
    
    const isFollowUp = i % 3 === 0;
    
    const encounter = await prisma.encounter.create({
      data: {
        patientId: patients[i].id,
        clinicianId: doctor.id,
        visitType: isFollowUp ? 'FOLLOW_UP' : 'INITIAL',
        chiefComplaint: chiefComplaints[i],
        duration: ['1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks', 'Chronic'][i % 5],
        severity: Math.floor(Math.random() * 5) + 5,
        language: 'en',
        status: i < 3 ? 'APPROVED' : i < 6 ? 'COMPLETED' : 'IN_PROGRESS'
      }
    });
    encounters.push(encounter);

    if (i < 6) {
      await prisma.biomedicalAssessment.create({
        data: {
          encounterId: encounter.id,
          pastMedicalHistory: ['None', 'Diabetes', 'Hypertension', 'None', 'Asthma', 'None'][i],
          allergies: ['None', 'Penicillin', 'None', 'None', 'Dust', 'None'][i],
          medications: ['None', 'Metformin', 'Amlodipine', 'None', 'Inhaler', 'None'][i],
          familyHistory: ['None', 'Diabetes - Father', 'Heart Disease - Mother', 'None', 'Asthma - Sister', 'None'][i]
        }
      });

      await prisma.ayurvedicAssessment.create({
        data: {
          encounterId: encounter.id,
          prakriti: ['Vata-Pitta', 'Kapha', 'Pitta', 'Vata', 'Kapha-Vata', 'Pitta'][i],
          vikriti: ['Vata aggravation', 'Kapha aggravation', 'Pitta aggravation', 'Vata aggravation', 'Kapha aggravation', 'Pitta aggravation'][i],
          agni: ['Variable', 'Weak', 'Strong', 'Variable', 'Weak', 'Variable'][i],
          ahara: ['Irregular meals', 'Heavy meals', 'Regular meals', 'Light meals', 'Irregular meals', 'Heavy meals'][i],
          nidra: ['Insomnia', 'Normal', 'Disturbed', 'Normal', 'Excessive sleep', 'Disturbed'][i],
          bowelPattern: ['Irregular', 'Constipation', 'Loose stools', 'Normal', 'Irregular', 'Normal'][i]
        }
      });

      await prisma.vital.create({
        data: {
          encounterId: encounter.id,
          systolicBP: Math.floor(Math.random() * 40) + 110,
          diastolicBP: Math.floor(Math.random() * 20) + 70,
          pulse: Math.floor(Math.random() * 30) + 65,
          temperature: Math.floor(Math.random() * 2) + 36.5,
          weight: Math.floor(Math.random() * 30) + 55,
          height: Math.floor(Math.random() * 30) + 155,
          spo2: Math.floor(Math.random() * 5) + 95
        }
      });

      if (i < 3) {
        await prisma.redFlag.create({
          data: {
            encounterId: encounter.id,
            level: i === 0 ? 'URGENT' : 'ATTENTION',
            code: i === 0 ? 'HIGH_SEVERITY' : 'MODERATE_SEVERITY',
            reason: i === 0 ? 'Patient reported high symptom severity (9/10)' : 'Patient reported moderate symptom severity (7/10)',
            sourceField: 'severity',
            sourceValue: String(i === 0 ? 9 : 7)
          }
        });
      }

      const interviewQuestions = [
        { key: 'symptom_location', text: 'Where exactly do you feel the discomfort?' },
        { key: 'symptom_duration', text: 'How long have you been experiencing this?' },
        { key: 'symptom_severity', text: 'On a scale of 1-10, how severe is the discomfort?' }
      ];

      for (const q of interviewQuestions) {
        await prisma.interviewResponse.create({
          data: {
            encounterId: encounter.id,
            questionKey: q.key,
            questionText: q.text,
            response: ['Head region', 'Lower back', 'Abdomen'][i] || 'General area',
            language: 'en',
            source: 'TEXT'
          }
        });
      }
    }

    if (i % 3 === 0) {
      await prisma.followUp.create({
        data: {
          patientId: patients[i].id,
          encounterId: encounter.id,
          scheduledAt: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
          status: 'SCHEDULED',
          progressNotes: 'Follow-up for progress check'
        }
      });
    }
  }

  const rohanPatient = patients[0];
  
  await prisma.prakritiAssessment.create({
    data: {
      patientId: rohanPatient.id,
      encounterId: encounters[0].id,
      responses: JSON.stringify({
        bodyBuild: 'medium',
        skinType: 'dry',
        hairType: 'dry',
        appetite: 'variable',
        digestion: 'variable',
        sleep: 'light',
        speech: 'fast',
        memory: 'quick',
        temperament: 'anxious'
      }),
      vataScore: 65,
      pittaScore: 25,
      kaphaScore: 10,
      calculatedResult: 'Vata',
      clinicianResult: 'Vata-Pitta'
    }
  });

  await prisma.medicalDocument.create({
    data: {
      patientId: rohanPatient.id,
      encounterId: encounters[0].id,
      filename: 'previous_prescription.jpg',
      mimeType: 'image/jpeg',
      storagePath: './uploads/demo-prescription.jpg',
      extractionStatus: 'COMPLETED',
      extractedText: '[Demo] Previous prescription from Dr. Kumar:\n\nDiagnosis: Chronic tension headache\nMedications:\n1. Tab. Paracetamol 500mg - 1 tablet twice daily for 5 days\n2. Tab. Ibuprofen 400mg - 1 tablet after food for 3 days\n\nAdvice: Follow up after 1 week',
      extractedStructuredData: JSON.stringify({
        doctor: 'Dr. Kumar',
        diagnosis: 'Chronic tension headache',
        medications: [
          { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
          { name: 'Ibuprofen', dosage: '400mg', frequency: 'After food', duration: '3 days' }
        ]
      })
    }
  });

  for (let i = 0; i < encounters.length; i++) {
    if (i < 3 && encounters[i].status !== 'IN_PROGRESS') {
      await prisma.encounter.update({
        where: { id: encounters[i].id },
        data: {
          generatedSummary: `AI-GENERATED CLINICAL SUMMARY\n\nPatient: ${patients[i].fullName}\nAge: ${patients[i].age}\nGender: ${patients[i].gender}\nChief Complaint: ${chiefComplaints[i]}\n\nThis is a demo summary for SIH 2026 presentation.`,
          summaryApproved: encounters[i].status === 'APPROVED'
        }
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log(`Created:
- 1 clinic
- 1 admin, 1 doctor, 1 patient user, 2 students
- ${patients.length} patients
- ${encounters.length} encounters
- Biomedical and Ayurvedic assessments
- Vitals for each encounter
- Red flags for urgent cases
- Interview responses
- Follow-ups
- Prakriti assessment
- Sample document
- Clinical summaries`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
