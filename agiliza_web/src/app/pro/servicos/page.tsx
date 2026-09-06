"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function MeusServicos() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FINISHED'>('ACTIVE');

  const fetchServices = useCallback((currentPage: number) => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/profissional');
      return;
    }

    fetch(`/api/services/requests?page=${currentPage}&per_page=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const rawList = (data && Array.isArray(data.items)) ? data.items : (Array.isArray(data) ? data : []);
        if (data && data.total_pages) setTotalPages(Math.ceil(rawList.length / 10) || 1);
        
        // Serviços desbloqueados ou em andamento / aceitos / concluídos
        const activeRequests = rawList.filter((r: any) => r.is_unlocked || (r.status !== 'PENDING' && r.status !== 'OPEN' && r.status !== 'CANCELLED'));
        
        const uniqueRequests: any[] = [];
        const seenKeys = new Set<string>();
        for (const req of activeRequests) {
          const key = `${req.client_id}_${req.title}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueRequests.push(req);
          }
        }
        setRequests(uniqueRequests);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    // Carregar IDs ocultados pelo prestador
    const storedHidden = localStorage.getItem('agiliza_pro_hidden_requests');
    if (storedHidden) {
      try {
        setHiddenIds(JSON.parse(storedHidden));
      } catch(e) {}
    }

    fetchServices(page);
  }, [fetchServices, page]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/services/requests/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchServices(page);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Erro ao atualizar o andamento do serviço.');
      }
    } catch(e) {
      alert('Erro de conexão ao atualizar serviço.');
    }
  };

  const handleHideService = (id: string) => {
    const updated = [...hiddenIds, id];
    setHiddenIds(updated);
    localStorage.setItem('agiliza_pro_hidden_requests', JSON.stringify(updated));
  };

  const handleRestoreHidden = () => {
    setHiddenIds([]);
    localStorage.removeItem('agiliza_pro_hidden_requests');
  };

  const visibleRequests = requests.filter(r => !hiddenIds.includes(r.id)).filter(req => {
    if (statusFilter === 'ALL') return true;
    const isFinished = req.status === 'COMPLETED' || req.status === 'CANCELLED';
    if (statusFilter === 'ACTIVE') return !isFinished;
    if (statusFilter === 'FINISHED') return isFinished;
    return true;
  });

  return (
    <div style={{ padding: '20px', paddingBottom: '80px', backgroundColor: 'var(--color-bg)', minHeight: '100%', color: 'var(--color-text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          Meus Trabalhos
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ACTIVE" style={{ color: '#000' }}>Apenas Ativos</option>
            <option value="FINISHED" style={{ color: '#000' }}>Apenas Finalizados</option>
            <option value="ALL" style={{ color: '#000' }}>Mostrar Todos</option>
          </select>

          {hiddenIds.length > 0 && (
            <button 
              onClick={handleRestoreHidden}
              style={{ background: 'none', border: 'none', color: '#B3F63F', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              👁️ Restaurar ({hiddenIds.length})
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Carregando serviços...</p>
        ) : visibleRequests.length === 0 ? (
          <Card style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
            Você não possui serviços ativos no momento.
          </Card>
        ) : (
          visibleRequests.map(req => {
            const isCompleted = req.status === 'COMPLETED';
            const isInProgress = req.status === 'IN_PROGRESS' || req.status === 'ACCEPTED';

            return (
              <Card key={req.id} style={{ borderLeft: `4px solid ${isCompleted ? '#10b981' : '#B3F63F'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  <span style={{ 
                    fontWeight: 700, 
                    color: isCompleted ? '#10b981' : '#B3F63F'
                  }}>
                    {isCompleted ? '✅ Finalizado' : '🚀 Em Atendimento'}
                  </span>
                  <span>{req.created_at ? new Date(req.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>{req.title}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={`https://i.pravatar.cc/150?u=${req.client_id}`} alt="Cliente" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>{req.client_name || 'Cliente'}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>{req.client_phone || '(11) 99999-9999'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <Link href={`/chat/${req.id}`} style={{ flex: 2, textDecoration: 'none' }}>
                    <Button variant="primary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}>
                      💬 Abrir Chat
                    </Button>
                  </Link>

                  {!isCompleted && (
                    <Button 
                      variant="outline" 
                      style={{ flex: 2, padding: '10px', fontSize: '0.8rem', borderColor: '#10b981', color: '#10b981' }}
                      onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                    >
                      ✅ Concluir
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    style={{ padding: '10px', minWidth: '44px', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderColor: 'rgba(255,255,255,0.2)' }}
                    onClick={() => handleHideService(req.id)}
                    title="Ocultar"
                  >
                    🗑️
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
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
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
    </div>
  );
}
