import { useEffect, useState, useCallback } from 'react';
import { Search, Pencil, X, Save } from 'lucide-react';
import { api } from '../services/api';
import LoadingState from '../components/LoadingState';
import { Toast, type ToastData } from '../components/Toast';
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
    city?: { id?: string; name: string };
    salaryHistories: { salary: number }[];
    profileStacks: { stack: { id?: string; name: string } }[];
  };
}

interface Stack {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  state: string;
  country: string;
}

const EXPERIENCE_LEVELS = [
  { value: 'JUNIOR', label: 'Júnior (0–2 anos)' },
  { value: 'MID', label: 'Pleno (3–5 anos)' },
  { value: 'SENIOR', label: 'Sênior (6–10 anos)' },
  { value: 'STAFF_PLUS', label: 'Staff / Principal (10+ anos)' },
  { value: 'LEAD', label: 'Tech Lead / Management' },
];

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Listas vindas do banco
  const [stacksList, setStacksList] = useState<Stack[]>([]);
  const [citiesList, setCitiesList] = useState<City[]>([]);

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER',
    experienceLevel: 'MID',
    salary: '',
    cityId: '',           // ID da cidade selecionada
    stacks: [] as string[], // IDs das stacks selecionadas
  });
  const [toast, setToast] = useState<ToastData | null>(null);

  /* ── Carga inicial: usuários + stacks + cidades ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stacks, cities] = await Promise.all([
        api.listUsers(),
        api.listStacks(),
        api.listCities(),
      ]);
      setUsers(Array.isArray(data) ? data : []);
      setStacksList(Array.isArray(stacks) ? stacks : []);
      setCitiesList(Array.isArray(cities) ? cities : []);
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

  useEffect(() => { load(); }, [load]);

  /* ── Filtro de tabela ── */
  const filtered = users.filter(
    u =>
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === '' || u.role === roleFilter)
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Abre modal de edição ── */
  function handleEditClick(user: UserRow) {
    setEditingUser(user);
    const p = user.profile;

    // Tenta resolver o ID da cidade a partir do nome (caso o backend retorne só o nome)
    const cityName = p?.city?.name || '';
    const matchedCity = citiesList.find(
      c => c.name.toLowerCase() === cityName.toLowerCase()
    );
    const cityId = p?.city?.id || matchedCity?.id || '';

    // Resolve IDs das stacks do perfil
    const profileStackIds = (p?.profileStacks || []).map(ps => {
      const id = ps.stack?.id;
      if (id) return id;
      // fallback: busca pelo nome na lista
      const found = stacksList.find(
        s => s.name.toLowerCase() === ps.stack?.name?.toLowerCase()
      );
      return found?.id || '';
    }).filter(Boolean);

    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'USER',
      experienceLevel: p?.experienceLevel || 'MID',
      salary: p?.salaryHistories?.[0]?.salary?.toString() || '',
      cityId,
      stacks: profileStackIds,
    });
  }

  /* ── Alterna stack selecionada ── */
  function toggleStack(id: string) {
    setEditForm(prev => ({
      ...prev,
      stacks: prev.stacks.includes(id)
        ? prev.stacks.filter(s => s !== id)
        : [...prev.stacks, id],
    }));
  }

  /* ── Salva edição ── */
  async function handleSaveEdit() {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const selectedCity = citiesList.find(c => c.id === editForm.cityId);

      // 🔥 CONVERSÃO CRÍTICA (ID → NAME)
      const selectedStacksNames = editForm.stacks
        .map(id => stacksList.find(s => s.id === id)?.name)
        .filter((name): name is string => Boolean(name));

      await api.updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        experienceLevel: editForm.experienceLevel,
        salary: Number(editForm.salary),
        cityId: editForm.cityId || undefined,
        city: selectedCity?.name || undefined,
        stacks: selectedStacksNames, // ✅ CORRETO AGORA
      });

      setToast({
        type: 'success',
        title: `Usuário ${editingUser.name} atualizado`,
        message: 'As informações foram salvas com sucesso.',
      });
      setEditingUser(null);
      await load();
    } catch (err) {
      console.error('Erro ao editar', err);
      setToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: `Não foi possível salvar as alterações ${editingUser.name}.`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="users-page">
      {/* Header */}
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
            onChange={e => setSearch(e.target.value)}
            id="users-search"
          />
        </div>
        <button className="users-page__filter-btn" style={{ padding: 0, background: 'transparent', border: 'none' }}>
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
          <div style={{ height: 400, display: 'flex' }}>
            <LoadingState message="Buscando lista de usuários..." />
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
                      <div className="users-table__avatar" style={{ background: `hsl(${(i * 47) % 360}, 55%, 60%)` }}>
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

      {/* Overlay */}
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

          {/* Nome */}
          <div className="form-group row">
            <label>Nome Completo</label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="form-group row">
            <label>E-mail Corporativo</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          {/* Role */}
          <div className="form-group row">
            <label>Nível de Acesso (Role)</label>
            <select
              value={editForm.role}
              onChange={e => setEditForm({ ...editForm, role: e.target.value })}
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* Cidade — select dinâmico */}
          <div className="form-group row">
            <label>Localização (Cidade)</label>
            {citiesList.length > 0 ? (
              <select
                value={editForm.cityId}
                onChange={e => setEditForm({ ...editForm, cityId: e.target.value })}
              >
                <option value="">Selecione a cidade...</option>
                {citiesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.state}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Cidades não disponíveis"
                disabled
                style={{ opacity: 0.5 }}
              />
            )}
          </div>

          {/* Nível de Experiência — select com valores do sistema */}
          <div className="form-group row">
            <label>Nível de Experiência</label>
            <select
              value={editForm.experienceLevel}
              onChange={e => setEditForm({ ...editForm, experienceLevel: e.target.value })}
            >
              {EXPERIENCE_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Salário */}
          <div className="form-group row">
            <label>Salário Atual (R$)</label>
            <input
              type="number"
              placeholder="12000"
              value={editForm.salary}
              onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
            />
          </div>

          {/* Stacks — chips selecionáveis vindos do banco */}
          <div className="form-group row">
            <label>Stacks Principais</label>

            {/* Chips selecionadas */}
            {editForm.stacks.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {editForm.stacks.map(id => {
                  const stack = stacksList.find(s => s.id === id);
                  if (!stack) return null;
                  return (
                    <span
                      key={id}
                      style={{
                        background: 'var(--color-primary-100)',
                        color: 'var(--color-primary-800)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {stack.name}
                      <X
                        size={14}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleStack(id)}
                      />
                    </span>
                  );
                })}
              </div>
            )}

            {/* Select para adicionar */}
            {stacksList.length > 0 ? (
              <select
                value=""
                onChange={e => {
                  if (e.target.value) toggleStack(e.target.value);
                }}
              >
                <option value="">Adicionar stack...</option>
                {stacksList
                  .filter(s => !editForm.stacks.includes(s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Stacks não disponíveis"
                disabled
                style={{ opacity: 0.5 }}
              />
            )}
          </div>
        </div>

        <div className="edit-sidebar__footer">
          <button className="btn-secondary" onClick={() => setEditingUser(null)}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar Alterações</>}
          </button>
        </div>
      </div>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
