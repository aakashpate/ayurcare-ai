import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ExtractionResult {
  text: string;
  structuredData: any;
  confidence: number;
  isMock?: boolean;
}

export default function Documents() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setExtraction(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadedFile);
      formData.append('encounterId', encounterId || '');
      
      if (!patientId) {
        const encounterRes = await api.get(`/encounters/${encounterId}`);
        formData.append('patientId', encounterRes.data.encounter.patientId);
        setPatientId(encounterRes.data.encounter.patientId);
      } else {
        formData.append('patientId', patientId);
      }

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setExtraction(response.data.extraction);
      toast.success('Document uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload document');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmExtraction = () => {
    toast.success('Extraction confirmed!');
    navigate(`/review/${encounterId}`);
  };

  const handleLoadDemoDocument = async () => {
    setUploading(true);
    try {
      const response = await api.post('/documents/upload', {
        extraction: {
          text: '[DEMO] Previous prescription from Dr. Kumar:\n\nDiagnosis: Chronic tension headache\nMedications:\n1. Tab. Paracetamol 500mg - 1 tablet twice daily for 5 days\n2. Tab. Ibuprofen 400mg - 1 tablet after food for 3 days\n\nAdvice: Follow up after 1 week',
          structuredData: {
            doctor: 'Dr. Kumar',
            diagnosis: 'Chronic tension headache',
            medications: [
              { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
              { name: 'Ibuprofen', dosage: '400mg', frequency: 'After food', duration: '3 days' }
            ]
          },
          confidence: 0.92,
          isMock: true
        }
      });

      setExtraction(response.data.extraction);
      toast.success('Demo document loaded!');
    } catch (error) {
      toast.error('Failed to load demo document');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {t('documents.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload previous prescriptions, lab reports, or medical documents
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemoDocument}
          disabled={uploading}
          className="btn-secondary flex items-center text-sm"
        >
          <FileText className="w-4 h-4 mr-1" />
          Load Demo Document
        </button>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            uploadedFile 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploadedFile ? (
            <div className="space-y-2">
              <FileText className="mx-auto h-12 w-12 text-primary-500" />
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="font-medium text-gray-700">
                {t('documents.dragDrop')}
              </p>
              <p className="text-sm text-gray-500">
                {t('documents.supportedFormats')}
              </p>
            </div>
          )}
        </div>

        {uploadedFile && !extraction && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Extract
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Extraction Results */}
      {extraction && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-gray-900">
              {t('documents.extraction')}
            </h2>
            <div className="flex items-center gap-2">
              {extraction.isMock && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  DEMO OCR
                </span>
              )}
              <span className="text-sm text-gray-500 mr-2">
                {t('documents.confidence')}:
              </span>
              <span className={`font-medium ${
                extraction.confidence >= 0.8 ? 'text-green-600' :
                extraction.confidence >= 0.6 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {(extraction.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Extracted Text */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">
              {t('documents.extractedText')}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                {extraction.text}
              </pre>
            </div>
          </div>

          {/* Structured Data */}
          {extraction.structuredData && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">
                {t('documents.structuredData')}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-600">
                  {JSON.stringify(extraction.structuredData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Confidence Warning */}
          {(extraction.confidence < 0.8 || extraction.isMock) && (
            <div className={`border rounded-lg p-4 mb-4 ${
              extraction.isMock ? 'bg-amber-50 border-amber-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex">
                <AlertCircle className={`h-5 w-5 ${extraction.isMock ? 'text-amber-400' : 'text-yellow-400'}`} />
                <div className="ml-3">
                  {extraction.isMock ? (
                    <p className="text-sm text-amber-700">
                      This is a demo OCR extraction with simulated data. In production, actual text would be extracted from the document.
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-700">
                      The extraction confidence is below 80%. Please review the extracted information carefully.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => {
                setUploadedFile(null);
                setExtraction(null);
              }}
              className="btn-secondary"
            >
              {t('documents.reupload')}
            </button>
            <button
              onClick={handleConfirmExtraction}
              className="btn-primary flex items-center"
            >
              <Check className="w-4 h-4 mr-2" />
              {t('documents.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button 
          onClick={() => navigate(`/vitals/${encounterId}`)}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </button>
        <button 
          onClick={() => navigate(`/review/${encounterId}`)}
          className="btn-primary flex items-center"
        >
          {t('common.next')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
