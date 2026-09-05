"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { Button } from '@/components/ui/Button';

export default function DirectChatRoom() {
  const params = useParams();
  const router = useRouter();
  const targetUserId = (params?.userId as string) || '';
  
  const [inputText, setInputText] = useState('');
  const [token, setToken] = useState<string | undefined>(undefined);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myUserName, setMyUserName] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<any>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('agiliza_token');
    const storedUser = localStorage.getItem('agiliza_user');
    
    if (!storedToken) {
      router.push('/login/cliente');
      return;
    }
    
    setToken(storedToken);

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const myId = u.pid || u.id || u.user?.pid || u.user?.id;
        const myName = u.name || u.user?.name;
        if (myId) setMyUserId(String(myId));
        if (myName) setMyUserName(String(myName));
      } catch(e) {}
    }

    fetch('/api/auth/current', {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const myId = data.pid || data.id;
        const myName = data.name;
        if (myId) setMyUserId(String(myId));
        if (myName) setMyUserName(String(myName));
      })
      .catch(console.error);

    // Buscar informações do destinatário
    if (targetUserId) {
      fetch(`/api/auth/users/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setTargetUser(data);
        })
        .catch(() => {});
    }

  }, [targetUserId, router]);

  // Hook do WebSocket configurado para Chat Direto (isDirect = true)
  const { messages, isConnected, isSending, sendMessage } = useWebSocketChat(targetUserId, token, true);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText;
    setInputText('');
    await sendMessage(content);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, backgroundColor: 'var(--md-sys-color-bg)' }}>
      {/* M3 Light Top App Bar - Direct Chat */}
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', 
        backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-border)',
        boxShadow: 'var(--md-elevation-1)', flexShrink: 0
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--md-sys-color-primary)', cursor: 'pointer', fontWeight: 700 }}
        >
          ←
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <img 
            src={targetUser?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.name || 'User')}&background=random`} 
            alt="Perfil" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--md-sys-color-primary)', flexShrink: 0 }} 
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.name || 'User')}&background=random` }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {targetUser?.name || 'Conversa Direta'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: isConnected ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
              {isConnected ? '● Online (Tempo Real)' : '○ Reconectando...'}
            </span>
          </div>
        </div>

        <Link href={`/cliente/pedidos/novo?pro_id=${targetUserId}`}>
          <Button variant="outline" style={{ fontSize: '0.75rem', padding: '6px 10px', whiteSpace: 'nowrap' }}>
            📋 Formalizar Pedido
          </Button>
        </Link>
      </header>

      {/* M3 Chat Messages List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--md-sys-color-text-muted)', marginTop: '40px', fontSize: '0.92rem' }}>
            Inicie uma conversa direta com este profissional! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const senderIdStr = String(msg.sender_id || '').toLowerCase();
            const userIdStr = String(myUserId || '').toLowerCase();
            const senderNameStr = String(msg.sender_name || '').toLowerCase();
            const userNameStr = String(myUserName || '').toLowerCase();

            const isMe = Boolean(
              (userIdStr && senderIdStr === userIdStr) ||
              (userNameStr && senderNameStr === userNameStr) ||
              senderNameStr === 'você'
            );

            return (
              <div key={msg.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                marginLeft: isMe ? 'auto' : '0',
                marginRight: isMe ? '0' : 'auto',
                maxWidth: '82%',
                display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <div style={{ 
                  backgroundColor: isMe ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                  color: isMe ? '#FFFFFF' : 'var(--md-sys-color-text)',
                  padding: '12px 16px',
                  borderRadius: 'var(--md-shape-lg)',
                  borderBottomRightRadius: isMe ? '4px' : 'var(--md-shape-lg)',
                  borderBottomLeftRadius: !isMe ? '4px' : 'var(--md-shape-lg)',
                  boxShadow: 'var(--md-elevation-1)',
                  border: isMe ? 'none' : '1px solid var(--md-sys-color-border)'
                }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.45', fontWeight: 500 }}>
                    {msg.content}
                  </p>
                </div>

                <div style={{ 
                  fontSize: '0.72rem', color: 'var(--md-sys-color-text-muted)', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start', 
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '0 4px' 
                }}>
                  <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  {isMe && (
                    <span 
                      title="Entregue e Lida"
                      style={{ 
                        color: 'var(--md-sys-color-primary)',
                        fontWeight: 800, 
                        fontSize: '0.85rem',
                        letterSpacing: '-2px',
                        marginLeft: '2px'
                      }}
                    >
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* M3 Outlined Bottom Chat Input Bar */}
      <div style={{ 
        padding: '14px 20px', 
        backgroundColor: 'var(--md-sys-color-surface)', 
        borderTop: '1px solid var(--md-sys-color-border)', 
        boxShadow: 'var(--md-elevation-1)',
        flexShrink: 0 
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Digite uma mensagem para o profissional..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ 
              flex: 1, padding: '12px 18px', borderRadius: 'var(--md-shape-full)', 
              border: '1.5px solid var(--md-sys-color-border)', backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-text)',
              outline: 'none', fontSize: '0.95rem'
            }} 
          />
          <Button 
            type="submit"
            variant="primary"
            disabled={isSending || !inputText.trim()}
            style={{ 
              width: '46px', height: '46px', padding: 0, borderRadius: 'var(--md-shape-full)'
            }}
          >
            ➤
          </Button>
        </form>
      </div>
    </div>
  );
}
