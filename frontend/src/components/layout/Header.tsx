import { Search, Bell } from 'lucide-react';
import './Header.css';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth(); // Utilize o hook useAuth para obter o usuário logado
  return (
    <header className="header">
      <div className="header__left">
        <div className="header__breadcrumb">
          <span className="header__breadcrumb-item">{title}</span>
          {subtitle && (
            <>
              <span className="header__breadcrumb-sep">›</span>
              <span className="header__breadcrumb-current">{subtitle}</span>
            </>
          )}
        </div>
      </div>

      <div className="header__right">
        <div className="header__search">
          <Search size={16} strokeWidth={2} className="header__search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            className="header__search-input"
            id="global-search"
          />
        </div>

        <button className="header__icon-btn" id="notifications-btn" aria-label="Notificações">
          <Bell size={20} strokeWidth={1.8} />
          <span className="header__notification-dot" />
        </button>

        <div className="header__user">
          <div className="header__avatar">
            {/* Renderiza a primeira letra do email do usuário */}
            <span>{user?.email?.charAt(0) || 'fake'}</span>
          </div>
          <div className="header__user-info">
            {/* <span className="header__user-name">{user?.nome || 'Usuário fake'}</span> */}
            <span className="header__user-role">{user?.email || 'Email fake'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
