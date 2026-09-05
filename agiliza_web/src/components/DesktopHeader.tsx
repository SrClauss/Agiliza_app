'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AgilizaLogo } from './ui/AgilizaLogo';
import { useAuthStore } from '@/stores/authStore';

export default function DesktopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.context);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (pathname.startsWith('/login') || pathname.startsWith('/cadastro') || pathname === '/') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login/cliente');
  };

  const navLinks = role === 'PROFESSIONAL' 
    ? [
        { label: 'Início / Painel', href: '/pro' },
        { label: 'Mensagens', href: '/chat' },
        { label: 'Contatos Desbloqueados', href: '/pro/servicos' },
        { label: 'Planos', href: '/pro/planos' },
        { label: 'Configurações', href: '/pro/configuracoes' },
        { label: 'Perfil', href: '/pro/perfil' }
      ]
    : [
        { label: 'Início', href: '/cliente' },
        { label: 'Mensagens', href: '/chat' },
        { label: 'Meus Pedidos', href: '/cliente/pedidos' },
        { label: 'Novo Pedido', href: '/cliente/pedidos/novo' },
        { label: 'Perfil', href: '/cliente/perfil' }
      ];

  return (
    <header className="desktop-header-container">
      <div className="desktop-header-content">
        <Link href={role === 'PROFESSIONAL' ? '/pro' : '/cliente'} style={{ textDecoration: 'none' }}>
          <AgilizaLogo size={36} showText={true} />
        </Link>

        <nav className="desktop-header-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`desktop-nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="desktop-header-user">
          {user && (
            <div className="user-profile-badge">
              <img 
                src={user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
                alt="Avatar" 
                className="user-avatar-small"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random` }}
              />
              <span className="user-name-text">{user.name || 'Usuário'}</span>
            </div>
          )}
          <button onClick={handleLogout} className="desktop-logout-btn">
            Sair 🚪
          </button>
        </div>
      </div>
    </header>
  );
}
