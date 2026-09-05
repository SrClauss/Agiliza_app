"use client";
import React, { useEffect, useState } from 'react';
import { AgilizaLogo } from '@/components/ui/AgilizaLogo';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ earnings: 0, active: 0, completed: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [limits, setLimits] = useState<{ limit: number; used: number; remaining: number; is_unlimited?: boolean } | null>(null);

  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    if (!token) {
      router.push('/login/profissional');
      return;
    }

    const storedHidden = localStorage.getItem('agiliza_pro_hidden_requests');
    if (storedHidden) {
      try {
        setHiddenIds(JSON.parse(storedHidden));
      } catch(e) {}
    }

    fetch('/api/auth/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('agiliza_token');
          localStorage.removeItem('agiliza_user');
          router.push('/login/profissional');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setUser(data);
      })
      .catch(console.error);

    fetch(`/api/services/requests?page=${page}&per_page=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.items)) {
          setRequests(data.items);
          setTotalPages(data.total_pages || 1);
          const active = data.items.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED').length;
          const completed = data.items.filter((r: any) => r.status === 'COMPLETED').length;
          setStats({ earnings: completed * 150, active, completed });
        } else if (Array.isArray(data)) {
          setRequests(data);
          const active = data.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED').length;
          const completed = data.filter((r: any) => r.status === 'COMPLETED').length;
          setStats({ earnings: completed * 150, active, completed });
        }
      })
      .catch(console.error);

    fetch('/api/auth/professionals/me/limits', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLimits(data);
      })
      .catch(console.error);

  }, [router, page]);

  const handleHideRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...hiddenIds, id];
    setHiddenIds(updated);
    localStorage.setItem('agiliza_pro_hidden_requests', JSON.stringify(updated));
  };

  const handleRestoreHidden = () => {
    setHiddenIds([]);
    localStorage.removeItem('agiliza_pro_hidden_requests');
  };

  const handleOpenUnlockModal = (req: any) => {
    if (req.is_unlocked || req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS') {
      router.push(`/chat/${req.id}`);
      return;
    }
    setSelectedRequest(req);
    setShowModal(true);
  };

  const handleConfirmUnlock = async () => {
    if (!selectedRequest) return;
    setUnlocking(true);

    const token = localStorage.getItem('agiliza_token');

    try {
      const res = await fetch(`/api/services/requests/${selectedRequest.id}/unlock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setShowModal(false);
        router.push(`/chat/${selectedRequest.id}`);
      } else {
        const statusRes = await fetch(`/api/services/requests/${selectedRequest.id}/status`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: 'ACCEPTED' })
        });
        
        if (statusRes.ok) {
          setShowModal(false);
          router.push(`/chat/${selectedRequest.id}`);
        } else {
          alert('Não foi possível desbloquear este contato.');
        }
      }
    } catch(e) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setUnlocking(false);
    }
  };

  const [filterMode, setFilterMode] = useState<'ALL' | 'REMOTE' | 'PRESENTIAL'>('ALL');

  const pendingOpportunities = requests
    .filter(r => (r.status === 'PENDING' || r.status === 'OPEN') && !hiddenIds.includes(r.id) && !r.is_unlocked)
    .filter(r => {
      if (filterMode === 'REMOTE') return r.is_remote;
      if (filterMode === 'PRESENTIAL') return !r.is_remote;
      return true;
    });
  
  const totalPendingCount = requests.filter(r => (r.status === 'PENDING' || r.status === 'OPEN') && !hiddenIds.includes(r.id) && !r.is_unlocked).length;
  const remoteCount = requests.filter(r => (r.status === 'PENDING' || r.status === 'OPEN') && !hiddenIds.includes(r.id) && !r.is_unlocked && r.is_remote).length;
  const presentialCount = totalPendingCount - remoteCount;
  const unlockedServices = requests.filter(r => (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS' || r.is_unlocked));

  return (
    <div style={{ backgroundColor: 'var(--md-sys-color-bg)', minHeight: '100vh', color: 'var(--md-sys-color-text)' }}>
      {/* M3 Light Top Bar Header */}
      <header style={{ 
        backgroundColor: 'var(--md-sys-color-surface)', 
        color: 'var(--md-sys-color-text)', 
        borderBottomRightRadius: 'var(--md-shape-xl)', 
        borderBottomLeftRadius: 'var(--md-shape-xl)', 
        padding: '24px', 
        borderBottom: '1px solid var(--md-sys-color-border)', 
        boxShadow: 'var(--md-elevation-1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <AgilizaLogo size={38} showText={true} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-text-muted)' }}>Avaliação</div>
            <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>★ {Number(user?.average_rating || 5).toFixed(1)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={user?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} 
              alt="Profile" 
              style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--md-sys-color-primary)', boxShadow: 'var(--md-elevation-1)', objectFit: 'cover' }} 
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random` }}
            />
            <span className="m3-badge" style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '0.68rem', backgroundColor: '#ef4444', color: '#ffffff' }}>
              {totalPendingCount}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-text-muted)' }}>Painel do Parceiro</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-text)', letterSpacing: '-0.2px' }}>
              {user?.name || 'Carregando...'}
            </h1>
          </div>
        </div>
      </header>

      <div style={{ padding: '24px', paddingBottom: '80px' }}>
        
        {/* Limites de Contato / Plano */}
        <section style={{ marginBottom: '28px' }}>
          <Card style={{ padding: '20px', borderLeft: '4px solid var(--md-sys-color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--md-shape-lg)' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '2px' }}>Créditos Mensais de Contato</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--md-sys-color-text)' }}>
                {limits ? (limits.is_unlimited ? 'Ilimitados' : `${limits.remaining} de ${limits.limit} restantes`) : 'Carregando...'}
              </div>
            </div>
            <Button variant="outline" style={{ fontSize: '0.82rem', padding: '8px 16px' }} onClick={() => router.push('/pro/planos')}>
              ⭐ Upgrade Plano
            </Button>
          </Card>
        </section>

        {/* Novas Oportunidades para Desbloquear */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Novas Oportunidades</h2>
            <span className="m3-badge">
              {pendingOpportunities.length} Exibidas
            </span>
          </div>

          {/* Filtros de Modalidade: Todos, Remotos, Presenciais */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setFilterMode('ALL')}
              style={{
                padding: '6px 14px', borderRadius: '16px', border: '1px solid var(--md-sys-color-border)',
                backgroundColor: filterMode === 'ALL' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                color: filterMode === 'ALL' ? '#fff' : 'var(--md-sys-color-text)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Todos ({totalPendingCount})
            </button>
            <button
              onClick={() => setFilterMode('REMOTE')}
              style={{
                padding: '6px 14px', borderRadius: '16px', border: '1px solid var(--md-sys-color-border)',
                backgroundColor: filterMode === 'REMOTE' ? '#4caf50' : 'var(--md-sys-color-surface)',
                color: filterMode === 'REMOTE' ? '#fff' : 'var(--md-sys-color-text)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              💻 Remotos ({remoteCount})
            </button>
            <button
              onClick={() => setFilterMode('PRESENTIAL')}
              style={{
                padding: '6px 14px', borderRadius: '16px', border: '1px solid var(--md-sys-color-border)',
                backgroundColor: filterMode === 'PRESENTIAL' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                color: filterMode === 'PRESENTIAL' ? '#fff' : 'var(--md-sys-color-text)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              📍 Presenciais ({presentialCount})
            </button>
          </div>

          <div className="responsive-grid">
            {pendingOpportunities.map(req => (
              <Card key={req.id} style={{ borderRadius: 'var(--md-shape-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>{req.service_category_id || 'Serviço'}</span>
                  {req.is_remote ? (
                    <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#2e7d32', fontWeight: 700, fontSize: '0.75rem' }}>💻 Remoto</span>
                  ) : (
                    <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>📍 Presencial</span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{req.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '14px' }}>
                  {req.is_remote ? '💻 Atendimento 100% Online / Remoto' : `📍 ${req.address}`}
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid var(--md-sys-color-border)' }}>👤</div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{req.client_name || 'Cliente'}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="primary" style={{ flex: 2, padding: '12px' }} onClick={() => handleOpenUnlockModal(req)}>
                    Desbloquear Contato
                  </Button>
                  <Button 
                    variant="outline" 
                    style={{ flex: 1, padding: '12px', fontSize: '0.82rem' }} 
                    onClick={(e) => handleHideRequest(req.id, e)}
                  >
                    🙈 Ocultar
                  </Button>
                </div>
              </Card>
            ))}
            
            {pendingOpportunities.length === 0 && (
              <Card style={{ textAlign: 'center', color: 'var(--md-sys-color-text-muted)', padding: '32px 24px', borderRadius: 'var(--md-shape-xl)' }}>
                Nenhuma nova oportunidade disponível no momento.
              </Card>
            )}

            {hiddenIds.length > 0 && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button 
                  onClick={handleRestoreHidden}
                  style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                >
                  👁️ Restaurar {hiddenIds.length} oportunidade(s) ocultada(s)
                </button>
              </div>
            )}

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
          </div>
        </section>
      </div>

      {/* M3 MODAL DE CONFIRMACAO DE DESBLOQUEIO (LIGHT MODE) */}
      {showModal && selectedRequest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 100
        }}>
          <Card style={{ maxWidth: '420px', width: '100%', padding: '28px', borderRadius: 'var(--md-shape-xl)', border: '1.5px solid var(--md-sys-color-primary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--md-sys-color-primary)', marginBottom: '14px' }}>
              ⚠️ Confirmar Desbloqueio
            </h3>
            
            {limits && limits.remaining <= 0 && !limits.is_unlimited ? (
              <>
                <p style={{ fontSize: '0.95rem', color: 'var(--md-sys-color-text)', lineHeight: '1.5', marginBottom: '24px' }}>
                  Você atingiu o limite de <strong>{limits.limit} contatos</strong> do seu plano atual. Faça o upgrade para continuar falando com novos clientes.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" style={{ flex: 1 }} onClick={() => router.push('/pro/planos')}>
                    ⭐ Ver Planos
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.95rem', color: 'var(--md-sys-color-text)', lineHeight: '1.5', marginBottom: '16px' }}>
                  Você deseja desbloquear o contato do serviço <strong>"{selectedRequest.title}"</strong>?
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-text-muted)', marginBottom: '24px', backgroundColor: 'var(--md-sys-color-surface-variant)', padding: '12px', borderRadius: 'var(--md-shape-md)' }}>
                  💡 Esta ação consumirá <strong>1 crédito de contato</strong>. Restam {limits ? limits.remaining : 1} créditos este mês.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="outline" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={unlocking}>
                    Cancelar
                  </Button>
                  <Button variant="primary" style={{ flex: 1 }} onClick={handleConfirmUnlock} disabled={unlocking}>
                    {unlocking ? 'Desbloqueando...' : 'Confirmar'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
