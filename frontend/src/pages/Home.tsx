import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">TechSalary Intelligence</div>
        <div className="home-actions">
          <button className="btn-secondary" onClick={() => navigate('/login')}>Entrar</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Criar Conta</button>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="hero-title"
          >
            Descubra o Verdadeiro Valor <br /> da sua Carreira Tech
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-subtitle"
          >
            Analytics avançados, médias salariais por stack e cidade, e insights poderosos para tomar as melhores decisões profissionais.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hero-cta"
          >
            <button className="btn-primary large" onClick={() => navigate('/register')}>
              Começar Agora
            </button>
          </motion.div>
        </section>

        <section className="features-section">
          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="feature-icon bg-indigo">📊</div>
            <h3>Analytics em Tempo Real</h3>
            <p>Compare seu salário com a média de mercado usando gráficos dinâmicos e precisos.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="feature-icon bg-emerald">🌍</div>
            <h3>Ranking de Cidades</h3>
            <p>Descubra os polos tecnológicos que oferecem as melhores remunerações para sua stack.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="feature-icon bg-purple">🔒</div>
            <h3>Dados Seguros</h3>
            <p>Seu perfil é anônimo nas estatísticas públicas. A privacidade é o nosso foco.</p>
          </motion.div>
        </section>
      </main>
    </div>
  );
};
