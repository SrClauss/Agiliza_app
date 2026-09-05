'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AgilizaLogo } from '@/components/ui/AgilizaLogo';
import { validateCPF, formatCPF } from '@/utils/cpf';

export default function CompletarPerfil() {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>('CLIENT');

  useEffect(() => {
    const userStr = localStorage.getItem('agiliza_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role || 'CLIENT');
    }
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentErrors: Record<string, string> = {};
    if (!validateCPF(cpf)) currentErrors.cpf = 'CPF inválido';
    
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      const token = localStorage.getItem('agiliza_token');
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cpf, phone, password })
      });

      if (res.ok) {
        if (role === 'PROFESSIONAL') {
          router.push('/pro');
        } else {
          router.push('/cliente');
        }
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || 'Erro ao salvar perfil' });
      }
    } catch (err) {
      setErrors({ submit: 'Erro de conexão com servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--md-sys-color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <AgilizaLogo />
        </div>
        
        <Card style={{ padding: '2rem', borderRadius: '1.5rem', boxShadow: 'var(--md-sys-elevation-3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '0.5rem'
            }}>
              Quase lá!
            </h1>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
              Precisamos de apenas mais alguns detalhes para completar seu cadastro.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="CPF"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              required
              maxLength={14}
            />
            {errors.cpf && <span style={{ color: 'var(--md-sys-color-error)', fontSize: '0.75rem' }}>{errors.cpf}</span>}

            <Input
              label="Telefone / WhatsApp"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div style={{ marginBottom: '1rem' }}>
              <Input
                label="Crie uma Senha (Opcional)"
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p style={{ 
                color: 'var(--md-sys-color-on-surface-variant)', 
                fontSize: '0.75rem',
                marginTop: '0.25rem'
              }}>
                Crie uma senha se quiser logar com e-mail no futuro.
              </p>
            </div>

            {errors.submit && (
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                backgroundColor: 'var(--md-sys-color-error-container)', 
                color: 'var(--md-sys-color-on-error-container)',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Salvando...' : 'Concluir Cadastro'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
