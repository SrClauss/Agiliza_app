import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AgilizaLogo } from '@/components/ui/AgilizaLogo';

export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: '32px 24px', 
      backgroundColor: 'var(--md-sys-color-bg)',
      color: 'var(--md-sys-color-text)',
      textAlign: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '36px', alignItems: 'center' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <AgilizaLogo size={140} showText={true} />
          <p style={{ fontSize: '1.05rem', color: 'var(--md-sys-color-text-muted)', marginTop: '4px', maxWidth: '340px', lineHeight: 1.4 }}>
            A ponte rápida e inteligente entre quem precisa e quem sabe fazer.
          </p>
        </div>

        {/* Access Selection Card - M3 Light Container */}
        <Card style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          width: '100%',
          padding: '32px 24px', 
          borderRadius: 'var(--md-shape-xl)',
          backgroundColor: 'var(--md-sys-color-surface)',
          boxShadow: 'var(--md-elevation-2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--md-sys-color-text)', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.2px' }}>
              Como deseja acessar?
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-text-muted)', marginTop: '4px' }}>
              Escolha seu tipo de conta abaixo
            </p>
          </div>
          
          <Link href="/login/cliente" style={{ width: '100%' }}>
            <Button variant="primary" fullWidth style={{ padding: '16px 20px', fontSize: '1.05rem', flexDirection: 'column', gap: '2px' }}>
              <span>👤 Sou Cliente</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.9 }}>Quero encontrar um profissional</span>
            </Button>
          </Link>
          
          <Link href="/login/profissional" style={{ width: '100%' }}>
            <Button variant="secondary" fullWidth style={{ padding: '16px 20px', fontSize: '1.05rem', flexDirection: 'column', gap: '2px' }}>
              <span>🛠️ Sou Profissional</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.9 }}>Quero encontrar novos clientes</span>
            </Button>
          </Link>
        </Card>
        
        {/* Footer Legal Terms */}
        <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-text-muted)', lineHeight: 1.5 }}>
          Ao continuar, você concorda com nossos <br />
          <Link href="#" style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600, textDecoration: 'underline' }}>Termos de Uso</Link> e <Link href="#" style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600, textDecoration: 'underline' }}>Política de Privacidade</Link>.
        </p>

      </div>
    </div>
  );
}
