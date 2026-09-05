"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Plan {
  id: string;
  name: string;
  price_cents: number;
  monthly_unlock_limit: number;
  stripe_price_id?: string;
  features?: string;
}

export default function PlanosProfissional() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('agiliza_token');
    if (storedToken) setToken(storedToken);

    fetch('/api/billing/plans')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch((err) => console.error('Erro ao carregar planos:', err));
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!token) {
      alert("Faça login novamente para assinar um plano.");
      return;
    }
    setLoading(planId);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ plan: planId })
      });
      
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'Não foi possível gerar a página do Stripe. Verifique a chave STRIPE_SECRET_KEY no servidor.');
      }
    } catch (error) {
      console.error(error);
      alert('Não foi possível iniciar o checkout.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)', paddingBottom: '80px' }}>
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', 
        backgroundColor: 'var(--color-surface)', color: 'var(--color-text)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', borderBottom: '1px solid var(--color-border)'
      }}>
        <Link href="/pro/perfil" style={{ fontSize: '1.5rem', color: 'var(--color-text)', textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>Planos Agiliza Pro</h1>
      </header>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Desbloqueie mais clientes</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Aumente seus ganhos escolhendo um plano Pro.
          </p>
        </div>

        {plans.map((p) => {
          let parsedFeatures: string[] = [];
          try {
            if (p.features) parsedFeatures = JSON.parse(p.features);
          } catch {
            parsedFeatures = [];
          }

          const isFree = p.id === 'free';
          const priceFormatted = (p.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

          return (
            <Card key={p.id} style={{ borderTop: `4px solid ${isFree ? '#94a3b8' : '#B3F63F'}`, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: isFree ? 'var(--color-text)' : '#B3F63F' }}>{p.name}</h3>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: isFree ? 'var(--color-text)' : '#B3F63F' }}>
                  {priceFormatted}<span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/mês</span>
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                {parsedFeatures.map((feat, idx) => (
                  <li key={idx}>✅ {feat}</li>
                ))}
              </ul>

              {isFree ? (
                <Button variant="outline" fullWidth disabled>
                  Plano Padrão
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={() => handleSubscribe(p.id)}
                  disabled={loading === p.id}
                >
                  {loading === p.id ? 'Processando...' : 'Assinar Agora'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
