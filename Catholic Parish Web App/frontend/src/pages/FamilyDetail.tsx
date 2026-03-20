import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { familiesApi, peopleApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { SACRAMENT_COLORS } from '../types';
import type { Family, Person } from '../types';

export default function FamilyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [family, setFamily] = useState<Family & { members: Person[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [relationship, setRelationship] = useState('');
  const [adding, setAdding] = useState(false);
  const [searched, setSearched] = useState(false);

  const load = async () => {
    try {
      const r = await familiesApi.get(id!);
      setFamily(r.data);
    } catch { navigate('/families'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const searchPeople = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setSearched(false); return; }
    const r = await peopleApi.list({ search: q, limit: 10 });
    setSearchResults(r.data.data);
    setSearched(true);
  };

  const addMember = async () => {
    if (!selectedPerson || !relationship) return;
    setAdding(true);
    try {
      await familiesApi.addMember(id!, { personId: selectedPerson.id, relationship });
      setShowAddMember(false);
      setSelectedPerson(null);
      setRelationship('');
      setSearchQuery('');
      setSearchResults([]);
      setSearched(false);
      load();
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-pulse">✝</div></div>;
  if (!family) return null;

  return (
    <div>
      <PageHeader
        title={`${family.family_name ?? family.familyName} Family`}
        subtitle={family.address || 'No address recorded'}
        actions={
          <div className="flex gap-3">
            {hasRole('parish_admin', 'sacramental_clerk') && (
              <button onClick={() => setShowAddMember(true)} className="bg-navy-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-navy-700">
                + Add Member
              </button>
            )}
            <button onClick={() => navigate('/families')} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              ← Back
            </button>
          </div>
        }
      />

      <div className="p-8">
        {/* Family info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize ml-1">{family.status}</span></div>
            <div><span className="text-gray-500">Members:</span> <span className="font-medium ml-1">{family.members?.length ?? 0}</span></div>
            {family.notes && <div><span className="text-gray-500">Notes:</span> <span className="ml-1">{family.notes}</span></div>}
          </div>
        </div>

        {/* Members */}
        <h3 className="font-serif text-lg font-semibold text-navy-900 mb-4">Family Members</h3>
        {!family.members?.length ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
            <p>No members yet. Add the first member to this family.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {family.members.map(member => (
              <Link
                key={member.id}
                to={`/people/${member.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-navy-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{member.gender === 'female' ? '👩' : '👨'}</span>
                      <p className="font-medium text-navy-800">{member.first_name ?? member.firstName} {member.last_name ?? member.lastName}</p>
                    </div>
                    <p className="text-xs text-gray-500 capitalize ml-8">{member.relationship}</p>
                    {(member.dob) && (
                      <p className="text-xs text-gray-400 ml-8">
                        Born: {new Date(member.dob).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {member.status}
                  </span>
                </div>

                {/* Sacrament chips */}
                {member.sacraments?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                    {(member.sacraments as Array<{ code: string; name: string; status: string }>).map(s => (
                      <span key={s.code} className={`px-2 py-0.5 rounded-full text-xs font-medium ${SACRAMENT_COLORS[s.code] || 'bg-gray-100 text-gray-600'}`}>
                        {s.name?.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 ml-8 mt-2">No sacraments recorded</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="font-serif text-xl font-bold text-navy-900">Add Member to Family</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Person</label>
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); searchPeople(e.target.value); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  placeholder="Type a name…"
                />
                {searchResults.length > 0 && !selectedPerson && (
                  <div className="border border-gray-200 rounded-lg mt-1 divide-y max-h-40 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p.id} onClick={() => { setSelectedPerson(p); setSearchQuery(`${p.first_name ?? p.firstName} ${p.last_name ?? p.lastName}`); setSearchResults([]); setSearched(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                        {p.first_name ?? p.firstName} {p.last_name ?? p.lastName}
                      </button>
                    ))}
                  </div>
                )}
                {searched && searchResults.length === 0 && !selectedPerson && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg mt-1 px-3 py-2 text-sm text-amber-800">
                    No person found with that name.{' '}
                    <a href="/people" className="underline font-medium text-amber-900">Create a new person first</a>, then add them here.
                  </div>
                )}
                {selectedPerson && <p className="text-xs text-green-600 mt-1">✓ Selected: {selectedPerson.first_name ?? selectedPerson.firstName} {selectedPerson.last_name ?? selectedPerson.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select value={relationship} onChange={e => setRelationship(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500">
                  <option value="">Select relationship</option>
                  <option value="head">Head of Household</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAddMember(false); setSelectedPerson(null); setSearchQuery(''); setRelationship(''); setSearched(false); setSearchResults([]); }} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={addMember} disabled={!selectedPerson || !relationship || adding} className="flex-1 bg-navy-800 text-white py-2 rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50">
                  {adding ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
