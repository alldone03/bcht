import React, { useEffect, useState } from 'react';
import FormBuilder from './FormBuilder';
import FormResponsesList from './FormResponsesList';
import FormsList from './FormsList';
import { api } from '../api';
import {
  ClipboardList,
  FilePlus,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  ShieldCheck,
  Clock,
  Bot,
  User,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

export default function DokterDashboard({ user, activeTab, setActiveTab }) {
  return (
    <div className="space-y-6">
      {/* Mobile Tab Nav */}
      <div className="tabs tabs-boxed md:hidden bg-base-100 p-2 shadow rounded-xl flex-wrap">
        <a
          className={`tab ${activeTab === 'forms-responses' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('forms-responses')}
        >
          Respon Form
        </a>
        <a
          className={`tab ${activeTab === 'forms-builder' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('forms-builder')}
        >
          Form Builder
        </a>
        <a
          className={`tab ${activeTab === 'forms-list' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('forms-list')}
        >
          Isi Formulir
        </a>
        <a
          className={`tab ${activeTab === 'supervisi-chat' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('supervisi-chat')}
        >
          Supervisi Chat
        </a>
      </div>

      {activeTab === 'forms-builder' ? (
        <FormBuilder onBack={() => setActiveTab('forms-responses')} />
      ) : activeTab === 'forms-list' ? (
        <FormsList user={user} setActiveTab={setActiveTab} />
      ) : activeTab === 'supervisi-chat' ? (
        <ChatSupervisionView />
      ) : (
        <FormResponsesList />
      )}
    </div>
  );
}

function ChatSupervisionView() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Modals / Input state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    loadSessions();
    loadPatients();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await api.chatGetSupervisionSessions();
      setSessions(data);
    } catch (e) {
      console.error("Gagal memuat sesi supervisi", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadPatients = async () => {
    try {
      const allUsers = await api.getUsers();
      setPatients(allUsers.filter(u => u.role === 'PESERTA'));
    } catch (e) {
      console.error("Gagal memuat daftar pasien", e);
    }
  };

  // WebSocket Connection & Real-Time Sync for Doctor
  useEffect(() => {
    if (!selectedSession) {
      setSocketConnected(false);
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:6001';
    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WS Doctor] Connected to WebSocket server');
        setSocketConnected(true);
        socket.send(JSON.stringify({ type: 'subscribe', sessionId: selectedSession.id }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: wsEvent, data } = payload;

          if (wsEvent === 'message_created') {
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev;
              return [...prev, data];
            });
          } else if (wsEvent === 'message_updated') {
            setMessages(prev => prev.map(m => m.id === data.id ? data : m));
          } else if (wsEvent === 'message_deleted') {
            setMessages(prev => prev.filter(m => m.id !== data.id));
          }
        } catch (err) {
          console.error('[WS Doctor] Failed to parse message', err);
        }
      };

      socket.onclose = () => {
        console.warn('[WS Doctor] Connection closed, retrying in 3s...');
        setSocketConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('[WS Doctor] Socket error', err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [selectedSession]);

  const handleSelectSession = async (sess) => {
    setSelectedSession(sess);
    setEditingMsgId(null);
    setLoadingMessages(true);
    try {
      const msgs = await api.chatGetSupervisionMessages(sess.id);
      setMessages(msgs);
    } catch (e) {
      console.error("Gagal memuat pesan", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Create Session
  const handleCreateSession = async () => {
    if (!selectedPatientId) {
      alert("Pilih pasien terlebih dahulu!");
      return;
    }
    try {
      const sess = await api.chatSupervisionCreateSession(selectedPatientId);
      setSessions(prev => [sess, ...prev]);
      setShowCreateModal(false);
      setSelectedPatientId('');
      handleSelectSession(sess);
      alert("Sesi diskusi medis berhasil dimulai!");
    } catch (e) {
      alert("Gagal membuat sesi: " + e.message);
    }
  };

  // Delete Session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (confirm("Apakah Anda yakin ingin menghapus seluruh sesi diskusi medis ini beserta log chatnya?")) {
      try {
        await api.chatSupervisionDeleteSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
        alert("Sesi diskusi berhasil dihapus.");
      } catch (e) {
        alert("Gagal menghapus sesi: " + e.message);
      }
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession) return;
    const txt = replyText.trim();
    setReplyText('');
    try {
      const updatedMsgs = await api.chatSupervisionSendMessage(selectedSession.id, txt);
      if (!socketConnected) {
        setMessages(updatedMsgs);
      }
    } catch (e) {
      alert("Gagal mengirim pesan: " + e.message);
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (confirm("Hapus pesan ini dari riwayat?")) {
      try {
        await api.chatSupervisionDeleteMessage(msgId);
        if (!socketConnected) {
          setMessages(prev => prev.filter(m => m.id !== msgId));
        }
      } catch (e) {
        alert("Gagal menghapus pesan: " + e.message);
      }
    }
  };

  // Start Edit
  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.message);
  };

  // Submit Edit
  const handleUpdateMessage = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      const updated = await api.chatSupervisionUpdateMessage(msgId, editingText.trim());
      if (!socketConnected) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: updated.message } : m));
      }
      setEditingMsgId(null);
    } catch (e) {
      alert("Gagal memperbarui pesan: " + e.message);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 p-8 flex flex-col items-center justify-center text-center min-h-[400px] h-[calc(100vh-10rem)] max-h-[600px] relative overflow-hidden">
      {/* Background soft glowing blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative space-y-6 max-w-md">
        <div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto border border-warning/20 shadow-lg shadow-warning/5 animate-pulse">
          <MessageSquare className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-black text-neutral">Supervisi Chat Sedang Pemeliharaan</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Fitur supervisi chatbot AI pasien saat ini sedang menjalani pemeliharaan berkala untuk peningkatan performa dan sinkronisasi data klinis. Kami akan segera kembali online.
          </p>
        </div>

        <div className="badge badge-warning gap-1.5 py-3 px-4 rounded-xl font-bold text-[10px] tracking-wider uppercase text-warning-content">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-content animate-ping" />
          Status: Under Maintenance
        </div>

        <div className="pt-4 border-t border-base-200 text-[10px] text-neutral-400">
          Layanan monitoring medis dan respon form tetap berjalan normal.
        </div>
      </div>
    </div>
  );
}
