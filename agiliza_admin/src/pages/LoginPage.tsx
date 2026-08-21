import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('admin@agilizapro.com.br');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha no login');
      }

      const isStaffUser = data.is_staff || data.role === 'ADMIN' || data.user?.is_staff || data.user?.role === 'ADMIN';
      if (!isStaffUser) {
        throw new Error('Acesso negado: Este usuário não possui privilégios de Administrador.');
      }

      const token = data.token || data.tokens?.access;
      const userObj = {
        id: data.pid || data.user?.id || '',
        email: data.email || data.user?.email || email,
        name: data.name || data.user?.name || 'Administrador',
        is_staff: true,
        role: data.role || data.user?.role || 'ADMIN'
      };

      login(token, userObj);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        color: '#0f172a'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img 
            src="/agilizapro_logo_rounded.png" 
            alt="AgilizaPro" 
            style={{ width: '64px', borderRadius: '14px', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
          />
          <h1 style={{ fontSize: '1.4rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>Painel Administrativo</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Acesso restrito para equipe de gestão</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>E-mail Administrativo</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="username"
              placeholder="admin@agilizapro.com.br"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Senha de Acesso</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }} 
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
