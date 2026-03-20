import { NavLink } from 'react-router-dom';
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

const navItemsADM = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/users', icon: Users, label: 'Usuários' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

const navItemsUSU = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function Sidebar() {
  const { logout, user } = useAuth();

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
        {/* Renderiza os itens de navegação com base no role de usuário logado */}
        {(user?.role === 'ADMIN' ? navItemsADM : navItemsUSU).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <item.icon size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
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
