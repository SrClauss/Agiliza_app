import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { token } = useAuth();
  const [finStats, setFinStats] = useState<any>(null);
  const [servStats, setServStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5150/api/admin/stats/financial', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setFinStats(data));

    fetch('http://localhost:5150/api/admin/stats/services', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setServStats(data));

    fetch('http://localhost:5150/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); });
  }, [token]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Visão Geral da Plataforma</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Métricas gerais e indicadores do sistema em tempo real.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total de Usuários Cadastrados</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{users.length}</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Receita Mensal Estimada</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{finStats?.estimated_mrr_formatted || 'R$ 0,00'}</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Profissionais Cadastrados</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>{finStats?.total_professionals || 0}</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total de Pedidos Realizados</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{servStats?.total_requests || 0}</div>
        </div>
      </div>
    </div>
  );
}
