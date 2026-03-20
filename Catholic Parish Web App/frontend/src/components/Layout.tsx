import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../api/client';
import { ROLES } from '../types';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏛️', roles: [] },
  { to: '/families', label: 'Families', icon: '👨‍👩‍👧‍👦', roles: [] },
  { to: '/people', label: 'People', icon: '👤', roles: [] },
  { to: '/sacraments', label: 'Sacraments', icon: '✝️', roles: [] },
  { to: '/certificates', label: 'Certificates', icon: '📜', roles: [] },
  { to: '/admin', label: 'Admin', icon: '⚙️', roles: [ROLES.ADMIN, ROLES.AUDITOR] },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [parishName, setParishName] = useState<string | null>(null);

  useEffect(() => {
    adminApi.parishSettings().then(r => {
      if (r.data.logo_path) setLogoPath(r.data.logo_path);
      if (r.data.name) setParishName(r.data.name);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter(item =>
    item.roles.length === 0 || hasRole(...item.roles)
  );

  return (
    <div className="flex h-screen bg-ivory font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 flex flex-col shadow-xl">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-navy-700 flex items-center gap-3">
          {logoPath
            ? <img src={logoPath} alt="Parish Logo" className="w-12 h-12 rounded-full object-contain bg-white p-0.5 shrink-0" />
            : <span className="text-gold-400 text-2xl">✝</span>}
          <div className="min-w-0">
            <h1 className="font-serif text-gold-400 text-base font-bold leading-tight truncate">
              {parishName || 'Parish Manager'}
            </h1>
            <p className="text-navy-300 text-xs mt-0.5">Sacramental Records System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-700 text-white'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-navy-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-navy-400 text-xs truncate">{user?.roles[0]?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-navy-300 hover:text-white text-sm rounded-lg hover:bg-navy-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
