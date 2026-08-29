import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Shield,
  UserCheck,
  UserX,
  CheckCircle,
  Clock,
  Stethoscope,
  LogOut,
  RefreshCw,
  Search,
  Sun,
  Moon,
  FileText,
  AlertTriangle,
  Eye,
  X,
  Award,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Component as Background } from '@/components/ui/background-snippets';

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  licenseNo: string;
  speciality: string;
  hospital: string;
  verificationId: string;
  verified: boolean;
  verifiedAt: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  phone: string;
  address?: string;
  experienceYears?: number;
  rejectionReason?: string;
  qualifications?: Array<{ degree: string; institution: string; completionYear: string }>;
  certificates?: Array<{ type: string; fileName: string; size: number; dataUrl?: string }>;
  createdAt: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [search, setSearch] = useState('');
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('ayurcare-dark') === 'true';
  });

  useEffect(() => {
    const isAdmin = localStorage.getItem('ayurcare-admin');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ayurcare-dark', String(dark));
  }, [dark]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/doctors');
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId: string) => {
    setActionLoading(doctorId);
    try {
      const response = await api.patch(`/admin/doctors/${doctorId}/verify`);
      setDoctors(prev => prev.map(d => d.id === doctorId ? response.data.doctor : d));
      setSelectedDoctor(prev => prev?.id === doctorId ? response.data.doctor : prev);
    } catch (error) {
      console.error('Failed to verify doctor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (doctorId: string) => {
    const reason = window.prompt('Enter the reason this application cannot be verified:');
    if (!reason?.trim()) return;
    setActionLoading(doctorId);
    try {
      const response = await api.patch(`/admin/doctors/${doctorId}/reject`, { reason: reason.trim() });
      setDoctors(prev => prev.map(d => d.id === doctorId ? response.data.doctor : d));
      setSelectedDoctor(prev => prev?.id === doctorId ? response.data.doctor : prev);
    } catch (error) {
      console.error('Failed to reject doctor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ayurcare-admin');
    navigate('/admin-login');
  };

  const filteredDoctors = doctors.filter(d => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'pending' ? d.status === 'PENDING' : d.status === 'VERIFIED';
    const matchesSearch =
      !search ||
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNo.toLowerCase().includes(search.toLowerCase()) ||
      d.speciality.toLowerCase().includes(search.toLowerCase()) ||
      d.verificationId.toLowerCase().includes(search.toLowerCase()) ||
      d.qualifications?.some(q => q.degree.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = doctors.filter(d => d.status === 'PENDING').length;
  const verifiedCount = doctors.filter(d => d.status === 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Background />

      {/* Top Nav */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-gray-900 dark:text-white leading-tight">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AyurCare Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{doctors.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Doctors</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">New Registrations</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{verifiedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verified Doctors</p>
            </div>
          </div>
        </div>

        {/* New Registration Alert */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>{pendingCount} doctor{pendingCount > 1 ? 's' : ''}</strong> waiting for admin verification. Review their credentials to approve or reject.
            </p>
              <button
                onClick={() => setFilter('pending')}
                className="ml-auto text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
              >
                View New Doctors
              </button>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, license, or speciality..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'verified'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                 {f === 'all' ? 'All' : f === 'pending' ? `New (${pendingCount})` : `Verified (${verifiedCount})`}
              </button>
            ))}
            <button
              onClick={fetchDoctors}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doctor List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="spinner"></div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center py-16 text-gray-500 dark:text-gray-400">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">No doctors found</p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term' : filter !== 'all' ? 'No doctors match this filter' : 'No doctors registered yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDoctors.map(doc => (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        doc.status === 'VERIFIED'
                          ? 'bg-green-100 dark:bg-green-900/50'
                          : 'bg-amber-100 dark:bg-amber-900/50'
                      }`}
                    >
                      {doc.status === 'VERIFIED' ? (
                        <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{doc.fullName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{doc.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{doc.phone}</p>
                      {doc.address && <p className="text-sm text-gray-500 dark:text-gray-400">{doc.address}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                          <FileText className="w-3 h-3" />
                          {doc.licenseNo}
                        </span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full">
                          {doc.speciality}
                        </span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full">
                          {doc.hospital}
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
                          ID: {doc.verificationId}
                        </span>
                      </div>
                      {doc.verifiedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Verified on {new Date(doc.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                    >
                      <Eye className="w-4 h-4" /> Details
                    </button>
                    {doc.status === 'VERIFIED' ? (
                      <span className="flex items-center gap-1.5 text-sm bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </span>
                    ) : doc.status === 'REJECTED' ? (
                      <span className="flex items-center gap-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg font-medium">
                        <UserX className="w-4 h-4" /> Rejected
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleVerify(doc.id)}
                          disabled={actionLoading === doc.id}
                          className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          {actionLoading === doc.id ? 'Processing...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleReject(doc.id)}
                          disabled={actionLoading === doc.id}
                          className="flex items-center gap-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 font-medium transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-4">
          AyurCare Admin — Restricted Access
        </div>
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onClick={() => setSelectedDoctor(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between">
              <div><p className="text-xs font-medium text-red-600 uppercase tracking-wider">Doctor verification file</p><h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mt-1">{selectedDoctor.fullName}</h2></div>
              <button onClick={() => setSelectedDoctor(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 sm:p-7 space-y-7">
              <section className="grid sm:grid-cols-2 gap-4">
                {[
                  ['Email', selectedDoctor.email], ['Phone', selectedDoctor.phone],
                  ['Registration number', selectedDoctor.licenseNo], ['Speciality', selectedDoctor.speciality],
                  ['Hospital / clinic', selectedDoctor.hospital], ['Verification ID', selectedDoctor.verificationId]
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4"><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="font-medium text-gray-900 dark:text-white mt-1">{value}</p></div>)}
              </section>

              <section className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-red-500 mt-0.5" /><div><p className="text-sm text-gray-500">Address</p><p className="text-gray-900 dark:text-white">{selectedDoctor.address || 'Not provided'}</p></div></div>
                <div className="flex items-start gap-3"><Briefcase className="w-5 h-5 text-red-500 mt-0.5" /><div><p className="text-sm text-gray-500">Experience</p><p className="text-gray-900 dark:text-white">{selectedDoctor.experienceYears ?? 'Not provided'} years</p></div></div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Qualifications</h3>
                <div className="mt-3 space-y-2">
                  {selectedDoctor.qualifications?.length ? selectedDoctor.qualifications.map((qualification, index) => (
                    <div key={`${qualification.degree}-${index}`} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:justify-between gap-1"><div><p className="font-medium text-gray-900 dark:text-white">{qualification.degree}</p><p className="text-sm text-gray-500">{qualification.institution}</p></div><span className="text-sm text-gray-500">Completed {qualification.completionYear}</span></div>
                  )) : <p className="text-sm text-gray-500">No qualifications supplied.</p>}
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> Submitted certificates</h3>
                <div className="mt-3 space-y-2">
                  {selectedDoctor.certificates?.length ? selectedDoctor.certificates.map((certificate, index) => (
                    <div key={`${certificate.fileName}-${index}`} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-3"><div><p className="font-medium text-gray-900 dark:text-white">{certificate.fileName}</p><p className="text-sm text-gray-500">{certificate.type} · {Math.ceil(certificate.size / 1024)} KB</p></div>{certificate.dataUrl ? <a href={certificate.dataUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">View document</a> : <span className="text-xs text-gray-500">Demo record</span>}</div>
                  )) : <p className="text-sm text-gray-500">No certificates supplied.</p>}
                </div>
              </section>

              {selectedDoctor.rejectionReason && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"><p className="text-sm font-medium text-red-800 dark:text-red-300">Rejection reason</p><p className="text-sm text-red-700 dark:text-red-400 mt-1">{selectedDoctor.rejectionReason}</p></div>}

              {selectedDoctor.status === 'PENDING' && <div className="flex flex-col sm:flex-row gap-3"><button onClick={() => handleVerify(selectedDoctor.id)} disabled={actionLoading === selectedDoctor.id} className="flex-1 rounded-xl bg-green-600 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-50">Verify doctor</button><button onClick={() => handleReject(selectedDoctor.id)} disabled={actionLoading === selectedDoctor.id} className="flex-1 rounded-xl bg-red-100 py-3 text-red-700 font-semibold hover:bg-red-200 disabled:opacity-50">Reject application</button></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
