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

export function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileStacks, setProfileStacks] = useState<StackItem[]>([]);

  // Estados de Edicao Completos
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', email: '', password: '', city: '', experienceLevel: '', salary: '', stacks: ''
  });

  async function loadProfile() {
    try {
      const [p, h] = await Promise.all([
        api.getProfile(),
        api.getSalaryHistory(),
      ]);
      setProfile(p);
      console.log('Profile data:', p);
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      // Fallback com dados fake para desenvolvimento local ou em caso de erro
      console.warn('Erro ao carregar perfil do admin (ele não existe), usando dados fake');
      const userFake = {
        id: 'idFaked',
        email: 'fake@email.com',
        nome: 'Usuário fake',
        role: 'USER',
        city: 'cidadeFaked',
        experienceLevel: 'SENIOR',
        stacks: ['faked', 'faked2', 'faked3'],
        currentSalary: 12000,
      };
      setProfile({
        ...userFake,
        userId: userFake.id,
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

  useEffect(() => {
    loadProfile();
  }, []);

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

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  const expLabels: Record<string, string> = {
    JUNIOR: 'Júnior (0-2 anos)',
    MID: 'Pleno (3-5 anos)',
    SENIOR: 'Sênior (6-10 anos)',
    STAFF_PLUS: 'Staff+ (10+ anos)',
  };

  // Nome e email vêm do contexto de autenticação (fonte primária),
  // com fallback para os dados do perfil caso o contexto não tenha
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

  function handleOpenEdit() {
    setIsEditing(true);
    setEditForm({
      name: displayName,
      email: displayEmail,
      password: '',
      city: profile?.city || '',
      experienceLevel: profile?.experienceLevel || 'MID',
      salary: profile?.currentSalary?.toString() || '0',
      stacks: profile?.stacks?.join(', ') || ''
    });
  }

  async function handleSaveEdit() {
    setIsSaving(true);
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        experienceLevel: editForm.experienceLevel,
        salary: Number(editForm.salary),
        city: editForm.city,
        stacks: editForm.stacks.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      await api.updateProfile(payload);
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      alert('Houve um erro ao atualizar o perfil.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="profile">
      {/* Profile Card */}
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
          <button className="icon-btn" style={{ marginLeft: 'auto', alignSelf: 'flex-start', color: '#fff' }} onClick={handleOpenEdit} title="Editar Perfil">
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
                ? expLabels[profile.experienceLevel] 
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
            <button
              className="profile__add-btn"
              id="add-stack-btn"
              onClick={handleOpenModal}
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </button>
          </div>
          <div className="profile__stacks">
            {profile?.stacks.map((stack, i) => (
              <span
                key={stack}
                className="stack-tag"
                style={{ animationDelay: `${i * 80}ms` }}
              >
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
                <AreaChart data={[...history].reverse().map(h => ({ ...h, displayDate: formatDate(h.createdAt) }))}>
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="var(--color-gray-400)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-gray-400)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000) + 'k' : value}`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--color-gray-800)', boxShadow: 'var(--shadow-lg)' }}
                    itemStyle={{ color: 'var(--color-primary-600)' }}
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Salário']}
                  />
                  <Area type="monotone" dataKey="salary" stroke="var(--color-primary-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorSalary)" />
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

      {/* Edit Sidebar Overlay */}
      {isEditing && (
        <div className="sidebar-overlay" onClick={() => setIsEditing(false)} />
      )}

      {/* Edit Sidebar */}
      <div className={`edit-sidebar ${isEditing ? 'open' : ''}`}>
        <div className="edit-sidebar__header">
          <h3>Atualizar Meus Dados</h3>
          <button className="icon-btn" onClick={() => setIsEditing(false)}>
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
            <label>E-mail</label>
            <input 
              type="email" 
              value={editForm.email} 
              onChange={e => setEditForm({...editForm, email: e.target.value})} 
            />
          </div>
          <div className="form-group row">
            <label>Nova Senha (opcional)</label>
            <input 
              type="password"
              placeholder="Deixe em branco para não alterar" 
              value={editForm.password} 
              onChange={e => setEditForm({...editForm, password: e.target.value})} 
            />
          </div>

          <div className="form-group row">
            <label>Localização (Cidade)</label>
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
            <label>Suas Stacks</label>
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
              <option value="">Selecione para adicionar...</option>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="C#">C#</option>
              <option value="Go">Go</option>
              <option value="Ruby">Ruby</option>
              <option value="PHP">PHP</option>
              <option value="Vue">Vue</option>
              <option value="Angular">Angular</option>
              <option value="TypeScript">TypeScript</option>
              <option value="AWS">AWS</option>
              <option value="Docker">Docker</option>
            </select>
          </div>
        </div>

        <div className="edit-sidebar__footer">
          <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar Alterações</>}
          </button>
        </div>
      </div>
    </div>
  );
}