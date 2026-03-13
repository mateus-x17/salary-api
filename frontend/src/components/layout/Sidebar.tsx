import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  User,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/users', icon: Users, label: 'Usuários' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <TrendingUp size={22} strokeWidth={2.5} />
        </div>
        <div className="sidebar__logo-text">
          <span className="sidebar__logo-name">Salary</span>
          <span className="sidebar__logo-sub">Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <span className="sidebar__section-label">Menu</span>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={`sidebar__link ${location.pathname === to ? 'sidebar__link--active' : ''}`}
          >
            <span className="sidebar__link-indicator" />
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar__bottom">
        <button className="sidebar__link sidebar__logout" onClick={logout}>
          <LogOut size={20} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
