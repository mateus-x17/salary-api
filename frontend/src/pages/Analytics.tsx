import { useEffect, useState, useCallback, useRef } from 'react';
import {
  TrendingUp,
  MapPin,
  Code2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Activity,
  X as XIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import './Analytics.css';
import './Analytics-filters.css';

// ── Tipos ─────────────────────────────────────────────────────────────────
interface StackData {
  stack: string;
  averageSalary: number;
  totalRecords: number;
}

interface LevelData {
  experienceLevel: string;
  label: string;
  averageSalary: number;
  totalRecords: number;
}

interface CityRankItem {
  city: string;
  averageSalary: number;
  totalRecords: number;
}

// ── Design tokens como array de cores (tokens css) ───────────────────────
const CHART_COLORS = [
  '#6366F1', // primary-500
  '#06B6D4', // accent-500
  '#10B981', // success-500
  '#F59E0B', // warning-500
  '#A78BFA',
  '#22D3EE',
  '#34D399',
  '#FCD34D',
  '#F472B6',
  '#60A5FA',
];

// ── Tooltip padronizado ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: 'var(--border-light)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      padding: '0.75rem 1rem',
      minWidth: 160,
    }}>
      <p style={{ margin: 0, marginBottom: 6, fontSize: '0.8rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ margin: 0, color: entry.color || '#6366F1', fontWeight: 700, fontSize: '0.95rem' }}>
          R$ {Number(entry.value).toLocaleString('pt-BR')}
        </p>
      ))}
      {payload[0]?.payload?.totalRecords != null && (
        <p style={{ margin: 0, marginTop: 4, fontSize: '0.78rem', color: 'var(--color-gray-400)' }}>
          {payload[0].payload.totalRecords} registro(s)
        </p>
      )}
    </div>
  );
}

type ChartMode = 'bar' | 'line';

// Níveis disponíveis — reflete os valores do backend
const EXPERIENCE_LEVELS = [
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'MID', label: 'Pleno (Mid)' },
  { value: 'SENIOR', label: 'Sênior' },
  { value: 'STAFF_PLUS', label: 'Staff+' },
  { value: 'LEAD', label: 'Lead / Manager' },
];

export function AnalyticsPage() {
  const [globalAvg, setGlobalAvg] = useState<number | null>(null);
  const [baseRanking, setBaseRanking] = useState<StackData[]>([]);
  const [citiesRanking, setCitiesRanking] = useState<{ above: CityRankItem[]; below: CityRankItem[] }>({ above: [], below: [] });
  const [stacks, setStacks] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; state: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados do gráfico dinâmico (muda com filtros)
  const [chartData, setChartData] = useState<StackData[] | LevelData[]>([]);
  const [chartDataKey, setChartDataKey] = useState<'stack' | 'label'>('stack');
  const [chartLoading, setChartLoading] = useState(false);

  // Filtros
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ stackId: '', cityId: '', experienceLevel: '' });
  const [filteredStat, setFilteredStat] = useState<{ averageSalary: number; totalRecords: number } | null>(null);
  const activeFiltersCount = [filters.stackId, filters.cityId, filters.experienceLevel].filter(Boolean).length;

  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [chartTitle, setChartTitle] = useState('Média Salarial por Stack');
  const [chartSub, setChartSub] = useState('Ranking geral de stacks');

  // Evitar re-fetch desnecessário
  const prevFilters = useRef(filters);

  // Carga inicial
  useEffect(() => {
    async function load() {
      try {
        const [g, r, s, c, cr] = await Promise.all([
          api.getGlobalAnalytics(),
          api.getStackRanking(),
          api.listStacks(),
          api.listCities(),
          api.getCityRankings().catch(() => ({ above: [], below: [] }))
        ]);
        setGlobalAvg(g.averageSalary);
        const ranking = Array.isArray(r) ? [...r].sort((a, b) => b.averageSalary - a.averageSalary) : [];
        setBaseRanking(ranking);
        setChartData(ranking);
        setStacks(Array.isArray(s) ? s : []);
        setCities(Array.isArray(c) ? c : []);
        setCitiesRanking(cr || { above: [], below: [] });
      } catch {
        console.warn('Erro ao carregar analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Atualiza gráfico e média filtrada quando filtros mudam
  const updateChartForFilters = useCallback(async (f: typeof filters) => {
    const noFilters = !f.stackId && !f.cityId && !f.experienceLevel;
    if (noFilters) {
      // Sem filtros: mostra ranking global por stack
      setChartData([...baseRanking]);
      setChartDataKey('stack');
      setChartTitle('Média Salarial por Stack');
      setChartSub('Ranking geral de stacks');
      setFilteredStat(null);
      return;
    }

    setChartLoading(true);
    try {
      // Busca média filtrada
      const stat = await api.getFilteredAnalytics(f);
      setFilteredStat(stat);

      // Decide qual chart granular buscar
      if (f.stackId && !f.cityId && !f.experienceLevel) {
        // Stack selecionada → mostra distribuição por nível de experiência
        const data = await api.getChartByStack(f.stackId);
        const sorted = [...data].sort((a, b) => b.averageSalary - a.averageSalary);
        setChartData(sorted as any);
        setChartDataKey('label');
        const stackName = stacks.find(s => s.id === f.stackId)?.name || 'Stack';
        setChartTitle(`Salário por Experiência — ${stackName}`);
        setChartSub('Média por nível de senioridade nesta stack');
      } else if (f.cityId && !f.stackId && !f.experienceLevel) {
        // Cidade selecionada → mostra stacks naquela cidade
        const data = await api.getChartByCity(f.cityId);
        const sorted = [...data].sort((a, b) => b.averageSalary - a.averageSalary);
        setChartData(sorted);
        setChartDataKey('stack');
        const cityName = cities.find(c => c.id === f.cityId)?.name || 'Cidade';
        setChartTitle(`Stacks em ${cityName}`);
        setChartSub('Média salarial por stack nesta cidade');
      } else if (f.experienceLevel && !f.stackId && !f.cityId) {
        // Nível de exp → mostra stacks naquele nível
        const data = await api.getChartByLevel(f.experienceLevel);
        const sorted = [...data].sort((a, b) => b.averageSalary - a.averageSalary);
        setChartData(sorted);
        setChartDataKey('stack');
        const levelLabel = EXPERIENCE_LEVELS.find(l => l.value === f.experienceLevel)?.label || f.experienceLevel;
        setChartTitle(`Stacks — Nível ${levelLabel}`);
        setChartSub('Média salarial por stack neste nível');
      } else {
        // Combinação múltipla: exibe stacks filtradas
        let data: StackData[];
        if (f.cityId) {
          data = await api.getChartByCity(f.cityId);
        } else if (f.experienceLevel) {
          data = await api.getChartByLevel(f.experienceLevel);
        } else {
          data = [...baseRanking];
        }
        // Se tem stackId, filtra no front para o selecionado
        if (f.stackId) {
          const stackName = stacks.find(s => s.id === f.stackId)?.name;
          data = stackName ? data.filter(d => d.stack === stackName) : data;
        }
        const sorted = [...data].sort((a, b) => b.averageSalary - a.averageSalary);
        setChartData(sorted);
        setChartDataKey('stack');
        setChartTitle('Resultado dos Filtros Combinados');
        setChartSub('Combinação de stack, cidade e nível');
      }
    } catch (err) {
      console.error('Erro ao carregar dados filtrados:', err);
    } finally {
      setChartLoading(false);
    }
  }, [baseRanking, stacks, cities]);

  useEffect(() => {
    if (JSON.stringify(prevFilters.current) !== JSON.stringify(filters)) {
      prevFilters.current = filters;
      updateChartForFilters(filters);
    }
  }, [filters, updateChartForFilters]);

  function clearFilters() {
    setFilters({ stackId: '', cityId: '', experienceLevel: '' });
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  return (
    <div className="analytics">
      {/* ── Header ── */}
      <div className="analytics__header">
        <div>
          <h2 className="analytics__title">Analytics Salariais</h2>
          <p className="analytics__sub">
            {activeFiltersCount > 0
              ? `${activeFiltersCount} filtro(s) ativo(s) — dados ajustados dinamicamente`
              : 'Análise detalhada por stack, cidade e experiência'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Toggle mode */}
          <div className="chart-mode-toggle">
            <button className={`chart-mode-btn${chartMode === 'bar' ? ' active' : ''}`} onClick={() => setChartMode('bar')}>
              <BarChart2 size={16} /><span>Barras</span>
            </button>
            <button className={`chart-mode-btn${chartMode === 'line' ? ' active' : ''}`} onClick={() => setChartMode('line')}>
              <Activity size={16} /><span>Linha</span>
            </button>
          </div>

          {/* Botão filtros colapsável */}
          <button
            className={`filters-toggle-btn${filtersOpen ? ' open' : ''}${activeFiltersCount > 0 ? ' has-active' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <SlidersHorizontal size={16} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && <span className="filters-badge">{activeFiltersCount}</span>}
            {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Painel de Filtros (colapsável) ── */}
      <div className={`analytics__filters-panel${filtersOpen ? ' open' : ''}`}>
        <div className="analytics__filters">
          <div className="filter-group">
            <label>Stack Tecnológica</label>
            <select value={filters.stackId} onChange={e => setFilters({ ...filters, stackId: e.target.value })}>
              <option value="">Todas as Stacks</option>
              {stacks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Cidade</label>
            <select value={filters.cityId} onChange={e => setFilters({ ...filters, cityId: e.target.value })}>
              <option value="">Todas as Cidades</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}{c.state ? ` — ${c.state}` : ''}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Nível de Experiência</label>
            <select value={filters.experienceLevel} onChange={e => setFilters({ ...filters, experienceLevel: e.target.value })}>
              <option value="">Todos os Níveis</option>
              {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          {activeFiltersCount > 0 && (
            <div className="filter-group" style={{ flex: '0 0 auto', justifyContent: 'flex-end' }}>
              <label style={{ visibility: 'hidden' }}>‎</label>
              <button className="filter-clear-btn" onClick={clearFilters}>
                <XIcon size={14} /> Limpar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Overview Cards ── */}
      <div className="analytics__overview">
        <div className="overview-card overview-card--hero">
          <div className="overview-card__icon"><TrendingUp size={28} /></div>
          <div className="overview-card__data">
            <span className="overview-card__label">
              {filteredStat ? 'Média Filtrada' : 'Média Salarial Global'}
            </span>
            <span className="overview-card__value">
              {loading ? '—' : formatCurrency(filteredStat ? filteredStat.averageSalary : (globalAvg || 0))}
            </span>
            {filteredStat && (
              <span style={{ marginTop: 4, color: '#A5B4FC', fontSize: '0.875rem' }}>
                baseado em {filteredStat.totalRecords} registro(s)
              </span>
            )}
            {!filteredStat && globalAvg && (
              <span style={{ marginTop: 4, color: '#A5B4FC', fontSize: '0.875rem' }}>
                média nacional de todos os profissionais
              </span>
            )}
          </div>
          {filteredStat && <div className="overview-card__badge"><span>Filtrado</span></div>}
        </div>

        <div className="overview-card">
          <div className="overview-card__small-icon overview-card__small-icon--stack"><Code2 size={20} /></div>
          <span className="overview-card__small-value">{stacks.length}</span>
          <span className="overview-card__small-label">Stacks Mapeadas</span>
        </div>

        <div className="overview-card">
          <div className="overview-card__small-icon overview-card__small-icon--city"><MapPin size={20} /></div>
          <span className="overview-card__small-value">{cities.length}</span>
          <span className="overview-card__small-label">Cidades Identificadas</span>
        </div>
      </div>

      {/* ── Grid de Gráficos ── */}
      <div className="analytics__grid">
        {/* Gráfico dinâmico principal */}
        <div className="analytics__panel analytics__panel--wide">
          <h3 className="analytics__panel-title">{chartTitle}</h3>
          <p className="analytics__panel-sub">{chartSub}</p>

          <div style={{ height: 380, marginTop: '1rem', position: 'relative' }}>
            {(loading || chartLoading) ? (
              <div className="skeleton" style={{ height: '100%', borderRadius: 12 }} />
            ) : chartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-gray-400)', flexDirection: 'column', gap: '0.5rem' }}>
                <Code2 size={40} strokeWidth={1} />
                <span>Sem dados para os filtros selecionados.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" vertical={false} />
                    <XAxis
                      dataKey={chartDataKey}
                      stroke="var(--color-gray-300)"
                      tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--color-gray-300)"
                      tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                      tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-primary-50)' }} />
                    <Bar dataKey="averageSalary" name="Salário Médio" radius={[8, 8, 0, 0]} maxBarSize={56}>
                      {chartData.map((_e, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" vertical={false} />
                    <XAxis
                      dataKey={chartDataKey}
                      stroke="var(--color-gray-300)"
                      tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--color-gray-300)"
                      tickFormatter={val => `R$ ${(val / 1000).toFixed(0)}k`}
                      tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="averageSalary"
                      stroke="#6366F1"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#6366F1', stroke: 'white', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ranking de Cidades */}
        <div className="analytics__panel">
          <h3 className="analytics__panel-title">Ranking de Cidades</h3>
          <p className="analytics__panel-sub">
            Média global: <strong>{globalAvg ? formatCurrency(globalAvg) : '—'}</strong>
          </p>

          <h4 className="ranking-section__label ranking-section__label--above">▲ Acima da Média</h4>
          <div className="pop-list">
            {citiesRanking.above.slice(0, 4).map((item, i) => (
              <div key={item.city} className="pop-item" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="pop-item__rank" style={{ background: 'var(--color-success-50)', color: 'var(--color-success-700)' }}>{i + 1}</div>
                <div className="pop-item__info">
                  <span className="pop-item__name">{item.city}</span>
                  <span className="pop-item__count">{item.totalRecords} profissional(is)</span>
                </div>
                <span className="pop-item__salary text-emerald">{formatCurrency(item.averageSalary)}</span>
              </div>
            ))}
            {citiesRanking.above.length === 0 && (
              <p style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                Nenhuma cidade acima da média ainda.
              </p>
            )}
          </div>

          <h4 className="ranking-section__label ranking-section__label--below" style={{ marginTop: '1.5rem' }}>▼ Abaixo da Média</h4>
          <div className="pop-list">
            {citiesRanking.below.slice(0, 4).map((item, i) => (
              <div key={item.city} className="pop-item" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="pop-item__rank" style={{ background: 'var(--color-danger-50)', color: 'var(--color-danger-700)' }}>{i + 1}</div>
                <div className="pop-item__info">
                  <span className="pop-item__name">{item.city}</span>
                  <span className="pop-item__count">{item.totalRecords} profissional(is)</span>
                </div>
                <span className="pop-item__salary text-rose">{formatCurrency(item.averageSalary)}</span>
              </div>
            ))}
            {citiesRanking.below.length === 0 && (
              <p style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                Nenhuma cidade abaixo da média ainda.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
