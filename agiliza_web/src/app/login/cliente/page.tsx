'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AgilizaLogo } from '@/components/ui/AgilizaLogo';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';

export default function LoginCliente() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setAuth(data.token, data, 'CLIENT');
        router.push('/cliente');
      } else {
        setErrorMsg(data.message || data.description || 'Email ou senha incorretos.');
      }
    } catch (err) {
      setErrorMsg('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMsg('');
      setLoading(true);
      try {
        const idToken = tokenResponse.access_token;
        const res = await fetch('/api/auth/social/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken, target_role: 'CLIENT' }) // Changed role to target_role
        });

        const data = await res.json();

        if (res.ok && data.token) {
          setAuth(data.token, data, 'CLIENT');
          if (data.needs_onboarding) {
            router.push('/completar-perfil');
          } else {
            router.push('/cliente');
          }
        } else {
          setErrorMsg(data.message || data.description || 'Falha ao autenticar com a conta Google.');
        }
      } catch (err) {
        setErrorMsg('Erro ao conectar com o servidor. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setErrorMsg('Autenticação com o Google cancelada ou indisponível.');
      setLoading(false);
    }
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: '32px 24px', 
      backgroundColor: 'var(--md-sys-color-bg)' 
    }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <AgilizaLogo size={72} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--md-sys-color-text)' }}>Área do Cliente</h1>
            <p style={{ color: 'var(--md-sys-color-text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>Entre para contratar serviços com rapidez</p>
          </div>
        </div>

        <Card style={{ borderRadius: 'var(--md-shape-xl)', padding: '28px 24px' }}>
          {errorMsg && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#ef4444', 
              padding: '12px 14px', 
              borderRadius: 'var(--md-shape-md)', 
              marginBottom: '18px', 
              fontSize: '0.88rem', 
              fontWeight: 500,
              textAlign: 'center' 
            }}>
              ⚠️ {errorMsg}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input 
              label="Email" 
              type="email" 
              autoComplete="username"
              placeholder="cliente1@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Input 
                label="Senha" 
                type="password" 
                autoComplete="current-password"
                placeholder="123456" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Link href="#" style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-primary)', alignSelf: 'flex-end', fontWeight: 600, marginTop: '2px' }}>
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            <div style={{ position: 'relative', textAlign: 'center', margin: '14px 0' }}>
              <hr style={{ borderTop: '1px solid var(--md-sys-color-border)', borderBottom: 'none' }} />
              <span style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                backgroundColor: 'var(--md-sys-color-surface)', 
                padding: '0 12px', 
                fontSize: '0.8rem', 
                color: 'var(--md-sys-color-text-muted)',
                fontWeight: 500
              }}>
                ou
              </span>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              onClick={() => googleLogin()}
              disabled={loading}
              style={{ color: 'var(--md-sys-color-text)', gap: '10px' }}
            >
              <GoogleIcon size={20} />
              <span>Continuar com Google</span>
            </Button>
          </form>
        </Card>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-text-muted)' }}>
            Não tem uma conta? <Link href="/cadastro/cliente" style={{ color: 'var(--md-sys-color-primary)', fontWeight: 700 }}>Cadastre-se</Link>
          </p>
          
          <Link href="/login/profissional" style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-text-muted)', fontWeight: 600, display: 'inline-block', padding: '6px' }}>
            Sou um Profissional →
          </Link>
        </div>

      </div>
    </div>
  );
}
