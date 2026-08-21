import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'PROFESSIONAL'>('CLIENT');
  
  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modais
  const [blockUser, setBlockUser] = useState<any>(null);
  const [blockReason, setBlockReason] = useState('');
  const [grantUser, setGrantUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const fetchUsers = () => {
    fetch(`/api/admin/users?page=${page}&page_size=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          setUsers(data.users);
          setTotalItems(data.total || 0);
          setTotalPages(data.total_pages || 1);
        } else if (Array.isArray(data)) {
          setUsers(data);
        }
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [token, page, pageSize]);

  const handleToggleBlock = async () => {
    if (!blockUser) return;

    const endpoint = blockUser.is_blocked ? 'unblock' : 'block';
    const res = await fetch(`/api/admin/users/${blockUser.id}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: blockReason })
    });

    if (res.ok) {
      setBlockUser(null);
      setBlockReason('');
      fetchUsers();
    } else {
      alert('Erro ao alterar status de bloqueio.');
    }
  };

  const handleGrantPlan = async () => {
    if (!grantUser) return;

    const res = await fetch(`/api/admin/users/${grantUser.id}/grant-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ plan_id: selectedPlan })
    });

    if (res.ok) {
      setGrantUser(null);
      fetchUsers();
      alert(`Plano ${selectedPlan.toUpperCase()} concedido gratuitamente com sucesso!`);
    } else {
      alert('Erro ao conceder plano.');
    }
  };

  const filteredUsers = users.filter((u) => u.role === activeTab);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Gestão de Profissionais & Clientes</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Visualizando {users.length} registros nesta página (Total no Banco: {totalItems} usuários).
          </p>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('CLIENT')}
            style={{
              backgroundColor: activeTab === 'CLIENT' ? '#ffffff' : 'transparent',
              color: activeTab === 'CLIENT' ? '#0f172a' : '#64748b',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'CLIENT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            👤 Clientes na Página
          </button>
          <button
            onClick={() => setActiveTab('PROFESSIONAL')}
            style={{
              backgroundColor: activeTab === 'PROFESSIONAL' ? '#ffffff' : 'transparent',
              color: activeTab === 'PROFESSIONAL' ? '#0f172a' : '#64748b',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'PROFESSIONAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            🛠️ Profissionais na Página
          </button>
        </div>
      </div>

      {/* Tabela de Usuarios */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#0f172a', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Nome & Contato</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>CPF</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Tipo / Role</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Plano Atual</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Status</th>
              <th style={{ padding: '14px 20px', color: '#475569' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum registro encontrado nesta aba/página.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                      {u.cpf || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                      {u.role === 'CLIENT' ? '👤 Cliente' : '🛠️ Profissional'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {(u.subscription_plan || 'free').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {u.is_blocked ? (
                      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>🚫 Bloqueado</span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>🟢 Ativo</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', display: 'flex', gap: '8px' }}>
                    {u.role === 'PROFESSIONAL' && (
                      <button
                        onClick={() => setGrantUser(u)}
                        style={{ backgroundColor: 'transparent', border: '1px solid #0284c7', color: '#0284c7', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        ⚡ Ativar Plano
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setBlockUser(u);
                        setBlockReason(u.blocked_reason || '');
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: u.is_blocked ? '1px solid #16a34a' : '1px solid #ef4444',
                        color: u.is_blocked ? '#16a34a' : '#ef4444',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {u.is_blocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Barra de Controles de Paginação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Exibir por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 600 }}
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '8px' }}>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong> (Total: {totalItems})
            </span>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
                color: page <= 1 ? '#94a3b8' : '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontWeight: 700
              }}
            >
              ◀ Anterior
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
                color: page >= totalPages ? '#94a3b8' : '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 700
              }}
            >
              Próxima ▶
            </button>
          </div>
        </div>
      </div>

      {/* Modal Bloquear / Desbloquear */}
      {blockUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', color: '#0f172a', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 0 }}>
              {blockUser.is_blocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Usuário: <strong>{blockUser.name}</strong> ({blockUser.email})</p>

            {!blockUser.is_blocked && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>Motivo do Bloqueio</label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Informe o motivo da suspensão..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setBlockUser(null)} style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button
                onClick={handleToggleBlock}
                style={{
                  backgroundColor: blockUser.is_blocked ? '#16a34a' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {blockUser.is_blocked ? 'Confirmar Desbloqueio' : 'Confirmar Bloqueio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conceder Plano Gratuito */}
      {grantUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', color: '#0f172a', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 0 }}>Ativação Gratuita de Plano</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Profissional: <strong>{grantUser.name}</strong></p>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '6px', fontWeight: 600 }}>Selecione o Plano a Conceder</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600 }}
              >
                <option value="free">FREE (Grátis - 5 desbloqueios)</option>
                <option value="pro">PRO (Agiliza Pro - 20 desbloqueios)</option>
                <option value="premium">PREMIUM (Agiliza Premium - Ilimitado)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setGrantUser(null)} style={{ backgroundColor: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button
                onClick={handleGrantPlan}
                style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Conceder Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
