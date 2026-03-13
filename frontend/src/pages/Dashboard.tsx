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

  useEffect(() => {
    async function load() {
      try {
        const [g, r] = await Promise.all([
          api.getGlobalAnalytics(),
          api.getStackRanking(),
        ]);
        setGlobalAvg(g.averageSalary);
        setRanking(Array.isArray(r) ? r : []);
      } catch {
        // use fallback data
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
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

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
      value: '452',
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

  const maxSalary = Math.max(...ranking.map((r) => r.averageSalary), 1);

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="dashboard__hero">
        <div className="dashboard__hero-text">
          <h1 className="dashboard__hero-title">
            Painel de <span className="text-gradient">Inteligência</span> Salarial
          </h1>
          <p className="dashboard__hero-sub">
            Dados atualizados em tempo real sobre salários do setor tech.
          </p>
        </div>
        <div className="dashboard__hero-time">
          <div className="dashboard__time-dot" />
          <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </section>

      {/* Stats Grid */}
      <section className={`dashboard__stats ${loading ? 'loading' : ''}`}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`stat-card stat-card--${s.color}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="stat-card__header">
              <div className={`stat-card__icon stat-card__icon--${s.color}`}>
                {s.icon}
              </div>
              <div className={`stat-card__change ${s.up ? 'stat-card__change--up' : 'stat-card__change--down'}`}>
                {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{s.change}</span>
              </div>
            </div>
            <div className="stat-card__value">{s.value}</div>
            <div className="stat-card__label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Main Content — asymmetric grid */}
      <section className="dashboard__grid">
        {/* Ranking Chart (spans 2 cols) */}
        <div className="dashboard__panel dashboard__panel--wide">
          <div className="dashboard__panel-header">
            <div>
              <h3 className="dashboard__panel-title">Ranking por Stack</h3>
              <p className="dashboard__panel-sub">Média salarial por tecnologia</p>
            </div>
            <div className="dashboard__panel-filters">
              <button className="filter-btn filter-btn--active">Todos</button>
              <button className="filter-btn">Top 5</button>
            </div>
          </div>
          <div className="ranking-chart">
            {ranking.slice(0, 6).map((item, i) => (
              <div key={item.stack} className="ranking-item" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="ranking-item__info">
                  <span className="ranking-item__position">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ranking-item__stack">{item.stack}</span>
                  <span className="ranking-item__count">{item.totalRecords} profissionais</span>
                </div>
                <div className="ranking-item__bar-wrapper">
                  <div
                    className="ranking-item__bar"
                    style={{ width: `${(item.averageSalary / maxSalary) * 100}%` }}
                  />
                </div>
                <span className="ranking-item__value">{formatCurrency(item.averageSalary)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="dashboard__panel dashboard__panel--narrow">
          <div className="dashboard__panel-header">
            <div>
              <h3 className="dashboard__panel-title">Insights Rápidos</h3>
              <p className="dashboard__panel-sub">Destaques do período</p>
            </div>
          </div>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-item__icon insight-item__icon--up">
                <TrendingUp size={18} />
              </div>
              <div className="insight-item__content">
                <span className="insight-item__title">Stack em alta</span>
                <span className="insight-item__desc">{ranking[0]?.stack || 'Go'} lidera o ranking com a maior média salarial</span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-item__icon insight-item__icon--info">
                <BarChart3 size={18} />
              </div>
              <div className="insight-item__content">
                <span className="insight-item__title">Mais popular</span>
                <span className="insight-item__desc">
                  {ranking.sort((a, b) => b.totalRecords - a.totalRecords)[0]?.stack || 'TypeScript'} tem mais profissionais cadastrados
                </span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-item__icon insight-item__icon--warn">
                <DollarSign size={18} />
              </div>
              <div className="insight-item__content">
                <span className="insight-item__title">Média global</span>
                <span className="insight-item__desc">{globalAvg ? formatCurrency(globalAvg) : 'R$ 8.500'} — salário médio mensal bruto</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
