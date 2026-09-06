"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';

export default function ChatList() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const context = useAuthStore(s => s.context);
  const isPro = context === 'PROFESSIONAL' || (context as string) === 'PRO';

  const user = useAuthStore(s => s.user);

  useEffect(() => {
    const token = localStorage.getItem('agiliza_token');
    
    if (!token) {
      router.push(isPro ? '/login/profissional' : '/login/cliente');
      return;
    }

    const roleParam = isPro ? 'PRO' : 'CLIENT';
    fetch(`/api/services/requests?role=${roleParam}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const currentUserId = user?.pid;

          const filtered = data.filter((r: any) => {
            if (isPro) {
              // No papel Profissional: o usuário NÃO pode ser o cliente criador do pedido
              const isNotOwnClient = currentUserId ? r.client_id !== currentUserId : true;
              const isUnlockedOrActive = r.is_unlocked === true || r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS';
              return isNotOwnClient && isUnlockedOrActive;
            } else {
              // No papel Cliente: apenas os pedidos criados pelo próprio usuário como cliente
              return currentUserId ? r.client_id === currentUserId : true;
            }
          });

          setRequests(filtered);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router, isPro, user?.pid]);

  return (
    <div style={{ padding: '24px', paddingBottom: '80px', backgroundColor: 'var(--md-sys-color-bg)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', color: 'var(--md-sys-color-text)', letterSpacing: '-0.3px' }}>
        {isPro ? 'Contatos Desbloqueados & Mensagens' : 'Minhas Conversas'}
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <p style={{ color: 'var(--md-sys-color-text-muted)', textAlign: 'center', padding: '24px' }}>Carregando conversas...</p>
        ) : requests.length === 0 ? (
          <Card style={{ textAlign: 'center', color: 'var(--md-sys-color-text-muted)', padding: '32px 24px', borderRadius: 'var(--md-shape-xl)' }}>
            {isPro 
              ? 'Você ainda não desbloqueou nenhum contato. Acesse a aba Painel para ver as oportunidades!'
              : 'Nenhuma conversa ativa no momento.'}
          </Card>
        ) : (
          requests.map(req => {
            const displayName = isPro ? (req.client_name || 'Cliente') : (req.title || 'Serviço');
            const subTitle = isPro ? `Serviço: ${req.title}` : 'Toque para abrir a conversa';

            return (
              <Link key={req.id} href={`/chat/${req.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: 'var(--md-shape-lg)' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={(isPro ? req.client_profile_image : req.professional_profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`} 
                      alt="Perfil" 
                      referrerPolicy="no-referrer"
                      style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--md-sys-color-secondary)' }} 
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random` }}
                    />
                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', border: '2px solid var(--md-sys-color-surface)' }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-text)' }}>{displayName}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-secondary)', fontWeight: 600 }}>Ativo</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                      {subTitle}
                    </p>
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
