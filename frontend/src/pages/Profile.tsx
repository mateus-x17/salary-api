import { useEffect, useState } from 'react';
import {
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Code2,
  Clock,
  Plus,
  Mail,
  Pencil,
  X,
  Save
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StacksModal } from '../components/StacksModal';
import {Toast, type ToastData} from '../components/Toast';
import './Profile.css';
import './Users-sidebar.css';

interface ProfileData {
  userId: string;
  city: string;
  experienceLevel: string;
  stacks: string[];
  currentSalary: number;
  email: string;
  nome: string;
}

interface SalaryEntry {
  salary: number;
  createdAt: string;
}

interface StackItem {
  id: string;
  name: string;
}

interface CityItem {
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

const expLabels: Record<string, string> = {
  JUNIOR: 'Júnior (0-2 anos)',
  MID: 'Pleno (3-5 anos)',
  SENIOR: 'Sênior (6-10 anos)',
  STAFF_PLUS: 'Staff+ (10+ anos)',
  LEAD: 'Tech Lead / Management',
};

export function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileStacks, setProfileStacks] = useState<StackItem[]>([]);

  // Listas dinâmicas do banco
  const [allStacks, setAllStacks] = useState<StackItem[]>([]);
  const [allCities, setAllCities] = useState<CityItem[]>([]);

  // Estados de edição
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    cityId: '',
    experienceLevel: 'MID',
    salary: '',
    stacks: [] as string[], // nomes das stacks
  });
  const [toast, setToast] = useState<ToastData | null>(null);

  /* ── Carrega perfil + recursos do banco em paralelo ── */
  async function loadProfile() {
    try {
      const [p, h, stacks, cities] = await Promise.all([
        api.getProfile(),
        api.getSalaryHistory(),
        api.listStacks(),
        api.listCities(),
      ]);
      setProfile(p);
      setHistory(Array.isArray(h) ? h : []);
      setAllStacks(Array.isArray(stacks) ? stacks : []);
      setAllCities(Array.isArray(cities) ? cities : []);
    } catch {
      console.warn('Erro ao carregar perfil, usando dados fake');
      setProfile({
        userId: 'idFaked',
        email: 'fake@email.com',
        nome: 'Usuário fake',
        city: 'cidadeFaked',
        experienceLevel: 'SENIOR',
        stacks: ['faked', 'faked2', 'faked3'],
        currentSalary: 12000,
      });
      setHistory([
        { salary: 7000, createdAt: '2024-01-10T00:00:00Z' },
        { salary: 8500, createdAt: '2024-06-02T00:00:00Z' },
        { salary: 10000, createdAt: '2025-01-01T00:00:00Z' },
        { salary: 12000, createdAt: '2025-07-15T00:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  async function handleOpenModal() {
    try {
      const stacks = await api.getProfileStacks();
      setProfileStacks(stacks);
    } catch {
      setProfileStacks(
        (profile?.stacks || []).map((name, i) => ({ id: String(i), name }))
      );
    }
    setIsModalOpen(true);
  }

  async function handleStacksChanged() {
    await loadProfile();
  }

  /* ── Abre sidebar de edição, resolvendo IDs ── */
  function handleOpenEdit() {
    const cityName = profile?.city || '';
    const matchedCity = allCities.find(
      c => c.name.toLowerCase() === cityName.toLowerCase()
    );

    setIsEditing(true);
    setEditForm({
      name: displayName,
      email: displayEmail,
      password: '',
      cityId: matchedCity?.id || '',
      experienceLevel: profile?.experienceLevel || 'MID',
      salary: profile?.currentSalary?.toString() || '0',
      stacks: profile?.stacks || [],
    });
  }

  /* ── Toggle stack pelo nome ── */
  function toggleStack(name: string) {
    setEditForm(prev => ({
      ...prev,
      stacks: prev.stacks.includes(name)
        ? prev.stacks.filter(s => s !== name)
        : [...prev.stacks, name],
    }));
  }

  /* ── Salva edição ── */
  async function handleSaveEdit() {
    setIsSaving(true);
    try {
      const selectedCity = allCities.find(c => c.id === editForm.cityId);
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        experienceLevel: editForm.experienceLevel,
        salary: Number(editForm.salary),
        cityId: editForm.cityId || undefined,
        city: selectedCity?.name || undefined,
        stacks: editForm.stacks,
      };
      if (editForm.password) payload.password = editForm.password;

      await api.updateProfile(payload);
      setToast({
        type: 'success',
        title: 'Perfil atualizado',
        message: `Seus dados, ${editForm.name}, foram salvos com sucesso.`,
      });
      setIsEditing(false);
      await loadProfile();
    } catch {
      setToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: `Não foi possível salvar as alterações, ${editForm.name}.`,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  const displayName = user?.nome || profile?.nome || '—';
  const displayEmail = user?.email || profile?.email || '';

  if (loading) {
    return (
      <div className="profile">
        <div className="skeleton" style={{ height: 200, borderRadius: 18 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 18, marginTop: 24 }} />
      </div>
    );
  }

  return (
    <div className="profile">
      {/* ── Profile Card ── */}
      <div className="profile__card">
        <div className="profile__card-bg" />
        <div className="profile__card-content">
          <div className="profile__avatar">
            <User size={32} strokeWidth={1.5} />
          </div>
          <div className="profile__info">
            <h2 className="profile__name">{displayName}</h2>
            <div className="profile__email">
              <Mail size={13} />
              <span>{displayEmail}</span>
            </div>
            <p className="profile__sub">Profissional de Tecnologia</p>
          </div>
          <button
            className="icon-btn"
            style={{ marginLeft: 'auto', alignSelf: 'flex-start', color: '#fff' }}
            onClick={handleOpenEdit}
            title="Editar Perfil"
          >
            <Pencil size={20} />
          </button>
        </div>

        <div className="profile__details">
          <div className="profile__detail">
            <MapPin size={16} />
            <span>{profile?.city || 'N/A'}</span>
          </div>
          <div className="profile__detail">
            <Briefcase size={16} />
            <span>
              {profile?.experienceLevel
                ? (expLabels[profile.experienceLevel] ?? profile.experienceLevel)
                : 'N/A'}
            </span>
          </div>
          <div className="profile__detail profile__detail--salary">
            <DollarSign size={16} />
            <span className="profile__salary-value">
              {profile?.currentSalary ? formatCurrency(profile.currentSalary) : 'N/A'}
            </span>
            <span className="profile__salary-label">/ mês</span>
          </div>
        </div>
      </div>

      <div className="profile__grid">
        {/* Stacks */}
        <div className="profile__panel">
          <div className="profile__panel-header">
            <div>
              <h3 className="profile__panel-title">
                <Code2 size={18} />
                Minhas Stacks
              </h3>
              <p className="profile__panel-sub">{profile?.stacks.length} tecnologias</p>
            </div>
            <button className="profile__add-btn" id="add-stack-btn" onClick={handleOpenModal}>
              <Plus size={16} />
              <span>Adicionar</span>
            </button>
          </div>
          <div className="profile__stacks">
            {profile?.stacks.map((stack, i) => (
              <span key={stack} className="stack-tag" style={{ animationDelay: `${i * 80}ms` }}>
                {stack}
              </span>
            ))}
          </div>
        </div>

        {/* Salary History */}
        <div className="profile__panel">
          <div className="profile__panel-header">
            <div>
              <h3 className="profile__panel-title">
                <Clock size={18} />
                Histórico Salarial
              </h3>
              <p className="profile__panel-sub">Evolução ao longo do tempo</p>
            </div>
          </div>

          <div className="salary-chart" style={{ height: '240px', marginTop: '1rem' }}>
            {history.length === 0 ? (
              <p style={{ color: '#9CA3AF' }}>Nenhum histórico disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[...history].reverse().map(h => ({
                    ...h,
                    displayDate: formatDate(h.createdAt),
                  }))}
                >
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="var(--color-gray-400)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--color-gray-400)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `R$ ${v >= 1000 ? v / 1000 + 'k' : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      color: 'var(--color-gray-800)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                    itemStyle={{ color: 'var(--color-primary-600)' }}
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Salário']}
                  />
                  <Area
                    type="monotone"
                    dataKey="salary"
                    stroke="var(--color-primary-500)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSalary)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Modal de gerenciamento de stacks */}
      <StacksModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profileStacks={profileStacks}
        onStacksChanged={handleStacksChanged}
      />

      {/* Overlay */}
      {isEditing && (
        <div className="sidebar-overlay" onClick={() => setIsEditing(false)} />
      )}

      {/* ── Edit Sidebar ── */}
      <div className={`edit-sidebar ${isEditing ? 'open' : ''}`}>
        <div className="edit-sidebar__header">
          <h3>Atualizar Meus Dados</h3>
          <button className="icon-btn" onClick={() => setIsEditing(false)}>
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
            <label>E-mail</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          {/* Senha */}
          <div className="form-group row">
            <label>Nova Senha (opcional)</label>
            <input
              type="password"
              placeholder="Deixe em branco para não alterar"
              value={editForm.password}
              onChange={e => setEditForm({ ...editForm, password: e.target.value })}
            />
          </div>

          {/* Cidade — select dinâmico do banco */}
          <div className="form-group row">
            <label>Localização (Cidade)</label>
            {allCities.length > 0 ? (
              <select
                value={editForm.cityId}
                onChange={e => setEditForm({ ...editForm, cityId: e.target.value })}
              >
                <option value="">Selecione a cidade...</option>
                {allCities.map(c => (
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

          {/* Nível de Experiência — enum do sistema */}
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

          {/* Stacks — chips + select dinâmico do banco */}
          <div className="form-group row">
            <label>Suas Stacks</label>

            {/* Chips das stacks já selecionadas */}
            {editForm.stacks.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {editForm.stacks.map(name => (
                  <span
                    key={name}
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
                    {name}
                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleStack(name)} />
                  </span>
                ))}
              </div>
            )}

            {/* Select — somente stacks do banco ainda não adicionadas */}
            {allStacks.length > 0 ? (
              <select
                value=""
                onChange={e => { if (e.target.value) toggleStack(e.target.value); }}
              >
                <option value="">Selecione para adicionar...</option>
                {allStacks
                  .filter(s => !editForm.stacks.includes(s.name))
                  .map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
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
          <button className="btn-secondary" onClick={() => setIsEditing(false)}>
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