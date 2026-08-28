import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { t } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Save, Zap } from 'lucide-react';

interface VitalsData {
  systolicBP?: number;
  diastolicBP?: number;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  spo2?: number;
}

export default function Vitals() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue } = useForm<VitalsData>();

  const onSubmit = async (data: VitalsData) => {
    setSaving(true);
    try {
      const cleanData: any = {};
      if (data.systolicBP) cleanData.systolicBP = parseFloat(data.systolicBP as any);
      if (data.diastolicBP) cleanData.diastolicBP = parseFloat(data.diastolicBP as any);
      if (data.pulse) cleanData.pulse = parseFloat(data.pulse as any);
      if (data.temperature) cleanData.temperature = parseFloat(data.temperature as any);
      if (data.weight) cleanData.weight = parseFloat(data.weight as any);
      if (data.height) cleanData.height = parseFloat(data.height as any);
      if (data.spo2) cleanData.spo2 = parseFloat(data.spo2 as any);

      await api.put(`/encounters/${encounterId}/vitals`, cleanData);
      toast.success('Vitals saved successfully!');
      navigate(`/documents/${encounterId}`);
    } catch (error) {
      toast.error('Failed to save vitals');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDemoVitals = () => {
    setValue('systolicBP', 130);
    setValue('diastolicBP', 85);
    setValue('pulse', 78);
    setValue('temperature', 37.0);
    setValue('weight', 72);
    setValue('height', 170);
    setValue('spo2', 97);
    toast.success('Demo vitals loaded!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {t('vitals.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the patient's vital signs and measurements
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemoVitals}
          className="btn-secondary flex items-center text-sm"
        >
          <Zap className="w-4 h-4 mr-1" />
          Load Demo Vitals
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
            Blood Pressure
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.systolic')} ({t('vitals.mmHg')})
              </label>
              <input
                type="number"
                {...register('systolicBP')}
                className="input-field mt-1"
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.diastolic')} ({t('vitals.mmHg')})
              </label>
              <input
                type="number"
                {...register('diastolicBP')}
                className="input-field mt-1"
                placeholder="80"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">
            Other Vitals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.pulse')} ({t('vitals.bpm')})
              </label>
              <input
                type="number"
                {...register('pulse')}
                className="input-field mt-1"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.temperature')} ({t('vitals.celsius')})
              </label>
              <input
                type="number"
                step="0.1"
                {...register('temperature')}
                className="input-field mt-1"
                placeholder="36.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.weight')} ({t('vitals.kg')})
              </label>
              <input
                type="number"
                step="0.1"
                {...register('weight')}
                className="input-field mt-1"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.height')} ({t('vitals.cm')})
              </label>
              <input
                type="number"
                {...register('height')}
                className="input-field mt-1"
                placeholder="170"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('vitals.spo2')} ({t('vitals.percent')})
              </label>
              <input
                type="number"
                {...register('spo2')}
                className="input-field mt-1"
                placeholder="98"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            type="button"
            onClick={() => navigate(`/interview/${encounterId}`)}
            className="btn-secondary flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center"
          >
            {saving ? (
              <div className="spinner mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('common.save')} & Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
}
