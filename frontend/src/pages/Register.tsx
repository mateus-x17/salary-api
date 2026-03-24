import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { TrendingUp, Loader2 } from 'lucide-react';
import './Register.css';

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
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'MID', label: 'Pleno (Mid-Level)' },
  { value: 'SENIOR', label: 'Sênior' },
  { value: 'STAFF_PLUS', label: 'Staff / Principal' },
  { value: 'LEAD', label: 'Tech Lead / Management' },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth() as any;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    experience_level: 'JUNIOR',
    salary: '',
    stacks: [] as string[],   // array de IDs
    cityId: '',
  });

  const [stacksList, setStacksList] = useState<Stack[]>([]);
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Carrega stacks e cidades do backend ── */
  useEffect(() => {
    async function loadResources() {
      try {
        const [stacks, cities] = await Promise.all([api.listStacks(), api.listCities()]);
        setStacksList(Array.isArray(stacks) ? stacks : []);
        setCitiesList(Array.isArray(cities) ? cities : []);
      } catch {
        // deixa listas vazias — formulário ainda funciona sem elas
      } finally {
        setResourcesLoading(false);
      }
    }
    loadResources();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ── Adiciona / remove stack pelo ID ── */
  const toggleStack = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stacks: prev.stacks.includes(id)
        ? prev.stacks.filter(s => s !== id)
        : [...prev.stacks, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        experience_level: formData.experience_level,
        salary: Number(formData.salary),
        cityId: formData.cityId || undefined,
        stacks: formData.stacks,
      };
      console.log('Payload de registro:', payload);

      if (register) {
        await register(payload);
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      {/* Background blobs — mesmos do Login */}
      <div className="register__bg-blob register__bg-blob--1" />
      <div className="register__bg-blob register__bg-blob--2" />
      <div className="register__bg-blob register__bg-blob--3" />

      <div className="register__card">
        {/* Header */}
        <div className="register__header">
          <div className="register__logo">
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
          <h1 className="register__title">Criar Conta</h1>
          <p className="register__subtitle">Junte-se ao Tech Salary Intelligence</p>
        </div>

        {error && <div className="register__error">{error}</div>}

        <form className="register__form" onSubmit={handleSubmit}>

          {/* Linha 1 — Nome + Email */}
          <div className="register__grid-2">
            <div className="register__field">
              <label className="register__label" htmlFor="reg-name">Nome Completo</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                className="register__input"
                placeholder="Seu nome"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="register__field">
              <label className="register__label" htmlFor="reg-email">E-mail</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                className="register__input"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Linha 2 — Senha + Nível de Experiência */}
          <div className="register__grid-2">
            <div className="register__field">
              <label className="register__label" htmlFor="reg-password">Senha</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                className="register__input"
                placeholder="Sua senha secreta"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="register__field">
              <label className="register__label" htmlFor="reg-experience">Nível de Experiência</label>
              <select
                id="reg-experience"
                name="experience_level"
                className="register__input"
                value={formData.experience_level}
                onChange={handleChange}
              >
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 3 — Salário + Cidade */}
          <div className="register__grid-2">
            <div className="register__field">
              <label className="register__label" htmlFor="reg-salary">Salário Atual (R$)</label>
              <input
                id="reg-salary"
                type="number"
                name="salary"
                className="register__input"
                placeholder="Ex: 5000"
                min="0"
                value={formData.salary}
                onChange={handleChange}
                required
              />
            </div>
            <div className="register__field">
              <label className="register__label" htmlFor="reg-city">Cidade</label>
              {resourcesLoading ? (
                <div className="register__input register__input--loading">
                  <Loader2 size={16} className="register__spinner-icon" />
                  <span>Carregando...</span>
                </div>
              ) : (
                <select
                  id="reg-city"
                  name="cityId"
                  className="register__input"
                  value={formData.cityId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione a cidade...</option>
                  {citiesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.state}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Stacks — chips selecionáveis */}
          <div className="register__field">
            <label className="register__label">Stacks Tecnológicas</label>
            {resourcesLoading ? (
              <div className="register__stacks-loading">
                <Loader2 size={16} className="register__spinner-icon" />
                <span>Carregando stacks...</span>
              </div>
            ) : stacksList.length > 0 ? (
              <div className="register__stacks">
                {stacksList.map(stack => {
                  const selected = formData.stacks.includes(stack.id);
                  return (
                    <button
                      key={stack.id}
                      type="button"
                      className={`register__stack-chip ${selected ? 'register__stack-chip--selected' : ''}`}
                      onClick={() => toggleStack(stack.id)}
                    >
                      {stack.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="register__stacks-empty">Nenhuma stack disponível no momento.</p>
            )}
          </div>

          <button
            type="submit"
            className="register__btn"
            disabled={loading}
          >
            {loading ? <span className="register__spinner" /> : 'Criar Conta'}
          </button>
        </form>

        <div className="register__footer-nav">
          <p>
            Já possui uma conta?{' '}
            <span onClick={() => navigate('/login')} className="register__link">
              Fazer Login
            </span>
          </p>
        </div>

        <p className="register__footer">
          Tech Salary Intelligence API &middot; v1.0
        </p>
      </div>
    </div>
  );
};