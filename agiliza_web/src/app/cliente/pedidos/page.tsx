"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ReviewModal from '@/components/ReviewModal';

export default function PedidosCliente() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReviewReq, setSelectedReviewReq] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FINISHED'>('ACTIVE');

  const fetchRequests = useCallback((currentPage: number) => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/cliente');
      return;
    }

    fetch(`/api/services/requests?page=${currentPage}&per_page=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('agiliza_token');
          localStorage.removeItem('agiliza_user');
          router.push('/login/cliente');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.items)) {
          setRequests(data.items);
          setTotalPages(Math.ceil(data.items.length / 10) || 1); // Forcing a bit since we increased per_page
        } else if (Array.isArray(data)) {
          setRequests(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetchRequests(page);
  }, [fetchRequests, page]);

  const handleUpdateStatus = async (reqId: string, newStatus: string, confirmMsg?: string) => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) return;

    if (confirmMsg && !confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/services/requests/${reqId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchRequests(page);
        if (newStatus === 'COMPLETED') {
          const req = requests.find(r => r.id === reqId);
          if (req && req.professional_profile_id) {
            setSelectedReviewReq(req);
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Não foi possível atualizar o pedido.');
      }
    } catch(e) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const handleCompleteOrder = (reqId: string) => {
    handleUpdateStatus(reqId, 'COMPLETED', 'Deseja marcar este serviço como concluído?');
  };

  const handleDeleteRequest = async (reqId: string) => {
    if (!confirm('Tem certeza absoluta de que deseja apagar este pedido? Esta ação não pode ser desfeita.')) return;
    const token = localStorage.getItem('agiliza_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/services/requests/${reqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Pedido apagado com sucesso.');
        fetchRequests(page);
      } else {
        alert('Falha ao apagar pedido.');
      }
    } catch(e) {
      alert('Erro de conexão.');
    }
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'ALL') return true;
    const isFinished = req.status === 'COMPLETED' || req.status === 'CANCELLED';
    if (statusFilter === 'ACTIVE') return !isFinished;
    if (statusFilter === 'FINISHED') return isFinished;
    return true;
  });

  return (
    <div style={{ padding: '24px', paddingBottom: '32px', backgroundColor: 'var(--md-sys-color-bg)', minHeight: '100%', color: 'var(--md-sys-color-text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>Meus Pedidos</h1>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--md-shape-sm)',
            border: '1px solid var(--md-sys-color-surface-variant)',
            backgroundColor: 'var(--md-sys-color-surface)',
            color: 'var(--md-sys-color-text)',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ACTIVE">Apenas Ativos</option>
          <option value="FINISHED">Apenas Finalizados</option>
          <option value="ALL">Mostrar Todos</option>
        </select>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <p style={{ color: 'var(--md-sys-color-text-muted)', textAlign: 'center', padding: '24px' }}>Carregando seus pedidos...</p>
        ) : filteredRequests.length === 0 ? (
          <Card style={{ textAlign: 'center', color: 'var(--md-sys-color-text-muted)', padding: '32px 24px', borderRadius: 'var(--md-shape-xl)' }}>
            <p style={{ fontSize: '1rem', marginBottom: '16px' }}>Nenhum pedido encontrado para este filtro.</p>
            <Link href="/cliente/pedidos/novo" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                + Criar Novo Pedido
              </Button>
            </Link>
          </Card>
        ) : (
          filteredRequests.map(req => {
            const isCompleted = req.status === 'COMPLETED';
            const isInProgress = req.status === 'IN_PROGRESS' || req.status === 'ACCEPTED';

            return (
              <Card key={req.id} style={{ 
                padding: '22px', 
                borderRadius: 'var(--md-shape-lg)',
                borderLeft: `4px solid ${isCompleted ? '#10b981' : (isInProgress ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)')}` 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '8px' }}>
                  <span className="m3-badge" style={{
                    backgroundColor: isCompleted ? '#10b981' : (isInProgress ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)'),
                    color: isCompleted || isInProgress ? '#FFFFFF' : 'var(--md-sys-color-text)'
                  }}>
                    {(req.status === 'PENDING' || req.status === 'OPEN') && '⏳ Antes de Abrir'}
                    {(req.status === 'IN_PROGRESS' || req.status === 'ACCEPTED') && '🚀 Em Atendimento'}
                    {req.status === 'COMPLETED' && '✅ Finalizado'}
                    {req.status === 'CANCELLED' && '❌ Cancelado'}
                    {!['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(req.status) && req.status}
                  </span>
                  <span>{req.created_at ? new Date(req.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: 'var(--md-sys-color-text)' }}>{req.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>{req.description}</p>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href={`/chat/${req.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <Button variant="outline" fullWidth style={{ fontSize: '0.88rem', padding: '10px' }}>
                      💬 Chat / Detalhes
                    </Button>
                  </Link>

                  {isInProgress && (
                    <>
                      <Button 
                        variant="primary" 
                        onClick={() => handleCompleteOrder(req.id)}
                        style={{ flex: 1, fontSize: '0.88rem', padding: '10px' }}
                      >
                        ✅ Concluir Pedido
                      </Button>

                      <Button 
                        variant="outline" 
                        onClick={() => handleUpdateStatus(req.id, 'PENDING', 'Deseja reabrir este pedido para que outros profissionais possam atendê-lo?')}
                        style={{ flex: 1, fontSize: '0.88rem', padding: '10px', borderColor: 'var(--md-sys-color-primary)' }}
                      >
                        🔄 Reabrir Oportunidade
                      </Button>

                      <Button 
                        variant="outline" 
                        onClick={() => handleUpdateStatus(req.id, 'CANCELLED', 'Tem certeza de que deseja encerrar/cancelar este pedido?')}
                        style={{ flex: 1, fontSize: '0.88rem', padding: '10px', color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        ❌ Cancelar
                      </Button>
                    </>
                  )}

                  {isCompleted && req.professional_profile_id && (
                    <Button 
                      variant="primary" 
                      onClick={() => setSelectedReviewReq(req)}
                      style={{ flex: 1, fontSize: '0.88rem', padding: '10px', backgroundColor: '#f59e0b', color: '#FFFFFF', border: 'none' }}
                    >
                      ⭐ Avaliar Profissional
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={() => handleDeleteRequest(req.id)}
                    style={{ flex: 1, fontSize: '0.88rem', padding: '10px', color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    🗑️ Apagar Pedido
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            ← Anterior
          </Button>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--md-sys-color-text-muted)' }}>
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Próxima →
          </Button>
        </div>
      )}
      
      {requests.length > 0 && (
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <Link href="/cliente/pedidos/novo" style={{ textDecoration: 'none' }}>
            <Button variant="primary" fullWidth style={{ padding: '16px', fontSize: '1.02rem' }}>
              + Criar Novo Pedido
            </Button>
          </Link>
        </div>
      )}

      {/* Modal de Avaliação */}
      {selectedReviewReq && (
        <ReviewModal
          isOpen={Boolean(selectedReviewReq)}
          onClose={() => setSelectedReviewReq(null)}
          professionalProfileId={selectedReviewReq.professional_profile_id}
          serviceRequestId={selectedReviewReq.id}
          serviceTitle={selectedReviewReq.title}
          onSuccess={() => fetchRequests(page)}
        />
      )}
    </div>
  );
}
