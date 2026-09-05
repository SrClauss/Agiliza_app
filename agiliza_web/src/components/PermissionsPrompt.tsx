'use client';
import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';

export default function PermissionsPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkPermissionsStatus = () => {
    let locDenied = false;
    let notifDenied = false;

    if ('Notification' in window) {
      if (Notification.permission === 'denied') {
        notifDenied = true;
      }
    }

    if ('geolocation' in navigator) {
      navigator.permissions?.query({ name: 'geolocation' as any }).then((result) => {
        if (result.state === 'denied') {
          locDenied = true;
        }

        if (locDenied || notifDenied) {
          setIsBlocked(true);
        }
      }).catch(() => {});
    }

    if (notifDenied) {
      setIsBlocked(true);
    }
  };

  const requestPermissions = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem('agiliza_lat', position.coords.latitude.toString());
          localStorage.setItem('agiliza_lon', position.coords.longitude.toString());
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setIsBlocked(true);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'denied') {
          setIsBlocked(true);
        } else if (permission === 'granted' && 'serviceWorker' in navigator) {
          registerWebPushSubscription();
        }
      });
    }
  };

  const registerWebPushSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = 'BG_46KFeyhhEnxywfpu0KzpwUYn6aOzTti3dmkE9qmq21A3WDeA6LbZzW77dsHNHm_pykaOS9H4keOEWM05MgMo';
      
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
        const base64 = (vapidPublicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
      }

      const token = localStorage.getItem('agiliza_token');
      if (sub && token) {
        await fetch('/api/device_tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            token: JSON.stringify(sub),
            platform: 'web'
          })
        });
      }
    } catch(e) {}
  };

  useEffect(() => {
    // Avoid synchronous setState in useEffect
    setTimeout(() => {
      requestPermissions();
      checkPermissionsStatus();
    }, 0);

    const hasLat = typeof window !== 'undefined' && !!localStorage.getItem('agiliza_lat');
    const isNotifGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

    if (!hasLat || !isNotifGranted) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#19033E',
        border: '2px solid #B3F63F',
        borderRadius: 'var(--md-shape-xl)',
        padding: '24px',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.9), 0 0 24px rgba(179, 246, 63, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#FFFFFF'
      }}>
        {/* Título com Ícones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '16px' }}>
          <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>📍🔔</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#B3F63F', letterSpacing: '-0.2px' }}>
              Ativar Permissões no AgilizaPro
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#D1D5DB', fontWeight: 500 }}>
              Experiência completa e em tempo real
            </span>
          </div>
        </div>

        {/* Explicação de Para que Serve */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>📍</span>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '0.98rem' }}>Localização GPS:</strong>
              <p style={{ margin: '3px 0 0 0', color: '#E5E7EB', lineHeight: 1.4, fontSize: '0.88rem' }}>
                Para conectar você instantaneamente aos profissionais mais próximos da sua região e calcular trajetos.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🔔</span>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '0.98rem' }}>Notificações Push:</strong>
              <p style={{ margin: '3px 0 0 0', color: '#E5E7EB', lineHeight: 1.4, fontSize: '0.88rem' }}>
                Para avisar você imediatamente quando um profissional aceitar seu chamado ou enviar mensagem no chat.
              </p>
            </div>
          </div>
        </div>

        {/* Instrução de Como Ativar no Painel do Navegador */}
        <div style={{
          backgroundColor: '#26065B',
          border: '1.5px solid #B3F63F',
          borderRadius: 'var(--md-shape-md)',
          padding: '16px',
          fontSize: '0.88rem'
        }}>
          <div style={{ fontWeight: 800, color: '#B3F63F', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
            <span>🛠️</span> Como Liberar as Permissões no Navegador:
          </div>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#FFFFFF', lineHeight: 1.4, fontWeight: 500 }}>
            <li>
              Clique no ícone de <strong style={{ color: '#B3F63F' }}>Configurações do Site ( 🎛️ ou 🔒 )</strong> ao lado da barra de endereço (<code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', color: '#B3F63F' }}>app.agilizapro.net</code>).
            </li>
            <li>
              Ligue os botões das permissões de <strong style={{ color: '#B3F63F' }}>Local 📍</strong> e <strong style={{ color: '#B3F63F' }}>Notificações 🔔</strong>.
            </li>
            <li>
              Clique no botão <strong style={{ color: '#B3F63F' }}>Recarregar</strong> que surgirá no topo da página para aplicar!
            </li>
          </ol>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', alignItems: 'center', marginTop: '4px' }}>
          <button 
            onClick={() => setShowPrompt(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#D1D5DB',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '10px 16px'
            }}
          >
            Fechar
          </button>
          <Button 
            variant="primary" 
            onClick={() => {
              requestPermissions();
              setShowPrompt(false);
            }}
            style={{ fontSize: '0.92rem', padding: '12px 24px' }}
          >
            Tentar Solicitar ⚡
          </Button>
        </div>
      </div>
    </div>
  );
}
