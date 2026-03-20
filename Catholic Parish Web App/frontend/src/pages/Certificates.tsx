import { useEffect, useState } from 'react';
import { certificatesApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import type { CertificateRequest, CertificateTemplate } from '../types';

export default function Certificates() {
  const { hasRole } = useAuth();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'templates'>('requests');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [reqRes, tplRes] = await Promise.all([
        certificatesApi.getRequests(),
        certificatesApi.getTemplates(),
      ]);
      setRequests(reqRes.data);
      setTemplates(tplRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateRequest = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await certificatesApi.updateRequest(id, { status });
      load();
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    fulfilled: 'bg-green-100 text-green-700',
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="Certificates"
        subtitle="Manage certificate templates and requests"
      />

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests' ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Certificate Requests
            {pendingCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Templates
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : activeTab === 'requests' ? (
          requests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No certificate requests yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Person</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sacrament</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {hasRole('parish_admin', 'sacramental_clerk') && (
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 font-medium text-navy-800">{req.first_name ?? req.firstName} {req.last_name ?? req.lastName}</td>
                      <td className="px-6 py-4 text-gray-600">{req.sacrament_name ?? req.sacramentName}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{req.reason || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(req.createdAt ?? req.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                          {req.status}
                        </span>
                      </td>
                      {hasRole('parish_admin', 'sacramental_clerk') && (
                        <td className="px-6 py-4 text-right">
                          {req.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => updateRequest(req.id, 'approved')}
                                disabled={updatingId === req.id}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateRequest(req.id, 'rejected')}
                                disabled={updatingId === req.id}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <button
                              onClick={() => updateRequest(req.id, 'fulfilled')}
                              disabled={updatingId === req.id}
                              className="text-xs bg-navy-700 text-white px-2 py-1 rounded hover:bg-navy-800 disabled:opacity-50"
                            >
                              Mark Fulfilled
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Templates Tab */
          <div>
            {templates.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📄</p>
                <p>No certificate templates yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-navy-800">{t.name}</h4>
                      {t.is_default ?? t.isDefault ? (
                        <span className="bg-gold-100 text-gold-700 text-xs px-2 py-0.5 rounded-full">Default</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500">For: {t.sacrament_name ?? t.sacramentName}</p>
                    <p className="text-xs text-gray-400 mt-2 font-mono">Template ID: {t.id.slice(0, 8)}…</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-sm text-gray-500">
              Templates are managed in the Admin panel. Contact your administrator to add or modify templates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
