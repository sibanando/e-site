import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { peopleApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import type { Person } from '../types';

type PersonFormData = Omit<Person, 'id' | 'families' | 'sacraments'>;

export default function People() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PersonFormData>({ defaultValues: { status: 'active' } });
  const editForm = useForm<PersonFormData>({ defaultValues: { status: 'active' } });

  const load = async (q = '') => {
    setLoading(true);
    try {
      const r = await peopleApi.list({ search: q || undefined, limit: 50 });
      setPeople(r.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Pre-fill edit form when editPerson changes
  useEffect(() => {
    if (editPerson) {
      editForm.reset({
        firstName: editPerson.first_name ?? editPerson.firstName,
        middleName: editPerson.middle_name ?? editPerson.middleName,
        lastName: editPerson.last_name ?? editPerson.lastName,
        maidenName: editPerson.maiden_name ?? editPerson.maidenName,
        baptismalName: editPerson.baptismal_name ?? editPerson.baptismalName,
        dob: editPerson.dob ? editPerson.dob.slice(0, 10) : '',
        gender: editPerson.gender,
        email: editPerson.email,
        phone: editPerson.phone,
        status: editPerson.status,
      });
    }
  }, [editPerson]);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); load(search); };

  const onSubmit = async (data: unknown) => {
    setSaving(true);
    try {
      await peopleApi.create(data);
      reset();
      setShowModal(false);
      load(search);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const onEditSubmit = async (data: unknown) => {
    if (!editPerson) return;
    setSaving(true);
    try {
      await peopleApi.update(editPerson.id, data);
      setEditPerson(null);
      load(search);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await peopleApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load(search);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const canEdit = hasRole('parish_admin', 'sacramental_clerk');

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="Search and manage individual parishioners"
        actions={
          canEdit ? (
            <button onClick={() => setShowModal(true)} className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-700">
              + New Person
            </button>
          ) : undefined
        }
      />

      <div className="p-8">
        <form onSubmit={onSearch} className="flex gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, baptismal name, or maiden name…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <button type="submit" className="bg-navy-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-navy-600">Search</button>
          {search && <button type="button" onClick={() => { setSearch(''); load(''); }} className="text-gray-500 px-3 text-sm hover:text-navy-700">Clear</button>}
        </form>

        {loading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : people.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">👤</p>
            <p>{search ? `No results for "${search}"` : 'No people found.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Family</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {people.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/people/${p.id}`)}>
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-navy-800">{p.first_name ?? p.firstName} {p.last_name ?? p.lastName}</p>
                        {(p.baptismal_name ?? p.baptismalName) && <p className="text-xs text-gray-400">Baptismal: {p.baptismal_name ?? p.baptismalName}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{(p.family_name ?? p.familyName) || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{p.dob ? new Date(p.dob).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setEditPerson(p); }}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <span className="text-navy-500 text-xs">View →</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Person Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">New Person</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input {...register('firstName', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input {...register('lastName', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input {...register('middleName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baptismal Name</label>
                  <input {...register('baptismalName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input {...register('dob')} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select {...register('gender')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maiden Name</label>
                <input {...register('maidenName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-navy-800 text-white py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">Edit Person</h3>
            </div>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input {...editForm.register('firstName', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  {editForm.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input {...editForm.register('lastName', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  {editForm.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input {...editForm.register('middleName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baptismal Name</label>
                  <input {...editForm.register('baptismalName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input {...editForm.register('dob')} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select {...editForm.register('gender')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maiden Name</label>
                <input {...editForm.register('maidenName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...editForm.register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input {...editForm.register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...editForm.register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditPerson(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-navy-800 text-white py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-2">Delete Person</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.first_name ?? deleteTarget.firstName} {deleteTarget.last_name ?? deleteTarget.lastName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={onDelete} disabled={deleting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
