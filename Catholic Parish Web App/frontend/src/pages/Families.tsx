import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { familiesApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import type { Family } from '../types';

type FamilyFormData = { familyName: string; address: string; status: Family['status']; notes: string };

export default function Families() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editFamily, setEditFamily] = useState<Family | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FamilyFormData>({ defaultValues: { status: 'active' } });
  const editForm = useForm<FamilyFormData>();

  const load = async (p = 1, q = search) => {
    setLoading(true);
    try {
      const r = await familiesApi.list({ page: p, limit: 20, search: q || undefined });
      setFamilies(r.data.data);
      setTotal(r.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, ''); }, []);

  useEffect(() => {
    if (editFamily) {
      editForm.reset({
        familyName: editFamily.family_name ?? editFamily.familyName,
        address: editFamily.address ?? '',
        status: editFamily.status,
        notes: editFamily.notes ?? '',
      });
    }
  }, [editFamily]);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const onSubmit = async (data: FamilyFormData) => {
    setSaving(true);
    try {
      await familiesApi.create(data);
      reset();
      setShowModal(false);
      load(1);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const onEditSubmit = async (data: FamilyFormData) => {
    if (!editFamily) return;
    setSaving(true);
    try {
      await familiesApi.update(editFamily.id, data);
      setEditFamily(null);
      load(page, search);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await familiesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load(page, search);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    transferred: 'bg-blue-100 text-blue-700',
    deceased: 'bg-red-100 text-red-700',
  };

  const canEdit = hasRole('parish_admin', 'sacramental_clerk');

  return (
    <div>
      <PageHeader
        title="Families"
        subtitle={`${total} family record${total !== 1 ? 's' : ''}`}
        actions={
          canEdit ? (
            <button onClick={() => setShowModal(true)} className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-700">
              + New Family
            </button>
          ) : undefined
        }
      />

      <div className="p-8">
        {/* Search */}
        <form onSubmit={onSearch} className="flex gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by family name…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <button type="submit" className="bg-navy-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-navy-600">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); load(1, ''); }} className="text-gray-500 px-3 py-2 text-sm hover:text-navy-700">Clear</button>
          )}
        </form>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : families.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">👨‍👩‍👧‍👦</p>
            <p>No families found. {canEdit && 'Create the first one!'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Family Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {families.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/families/${f.id}`)}>
                    <td className="px-6 py-4 font-medium text-navy-800">{f.family_name ?? f.familyName}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{f.address || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{f.member_count ?? f.memberCount ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[f.status] || 'bg-gray-100 text-gray-600'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setEditFamily(f); }}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteTarget(f); }}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <span className="text-navy-500 text-xs hover:text-navy-700">View →</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1); }} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">Previous</button>
            <span className="px-3 py-1.5 text-sm text-gray-600">Page {page}</span>
            <button disabled={page * 20 >= total} onClick={() => { setPage(p => p + 1); load(page + 1); }} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Create Family Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">New Family</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                <input {...register('familyName', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" placeholder="e.g. De la Cruz" />
                {errors.familyName && <p className="text-red-500 text-xs mt-1">{errors.familyName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea {...register('address')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...register('notes')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-navy-800 text-white py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Create Family'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Family Modal */}
      {editFamily && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">Edit Family</h3>
            </div>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                <input {...editForm.register('familyName', { required: 'Required' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                {editForm.formState.errors.familyName && <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.familyName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea {...editForm.register('address')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...editForm.register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea {...editForm.register('notes')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditFamily(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
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
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-2">Delete Family</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the <strong>{deleteTarget.family_name ?? deleteTarget.familyName}</strong> family? This action cannot be undone.
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
