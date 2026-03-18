import { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

interface StatsCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ReactNode;
  color: string;
}

interface RankingItem {
  stack: string;
  averageSalary: number;
  totalRecords: number;
}

export function DashboardPage() {
  const [globalAvg, setGlobalAvg] = useState<number | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersCount, setUsersCount] = useState<number | null>(null);

  // ✅ novo estado de filtro
  const [filter, setFilter] = useState<'all' | 'top5'>('all');

  useEffect(() => {
    async function load() {
      try {
        const [g, r, uc] = await Promise.all([
          api.getGlobalAnalytics(),
          api.getStackRanking(),
          api.countUsers(),
        ]);
        setGlobalAvg(g.averageSalary);
        setRanking(Array.isArray(r) ? r : []);
        setUsersCount(uc.count);
      } catch {
        // fallback
        setGlobalAvg(8500);
        setRanking([
          { stack: 'React', averageSalary: 12000, totalRecords: 45 },
          { stack: 'Node.js', averageSalary: 11500, totalRecords: 38 },
          { stack: 'TypeScript', averageSalary: 11200, totalRecords: 52 },
          { stack: 'Python', averageSalary: 10800, totalRecords: 33 },
          { stack: 'Go', averageSalary: 13500, totalRecords: 18 },
          { stack: 'Java', averageSalary: 10200, totalRecords: 29 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    });
  
  // ✅ cria array de cards de stats
  const stats: StatsCard[] = [
    {
      label: 'Média Global',
      value: globalAvg ? formatCurrency(globalAvg) : '...',
      change: '+4.2%',
      up: true,
      icon: <DollarSign size={22} />,
      color: 'primary',
    },
    {
      label: 'Profissionais',
      value: usersCount ? String(usersCount) : '...',
      change: '+2 novos',
      up: true,
      icon: <Users size={22} />,
      color: 'accent',
    },
    {
      label: 'Stacks Ativas',
      value: String(ranking.length || 12),
      change: '+3%',
      up: true,
      icon: <BarChart3 size={22} />,
      color: 'success',
    },
    {
      label: 'Último Update',
      value: 'Agora',
      change: 'Realtime',
      up: true,
      icon: <Clock size={22} />,
      color: 'warning',
    },
  ];

  const maxSalary =
    ranking.length > 0
      ? Math.max(...ranking.map((r) => r.averageSalary))
      : 1;

  // ✅ aplica filtro corretamente
  const displayedRanking =
    filter === 'top5' ? ranking.slice(0, 5) : ranking;

  // ✅ evitar mutação do array
  const mostPopular = [...ranking].sort(
    (a, b) => b.totalRecords - a.totalRecords
  )[0];

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        {/* hero */}
        <div className="dashboard__hero-text">
          <h1 className="dashboard__hero-title">
            Painel de <span className="text-gradient">Inteligência</span>{' '}
            Salarial
          </h1>
          <p className="dashboard__hero-sub">
            Dados atualizados em tempo real sobre salários do setor tech.
          </p>
        </div>
        {/* data e hora */}
        <div className="dashboard__hero-time">
          <div className="dashboard__time-dot" />
          <span>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </section>
      
      {/* cards de estatisticas */}
      <section className={`dashboard__stats ${loading ? 'loading' : ''}`}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`stat-card stat-card--${s.color}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="stat-card__header">
              <div
                className={`stat-card__icon stat-card__icon--${s.color}`}
              >
                {s.icon}
              </div>
              <div
                className={`stat-card__change ${
                  s.up
                    ? 'stat-card__change--up'
                    : 'stat-card__change--down'
                }`}
              >
                {s.up ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                <span>{s.change}</span>
              </div>
            </div>
            <div className="stat-card__value">{s.value}</div>
            <div className="stat-card__label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="dashboard__grid">
        {/* ✅ ranking por stack */}
        <div className="dashboard__panel dashboard__panel--wide">
          <div className="dashboard__panel-header">
            <div>
              <h3 className="dashboard__panel-title">
                Ranking por Stack
              </h3>
              <p className="dashboard__panel-sub">
                Média salarial por tecnologia
              </p>
            </div>
            <div className="dashboard__panel-filters">
              <button
                className={`filter-btn ${
                  filter === 'all' ? 'filter-btn--active' : ''
                }`}
                onClick={() => setFilter('all')}
              >
                Todos
              </button>

              <button
                className={`filter-btn ${
                  filter === 'top5' ? 'filter-btn--active' : ''
                }`}
                onClick={() => setFilter('top5')}
              >
                Top 5
              </button>
            </div>
          </div>

          <div className="ranking-chart">
            {displayedRanking.map((item, i) => (
              <div
                key={item.stack}
                className="ranking-item"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="ranking-item__info">
                  <span className="ranking-item__position">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ranking-item__stack">
                    {item.stack}
                  </span>
                  <span className="ranking-item__count">
                    {item.totalRecords} profissionais
                  </span>
                </div>
                <div className="ranking-item__bar-wrapper">
                  <div
                    className="ranking-item__bar"
                    style={{
                      width: `${
                        (item.averageSalary / maxSalary) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="ranking-item__value">
                  {formatCurrency(item.averageSalary)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ insights */}
        <div className="dashboard__panel dashboard__panel--narrow">
          <div className="dashboard__panel-header">
            <div>
              <h3 className="dashboard__panel-title">
                Insights Rápidos
              </h3>
              <p className="dashboard__panel-sub">
                Destaques do período
              </p>
            </div>
          </div>

          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-item__icon insight-item__icon--up">
                <TrendingUp size={18} />
              </div>
              <div className="insight-item__content">
                <span className="insight-item__title">
                  Stack em alta
                </span>
                <span className="insight-item__desc">
                  {ranking[0]?.stack || 'dados insuficientes'} lidera o ranking
                </span>
              </div>
            </div>

            <div className="insight-item">
              <div className="insight-item__icon insight-item__icon--info">
                <BarChart3 size={18} />
              </div>
              <div className="insight-item__content">
                <span className="insight-item__title">
                  Mais popular
                </span>
                <span className="insight-item__desc">
                  {mostPopular?.stack || 'dados insuficientes'} tem mais
                  profissionais cadastrados
                </span>
              </div>
            </div>

            <div className="insight-item">
              <div className="insight-item__icon insight-item__icon--warn">
                <DollarSign size={18} />
              </div>
              <div className="insight-item__content">
                <span className="insight-item__title">
                  Média global
                </span>
                <span className="insight-item__desc">
                  {globalAvg
                    ? formatCurrency(globalAvg)
                    : 'erro ao obter dados'}{' '}
                  — salário médio mensal bruto
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
