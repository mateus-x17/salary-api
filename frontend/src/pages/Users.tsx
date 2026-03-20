import { useEffect, useState, useCallback } from 'react';
import { Search, Pencil, X, Save } from 'lucide-react';
import { api } from '../services/api';
import './Users.css';
import './Users-sidebar.css';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profile?: {
    experienceLevel: string;
    city?: { name: string };
    salaryHistories: { salary: number }[];
    profileStacks: { stack: { name: string } }[];
  }
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [stacksList, setStacksList] = useState<{ id: string; name: string }[]>([]);

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', email: '', role: '', experienceLevel: '', salary: '', city: '', stacks: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stacks] = await Promise.all([api.listUsers(), api.listStacks()]);
      setUsers(Array.isArray(data) ? data : []);
      setStacksList(Array.isArray(stacks) ? stacks : []);
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === '' || u.role === roleFilter)
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  function handleEditClick(user: UserRow) {
    setEditingUser(user);
    const p = user.profile;
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'USER',
      experienceLevel: p?.experienceLevel || 'MID',
      salary: p?.salaryHistories?.[0]?.salary?.toString() || '',
      city: p?.city?.name || '',
      stacks: p?.profileStacks?.map(ps => ps.stack?.name).filter(Boolean).join(', ') || ''
    });
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await api.updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        experienceLevel: editForm.experienceLevel,
        salary: Number(editForm.salary),
        city: editForm.city,
        stacks: editForm.stacks.split(',').map(s => s.trim()).filter(Boolean)
      });
      setEditingUser(null);
      await load();
    } catch (err) {
      console.error('Erro ao editar', err);
      alert('Houve um erro ao atualizar os dados.');
    } finally {
      setIsSaving(false);
    }
  }

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
        <button className="users-page__filter-btn" id="users-filter-btn" style={{ padding: 0, background: 'transparent', border: 'none' }}>
          <select
            id="users-role-filter"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              background: 'var(--surface-card)',
              border: 'var(--border-light)',
              color: 'var(--color-gray-700)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.65rem 1rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              appearance: 'none',
              minWidth: 140,
            }}
          >
            <option value="">Todos os Tipos</option>
            <option value="USER">👤 Usuário Comum</option>
            <option value="ADMIN">🛡️ Administrador</option>
          </select>
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
                <th style={{ textAlign: 'right' }}>Ações</th>
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
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn" onClick={() => handleEditClick(user)}>
                      <Pencil size={18} />
                    </button>
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

      {/* Edit Sidebar Overlay */}
      {editingUser && (
        <div className="sidebar-overlay" onClick={() => setEditingUser(null)} />
      )}

      {/* Edit Sidebar */}
      <div className={`edit-sidebar ${editingUser ? 'open' : ''}`}>
        <div className="edit-sidebar__header">
          <h3>Editar Perfil</h3>
          <button className="icon-btn" onClick={() => setEditingUser(null)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="edit-sidebar__content">
          <div className="form-group row">
            <label>Nome Completo</label>
            <input 
              type="text" 
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})} 
            />
          </div>
          <div className="form-group row">
            <label>E-mail Corporativo</label>
            <input 
              type="email" 
              value={editForm.email} 
              onChange={e => setEditForm({...editForm, email: e.target.value})} 
            />
          </div>
          
          <div className="form-group row">
            <label>Nível de Acesso (Role)</label>
            <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="form-group row">
            <label>Localização (Cidade/UF)</label>
            <input 
              type="text" 
              placeholder="Ex: São Paulo"
              value={editForm.city} 
              onChange={e => setEditForm({...editForm, city: e.target.value})} 
            />
          </div>

          <div className="form-group row">
            <label>Nível de Experiência</label>
            <select value={editForm.experienceLevel} onChange={e => setEditForm({...editForm, experienceLevel: e.target.value})}>
              <option value="JUNIOR">Júnior (0-2 anos)</option>
              <option value="MID">Pleno (3-5 anos)</option>
              <option value="SENIOR">Sênior (6-10 anos)</option>
              <option value="STAFF_PLUS">Staff/Principal (10+ anos)</option>
              <option value="LEAD">Tech Lead / Management</option>
            </select>
          </div>

          <div className="form-group row">
            <label>Salário Atual (R$)</label>
            <input 
              type="number" 
              placeholder="12000"
              value={editForm.salary} 
              onChange={e => setEditForm({...editForm, salary: e.target.value})} 
            />
          </div>

          <div className="form-group row">
            <label>Stacks Principais</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {editForm.stacks.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span key={s} style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-800)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {s}
                  <X size={14} style={{cursor: 'pointer'}} onClick={() => {
                    const newStacks = editForm.stacks.split(',').map(x=>x.trim()).filter(x => x && x !== s).join(', ');
                    setEditForm({...editForm, stacks: newStacks});
                  }} />
                </span>
              ))}
            </div>
            <select
              value=""
              onChange={e => {
                if (!e.target.value) return;
                const current = editForm.stacks.split(',').map(s=>s.trim()).filter(Boolean);
                if (!current.includes(e.target.value)) {
                  setEditForm({...editForm, stacks: [...current, e.target.value].join(', ')});
                }
              }}
            >
              <option value="">Adicionar stack...</option>
              {stacksList.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="edit-sidebar__footer">
          <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar Alterações</>}
          </button>
        </div>
      </div>
    </div>
  );
}
