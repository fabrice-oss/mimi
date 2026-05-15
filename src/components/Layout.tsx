import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Target, FileBarChart,
  Receipt, Flag, Settings, LogOut, Bell, Menu, X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import MonthSelector from './MonthSelector';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/transactions', icon: ArrowLeftRight,   label: 'Dépenses & Revenus' },
  { to: '/budget',       icon: Target,           label: 'Budget' },
  { to: '/factures',     icon: Receipt,          label: 'Factures' },
  { to: '/objectifs',    icon: Flag,             label: 'Objectifs' },
  { to: '/rapports',     icon: FileBarChart,     label: 'Rapports' },
];

const BOTTOM_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Accueil' },
  { to: '/transactions', icon: ArrowLeftRight,   label: 'Transactions' },
  { to: '/budget',       icon: Target,           label: 'Budget' },
  { to: '/factures',     icon: Receipt,          label: 'Factures' },
  { to: '/objectifs',    icon: Flag,             label: 'Objectifs' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #FFE8F1 20%, #F8F0FF 50%, #FFF0F3 80%, #FFEEF6 100%)' }}>

      {/* Orbes de fond */}
      <div className="orb w-96 h-96 bg-blush-200/50 -top-20 -left-20 animate-float" />
      <div className="orb w-80 h-80 bg-petal-200/40 top-1/3 -right-16 animate-float-slow" />
      <div className="orb w-64 h-64 bg-gold-100/50 bottom-10 left-1/4 animate-float-fast" />
      <div className="orb w-72 h-72 bg-blush-300/30 bottom-0 right-1/3 animate-float" />

      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col z-10 m-3 mr-0 rounded-3xl glass"
        style={{ boxShadow: '0 8px 32px rgba(255,143,171,0.12), inset 0 1px 0 rgba(255,255,255,0.8)' }}>

        <div className="p-5 pb-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Mimi Compta" className="w-9 h-9 rounded-2xl object-cover"
              style={{ boxShadow: '0 4px 12px rgba(255,107,142,0.3)' }} />
            <div>
              <div className="font-bold text-base" style={{ color: '#FF4D6D' }}>Mimi Compta</div>
              <div className="text-xs" style={{ color: '#c9a0b0' }}>Ton budget, tout doux</div>
            </div>
          </div>
        </div>

        <div className="mx-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,143,171,0.3), transparent)' }} />

        <nav className="flex-1 p-3 space-y-1 mt-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="mx-1 my-2 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,143,171,0.25), transparent)' }} />
          <NavLink to="/parametres" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={17} /><span>Paramètres</span>
          </NavLink>
        </nav>

        {user && (
          <div className="p-3 m-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.4)' }}>
            <div className="flex items-center gap-2.5">
              <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: '#4a3040' }}>{user.name.split(' ')[0]}</div>
                <div className="text-xs truncate" style={{ color: '#c9a0b0' }}>{user.email}</div>
              </div>
              <button onClick={handleLogout}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                style={{ color: '#ffaab8' }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Drawer mobile ───────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col animate-slide-up"
            style={{ background: 'rgba(255,240,243,0.97)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.6)' }}>
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Mimi Compta" className="w-9 h-9 rounded-2xl object-cover" />
                <div>
                  <div className="font-bold" style={{ color: '#FF4D6D' }}>Mimi Compta</div>
                  <div className="text-xs" style={{ color: '#c9a0b0' }}>Ton budget, tout doux</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-xl glass flex items-center justify-center"
                style={{ color: '#b89aaa' }}>
                <X size={16} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {[...NAV, { to: '/parametres', icon: Settings, label: 'Paramètres' }].map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={17} /><span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {user && (
              <div className="p-4 border-t border-blush-100">
                <div className="flex items-center gap-3">
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full ring-2 ring-white" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: '#4a3040' }}>{user.name}</div>
                    <div className="text-xs truncate" style={{ color: '#c9a0b0' }}>{user.email}</div>
                  </div>
                  <button onClick={handleLogout} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50" style={{ color: '#ffaab8' }}>
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 z-10">

        {/* Header */}
        <header className="m-3 mb-0 rounded-3xl glass flex items-center gap-3 px-4 py-3"
          style={{ boxShadow: '0 4px 20px rgba(255,143,171,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }}>

          {/* Hamburger mobile */}
          <button onClick={() => setMenuOpen(true)}
            className="md:hidden w-9 h-9 rounded-2xl glass flex items-center justify-center shrink-0"
            style={{ color: '#FF8FAB' }}>
            <Menu size={18} />
          </button>

          {/* Logo mobile */}
          <div className="md:hidden flex items-center gap-2 mr-auto">
            <img src="/logo.png" alt="Mimi Compta" className="w-7 h-7 rounded-xl object-cover" />
            <span className="text-sm font-bold" style={{ color: '#FF4D6D' }}>Mimi Compta</span>
          </div>

          {/* Month selector — centré sur desktop */}
          <div className="hidden md:flex flex-1 justify-start">
            <MonthSelector />
          </div>
          <div className="md:hidden">
            <MonthSelector />
          </div>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <button className="w-9 h-9 rounded-2xl glass flex items-center justify-center relative"
              style={{ boxShadow: '0 2px 8px rgba(255,143,171,0.15)' }}>
              <Bell size={16} style={{ color: '#FF8FAB' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: '#FF4D6D', boxShadow: '0 0 0 2px white' }} />
            </button>
            {user && (
              <img src={user.picture} alt={user.name}
                className="hidden md:block w-8 h-8 rounded-full ring-2 ring-white shadow-sm" />
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-3 pt-3 pb-24 md:pb-4">
          {children}
        </main>

        {/* ── Bottom nav mobile ────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3">
          <div className="glass rounded-3xl flex items-center justify-around px-2 py-2"
            style={{ boxShadow: '0 -4px 24px rgba(255,143,171,0.15), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
            {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => isActive
                  ? { background: 'linear-gradient(135deg,rgba(255,143,171,0.2),rgba(255,107,142,0.15))' }
                  : {}}>
                {({ isActive }) => (
                  <>
                    <Icon size={20} style={{ color: isActive ? '#FF4D6D' : '#c9a0b0' }} />
                    <span className="text-xs font-medium" style={{ color: isActive ? '#FF4D6D' : '#c9a0b0' }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
