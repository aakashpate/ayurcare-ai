import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { t } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  FileText, 
  ClipboardList, 
  Upload, 
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const registrationSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  age: z.number().min(1, 'Age must be at least 1').max(150, 'Invalid age'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  consentGiven: z.boolean().refine((val) => val === true, 'Consent is required')
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function NewCase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [encounterId, setEncounterId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      gender: 'MALE',
      consentGiven: false
    }
  });

  const consentGiven = watch('consentGiven');

  const steps = [
    { id: 1, name: t('intake.step1'), icon: User },
    { id: 2, name: t('intake.step2'), icon: ClipboardList },
    { id: 3, name: t('intake.step3'), icon: FileText },
    { id: 4, name: t('intake.step4'), icon: Upload },
    { id: 5, name: t('intake.step5'), icon: CheckCircle },
  ];

  const onSubmitRegistration = async (data: RegistrationData) => {
    try {
      const response = await api.post('/patients', {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
        emergencyContact: data.emergencyContact || undefined
      });
      
      const newPatientId = response.data.patient.id;
      
      const encounterResponse = await api.post('/encounters', {
        patientId: newPatientId,
        visitType: 'INITIAL',
        doctorId: user?.id
      });
      
      setEncounterId(encounterResponse.data.encounter.id);
      toast.success('Patient registered successfully!');
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register patient');
      console.error(error);
    }
  };

  const handleLoadDemo = async () => {
    try {
      const response = await api.post('/patients', {
        fullName: 'Rohan Sharma',
        age: 45,
        gender: 'MALE',
        phone: '9876543210',
        email: 'rohan@email.com',
        address: '123 Wellness Street, New Delhi',
        emergencyContact: '9876543211',
        consentGiven: true
      });
      
      const newPatientId = response.data.patient.id;
      
      const encounterResponse = await api.post('/encounters', {
        patientId: newPatientId,
        visitType: 'INITIAL',
        doctorId: user?.id,
        chiefComplaint: 'Stomach pain and bloating',
        duration: '3 days',
        severity: 7,
        language: 'en'
      });
      
      setEncounterId(encounterResponse.data.encounter.id);
      toast.success('Demo patient loaded!');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to load demo patient');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          {t('intake.title')}
        </h1>
        <button
          onClick={handleLoadDemo}
          className="btn-secondary"
        >
          {t('demo.loadDemo')}
        </button>
      </div>

      {/* Progress Steps */}
      <div className="card">
        <nav className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep > step.id ? 'bg-primary-600 text-white' :
                currentStep === step.id ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${
                currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <div className="card">
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
              {t('intake.step1')}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmitRegistration)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.fullName')} *
                  </label>
                  <input
                    {...register('fullName')}
                    className="input-field mt-1"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.age')} *
                  </label>
                  <input
                    type="number"
                    {...register('age', { valueAsNumber: true })}
                    className="input-field mt-1"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.gender')} *
                  </label>
                  <select {...register('gender')} className="input-field mt-1">
                    <option value="MALE">{t('intake.male')}</option>
                    <option value="FEMALE">{t('intake.female')}</option>
                    <option value="OTHER">{t('intake.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.phone')} *
                  </label>
                  <input
                    {...register('phone')}
                    className="input-field mt-1"
                    placeholder="+91-XXXXXXXXXX"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.email')}
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.emergencyContact')}
                  </label>
                  <input
                    {...register('emergencyContact')}
                    className="input-field mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intake.address')}
                  </label>
                  <textarea
                    {...register('address')}
                    className="input-field mt-1"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  {...register('consentGiven')}
                  id="consent"
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <label htmlFor="consent" className="ml-2 text-sm text-gray-600">
                  {t('intake.consent')}
                </label>
              </div>
              {errors.consentGiven && (
                <p className="text-sm text-red-600">{errors.consentGiven.message}</p>
              )}

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="btn-primary flex items-center"
                  disabled={!consentGiven}
                >
                  {t('common.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 2 && encounterId && (
          <div>
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
              {t('intake.step2')}
            </h2>
            <p className="text-gray-600 mb-4">
              Continue with the adaptive interview to gather clinical information.
            </p>
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentStep(1)}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </button>
              <button 
                onClick={() => navigate(`/interview/${encounterId}`)}
                className="btn-primary flex items-center"
              >
                Start Interview
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
              {t('intake.step3')}
            </h2>
            <p className="text-gray-600 mb-4">
              Record vital signs and examination findings.
            </p>
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentStep(2)}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </button>
              <button 
                onClick={() => navigate(`/vitals/${encounterId}`)}
                className="btn-primary flex items-center"
              >
                Enter Vitals
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
              {t('intake.step4')}
            </h2>
            <p className="text-gray-600 mb-4">
              Upload previous prescriptions or medical documents.
            </p>
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentStep(3)}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </button>
              <button 
                onClick={() => navigate(`/documents/${encounterId}`)}
                className="btn-primary flex items-center"
              >
                Upload Documents
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
              {t('intake.step5')}
            </h2>
            <p className="text-gray-600 mb-4">
              Review the complete case before finalizing.
            </p>
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentStep(4)}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </button>
              <button 
                onClick={() => navigate(`/review/${encounterId}`)}
                className="btn-primary flex items-center"
              >
                Review Case
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
