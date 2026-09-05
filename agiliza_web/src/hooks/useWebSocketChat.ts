import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  service_request_id?: string;
  sender_id: string;
  recipient_id?: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export function useWebSocketChat(id: string, tokenProp?: string, isDirect: boolean = false) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const myIdRef = useRef<string>('');
  const myNameRef = useRef<string>('');
  const retryCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);
  const isSubscribedRef = useRef<boolean>(true);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());

  // Validar se o ID fornecido é um UUID válido antes de tentar conexão
  const isValidUuid = Boolean(id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id));

  // Helper para obter o token JWT mais recente
  const getLatestToken = useCallback((): string => {
    if (tokenProp) return tokenProp.replace(/^Bearer\s+/i, '').trim();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agiliza_token');
      if (stored) return stored.replace(/^Bearer\s+/i, '').trim();
    }
    return '';
  }, [tokenProp]);

  // Carregar dados do usuário logado para ter certeza do ID e Nome
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('agiliza_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const uid = u.pid || u.id || u.user?.pid || u.user?.id;
        const name = u.name || u.user?.name;
        if (uid) myIdRef.current = String(uid).toLowerCase();
        if (name) myNameRef.current = String(name).toLowerCase();
      } catch(e) {}
    }

    const currentToken = getLatestToken();
    if (currentToken) {
      fetch('/api/auth/current', {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const uid = data.pid || data.id;
            const name = data.name;
            if (uid) myIdRef.current = String(uid).toLowerCase();
            if (name) myNameRef.current = String(name).toLowerCase();
          }
        })
        .catch(() => {});
    }
  }, [getLatestToken]);

  // Função para buscar histórico e sincronizar mensagens via REST
  const syncHistory = useCallback(async () => {
    if (!isValidUuid) return;
    const currentToken = getLatestToken();

    const restUrl = isDirect 
      ? `/api/chat/direct/${id}/messages` 
      : `/api/chat/${id}/messages`;

    try {
      const res = await fetch(restUrl, {
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      });
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      if (Array.isArray(data)) {
        setMessages(() => {
          const newSet = new Set<string>();
          const uniqueList: ChatMessage[] = [];
          for (const msg of data) {
            if (!newSet.has(msg.id)) {
              newSet.add(msg.id);
              uniqueList.push(msg);
            }
          }
          seenMsgIdsRef.current = newSet;
          return uniqueList;
        });
      }
    } catch(e) {}
  }, [id, isDirect, isValidUuid, getLatestToken]);

  // Carregar histórico inicial
  useEffect(() => {
    syncHistory();
  }, [syncHistory]);

  // Função central de conexão WebSocket com Exponential Backoff
  const connectRef = useRef<(() => void) | null>(null);

  const connectWebSocket = useCallback(() => {
    if (lastActivityRef.current === 0) lastActivityRef.current = Date.now();
    if (!isSubscribedRef.current || !isValidUuid) return;

    // Limpar conexões ou timers anteriores
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.close();
      } catch(e) {}
      socketRef.current = null;
    }

    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5150';
    const cleanToken = getLatestToken();

    const wsPath = isDirect 
      ? `/api/chat/direct/${id}/ws` 
      : `/api/chat/${id}/ws`;

    const wsUrl = `${protocol}//${host}${wsPath}${cleanToken ? `?token=${encodeURIComponent(cleanToken)}` : ''}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribedRef.current) return;
        setIsConnected(true);
        retryCountRef.current = 0; // Conectado com sucesso -> zera o backoff
        lastActivityRef.current = Date.now();

        // Iniciar Heartbeat periódico a cada 20 segundos
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch(e) {}

            // Watchdog: se não houve sinal de vida há mais de 35s, força reconexão
            if (Date.now() - lastActivityRef.current > 35000) {
              console.warn('[WebSocket Watchdog] Conexão silenciosa/inativa detectada. Forçando reconexão...');
              ws.close();
            }
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        lastActivityRef.current = Date.now();
        try {
          const rawData = JSON.parse(event.data);
          
          // Tratar mensagens de controle / pong
          if (rawData.type === 'pong' || rawData.type === 'ping') {
            return;
          }

          const newMessage: ChatMessage = rawData;
          if (!newMessage.id || !newMessage.content) return;

          setMessages((prev) => {
            if (seenMsgIdsRef.current.has(newMessage.id)) {
              return prev;
            }
            seenMsgIdsRef.current.add(newMessage.id);
            return [...prev, newMessage];
          });

          const msgSenderId = String(newMessage.sender_id || '').toLowerCase();
          const msgSenderName = String(newMessage.sender_name || '').toLowerCase();

          const isSentByMe = (myIdRef.current && msgSenderId === myIdRef.current) || 
                             (myNameRef.current && msgSenderName === myNameRef.current) ||
                             msgSenderName === 'você';

          if (!isSentByMe) {
            window.dispatchEvent(new CustomEvent('agiliza_new_chat_message', {
              detail: {
                sender_name: newMessage.sender_name || 'Outro Usuário',
                content: newMessage.content
              }
            }));
          }
        } catch (e) {}
      };

      const scheduleReconnect = () => {
        if (!isSubscribedRef.current) return;
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Exponential backoff com jitter aleatório (1s, 2s, 4s, 8s, max 15s)
        const baseDelay = Math.min(1000 * Math.pow(1.8, retryCountRef.current), 15000);
        const jitter = baseDelay * (0.8 + Math.random() * 0.4); // +/- 20% jitter
        retryCountRef.current += 1;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        if (connectRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectRef.current, jitter);
        }
      };

      ws.onclose = (event) => {
        // Se foi fechado por não-autorizado (código 4401 / POLICY), tenta atualizar token
        if (event.code === 4401 || event.reason.includes('Token')) {
          retryCountRef.current = Math.min(retryCountRef.current + 2, 6);
        }
        scheduleReconnect();
      };

      ws.onerror = () => {
        scheduleReconnect();
      };

    } catch (e) {
      setIsConnected(false);
      const delay = Math.min(1500 * Math.pow(1.8, retryCountRef.current), 15000);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    }
  }, [id, isDirect, isValidUuid, getLatestToken]);

  useEffect(() => {
    connectRef.current = connectWebSocket;
  }, [connectWebSocket]);

  // Efeito principal de ciclo de vida do WebSocket
  useEffect(() => {
    isSubscribedRef.current = true;
    retryCountRef.current = 0;
    connectWebSocket();

    // Gerenciador de eventos de ciclo de vida do PWA (Foco, Segundo Plano, Conexão de Rede)
    const handleVisibilityAndFocus = () => {
      if (document.visibilityState === 'visible') {
        // Sincronizar mensagens perdidas durante suspensão em segundo plano
        syncHistory();

        // Verificar saúde do socket
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          retryCountRef.current = 0; // Usuário voltou -> prioridade máxima
          connectWebSocket();
        } else {
          // Socket parece aberto: envia ping imediato para validar
          try {
            socket.send(JSON.stringify({ type: 'ping' }));
          } catch(e) {
            connectWebSocket();
          }
        }
      }
    };

    const handleOnline = () => {
      retryCountRef.current = 0;
      syncHistory();
      connectWebSocket();
    };

    document.addEventListener('visibilitychange', handleVisibilityAndFocus);
    window.addEventListener('focus', handleVisibilityAndFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      isSubscribedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityAndFocus);
      window.removeEventListener('focus', handleVisibilityAndFocus);
      window.removeEventListener('online', handleOnline);

      if (socketRef.current) {
        try {
          socketRef.current.onclose = null;
          socketRef.current.onerror = null;
          socketRef.current.onmessage = null;
          socketRef.current.close();
        } catch(e) {}
      }
    };
  }, [connectWebSocket, syncHistory]);

  // Função resiliente para envio de mensagens (WebSocket + REST Fallback)
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    const trimmed = content.trim();
    if (!trimmed || !isValidUuid) return false;

    const socket = socketRef.current;
    
    // 1. Enviar via WebSocket se estiver conectado
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ content: trimmed }));
        return true;
      } catch (e) {
        // Se falhar o envio via WS, continua para o fallback REST
      }
    }

    // 2. REST Fallback garantido (se WS estiver reconectando ou offline)
    setIsSending(true);
    const cleanToken = getLatestToken();
    const restUrl = isDirect 
      ? `/api/chat/direct/${id}/messages` 
      : `/api/chat/${id}/messages`;

    try {
      const res = await fetch(restUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {})
        },
        body: JSON.stringify({ content: trimmed })
      });

      if (res.ok) {
        const confirmedMsg: ChatMessage = await res.json();
        setMessages((prev) => {
          if (seenMsgIdsRef.current.has(confirmedMsg.id)) return prev;
          seenMsgIdsRef.current.add(confirmedMsg.id);
          return [...prev, confirmedMsg];
        });
        return true;
      }
    } catch(e) {
      console.error('[Chat Send Error] Falha ao enviar mensagem via REST fallback', e);
    } finally {
      setIsSending(false);
    }

    return false;
  }, [id, isDirect, isValidUuid, getLatestToken]);

  return { messages, isConnected, isSending, sendMessage, syncHistory };
}

