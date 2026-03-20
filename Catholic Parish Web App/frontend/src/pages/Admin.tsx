import { useEffect, useState } from 'react';
import { adminApi, authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { ROLES } from '../types';
import type { AuditLog } from '../types';

const AVAILABLE_ROLES = [
  { value: 'parish_admin', label: 'Parish Admin' },
  { value: 'sacramental_clerk', label: 'Sacramental Clerk' },
  { value: 'priest', label: 'Priest' },
  { value: 'auditor', label: 'Auditor' },
];

interface ParishSettings {
  id: string;
  name: string;
  address: string;
  diocese: string;
  contact_info: Record<string, string>;
  logo_path?: string;
}

interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

export default function Admin() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'parish' | 'users' | 'audit'>('parish');
  const [parish, setParish] = useState<ParishSettings | null>(null);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parishForm, setParishForm] = useState({ name: '', address: '', diocese: '', email: '', phone: '' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<StaffUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', roles: [] as string[], isActive: true });
  const [userFormError, setUserFormError] = useState('');

  useEffect(() => {
    if (!hasRole(ROLES.ADMIN, ROLES.AUDITOR)) { navigate('/dashboard'); return; }
    loadTab(activeTab);
  }, []);

  const loadTab = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'parish') {
        const r = await adminApi.parishSettings();
        setParish(r.data);
        setParishForm({
          name: r.data.name,
          address: r.data.address || '',
          diocese: r.data.diocese || '',
          email: r.data.contact_info?.email || '',
          phone: r.data.contact_info?.phone || '',
        });
      } else if (tab === 'users') {
        const r = await authApi.getUsers();
        setUsers(r.data);
      } else if (tab === 'audit') {
        const r = await adminApi.auditLog({ limit: 100 });
        setAuditLogs(r.data.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleTabChange = (tab: 'parish' | 'users' | 'audit') => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const r = await adminApi.uploadLogo(file);
      setParish(p => p ? { ...p, logo_path: r.data.logoPath } : p);
    } catch (err) { console.error(err); alert('Logo upload failed.'); }
    finally { setLogoUploading(false); e.target.value = ''; }
  };

  const saveParish = async () => {
    setSaving(true);
    try {
      const { email, phone, ...rest } = parishForm;
      await adminApi.updateParishSettings({ ...rest, contactInfo: { email, phone } });
      alert('Parish settings updated successfully!');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const openAddUser = () => {
    setEditUser(null);
    setUserForm({ firstName: '', lastName: '', email: '', password: '', roles: [], isActive: true });
    setUserFormError('');
    setShowUserModal(true);
  };

  const openEditUser = (u: StaffUser) => {
    setEditUser(u);
    setUserForm({ firstName: u.first_name, lastName: u.last_name, email: u.email, password: '', roles: (u.roles || []).filter(Boolean), isActive: u.is_active });
    setUserFormError('');
    setShowUserModal(true);
  };

  const saveUser = async () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email) { setUserFormError('Name and email are required.'); return; }
    if (!editUser && userForm.password.length < 8) { setUserFormError('Password must be at least 8 characters.'); return; }
    if (userForm.roles.length === 0) { setUserFormError('At least one role is required.'); return; }
    setSaving(true);
    setUserFormError('');
    try {
      if (editUser) {
        const payload: Record<string, unknown> = { firstName: userForm.firstName, lastName: userForm.lastName, roles: userForm.roles, isActive: userForm.isActive };
        if (userForm.password) payload.password = userForm.password;
        await authApi.updateUser(editUser.id, payload);
      } else {
        await authApi.createUser({ firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, password: userForm.password, roles: userForm.roles });
      }
      setShowUserModal(false);
      loadTab('users');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save user.';
      setUserFormError(msg);
    } finally { setSaving(false); }
  };

  const deleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    try {
      await authApi.deleteUser(deleteUserTarget.id);
      setDeleteUserTarget(null);
      loadTab('users');
    } catch (e) { console.error(e); }
    finally { setDeletingUser(false); }
  };

  return (
    <div>
      <PageHeader title="Administration" subtitle="Manage parish settings, users, and audit logs" />

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[
            { id: 'parish', label: '⛪ Parish Settings' },
            { id: 'users', label: '👥 Users & Roles' },
            { id: 'audit', label: '📋 Audit Log' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as 'parish' | 'users' | 'audit')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : activeTab === 'parish' && parish ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <h3 className="font-serif text-lg font-semibold text-navy-900 mb-5">Parish Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parish Name</label>
                <input
                  value={parishForm.name}
                  onChange={e => setParishForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={parishForm.address}
                  onChange={e => setParishForm(f => ({ ...f, address: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diocese</label>
                <input
                  value={parishForm.diocese}
                  onChange={e => setParishForm(f => ({ ...f, diocese: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={parishForm.email}
                    onChange={e => setParishForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    placeholder="office@example.org"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={parishForm.phone}
                    onChange={e => setParishForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              {hasRole(ROLES.ADMIN) && (
                <button onClick={saveParish} disabled={saving} className="bg-navy-800 text-white px-6 py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>

            {/* Logo Upload */}
            {hasRole(ROLES.ADMIN) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-serif text-lg font-semibold text-navy-900 mb-4">Parish Logo</h3>
                <p className="text-xs text-gray-500 mb-4">Used in certificates and the sidebar. Recommended: square image, PNG or JPG, max 5 MB.</p>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {parish?.logo_path
                      ? <img src={parish.logo_path} alt="Parish logo" className="w-full h-full object-contain p-1" />
                      : <span className="text-gray-400 text-3xl">✝</span>}
                  </div>
                  <div>
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${logoUploading ? 'opacity-50 pointer-events-none' : 'border-navy-700 text-navy-800 hover:bg-navy-50'}`}>
                      {logoUploading ? 'Uploading…' : '⬆ Upload Logo'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                    </label>
                    {parish?.logo_path && <p className="text-xs text-green-600 mt-2">✓ Logo uploaded</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openAddUser} className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-700">
                + Add User
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Since</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-3 font-medium text-navy-800">{u.first_name} {u.last_name}</td>
                      <td className="px-6 py-3 text-gray-600">{u.email}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || []).filter(Boolean).map(r => (
                            <span key={r} className="bg-navy-100 text-navy-700 text-xs px-2 py-0.5 rounded-full capitalize">{r.replace('_', ' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditUser(u)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                          <button onClick={() => setDeleteUserTarget(u)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Audit Log */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-700">{log.email ? `${log.first_name} ${log.last_name}` : 'System'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                        log.action === 'GENERATE' ? 'bg-gold-100 text-gold-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{log.entity_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && (
              <div className="text-center py-12 text-gray-400">No audit entries yet.</div>
            )}
          </div>
        )}
      </div>
      {/* Add / Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">{editUser ? 'Edit User' : 'Add User'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input value={userForm.firstName} onChange={e => setUserForm(f => ({ ...f, firstName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input value={userForm.lastName} onChange={e => setUserForm(f => ({ ...f, lastName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} disabled={!!editUser} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" placeholder={editUser ? 'Leave blank to keep current' : 'Min 8 characters'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles *</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROLES.map(r => (
                    <label key={r.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.roles.includes(r.value)}
                        onChange={e => setUserForm(f => ({ ...f, roles: e.target.checked ? [...f.roles, r.value] : f.roles.filter(x => x !== r.value) }))}
                        className="rounded"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
              {editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" checked={userForm.isActive} onChange={() => setUserForm(f => ({ ...f, isActive: true }))} /> Active
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" checked={!userForm.isActive} onChange={() => setUserForm(f => ({ ...f, isActive: false }))} /> Inactive
                    </label>
                  </div>
                </div>
              )}
              {userFormError && <p className="text-red-500 text-xs">{userFormError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowUserModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={saveUser} disabled={saving} className="flex-1 bg-navy-800 text-white py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {deleteUserTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-serif text-lg font-bold text-navy-900 mb-2">Delete User</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteUserTarget.first_name} {deleteUserTarget.last_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUserTarget(null)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={deleteUser} disabled={deletingUser} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                {deletingUser ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
