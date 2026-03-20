import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';
import LoadingState from '../components/LoadingState';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  // Assume a useAuth custom hook or api service will handle this
  const { register } = useAuth() as any; 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    experience_level: 'JUNIOR',
    salary: '',
    stacks: '',
    city: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Ex: transform stacks string to array
      const payload = {
        ...formData,
        salary: Number(formData.salary),
        stacks: formData.stacks.split(',').map((s) => s.trim()).filter(Boolean)
      };
      
      // Chamar backend/API aqui
      // await api.post('/auth/register', payload); ou usar register() do contexto se implementado
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

  if (loading) {
    return <LoadingState message="Criando sua conta..." />;
  }

  return (
    <div className="register-container">
      <motion.div 
        className="register-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="register-header">
          <h2>Criar Conta</h2>
          <p>Junte-se ao TechSalary Intelligence</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group grid-2">
            <div>
              <label>Nome Completo</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="modern-input" placeholder="Seu nome" />
            </div>
            <div>
              <label>E-mail</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="modern-input" placeholder="seu@email.com" />
            </div>
          </div>

          <div className="form-group grid-2">
            <div>
              <label>Senha</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="modern-input" placeholder="Sua senha secreta" />
            </div>
            <div>
              <label>Nível de Experiência</label>
              <select name="experience_level" value={formData.experience_level} onChange={handleChange} className="modern-input">
                <option value="JUNIOR">Júnior</option>
                <option value="MID">Pleno (Mid-Level)</option>
                <option value="SENIOR">Sênior</option>
              </select>
            </div>
          </div>

          <div className="form-group grid-2">
            <div>
              <label>Salário Atual (R$)</label>
              <input type="number" name="salary" required value={formData.salary} onChange={handleChange} className="modern-input" placeholder="Ex: 5000" min="0" />
            </div>
            <div>
              <label>Cidade principal</label>
              <input type="text" name="city" required value={formData.city} onChange={handleChange} className="modern-input" placeholder="Ex: São Paulo" />
            </div>
          </div>
          
          <div className="form-group">
            <label>Stacks (separadas por vírgula)</label>
            <input type="text" name="stacks" value={formData.stacks} onChange={handleChange} className="modern-input" placeholder="Ex: React, Node.js, Python" />
          </div>

          <button type="submit" className="btn-primary full-width">Cadastrar</button>
        </form>

        <div className="register-footer">
          <p>Já possui uma conta? <span onClick={() => navigate('/login')} className="link">Fazer Login</span></p>
        </div>
      </motion.div>
    </div>
  );
};
