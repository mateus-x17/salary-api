import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp } from 'lucide-react';
import './Login.css';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Background decorations */}
      <div className="login__bg-blob login__bg-blob--1" />
      <div className="login__bg-blob login__bg-blob--2" />
      <div className="login__bg-blob login__bg-blob--3" />

      <div className="login__card">
        <div className="login__header">
          <div className="login__logo">
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
          <h1 className="login__title">Salary Intelligence</h1>
          <p className="login__subtitle">Acesse o painel de análise salarial</p>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          {error && <div className="login__error">{error}</div>}

          <div className="login__field">
            <label className="login__label" htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              className="login__input"
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login__field">
            <label className="login__label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              className="login__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login__btn"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <span className="login__spinner" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="login__footer">
          Tech Salary Intelligence API &middot; v1.0
        </p>
      </div>
    </div>
  );
}
