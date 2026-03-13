import { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import './Users.css';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        // Fallback demo data
        setUsers([
          { id: '1', name: 'Mateus Silva', email: 'mateus@email.com', role: 'ADMIN', createdAt: '2026-01-15T10:00:00Z' },
          { id: '2', name: 'Ana Oliveira', email: 'ana@email.com', role: 'USER', createdAt: '2026-02-10T08:30:00Z' },
          { id: '3', name: 'Pedro Santos', email: 'pedro@email.com', role: 'USER', createdAt: '2026-02-20T14:00:00Z' },
          { id: '4', name: 'Julia Costa', email: 'julia@email.com', role: 'USER', createdAt: '2026-03-01T09:00:00Z' },
          { id: '5', name: 'Lucas Ferreira', email: 'lucas@email.com', role: 'USER', createdAt: '2026-03-05T11:30:00Z' },
          { id: '6', name: 'Camila Souza', email: 'camila@email.com', role: 'USER', createdAt: '2026-03-10T16:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="users-page">
      {/* Title */}
      <div className="users-page__header">
        <div>
          <h2 className="users-page__title">Usuários Cadastrados</h2>
          <p className="users-page__sub">Gerencie todos os profissionais da plataforma</p>
        </div>
        <span className="users-page__count">{filtered.length} registros</span>
      </div>

      {/* Toolbar */}
      <div className="users-page__toolbar">
        <div className="users-page__search">
          <Search size={16} className="users-page__search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="users-page__search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="users-search"
          />
        </div>
        <button className="users-page__filter-btn" id="users-filter-btn">
          <Filter size={16} />
          <span>Filtros</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="users-table-wrapper">
        {loading ? (
          <div className="users-table__loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 12 }} />
            ))}
          </div>
        ) : (
          <table className="users-table" id="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Função</th>
                <th>Cadastro</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user.id} className="users-table__row" style={{ animationDelay: `${i * 50}ms` }}>
                  <td>
                    <div className="users-table__user">
                      <div className="users-table__avatar" style={{
                        background: `hsl(${(i * 47) % 360}, 55%, 60%)`
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="users-table__name">{user.name}</span>
                    </div>
                  </td>
                  <td className="users-table__email">{user.email}</td>
                  <td>
                    <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="users-table__date">{formatDate(user.createdAt)}</td>
                  <td>
                    <span className="status-dot status-dot--active" />
                    <span className="status-label">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="users-page__pagination">
        <span className="users-page__pagination-info">Página 1 de 1</span>
      </div>
    </div>
  );
}
