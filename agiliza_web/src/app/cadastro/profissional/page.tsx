'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AgilizaLogo } from '@/components/ui/AgilizaLogo';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { validateCPF, formatCPF } from '@/utils/cpf';

export default function CadastroProfissional() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string, icon?: string, parent_id?: string, is_remote?: boolean, is_physical?: boolean}[]>([]);
  const [cpfError, setCpfError] = useState('');

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data.filter(c => !c.parent_id));
        }
      })
      .catch(console.error);
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    if (formatted.replace(/\D/g, '').length === 11) {
      if (!validateCPF(formatted)) {
        setCpfError('CPF inválido. Verifique os dígitos digitados.');
      } else {
        setCpfError('');
      }
    } else {
      setCpfError('');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCPF(cpf)) {
      setCpfError('Informe um CPF válido para se cadastrar como parceiro.');
      return;
    }
    console.log('Cadastro profissional:', { name, email, cpf, password, serviceCategory });
  };

  const googleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setCpfError('');
      setLoading(true);

      try {
        const idToken = tokenResponse.access_token;
        const res = await fetch('/api/auth/social/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken, role: 'PROFESSIONAL' })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem('agiliza_token', data.token);
          localStorage.setItem('agiliza_user', JSON.stringify(data));
          if (data.needs_onboarding) {
            router.push('/completar-perfil');
          } else {
            router.push('/pro');
          }
        } else {
          setCpfError(data.message || data.description || 'Falha ao cadastrar com o Google.');
        }
      } catch (err) {
        setCpfError('Erro de conexão ao comunicar com o servidor.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setCpfError('Autenticação com o Google cancelada.');
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
        
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <AgilizaLogo size={72} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--md-sys-color-text)' }}>Cadastro Profissional</h1>
            <p style={{ color: 'var(--md-sys-color-text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>Cadastre-se para receber novos pedidos</p>
          </div>
        </div>

        <Card style={{ 
          borderRadius: 'var(--md-shape-xl)', 
          padding: '28px 24px',
          borderTop: '4px solid var(--md-sys-color-secondary)'
        }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input 
              label="Nome Completo" 
              type="text" 
              placeholder="Seu nome" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <Input 
              label="Email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input 
                label="CPF do Profissional / Responsável" 
                type="text" 
                placeholder="000.000.000-00" 
                value={cpf}
                onChange={handleCpfChange}
                maxLength={14}
                required
              />
              {cpfError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px', display: 'block', fontWeight: 500 }}>
                  ⚠️ {cpfError}
                </span>
              )}
            </div>
            
            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)', letterSpacing: '0.1px' }}>
                Categoria Principal
              </label>
              <select 
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                required
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--md-shape-md)',
                  border: '1.5px solid var(--md-sys-color-border)',
                  backgroundColor: 'var(--md-sys-color-surface-variant)',
                  fontSize: '1rem',
                  color: 'var(--md-sys-color-text)',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Selecione uma categoria</option>
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || '🛠️'} {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Carregando categorias...</option>
                )}
              </select>
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Cadastrando...' : 'Criar Conta Profissional'}
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
              onClick={() => googleSignup()}
              disabled={loading}
              style={{ color: 'var(--md-sys-color-text)', gap: '10px' }}
            >
              <GoogleIcon size={20} />
              <span>Cadastrar com Google</span>
            </Button>
          </form>
        </Card>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-text-muted)' }}>
            Já é parceiro? <Link href="/login/profissional" style={{ color: 'var(--md-sys-color-secondary)', fontWeight: 700 }}>Faça Login</Link>
          </p>
          
          <Link href="/cadastro/cliente" style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-text-muted)', fontWeight: 600, display: 'inline-block', padding: '6px' }}>
            ← Quero ser um Cliente
          </Link>
        </div>

      </div>
    </div>
  );
}
