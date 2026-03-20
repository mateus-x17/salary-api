import { useEffect, useState } from 'react';
import {
  TrendingUp,
  MapPin,
  Code2,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api';
import './Analytics.css';

interface StackData {
  stack: string;
  averageSalary: number;
  totalRecords: number;
}

export function AnalyticsPage() {
  const [globalAvg, setGlobalAvg] = useState<number | null>(null);
  const [ranking, setRanking] = useState<StackData[]>([]);
  const [stacks, setStacks] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; state: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [g, r, s, c] = await Promise.all([
          api.getGlobalAnalytics(),
          api.getStackRanking(),
          api.listStacks(),
          api.listCities(),
        ]);
        setGlobalAvg(g.averageSalary);
        setRanking(Array.isArray(r) ? r : []);
        setStacks(Array.isArray(s) ? s : []);
        setCities(Array.isArray(c) ? c : []);
      } catch {
        // fallback com dados fake para desenvolvimento local ou em caso de erro
        console.warn('Erro ao carregar analytics, usando dados fake');
        setGlobalAvg(8500);
        setRanking([
          { stack: 'fake1', averageSalary: 13500, totalRecords: 18 },
          { stack: 'fake2', averageSalary: 12000, totalRecords: 45 },
          { stack: 'fake3', averageSalary: 11500, totalRecords: 38 },
          { stack: 'fake4', averageSalary: 11200, totalRecords: 52 },
          { stack: 'fake5', averageSalary: 10800, totalRecords: 33 },
          { stack: 'fake6', averageSalary: 10200, totalRecords: 29 },
          { stack: 'fake7', averageSalary: 14000, totalRecords: 8 },
          { stack: 'fake8', averageSalary: 9800, totalRecords: 15 },
        ]);
        setStacks([
          { id: '1', name: 'fake1' },
          { id: '2', name: 'fake2' },
          { id: '3', name: 'fake3' },
        ]);
        setCities([
          { id: '1', name: 'fake1', state: 'SP' },
          { id: '2', name: 'fake2', state: 'MG' },
          { id: '3', name: 'fake3', state: 'RJ' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const maxSalary = Math.max(...ranking.map((r) => r.averageSalary), 1);

  const sortedByPop = [...ranking].sort((a, b) => b.totalRecords - a.totalRecords);

  return (
    <div className="analytics">
      {/* Header */}
      <div className="analytics__header">
        <div>
          <h2 className="analytics__title">Analytics Salariais</h2>
          <p className="analytics__sub">Análise detalhada por stack, cidade e experiência</p>
        </div>
      </div>

      {/* Global Overview */}
      <div className="analytics__overview">
        <div className="overview-card overview-card--hero">
          <div className="overview-card__icon">
            <TrendingUp size={28} />
          </div>
          <div className="overview-card__data">
            <span className="overview-card__value">
              {loading ? '...' : globalAvg ? formatCurrency(globalAvg) : 'N/A'}
            </span>
            <span className="overview-card__label">Média Global Mensal</span>
          </div>
          <div className="overview-card__badge">
            <ArrowUpRight size={14} />
            <span>Atualizado em tempo real</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card__small-icon overview-card__small-icon--stack">
            <Code2 size={20} />
          </div>
          <span className="overview-card__small-value">{stacks.length}</span>
          <span className="overview-card__small-label">Stacks</span>
        </div>

        <div className="overview-card">
          <div className="overview-card__small-icon overview-card__small-icon--city">
            <MapPin size={20} />
          </div>
          <span className="overview-card__small-value">{cities.length}</span>
          <span className="overview-card__small-label">Cidades</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics__grid">
        {/* Bar chart by salary (wide) */}
        <div className="analytics__panel analytics__panel--wide">
          <h3 className="analytics__panel-title">Média Salarial por Stack</h3>
          <p className="analytics__panel-sub">Ordenado pela maior média</p>
          <div className="analytics__bars">
            {ranking
              .sort((a, b) => b.averageSalary - a.averageSalary)
              .map((item, i) => (
                <div key={item.stack} className="a-bar" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="a-bar__label">
                    <span className="a-bar__name">{item.stack}</span>
                    <span className="a-bar__value">{formatCurrency(item.averageSalary)}</span>
                  </div>
                  <div className="a-bar__track">
                    <div
                      className="a-bar__fill"
                      style={{
                        width: `${(item.averageSalary / maxSalary) * 100}%`,
                        background: `hsl(${230 + i * 15}, 65%, ${55 + i * 3}%)`,
                      }}
                    />
                  </div>
                  <span className="a-bar__count">{item.totalRecords} profissionais</span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Stacks by Popularity */}
        <div className="analytics__panel">
          <h3 className="analytics__panel-title">Popularidade por Stack</h3>
          <p className="analytics__panel-sub">Por número de profissionais</p>
          <div className="pop-list">
            {sortedByPop.slice(0, 5).map((item, i) => (
              <div key={item.stack} className="pop-item" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="pop-item__rank">{i + 1}</div>
                <div className="pop-item__info">
                  <span className="pop-item__name">{item.stack}</span>
                  <span className="pop-item__count">{item.totalRecords} profissionais</span>
                </div>
                <span className="pop-item__salary">{formatCurrency(item.averageSalary)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
