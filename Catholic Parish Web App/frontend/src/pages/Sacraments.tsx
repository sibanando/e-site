import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sacramentsApi } from '../api/client';
import PageHeader from '../components/PageHeader';
import { SACRAMENT_COLORS } from '../types';
import type { SacramentRecord, SacramentType } from '../types';

export default function Sacraments() {
  const navigate = useNavigate();
  const [sacraments, setSacraments] = useState<SacramentRecord[]>([]);
  const [types, setTypes] = useState<SacramentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [celebrantSearch, setCelebrantSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');

  const load = async (typeCode = '', from = dateFrom, to = dateTo, cel = celebrantSearch, person = personSearch) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (typeCode && typeCode !== 'all') params.typeCode = typeCode;
      if (from) params.dateFrom = from;
      if (to) params.dateTo = to;
      if (cel) params.celebrant = cel;
      if (person) params.personName = person;

      const [sacRes, typesRes] = await Promise.all([
        sacramentsApi.list(params),
        types.length ? Promise.resolve({ data: types }) : sacramentsApi.types(),
      ]);
      setSacraments(sacRes.data.data);
      if (!types.length) setTypes(typesRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleTabChange = (code: string) => {
    setActiveTab(code);
    load(code, dateFrom, dateTo, celebrantSearch, personSearch);
  };

  const exportCSV = () => {
    const headers = ['Person', 'Sacrament', 'Date', 'Celebrant', 'Place', 'Status'];
    const rows = sacraments.map(s => [
      `${s.first_name ?? s.firstName} ${s.last_name ?? s.lastName}`,
      s.sacrament_name ?? s.sacramentName ?? '',
      s.date ?? '',
      s.celebrant ?? '',
      s.place ?? '',
      s.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sacraments.csv'; a.click();
  };

  const allTabs = [{ id: 'all', code: 'all', name: 'All Sacraments' }, ...types.map(t => ({ id: t.id, code: t.code, name: t.name }))];

  return (
    <div>
      <PageHeader
        title="Sacraments"
        subtitle="View and manage all sacramental records"
        actions={
          <button onClick={exportCSV} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            ↓ Export CSV
          </button>
        }
      />

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-6 bg-gray-100 p-1 rounded-xl">
          {allTabs.map(tab => (
            <button
              key={tab.code}
              onClick={() => handleTabChange(tab.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.code ? 'bg-white text-navy-800 shadow-sm' : 'text-gray-600 hover:text-navy-700'
              }`}
            >
              {tab.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
          </div>
          <input
            value={personSearch}
            onChange={e => setPersonSearch(e.target.value)}
            placeholder="Search by person name…"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <input
            value={celebrantSearch}
            onChange={e => setCelebrantSearch(e.target.value)}
            placeholder="Filter by celebrant…"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <button onClick={() => load(activeTab)} className="bg-navy-700 text-white px-4 py-1.5 rounded text-sm hover:bg-navy-600">Apply</button>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setCelebrantSearch(''); setPersonSearch(''); load(activeTab, '', '', '', ''); }} className="text-gray-500 text-sm hover:text-navy-700">Clear</button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : sacraments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">✝️</p>
            <p>No sacramental records found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Person</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sacrament</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Celebrant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Place</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sacraments.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/people/${s.person_id ?? s.personId}`)}>
                    <td className="px-6 py-3 font-medium text-navy-800">{s.first_name ?? s.firstName} {s.last_name ?? s.lastName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SACRAMENT_COLORS[s.code ?? ''] || 'bg-gray-100 text-gray-600'}`}>
                        {s.sacrament_name ?? s.sacramentName}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{s.date ? new Date(s.date).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{s.celebrant || '—'}</td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{s.place || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                        s.status === 'completed' ? 'bg-green-100 text-green-700' :
                        s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-navy-500">View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {sacraments.length} record{sacraments.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
