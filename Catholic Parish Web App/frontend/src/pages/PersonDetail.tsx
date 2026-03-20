import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api, { peopleApi, sacramentsApi, certificatesApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { SACRAMENT_COLORS } from '../types';
import type { Person, SacramentRecord, SacramentType } from '../types';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [person, setPerson] = useState<Person | null>(null);
  const [sacramentTypes, setSacramentTypes] = useState<SacramentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSacramentModal, setShowSacramentModal] = useState(false);
  const [generatingCert, setGeneratingCert] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<Partial<SacramentRecord> & { sponsors: string }>();

  const load = async () => {
    try {
      const [personRes, typesRes] = await Promise.all([
        peopleApi.get(id!),
        sacramentsApi.types(),
      ]);
      setPerson(personRes.data);
      setSacramentTypes(typesRes.data);
    } catch { navigate('/people'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const onSacramentSubmit = async (data: Partial<SacramentRecord> & { sponsors: string }) => {
    setSaving(true);
    try {
      const sponsors = data.sponsors
        ? data.sponsors.split(',').map(s => s.trim()).filter(Boolean).map(s => ({ name: s, role: 'godparent' }))
        : [];
      await sacramentsApi.create({ ...data, personId: id, sponsors });
      reset();
      setShowSacramentModal(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const generateCertificate = async (sacrament: SacramentRecord) => {
    setGeneratingCert(sacrament.id);
    try {
      // Generate certificate record
      const res = await certificatesApi.generate({ personId: id, sacramentId: sacrament.id });
      const certId = res.data.id;

      // Fetch file with auth token and trigger browser download
      const fileRes = await api.get(`/certificates/${certId}/download`, { responseType: 'blob' });
      const contentType = fileRes.headers['content-type'] || 'application/pdf';
      const isPdf = contentType.includes('pdf');
      const blob = new Blob([fileRes.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${sacrament.code ?? 'sacrament'}_${person?.lastName ?? ''}.${isPdf ? 'pdf' : 'html'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setGeneratingCert(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-pulse">✝</div></div>;
  if (!person) return null;

  const completedSacraments = new Set((person.sacraments || []).filter(s => s.status === 'completed').map(s => s.sacrament_type_id ?? s.sacramentTypeId));

  return (
    <div>
      <PageHeader
        title={`${person.first_name ?? person.firstName} ${person.last_name ?? person.lastName}`}
        subtitle={person.family_name ?? person.familyName ? `${person.family_name ?? person.familyName} Family` : 'No family assigned'}
        actions={
          <div className="flex gap-3">
            {hasRole('parish_admin', 'sacramental_clerk', 'priest') && (
              <button onClick={() => setShowSacramentModal(true)} className="bg-gold-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gold-800">
                + Record Sacrament
              </button>
            )}
            <button onClick={() => navigate(-1)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">← Back</button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-serif text-base font-semibold text-navy-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Date of Birth', value: person.dob ? new Date(person.dob).toLocaleDateString() : '—' },
              { label: 'Gender', value: person.gender ?? '—' },
              { label: 'Baptismal Name', value: person.baptismal_name ?? person.baptismalName ?? '—' },
              { label: 'Maiden Name', value: person.maiden_name ?? person.maidenName ?? '—' },
              { label: 'Email', value: person.email ?? '—' },
              { label: 'Phone', value: person.phone ?? '—' },
            ].map(field => (
              <div key={field.label}>
                <p className="text-gray-500 text-xs">{field.label}</p>
                <p className="font-medium text-navy-800 capitalize">{field.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sacramental Timeline */}
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy-900 mb-4">Sacramental Journey</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {sacramentTypes.map(type => {
                const record = (person.sacraments || []).find(
                  s => (s.sacrament_type_id ?? s.sacramentTypeId) === type.id
                );
                const completed = record?.status === 'completed';

                return (
                  <div key={type.id} className="flex items-start gap-4 relative">
                    {/* Dot */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${completed ? 'bg-navy-800 border-navy-800 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                      <span className="text-lg">{completed ? '✓' : '○'}</span>
                    </div>

                    <div className={`flex-1 bg-white rounded-xl border p-4 ${completed ? 'border-navy-200' : 'border-gray-100 opacity-60'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${SACRAMENT_COLORS[type.code] || 'bg-gray-100 text-gray-600'}`}>
                            {type.name}
                          </span>
                          {completed && record ? (
                            <div className="text-sm text-gray-600 space-y-0.5">
                              {record.date && <p>📅 {new Date(record.date).toLocaleDateString()}</p>}
                              {record.place && <p>📍 {record.place}</p>}
                              {record.celebrant && <p>⛪ {record.celebrant}</p>}
                              {record.register_volume && <p>📖 Vol. {record.register_volume}, Pg. {record.register_page}</p>}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Not yet recorded</p>
                          )}
                        </div>
                        {completed && record && hasRole('parish_admin', 'sacramental_clerk', 'priest') && (
                          <button
                            onClick={() => generateCertificate(record as SacramentRecord)}
                            disabled={generatingCert === record.id}
                            className="text-xs bg-gold-600 text-white px-3 py-1.5 rounded-lg hover:bg-gold-700 disabled:opacity-50 flex-shrink-0 ml-4"
                          >
                            {generatingCert === record.id ? 'Generating…' : '📜 Certificate'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Record Sacrament Modal */}
      {showSacramentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">Record Sacrament</h3>
              <p className="text-sm text-gray-500 mt-1">For {person.first_name ?? person.firstName} {person.last_name ?? person.lastName}</p>
            </div>
            <form onSubmit={handleSubmit(onSacramentSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sacrament *</label>
                <select {...register('sacramentTypeId', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                  <option value="">Select sacrament</option>
                  {sacramentTypes.map(t => (
                    <option key={t.id} value={t.id} disabled={completedSacraments.has(t.id)}>
                      {t.name}{completedSacraments.has(t.id) ? ' (recorded)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input {...register('date')} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                    <option value="completed">Completed</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celebrant</label>
                <input {...register('celebrant')} placeholder="e.g. Fr. Thomas Aquino" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place / Church</label>
                <input {...register('place')} placeholder="e.g. St. Mary's Parish" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Register Volume</label>
                  <input {...register('registerVolume')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Register Page</label>
                  <input {...register('registerPage')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsors (comma-separated names)</label>
                <input {...register('sponsors')} placeholder="e.g. Juan Santos, Maria Reyes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...register('notes')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowSacramentModal(false); reset(); }} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-navy-800 text-white py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Record Sacrament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
