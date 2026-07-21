import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Send, Plus, Sparkles, MessageCircle, Bot, User, Trash2 } from 'lucide-react';

export default function ChatbotWindow({ user }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [llmActive, setLlmActive] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch all chat sessions on load
  const loadSessions = async () => {
    try {
      const data = await api.getChatSessions();
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        handleSelectSession(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkStatus = async () => {
    if (socketConnected) return; // skip polling if WebSocket is active
    try {
      const res = await api.chatGetLlmStatus();
      setLlmActive(res.active);
    } catch (e) {
      setLlmActive(false);
    }
  };

  useEffect(() => {
    loadSessions();
    checkStatus();
  }, [user]);

  // Polling for LLM Status (fallback if WebSocket is down)
  useEffect(() => {
    if (socketConnected) return;
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [socketConnected]);

  // WebSocket Connection & Real-Time Sync
  useEffect(() => {
    if (!activeSession) {
      setSocketConnected(false);
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:6001';
    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WS] Connected to WebSocket server');
        setSocketConnected(true);
        socket.send(JSON.stringify({ type: 'subscribe', sessionId: activeSession.id }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: wsEvent, data } = payload;
          
          if (wsEvent === 'llm_status') {
            setLlmActive(data.active);
          } else if (wsEvent === 'message_created') {
            setMessages(prev => {
              // Remove temporary optimistic bubble if it matches the received message content and role
              const filtered = prev.filter(m => !(m.role === data.role && m.message === data.message && typeof m.id === 'number' && String(m.id).length > 10));
              if (filtered.some(m => m.id === data.id)) return prev;
              return [...filtered, data];
            });
            setPolling(false);
            setLoading(false);
          } else if (wsEvent === 'message_updated') {
            setMessages(prev => prev.map(m => m.id === data.id ? data : m));
          } else if (wsEvent === 'message_deleted') {
            setMessages(prev => prev.filter(m => m.id !== data.id));
          }
        } catch (err) {
          console.error('[WS] Failed to parse message', err);
        }
      };

      socket.onclose = () => {
        console.warn('[WS] Connection closed, retrying in 3s...');
        setSocketConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('[WS] Socket error', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [activeSession]);

  // Polling for queue responses (fallback if socket is down)
  useEffect(() => {
    if (socketConnected) {
      setPolling(false);
      return;
    }
    let pollInterval;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'USER' && activeSession) {
      setPolling(true);
      pollInterval = setInterval(async () => {
        try {
          const msgs = await api.getChatMessages(activeSession.id);
          const newLast = msgs[msgs.length - 1];
          if (newLast && newLast.role === 'ASSISTANT') {
            setMessages(msgs);
            setPolling(false);
            clearInterval(pollInterval);
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    } else {
      setPolling(false);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [messages, activeSession, socketConnected]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, polling]);

  const handleSelectSession = async (session) => {
    setActiveSession(session);
    try {
      const msgs = await api.getChatMessages(session.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSess = await api.createChatSession();
      setSessions(prev => [newSess, ...prev]);
      setActiveSession(newSess);
      const msgs = await api.getChatMessages(newSess.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus sesi diskusi ini?')) {
      try {
        await api.deleteChatSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
          setMessages([]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeSession) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message bubble
    const userBubble = {
      id: Date.now(),
      role: 'USER',
      message: userMsg,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userBubble]);

    try {
      const updatedMessages = await api.sendChatMessage(activeSession.id, userMsg);
      if (!socketConnected) {
        setMessages(updatedMessages);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessages(prev => prev.filter(m => m.id !== userBubble.id));
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 p-8 flex flex-col items-center justify-center text-center min-h-[400px] h-[calc(100vh-10rem)] max-h-[600px] relative overflow-hidden">
      {/* Background soft glowing blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative space-y-6 max-w-md">
        <div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto border border-warning/20 shadow-lg shadow-warning/5 animate-pulse">
          <Bot className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-black text-neutral">Chatbot AI Sedang Pemeliharaan</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Asisten virtual Patriot AI saat ini sedang menjalani pembaruan sistem berkala untuk meningkatkan kualitas pelayanan kesehatan kami. Kami akan segera kembali online.
          </p>
        </div>

        <div className="badge badge-warning gap-1.5 py-3 px-4 rounded-xl font-bold text-[10px] tracking-wider uppercase text-warning-content">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-content animate-ping" />
          Status: Under Maintenance
        </div>

        <div className="pt-4 border-t border-base-200 text-[10px] text-neutral-400">
          Silakan hubungi Tim Kesehatan atau Dokter Anda jika memerlukan penanganan medis segera.
        </div>
      </div>
    </div>
  );
}
