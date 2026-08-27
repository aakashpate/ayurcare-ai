import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface FollowUp {
  id: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    phone: string;
    age: number;
    gender: string;
  };
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        const response = await api.get('/follow-ups/due');
        setFollowUps(response.data.followUps);
      } catch (error) {
        console.error('Failed to fetch follow-ups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowUps();
  }, []);

  const handleUpdateStatus = async (followUpId: string, status: string) => {
    try {
      await api.patch(`/follow-ups/${followUpId}`, { status });
      setFollowUps(prev => 
        prev.map(fu => fu.id === followUpId ? { ...fu, status } : fu)
      );
      toast.success(`Follow-up ${status.toLowerCase()}!`);
    } catch (error) {
      toast.error('Failed to update follow-up');
      console.error(error);
    }
  };

  const filteredFollowUps = followUps.filter(fu => {
    if (filter === 'all') return true;
    return fu.status.toLowerCase() === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'MISSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (scheduledAt: string) => {
    return new Date(scheduledAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          {t('followUps.title')}
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({followUps.length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'scheduled' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Scheduled ({followUps.filter(fu => fu.status === 'SCHEDULED').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({followUps.filter(fu => fu.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="card">
        {filteredFollowUps.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No follow-ups</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No follow-ups scheduled yet' : `No ${filter} follow-ups`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFollowUps.map((followUp) => (
              <div 
                key={followUp.id}
                className={`p-4 rounded-lg border ${
                  isOverdue(followUp.scheduledAt) && followUp.status === 'SCHEDULED'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-medium">
                        {followUp.patient.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <Link 
                          to={`/patients/${followUp.patient.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600"
                        >
                          {followUp.patient.fullName}
                        </Link>
                        <span className="ml-2 text-sm text-gray-500">
                          ({followUp.patient.patientCode})
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(followUp.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {isOverdue(followUp.scheduledAt) && followUp.status === 'SCHEDULED' && (
                          <span className="ml-2 text-red-600 font-medium">Overdue</span>
                        )}
                      </div>
                      {followUp.notes && (
                        <p className="mt-2 text-sm text-gray-600">{followUp.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getStatusColor(followUp.status)}`}>
                      {followUp.status}
                    </span>
                    
                    {followUp.status === 'SCHEDULED' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateStatus(followUp.id, 'COMPLETED')}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(followUp.id, 'MISSED')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Mark as Missed"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
