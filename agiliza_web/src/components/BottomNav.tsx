'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function BottomNav() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.context);
  const user = useAuthStore((state) => state.user);

  // Esconder navegação na Landing Page, Login e Cadastro
  if (pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/cadastro')) {
    return null;
  }

  // Determinar se estamos no fluxo de cliente ou profissional baseado no role e no pathname
  const isPro = role === 'PROFESSIONAL' || (role === null && pathname?.startsWith('/pro'));
  const basePath = isPro ? '/pro' : '/cliente';

  return (
    <nav className="bottom-nav">
      <Link href={basePath} className={`nav-item ${pathname === basePath ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <span className="nav-icon">🏠</span>
        </div>
        <span className="nav-text">Início</span>
      </Link>

      <Link href={`${basePath}/pedidos`} className={`nav-item ${pathname?.startsWith(`${basePath}/pedidos`) || pathname?.startsWith(`${basePath}/servicos`) ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <span className="nav-icon">📋</span>
        </div>
        <span className="nav-text">Pedidos</span>
      </Link>

      <Link href="/chat" className={`nav-item ${pathname?.startsWith('/chat') ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <span className="nav-icon">💬</span>
        </div>
        <span className="nav-text">Chat</span>
      </Link>

      <Link href={`${basePath}/perfil`} className={`nav-item ${pathname?.startsWith(`${basePath}/perfil`) ? 'active' : ''}`}>
        <div className="nav-icon-container" style={{ padding: '2px' }}>
          {user ? (
            <img 
              src={user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} 
              alt="Perfil"
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: pathname?.startsWith(`${basePath}/perfil`) ? '2px solid var(--md-sys-color-primary)' : '2px solid transparent' }}
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random` }}
            />
          ) : (
            <span className="nav-icon">👤</span>
          )}
        </div>
        <span className="nav-text">Perfil</span>
      </Link>
    </nav>
  );
}
