import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Report {
  summary: {
    total_families: string;
    total_people: string;
    total_sacraments: string;
    total_certificates: string;
    pending_requests: string;
  };
  sacramentsPerType: Array<{ name: string; count: string }>;
  recentCertificates: Array<{
    generated_at: string;
    first_name: string;
    last_name: string;
    sacrament_name: string;
    generated_by: string;
  }>;
  pendingFirstCommunionConfirmation: Array<{
    first_name: string;
    last_name: string;
    sacrament_name: string;
  }>;
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.reports().then(r => setReport(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const s = report?.summary;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.firstName}`}
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        actions={
          hasRole('parish_admin', 'sacramental_clerk') ? (
            <button
              onClick={() => navigate('/families')}
              className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-700"
            >
              + Add Family
            </button>
          ) : undefined
        }
      />

      <div className="p-8 space-y-8">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Families" value={s?.total_families ?? '—'} icon="👨‍👩‍👧‍👦" color="bg-blue-50" onClick={() => navigate('/families')} />
            <StatCard label="People" value={s?.total_people ?? '—'} icon="👤" color="bg-purple-50" onClick={() => navigate('/people')} />
            <StatCard label="Sacraments" value={s?.total_sacraments ?? '—'} icon="✝️" color="bg-yellow-50" onClick={() => navigate('/sacraments')} />
            <StatCard label="Certificates" value={s?.total_certificates ?? '—'} icon="📜" color="bg-green-50" onClick={() => navigate('/certificates')} />
            <StatCard label="Pending Requests" value={s?.pending_requests ?? '—'} icon="📋" color={parseInt(s?.pending_requests ?? '0') > 0 ? 'bg-red-50' : 'bg-gray-50'} onClick={() => navigate('/certificates')} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sacraments Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-serif text-lg font-semibold text-navy-900 mb-4">Sacraments by Type</h3>
            {report?.sacramentsPerType ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={report.sacramentsPerType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#334e68" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 bg-gray-50 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Recent Certificates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-serif text-lg font-semibold text-navy-900 mb-4">Recent Certificates</h3>
            {report?.recentCertificates?.length ? (
              <div className="space-y-3">
                {report.recentCertificates.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy-800">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-gray-500">{c.sacrament_name}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(c.generated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No certificates generated yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {hasRole('parish_admin', 'sacramental_clerk') && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-serif text-lg font-semibold text-navy-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Add Family', icon: '👨‍👩‍👧‍👦', to: '/families' },
                { label: 'Add Person', icon: '👤', to: '/people' },
                { label: 'Record Sacrament', icon: '✝️', to: '/sacraments' },
                { label: 'Generate Certificate', icon: '📜', to: '/certificates' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-navy-300 hover:bg-navy-50 transition-colors"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-xs font-medium text-navy-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Children pending sacraments */}
        {report?.pendingFirstCommunionConfirmation?.length ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-serif text-lg font-semibold text-amber-900 mb-3">⚠️ Children Pending Sacraments</h3>
            <div className="space-y-2">
              {report.pendingFirstCommunionConfirmation.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-amber-800">{p.first_name} {p.last_name}</span>
                  <span className="text-amber-600">{p.sacrament_name} pending</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
