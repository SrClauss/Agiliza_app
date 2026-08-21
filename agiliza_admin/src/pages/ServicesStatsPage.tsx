import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function ServicesStatsPage() {
  const { token } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5150/api/admin/stats/services', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, [token]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Estatísticas de Serviços Pedidos</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Acompanhe o volume de orçamentos e atendimentos por período.</p>
        </div>

        {/* Filtro Temporal */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              style={{
                backgroundColor: periodFilter === p ? '#ffffff' : 'transparent',
                color: periodFilter === p ? '#0f172a' : '#64748b',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
                boxShadow: periodFilter === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {p === 'today' && '📅 Hoje'}
              {p === 'week' && '📆 Esta Semana'}
              {p === 'month' && '🗓️ Este Mês'}
              {p === 'all' && '📊 Histórico'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pedidos (Filtro Selecionado)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
            {periodFilter === 'today' && (stats?.today_count || 0)}
            {periodFilter === 'week' && (stats?.week_count || 0)}
            {periodFilter === 'month' && (stats?.month_count || 0)}
            {periodFilter === 'all' && (stats?.total_requests || 0)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Histórico de Pedidos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats?.total_requests || 0}</div>
        </div>
      </div>
    </div>
  );
}
