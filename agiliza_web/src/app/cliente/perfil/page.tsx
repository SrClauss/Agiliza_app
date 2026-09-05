"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PerfilCliente() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/cliente');
      return;
    }

    fetch('/api/auth/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
      })
      .catch(console.error);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('agiliza_token');
    localStorage.removeItem('agiliza_user');
    router.push('/login/cliente');
  };

  const handleFeatureNotImplemented = (feature: string) => {
    alert(`A funcionalidade "${feature}" estará disponível na próxima versão!`);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '20px', backgroundColor: 'var(--color-bg)', minHeight: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Meu Perfil</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img 
          src={user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} 
          alt="Perfil" 
          style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #B3F63F', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', objectFit: 'cover' }} 
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random` }}
        />
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', margin: 0, textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>
            {user?.name || 'Carregando...'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>CLIENTE</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link href="/cliente/pedidos" style={{ display: 'block', textDecoration: 'none' }}>
          <Button variant="primary" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
            <span>📝 Meus Pedidos</span>
            <span>Ver Pedidos ➤</span>
          </Button>
        </Link>
        <Link href="/cliente/perfil/editar" style={{ display: 'block', textDecoration: 'none' }}>
          <Button 
            variant="outline" 
            style={{ width: '100%', textAlign: 'left', padding: '16px', justifyContent: 'flex-start' }}
          >
            ✏️ Editar Informações Pessoais
          </Button>
        </Link>
        <Link href="/cliente/perfil/enderecos" style={{ display: 'block', textDecoration: 'none' }}>
          <Button 
            variant="outline" 
            style={{ width: '100%', textAlign: 'left', padding: '16px', justifyContent: 'flex-start' }}
          >
            📍 Endereços Salvos
          </Button>
        </Link>
        <Button 
          variant="outline" 
          style={{ textAlign: 'left', padding: '16px', justifyContent: 'flex-start', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          onClick={handleLogout}
        >
          🚪 Sair da Conta
        </Button>
      </div>
    </div>
  );
}
