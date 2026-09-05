"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'service' | 'chat';
  targetUrl?: string;
}

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioContext.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.35);
  } catch (e) {
    // Ignorar se o áudio for bloqueado por política de reprodução automática sem interação prévia
  }
};

export default function NotificationListener() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [knownRequestStatuses, setKnownRequestStatuses] = useState<Map<string, string>>(new Map());
  const [knownLastMsgIds, setKnownLastMsgIds] = useState<Map<string, string>>(new Map());
  const [isFirstCheck, setIsFirstCheck] = useState(true);

  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  const context = useAuthStore(s => s.context);
  const logout = useAuthStore(s => s.logout);
  const myUserIdRef = useRef<string>('');

  // Solicitar permissão de Notificação do navegador ao carregar
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const currentToken = useAuthStore.getState().token;
    if (!currentToken) return;

    navigator.serviceWorker.ready.then(reg => {
      if ('pushManager' in reg) {
        reg.pushManager.getSubscription().then(async sub => {
          if (!sub) {
            try {
              const newSub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-m9GYW55mB5k93oZ488v29o97092Z6o2z_5493026z969Z9_Z_29_Z9_Z')
              });
              await sendSubscriptionToBackend(newSub, currentToken);
            } catch(e) {
              const fakeToken = "browser_pwa_" + Math.random().toString(36).substring(2, 10);
              await sendSubscriptionToBackend({ endpoint: fakeToken }, currentToken);
            }
          } else {
            await sendSubscriptionToBackend(sub, currentToken);
          }
        }).catch(async () => {
          const fakeToken = "browser_pwa_" + Math.random().toString(36).substring(2, 10);
          await sendSubscriptionToBackend({ endpoint: fakeToken }, currentToken);
        });
      }
    }).catch(() => {});
  }, [token]);

  const sendSubscriptionToBackend = async (sub: any, currentToken: string) => {
    try {
      await fetch('/api/device_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          token: sub.endpoint || JSON.stringify(sub),
          platform: 'web_pwa'
        })
      });
    } catch(e) {}
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const triggerNotification = useCallback((title: string, message: string, type: 'service' | 'chat', targetUrl: string = '/chat') => {
    playNotificationSound();

    let absoluteUrl = targetUrl.startsWith('/') ? `https://app.agilizapro.net${targetUrl}` : targetUrl;
    if (absoluteUrl === 'https://agilizapro.net' || absoluteUrl === 'https://agilizapro.net/' || absoluteUrl === '/') {
      absoluteUrl = 'https://app.agilizapro.net/chat';
    }

    const newToast: Toast = {
      id: Date.now().toString() + Math.random(),
      title,
      message,
      type,
      targetUrl
    };

    setToasts(prev => [newToast, ...prev]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);

    // Se a aba estiver aberta e visível na tela, não incomoda o usuário com notificação Push do sistema, o Toast já avisou.
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        try {
          reg.showNotification(title, {
            body: message,
            icon: '/agilizapro_logo_badge.png',
            badge: '/agilizapro_logo_badge.png',
            tag: 'chat', // Use same tag to merge with ServiceWorker push
            data: { url: absoluteUrl }
          });
        } catch(e) {}
      }).catch(() => {});
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: message,
          icon: '/agilizapro_logo_badge.png',
          tag: 'chat', // Use same tag
          data: { url: absoluteUrl }
        });
        notif.onclick = (e) => {
          e.preventDefault();
          window.focus();
          router.push(targetUrl);
        };
      } catch(e) {}
    }
  }, [router]);

  useEffect(() => {
    const handleNewChatMessage = (e: any) => {
      const detail = e.detail;
      if (detail) {
        triggerNotification(
          `💬 Nova mensagem de ${detail.sender_name || 'Usuário'}`,
          detail.content || 'Você recebeu uma nova mensagem no chat.',
          'chat',
          '/chat'
        );
      }
    };

    window.addEventListener('agiliza_new_chat_message', handleNewChatMessage);
    return () => {
      window.removeEventListener('agiliza_new_chat_message', handleNewChatMessage);
    };
  }, [triggerNotification]);

  useEffect(() => {
    if (!token || !user) return;

    const userRole = context;
    const myUserId = String((user as any)?.id || user?.pid || '').toLowerCase();
    const myProfId = String(user?.pid || '').toLowerCase();
    const myName = String(user?.name || '').toLowerCase();

    const interval = setInterval(() => {
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      fetch('/api/services/requests', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
        .then(res => {
          if (res.status === 401) {
            logout();
            clearInterval(interval);
            return null;
          }
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            const currentStatusMap = new Map<string, string>();
            data.forEach((r: any) => currentStatusMap.set(r.id, r.status));

            if (!isFirstCheck) {
              data.forEach((req: any) => {
                const prevStatus = knownRequestStatuses.get(req.id);

                if (userRole === 'PROFESSIONAL' && !prevStatus && (req.status === 'PENDING' || req.status === 'OPEN')) {
                  triggerNotification(
                    '🔔 Novo Serviço na Sua Região!',
                    `Oportunidade: ${req.title} - ${req.address || 'Próximo a você'}`,
                    'service',
                    '/pro'
                  );
                }

                if (userRole === 'CLIENT' && prevStatus === 'PENDING' && (req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS')) {
                  triggerNotification(
                    '🎉 Um Profissional Aceitou Seu Pedido!',
                    `O serviço "${req.title}" foi aceito por um profissional. Clique para abrir as mensagens!`,
                    'service',
                    `/chat/${req.id}`
                  );
                }

                if (req.status !== 'PENDING' && req.status !== 'CANCELLED') {
                  fetch(`/api/chat/${req.id}/messages`, {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                  })
                    .then(r => r.ok ? r.json() : [])
                    .then(msgs => {
                      if (Array.isArray(msgs) && msgs.length > 0) {
                        const lastMsg = msgs[msgs.length - 1];
                        const lastMsgId = lastMsg.id;
                        const prevLastMsgId = knownLastMsgIds.get(req.id);

                        const currentUserPid = String((useAuthStore.getState().user as any)?.pid || '').toLowerCase();
                        const senderId = String(lastMsg.sender_id || '').toLowerCase();
                        const senderName = String(lastMsg.sender_name || '').toLowerCase();

                        const isFromMe = Boolean(
                          (currentUserPid && senderId === currentUserPid) ||
                          (myUserId && senderId === myUserId) ||
                          (myProfId && senderId === myProfId) ||
                          (myName && senderName === myName) ||
                          senderName === 'você'
                        );
                        const isFromOther = !isFromMe;

                        if (prevLastMsgId && prevLastMsgId !== lastMsgId && isFromOther) {
                          triggerNotification(
                            `💬 Nova mensagem de ${lastMsg.sender_name || 'Usuário'}`,
                            lastMsg.content,
                            'chat',
                            `/chat/${req.id}`
                          );
                        }

                        setKnownLastMsgIds(prev => new Map(prev).set(req.id, lastMsgId));
                      }
                    })
                    .catch(() => {});
                }
              });
            } else {
              data.forEach((req: any) => {
                if (req.status !== 'PENDING') {
                  fetch(`/api/chat/${req.id}/messages`, {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                  })
                    .then(r => r.ok ? r.json() : [])
                    .then(msgs => {
                      if (Array.isArray(msgs) && msgs.length > 0) {
                        const lastMsg = msgs[msgs.length - 1];
                        setKnownLastMsgIds(prev => new Map(prev).set(req.id, lastMsg.id));
                      }
                    })
                    .catch(() => {});
                }
              });
              setIsFirstCheck(false);
            }

            setKnownRequestStatuses(currentStatusMap);
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [knownRequestStatuses, knownLastMsgIds, isFirstCheck, triggerNotification, token, user, context, logout]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '420px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <div 
          key={toast.id}
          onClick={() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
            router.push(toast.targetUrl || '/chat');
          }}
          style={{
            cursor: 'pointer',
            pointerEvents: 'auto',
            background: toast.type === 'service' 
              ? 'linear-gradient(180deg, var(--md-sys-color-surface) 0%, var(--md-sys-color-surface-variant) 100%)' 
              : 'linear-gradient(180deg, var(--md-sys-color-primary) 0%, #21014a 100%)',
            color: toast.type === 'service' ? 'var(--md-sys-color-text)' : '#FFFFFF',
            padding: '14px 18px',
            borderRadius: 'var(--md-shape-md)',
            border: toast.type === 'service' ? '1.5px solid var(--md-sys-color-primary)' : '1.5px solid var(--md-sys-color-secondary)',
            boxShadow: 'var(--md-elevation-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            transition: 'transform 0.15s ease'
          }}
        >
          <strong style={{ fontSize: '0.95rem', color: toast.type === 'service' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-secondary)' }}>
            {toast.title}
          </strong>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {toast.message}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#B3F63F', marginTop: '2px', fontWeight: 600 }}>
            👉 Toque para abrir a conversa
          </span>
        </div>
      ))}
    </div>
  );
}
