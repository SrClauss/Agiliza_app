import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', label: 'Visão Geral', icon: '📊' },
    { path: '/planos', label: 'Gestão de Planos', icon: '💎' },
    { path: '/categorias', label: 'Categorias & Emojis', icon: '🏷️' },
    { path: '/usuarios', label: 'Usuários & Bloqueios', icon: '👥' },
    { path: '/financeiro', label: 'Estatísticas Financeiras', icon: '💰' },
    { path: '/servicos', label: 'Estatísticas de Serviços', icon: '📋' },
    { path: '/equipe', label: 'Gestão de Acessos (Staff)', icon: '🔑' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      boxShadow: '2px 0 12px rgba(0,0,0,0.03)'
    }}>
      {/* Header Marca */}
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <img src="/agilizapro_logo_rounded.png" alt="Logo" style={{ height: '36px', borderRadius: '10px' }} />
        <div>
          <h2 style={{ fontSize: '1rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>AgilizaPro</h2>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>Painel Administrativo</span>
        </div>
      </div>

      {/* Links de Navegação */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              color: isActive ? '#0f172a' : '#64748b',
              backgroundColor: isActive ? '#f1f5f9' : 'transparent',
              borderLeft: isActive ? '4px solid #0284c7' : '4px solid transparent',
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9rem',
              transition: 'all 0.15s ease'
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Perfil & Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fafafa' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user?.name || 'Administrador'}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email}</div>
        </div>
        <button 
          onClick={logout}
          title="Sair"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ef4444',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px'
          }}
        >
          🚪
        </button>
      </div>
    </aside>
  );
}
