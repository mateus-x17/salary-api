import { useEffect, useState } from 'react';
import {
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Code2,
  Clock,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import { StacksModal } from '../components/StacksModal';
import './Profile.css';

interface ProfileData {
  userId: string;
  city: string;
  experienceLevel: string;
  stacks: string[];
  currentSalary: number;
}

interface SalaryEntry {
  salary: number;
  createdAt: string;
}

// Interface usada pelo modal (precisa de id + name)
interface StackItem {
  id: string;
  name: string;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileStacks, setProfileStacks] = useState<StackItem[]>([]);

  async function loadProfile() {
    try {
      const [p, h] = await Promise.all([
        api.getProfile(),
        api.getSalaryHistory(),
      ]);
      setProfile(p);
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      // Fallback demo
      setProfile({
        userId: '1',
        city: 'São Paulo',
        experienceLevel: 'SENIOR',
        stacks: ['React', 'Node.js', 'TypeScript'],
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

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleOpenModal() {
    // Busca as stacks do perfil com id + name para passar ao modal
    try {
      const stacks = await api.getProfileStacks();
      setProfileStacks(stacks);
    } catch {
      // Se falhar, usa os nomes do profile como fallback (sem id real)
      setProfileStacks(
        (profile?.stacks || []).map((name, i) => ({ id: String(i), name }))
      );
    }
    setIsModalOpen(true);
  }

  // Chamado pelo modal após qualquer adição ou remoção
  async function handleStacksChanged() {
    await loadProfile();
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  const expLabels: Record<string, string> = {
    JUNIOR: 'Júnior (0-2 anos)',
    PLENO: 'Pleno (3-5 anos)',
    SENIOR: 'Sênior (6-10 anos)',
    STAFF_PLUS: 'Staff+ (10+ anos)',
  };

  const maxSalary = Math.max(...history.map((h) => h.salary), 1);

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
      {/* Profile Card */}
      <div className="profile__card">
        <div className="profile__card-bg" />
        <div className="profile__card-content">
          <div className="profile__avatar">
            <User size={32} strokeWidth={1.5} />
          </div>
          <div className="profile__info">
            <h2 className="profile__name">Meu Perfil</h2>
            <p className="profile__sub">Profissional de Tecnologia</p>
          </div>
        </div>

        <div className="profile__details">
          <div className="profile__detail">
            <MapPin size={16} />
            <span>{profile?.city || 'N/A'}</span>
          </div>
          <div className="profile__detail">
            <Briefcase size={16} />
            <span>{profile?.experienceLevel ? expLabels[profile.experienceLevel] || profile.experienceLevel : 'N/A'}</span>
          </div>
          <div className="profile__detail profile__detail--salary">
            <DollarSign size={16} />
            <span className="profile__salary-value">{profile?.currentSalary ? formatCurrency(profile.currentSalary) : 'N/A'}</span>
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

          <div className="salary-chart">
            {history.map((entry, i) => (
              <div key={i} className="salary-chart__item" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="salary-chart__bar-wrapper">
                  <div
                    className="salary-chart__bar"
                    style={{ height: `${(entry.salary / maxSalary) * 100}%` }}
                  />
                </div>
                <span className="salary-chart__value">{formatCurrency(entry.salary)}</span>
                <span className="salary-chart__date">{formatDate(entry.createdAt)}</span>
              </div>
            ))}
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
    </div>
  );
}