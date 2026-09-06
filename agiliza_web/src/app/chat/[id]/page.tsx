"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { Button } from '@/components/ui/Button';
import ReviewModal from '@/components/ReviewModal';
import { useAuthStore } from '@/stores/authStore';

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.id as string) || '';
  
  const [inputText, setInputText] = useState('');
  const [token, setToken] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context = useAuthStore(s => s.context);
  const isPro = context === 'PROFESSIONAL' || (context as string) === 'PRO';

  const fetchRequestDetails = useCallback((authToken: string) => {
    if (requestId && requestId !== 'default') {
      fetch(`/api/services/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Não autorizado ou não encontrado");
          return res.json();
        })
        .then(data => {
          setRequestDetails(data);
        })
        .catch(console.error);
    }
  }, [requestId]);

  useEffect(() => {
    const storedToken = localStorage.getItem('agiliza_token');
    const storedUser = localStorage.getItem('agiliza_user');
    
    if (!storedToken) {
      router.push(isPro ? '/login/profissional' : '/login/cliente');
      return;
    }
    
    setToken(storedToken);

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const myId = u.pid || u.id || u.user?.pid || u.user?.id;
        const myName = u.name || u.user?.name;
        if (myId) setUserId(String(myId));
        if (myName) setUserName(String(myName));
      } catch(e) {}
    }

    fetch('/api/auth/current', {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const myId = data.pid || data.id;
        const myName = data.name;
        if (myId) setUserId(String(myId));
        if (myName) setUserName(String(myName));
      })
      .catch(console.error);

    fetchRequestDetails(storedToken);

  }, [requestId, router, fetchRequestDetails, isPro]);

  const { messages, isConnected, isSending, sendMessage } = useWebSocketChat(requestId, token);

  // Rolagem automática para a mensagem mais recente
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isCancelled) return;

    const content = inputText;
    setInputText('');
    await sendMessage(content);
    setTimeout(scrollToBottom, 100);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !requestId) return;
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/services/requests/${requestId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchRequestDetails(token);
        if (newStatus === 'COMPLETED' && !isPro) {
          setShowReviewModal(true);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Erro ao atualizar o andamento do pedido.');
      }
    } catch(e) {
      alert('Erro de conexão ao atualizar pedido.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStatus = requestDetails?.status || 'PENDING';
  const isCompleted = currentStatus === 'COMPLETED';
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh', 
      maxHeight: '100vh',
      width: '100%',
      overflow: 'hidden', 
      backgroundColor: 'var(--md-sys-color-bg)' 
    }}>
      {/* Top Bar Fixa */}
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', 
        backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-border)',
        boxShadow: 'var(--md-elevation-1)', flexShrink: 0, zIndex: 20
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--md-sys-color-primary)', cursor: 'pointer', fontWeight: 700 }}
        >
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <img 
            src={(isPro ? requestDetails?.client_profile_image : requestDetails?.professional_profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(isPro ? (requestDetails?.client_name || 'Cliente') : (requestDetails?.title || 'Serviço'))}&background=random`} 
            alt="Perfil" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--md-sys-color-primary)', flexShrink: 0 }} 
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(isPro ? (requestDetails?.client_name || 'Cliente') : (requestDetails?.title || 'Serviço'))}&background=random` }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isPro ? (requestDetails?.client_name || 'Cliente') : (requestDetails?.title || 'Atendimento do Serviço')}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: isConnected ? '#059669' : '#f59e0b', fontWeight: 700 }}>
                {isConnected ? '● Online (Tempo Real)' : '○ Reconectando...'}
              </span>
            </div>
          </div>
        </div>

        {/* Badge de Status */}
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '4px 8px',
          borderRadius: 'var(--md-shape-sm)',
          backgroundColor: isCompleted ? '#10b981' : (isCancelled ? '#ef4444' : 'var(--md-sys-color-primary)'),
          color: '#FFFFFF'
        }}>
          {isCompleted ? 'CONCLUÍDO' : (isCancelled ? 'CANCELADO' : 'EM ATENDIMENTO')}
        </span>
      </header>

      {/* Histórico de Mensagens com Scroll Interno Próprio */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        WebkitOverflowScrolling: 'touch',
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px' 
      }}>
        
        {/* Banner de Encerramento e Avaliação para o Cliente quando o serviço for Concluído */}
        {!isPro && isCompleted && (
          <div style={{
            padding: '18px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid #f59e0b',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '10px',
            boxShadow: 'var(--md-elevation-1)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f59e0b' }}>
              🎉 O Profissional finalizou este serviço!
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-text)', margin: '6px 0 14px 0' }}>
              Por favor, confirme o encerramento e deixe sua avaliação sobre o atendimento do profissional.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowReviewModal(true)}
              style={{ backgroundColor: '#f59e0b', color: '#FFFFFF', padding: '10px 22px', fontWeight: 700, border: 'none' }}
            >
              ⭐ Confirmar Encerramento e Avaliar
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--md-sys-color-text-muted)', marginTop: '40px', fontSize: '0.92rem' }}>
            Nenhuma mensagem neste serviço ainda. Envie um oi! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const senderIdStr = String(msg.sender_id || '').toLowerCase();
            const userIdStr = String(userId || '').toLowerCase();
            const senderNameStr = String(msg.sender_name || '').toLowerCase();
            const userNameStr = String(userName || '').toLowerCase();

            // Identificar se a mensagem foi enviada por MIM (Remetente) ou pelo OUTRO (Destinatário)
            const isMe = Boolean(
              (userIdStr && senderIdStr && userIdStr === senderIdStr) ||
              (userNameStr && senderNameStr && userNameStr === senderNameStr) ||
              senderNameStr === 'você' ||
              (isPro && requestDetails?.professional_user_id && senderIdStr === String(requestDetails.professional_user_id).toLowerCase()) ||
              (!isPro && requestDetails?.client_id && senderIdStr === String(requestDetails.client_id).toLowerCase())
            );

            const displaySenderName = isMe ? 'Você' : (msg.sender_name || (isPro ? 'Cliente' : 'Profissional'));
            const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div 
                key={msg.id} 
                style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  marginLeft: isMe ? 'auto' : '0',
                  marginRight: isMe ? '0' : 'auto',
                  maxWidth: '82%',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  marginBottom: '4px'
                }}
              >
                {/* Cabeçalho de Nome e Horário acima do balão */}
                <div style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 700,
                  color: isMe ? '#a7f3d0' : '#B3F63F', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '0 4px' 
                }}>
                  <span>{displaySenderName}</span>
                  <span style={{ fontWeight: 400, color: 'var(--md-sys-color-text-muted)' }}>{timeStr}</span>
                </div>

                {/* Balão de Mensagem Diferenciado */}
                <div style={{ 
                  background: isMe 
                    ? 'linear-gradient(135deg, #5f43ee 0%, #7c5cff 100%)' 
                    : 'var(--color-surface, #1e293b)',
                  color: isMe ? '#FFFFFF' : 'var(--color-text, #f8fafc)',
                  padding: '12px 18px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  boxShadow: isMe ? '0 4px 14px rgba(95, 67, 238, 0.35)' : '0 4px 14px rgba(0, 0, 0, 0.25)',
                  border: isMe ? '1px solid rgba(255, 255, 255, 0.18)' : '1.5px solid var(--color-border, #334155)',
                  wordBreak: 'break-word'
                }}>
                  <p style={{ margin: 0, fontSize: '0.94rem', lineHeight: '1.5', fontWeight: 500 }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar FIXA Sempre Visível no Rodapé com Barra de Opções Superior */}
      <div style={{ 
        backgroundColor: 'var(--md-sys-color-surface)', 
        borderTop: '1px solid var(--md-sys-color-border)', 
        boxShadow: '0 -2px 10px rgba(0,0,0,0.15)',
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 50
      }}>
        <div style={{ padding: '14px 20px', paddingBottom: '0' }}>
          {isCancelled ? (
            <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.88rem', padding: '8px', fontWeight: 600 }}>
              ❌ Este atendimento foi cancelado e não aceita mais mensagens.
            </div>
          ) : isCompleted ? (
            <div style={{ textAlign: 'center', color: '#10b981', fontSize: '0.88rem', padding: '8px', fontWeight: 600 }}>
              ✅ Serviço Finalizado. O chat foi encerrado.
            </div>
          ) : (
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Digite uma mensagem..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isCancelled || isCompleted}
                style={{ 
                  flex: 1, padding: '12px 18px', borderRadius: 'var(--md-shape-full)', 
                  border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-text)',
                  outline: 'none', fontSize: '0.95rem'
                }} 
              />
              <Button 
                type="submit"
                variant="primary"
                disabled={isSending || !inputText.trim() || isCancelled || isCompleted}
                style={{ 
                  width: '46px', height: '46px', padding: 0, borderRadius: 'var(--md-shape-full)', flexShrink: 0
                }}
              >
                ➤
              </Button>
            </form>
          )}
        </div>

        {/* Barra de Opções do Serviço (Abaixo do Campo de Digitação) */}
        {!isCompleted && !isCancelled && (
          <div style={{
            padding: '8px 20px',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-text-muted)' }}>
              Opções:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="primary"
                onClick={() => {
                  if (confirm(isPro 
                    ? 'Deseja marcar este serviço como finalizado?' 
                    : 'Deseja finalizar o projeto e avaliar o profissional?'
                  )) {
                    handleUpdateStatus('COMPLETED');
                  }
                }}
                disabled={updatingStatus}
                style={{ fontSize: '0.75rem', padding: '6px 12px', backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}
              >
                ✅ Finalizar
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar este atendimento?')) {
                    handleUpdateStatus('CANCELLED');
                  }
                }}
                disabled={updatingStatus}
                style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#dc2626', borderColor: '#dc2626' }}
              >
                ❌ Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Avaliação para o Cliente */}
      {requestDetails && requestDetails.professional_profile_id && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          professionalProfileId={requestDetails.professional_profile_id}
          serviceRequestId={requestDetails.id}
          serviceTitle={requestDetails.title}
          onSuccess={() => {
            if (token) fetchRequestDetails(token);
          }}
        />
      )}
    </div>
  );
}
