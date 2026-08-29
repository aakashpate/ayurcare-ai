import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle, FileCheck, Plus, Stethoscope, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Qualification {
  degree: string;
  institution: string;
  completionYear: string;
}

export default function DoctorRegister() {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '', address: '',
    licenseNo: '', speciality: '', hospital: '', experienceYears: ''
  });
  const [qualifications, setQualifications] = useState<Qualification[]>([{ degree: '', institution: '', completionYear: '' }]);
  const [certificates, setCertificates] = useState<Array<{ type: string; fileName: string; size: number; dataUrl: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const updateQualification = (index: number, key: keyof Qualification, value: string) => {
    setQualifications(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const handleCertificates = async (files: File[]) => {
    if (files.length > 3) {
      toast.error('Upload up to three certificates.');
      return;
    }
    if (files.some(file => file.size > 750 * 1024)) {
      toast.error('Each demo certificate must be 750 KB or smaller.');
      return;
    }
    const uploaded = await Promise.all(files.map(file => new Promise<{ type: string; fileName: string; size: number; dataUrl: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ type: 'Professional certificate', fileName: file.name, size: file.size, dataUrl: String(reader.result) });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    setCertificates(uploaded);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 6) return toast.error('Password must contain at least 6 characters.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (certificates.length === 0) return toast.error('Upload at least one qualification or license certificate.');

    setLoading(true);
    try {
      const response = await api.post('/auth/doctor-register', {
        ...form,
        experienceYears: Number(form.experienceYears),
        qualifications,
        certificates
      });
      setVerificationId(response.data.verificationId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration could not be submitted.');
    } finally {
      setLoading(false);
    }
  };

  if (verificationId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/[0.06] p-9 text-center">
          <CheckCircle className="w-16 h-16 text-amber-400 mx-auto" />
          <h1 className="text-3xl font-serif font-bold mt-5">Application submitted</h1>
          <p className="text-slate-300 mt-3">An administrator will review your qualifications and certificates before your account can sign in.</p>
          <div className="mt-6 rounded-xl bg-black/20 p-4"><p className="text-xs text-slate-400">Verification ID</p><p className="font-mono text-lg mt-1">{verificationId}</p></div>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-400">Return to doctor sign in</Link>
        </div>
      </div>
    );
  }

  const inputClass = 'mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-6"><ArrowLeft className="w-4 h-4" /> Back to doctor sign in</Link>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-950 text-white p-8 sm:p-10">
            <div className="flex items-center gap-3 text-blue-300"><Stethoscope className="w-6 h-6" /><span className="font-medium">Practitioner onboarding</span></div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mt-4">Create a doctor account</h1>
            <p className="text-slate-300 mt-2">Provide your professional details and evidence for administrator verification.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-9">
            <section>
              <h2 className="font-semibold text-lg text-slate-900">Account credentials</h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <label className="text-sm text-slate-700">Email<input type="email" required value={form.email} onChange={e => updateForm('email', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Full name<input required value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Password<input type="password" required value={form.password} onChange={e => updateForm('password', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Confirm password<input type="password" required value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} className={inputClass} /></label>
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-lg text-slate-900">Basic professional information</h2>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <label className="text-sm text-slate-700">Phone<input required value={form.phone} onChange={e => updateForm('phone', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Medical registration number<input required value={form.licenseNo} onChange={e => updateForm('licenseNo', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Speciality<input required value={form.speciality} onChange={e => updateForm('speciality', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Hospital or clinic<input required value={form.hospital} onChange={e => updateForm('hospital', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Years of experience<input type="number" min="0" required value={form.experienceYears} onChange={e => updateForm('experienceYears', e.target.value)} className={inputClass} /></label>
                <label className="text-sm text-slate-700">Address<input required value={form.address} onChange={e => updateForm('address', e.target.value)} className={inputClass} /></label>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between"><h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2"><Award className="w-5 h-5 text-blue-600" /> Qualifications</h2><button type="button" onClick={() => setQualifications(prev => [...prev, { degree: '', institution: '', completionYear: '' }])} className="text-sm text-blue-600 flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
              <div className="space-y-3 mt-4">
                {qualifications.map((qualification, index) => (
                  <div key={index} className="grid sm:grid-cols-[1fr_1fr_140px_auto] gap-3 rounded-xl bg-slate-50 p-4">
                    <input required placeholder="Degree" value={qualification.degree} onChange={e => updateQualification(index, 'degree', e.target.value)} className={inputClass} />
                    <input required placeholder="Institution" value={qualification.institution} onChange={e => updateQualification(index, 'institution', e.target.value)} className={inputClass} />
                    <input required placeholder="Year" value={qualification.completionYear} onChange={e => updateQualification(index, 'completionYear', e.target.value)} className={inputClass} />
                    {qualifications.length > 1 && <button type="button" onClick={() => setQualifications(prev => prev.filter((_, i) => i !== index))} className="self-end p-3 text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2"><FileCheck className="w-5 h-5 text-blue-600" /> Verification certificates</h2>
              <label className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40">
                <Upload className="w-7 h-7 text-blue-500" /><span className="font-medium mt-2">Choose certificates</span><span className="text-xs text-slate-500 mt-1">PDF or image files, multiple files allowed</span>
                <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={e => handleCertificates(Array.from(e.target.files || []))} />
              </label>
              {certificates.map(file => <div key={file.fileName} className="mt-2 flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm"><span>{file.fileName}</span><span className="text-slate-500">{Math.ceil(file.size / 1024)} KB</span></div>)}
            </section>

            <button disabled={loading} className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Submitting...' : 'Submit for verification'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
