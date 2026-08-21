import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function RegisterStaffPage() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [inviteToken, setInviteToken] = useState(tokenParam);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenParam) setInviteToken(tokenParam);
  }, [tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== passwordConfirm) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5150/api/admin/staff/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_token: inviteToken,
          name,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao concluir cadastro do administrador.');
      }

      setSuccess('Cadastro concluído com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Token de convite inválido ou expirado (mais de 24h).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#100130',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#19023C',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        color: '#FAFAF8'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img 
            src="/agilizapro_logo_rounded.png" 
            alt="AgilizaPro" 
            style={{ width: '70px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
          />
          <h1 style={{ fontSize: '1.3rem', color: '#FAFAF8', margin: 0, fontWeight: 800 }}>Concluir Cadastro de Staff</h1>
          <p style={{ fontSize: '0.85rem', color: '#B3F63F', marginTop: '4px', fontWeight: 600 }}>● Convite Válido por 24 horas</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(179, 246, 63, 0.15)', border: '1px solid #B3F63F', color: '#B3F63F', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 700 }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#b8b3ce', marginBottom: '6px', fontWeight: 600 }}>Token de Convite</label>
            <input 
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              required
              placeholder="stf_..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#100130', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FAFAF8', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#b8b3ce', marginBottom: '6px', fontWeight: 600 }}>Seu Nome Completo</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Digite seu nome"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#100130', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FAFAF8', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#b8b3ce', marginBottom: '6px', fontWeight: 600 }}>Crie sua Senha de Administrador</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#100130', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FAFAF8', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#b8b3ce', marginBottom: '6px', fontWeight: 600 }}>Confirme a Senha</label>
            <input 
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#100130', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FAFAF8', fontSize: '0.9rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              backgroundColor: '#B3F63F',
              color: '#100130',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(179, 246, 63, 0.3)'
            }}
          >
            {loading ? 'Finalizando Cadastro...' : 'Concluir & Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
