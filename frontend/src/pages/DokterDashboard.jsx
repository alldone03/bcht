import React, { useState, useEffect, useRef } from 'react';
import MewsBuilder from './MewsBuilder';
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
  const [mewsSubmissions, setMewsSubmissions] = useState([]);
  const [mewsLoading, setMewsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [adviceText, setAdviceText] = useState('');
  const [submittingAdvice, setSubmittingAdvice] = useState(false);

  const isFetchingMews = useRef(false);

  useEffect(() => {
    if (activeTab === 'mews-submissions') {
      fetchMewsSubmissions();
    }
  }, [activeTab]);

  const fetchMewsSubmissions = async () => {
    if (isFetchingMews.current) return;
    isFetchingMews.current = true;
    setMewsLoading(true);
    try {
      const data = await api.mewsGetAllResults();
      setMewsSubmissions(data);
    } catch (e) {
      console.error("Gagal mengambil submissions M-EWS", e);
    } finally {
      setMewsLoading(false);
      isFetchingMews.current = false;
    }
  };

  const handleOpenReview = (sub) => {
    setSelectedResult(sub);
    setAdviceText(sub.doctor_notes || '');
  };

  const handleCloseReview = () => {
    setSelectedResult(null);
    setAdviceText('');
  };

  const handleSubmitAdvice = async () => {
    if (!adviceText.trim()) {
      alert("Saran klinis dokter tidak boleh kosong!");
      return;
    }

    setSubmittingAdvice(true);
    try {
      // If we don't have result_id directly, fallback to session_id
      const id = selectedResult.result_id || selectedResult.session_id;
      await api.mewsApproveResult(id, adviceText);
      alert("Hasil screening berhasil divalidasi dan saran telah dikirim ke pasien!");
      handleCloseReview();
      fetchMewsSubmissions();
    } catch (e) {
      alert("Gagal memberikan ulasan: " + e.message);
    } finally {
      setSubmittingAdvice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Tab Nav */}
      <div className="tabs tabs-boxed md:hidden bg-base-100 p-2 shadow rounded-xl flex-wrap">
        <a 
          className={`tab ${activeTab === 'mews-submissions' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('mews-submissions')}
        >
          Hasil M-EWS
        </a>
        <a 
          className={`tab ${activeTab === 'mews-builder' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('mews-builder')}
        >
          Builder M-EWS
        </a>
        <a 
          className={`tab ${activeTab === 'mews-chats' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('mews-chats')}
        >
          Supervisi Chat
        </a>
      </div>

      {activeTab === 'mews-builder' ? (
        <div>
          <MewsBuilder doctorId={user.id} onTemplateSaved={() => setActiveTab('mews-submissions')} />
        </div>
      ) : activeTab === 'mews-chats' ? (
        <ChatSupervisionView />
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-black text-neutral">Hasil Screening M-EWS</h1>
            <p className="text-sm text-neutral-500 mt-1">Daftar lengkap hasil skrining klinis parameter M-EWS dari seluruh pasien.</p>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-200 p-6 rounded-3xl">
            {mewsLoading ? (
              <div className="text-center py-12">
                <span className="loading loading-spinner text-primary" />
                <p className="text-xs text-neutral-500 mt-2">Memuat data...</p>
              </div>
            ) : mewsSubmissions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                Belum ada pasien yang melakukan screening M-EWS.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Pasien</th>
                      <th>Template</th>
                      <th>Skor Total</th>
                      <th>Klasifikasi</th>
                      <th>Status Verifikasi</th>
                      <th>Rincian Review</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mewsSubmissions.map((sub, idx) => (
                      <tr key={idx} className="hover">
                        <td>
                          <div className="font-bold text-xs text-neutral">{sub.participant_name}</div>
                        </td>
                        <td>
                          <div className="text-xs text-neutral-500">{sub.template_name}</div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold font-mono text-xs text-neutral">Total: {sub.total_score}</span>
                            <span className="text-[10px] text-neutral-400">Max: {sub.highest_score}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-sm font-extrabold uppercase px-2 py-0.5 rounded ${
                            sub.classification === 'RED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : sub.classification === 'YELLOW' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
                          }`}>
                            {sub.classification}
                          </span>
                        </td>
                        <td>
                          {sub.status === 'APPROVED' ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                              <ShieldCheck className="w-4 h-4 shrink-0" /> Diverifikasi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-neutral-400 font-bold text-xs">
                              <Clock className="w-4 h-4 shrink-0" /> Tertunda
                            </span>
                          )}
                        </td>
                        <td className="max-w-[200px] truncate text-xs text-neutral-500">
                          {sub.status === 'APPROVED' ? (
                            <div>
                              <div className="font-bold text-neutral-700">Dr. {sub.doctor_name}</div>
                              <div className="italic text-[10px] truncate">{sub.doctor_notes}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-normal">Belum ada saran</span>
                          )}
                        </td>
                        <td className="text-xs text-neutral-400">
                          {new Date(sub.finished_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button 
                            onClick={() => handleOpenReview(sub)}
                            className="btn btn-primary btn-xs rounded-xl font-bold flex items-center gap-1"
                          >
                            {sub.status === 'APPROVED' ? 'Edit Saran' : 'Beri Saran'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedResult && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-xl p-6 relative">
            <button 
              onClick={handleCloseReview}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading font-black text-lg text-neutral mb-2">Validasi & Rekomendasi Medis</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Berikan saran klinis untuk pasien <strong>{selectedResult.participant_name}</strong> berdasarkan hasil M-EWS dengan klasifikasi <strong>{selectedResult.classification}</strong> (Skor: {selectedResult.total_score}).
            </p>

            <div className="bg-base-200/60 border border-base-200 p-4 rounded-2xl mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-neutral-500">Klasifikasi M-EWS:</span>
                <span className="font-black text-neutral">{selectedResult.classification}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-neutral-500">Rekomendasi Awal:</span>
                <span className="font-medium text-neutral">{selectedResult.recommendation}</span>
              </div>
            </div>

            <div className="form-control mb-5">
              <label className="label"><span className="label-text font-bold text-xs">Saran / Catatan Khusus Dokter</span></label>
              <textarea 
                rows="4"
                value={adviceText}
                onChange={(e) => setAdviceText(e.target.value)}
                className="textarea textarea-bordered rounded-2xl text-xs w-full focus:outline-none"
                placeholder="Tulis instruksi observasi, saran obat, atau langkah rujukan selanjutnya..."
                required
              />
            </div>

            <div className="modal-action">
              <button 
                onClick={handleCloseReview}
                className="btn btn-ghost rounded-xl btn-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitAdvice}
                disabled={submittingAdvice}
                className="btn btn-primary rounded-xl btn-sm font-bold flex items-center gap-1 px-4"
              >
                {submittingAdvice ? <span className="loading loading-spinner loading-xs" /> : <Send className="w-3.5 h-3.5" />}
                Kirim Validasi
              </button>
            </div>
          </div>
        </div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-black text-neutral">Supervisi Chatbot AI Pasien</h1>
          <p className="text-sm text-neutral-500 mt-1">Supervisi & kelola riwayat konsultasi medis antara pasien dan Patriot AI.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary rounded-xl btn-sm font-bold flex items-center gap-1.5 px-4"
        >
          <Plus className="w-4 h-4" />
          Mulai Diskusi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-14rem)] max-h-[600px]">
        {/* Left Side: Sessions list */}
        <div className="md:col-span-1 bg-base-100 rounded-2xl shadow-xl border border-base-200 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-sm text-neutral">Daftar Sesi Diskusi</h3>
            {loadingSessions ? (
              <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div 
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-xs flex justify-between items-center ${
                      selectedSession?.id === sess.id
                        ? 'bg-primary text-primary-content border-primary font-bold shadow-md shadow-primary/20'
                        : 'bg-base-200 hover:bg-base-300 text-neutral border-transparent'
                    }`}
                  >
                    <div className="truncate mr-2 flex-1">
                      <div className="font-bold truncate">{sess.participant_name}</div>
                      <div className="text-[10px] opacity-80 truncate">{sess.title}</div>
                      <div className="text-[9px] opacity-60 mt-1">
                        {new Date(sess.started_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSession(e, sess.id)}
                      className="hover:scale-110 text-error-content hover:text-red-500 p-1 rounded"
                      title="Hapus Sesi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-8">Belum ada sesi diskusi dari pasien.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Conversation stream */}
        <div className="md:col-span-3 bg-base-100 rounded-2xl shadow-xl border border-base-200 flex flex-col justify-between overflow-hidden">
          {selectedSession ? (
            <>
              <div className="p-4 border-b border-base-200 bg-base-200/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-neutral">
                    Supervisi: {selectedSession.participant_name}
                  </h4>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
                    Model: {selectedSession.llm_model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-base-200/50 px-2 py-0.5 rounded-xl border border-base-200/60">
                    <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                    <span className="text-[8px] font-bold text-neutral-600">
                      Real-time: {socketConnected ? 'AKTIF' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="badge badge-accent font-bold text-[9px] uppercase">
                    Supervised Active CRUD View
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[400px]">
                {loadingMessages ? (
                  <div className="flex justify-center py-12"><span className="loading loading-spinner text-primary" /></div>
                ) : (
                  messages.map((msg) => {
                    const isDoctor = msg.role === 'DOCTOR';
                    const isUser = msg.role === 'USER';
                    
                    let chatStyle = "chat-start";
                    let bubbleColor = "bg-base-200 text-neutral";
                    let senderLabel = "AI";

                    if (isUser) {
                      chatStyle = "chat-end";
                      bubbleColor = "bg-primary text-primary-content";
                      senderLabel = "U";
                    } else if (isDoctor) {
                      chatStyle = "chat-end";
                      bubbleColor = "bg-success text-success-content font-medium";
                      senderLabel = "Dr";
                    }

                    return (
                      <div key={msg.id} className={`chat ${chatStyle} group`}>
                        <div className="chat-image avatar placeholder">
                          <div className="w-8 rounded-full bg-neutral text-neutral-content flex items-center justify-center text-[10px] font-bold">
                            {senderLabel}
                          </div>
                        </div>
                        <div className={`chat-bubble text-xs leading-relaxed relative max-w-[85%] pr-8 ${bubbleColor}`}>
                          {editingMsgId === msg.id ? (
                            <div className="flex flex-col gap-2 p-1">
                              <textarea 
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="textarea textarea-bordered text-xs focus:outline-none w-full text-neutral bg-base-100"
                                rows="2"
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingMsgId(null)} className="btn btn-ghost btn-xs">Batal</button>
                                <button onClick={() => handleUpdateMessage(msg.id)} className="btn btn-primary btn-xs">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>{msg.message}</div>
                              {/* Edit & Delete operations */}
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all flex gap-1.5 bg-base-100/10 p-0.5 rounded shadow">
                                <button 
                                  onClick={() => startEdit(msg)} 
                                  className="hover:scale-115 text-neutral-content/75 hover:text-primary transition-all"
                                  title="Edit Pesan"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteMessage(msg.id)} 
                                  className="hover:scale-115 text-neutral-content/75 hover:text-red-500 transition-all"
                                  title="Hapus Pesan"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-base-200 bg-base-200/20 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ketik ulasan dokter, koreksi, atau saran Anda..." 
                  className="input input-bordered flex-1 rounded-xl text-xs"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-xl btn-sm h-10 px-4"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
              <Bot className="w-12 h-12 text-primary mb-3" />
              <h4 className="font-heading font-bold text-sm text-neutral">Supervisi Chatbot AI Pasien</h4>
              <p className="text-xs max-w-sm mt-1">
                Pilih salah satu sesi diskusi medis pasien di menu sebelah kiri untuk mengelola log percakapan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl border border-base-200 shadow-2xl">
            <h3 className="font-bold text-lg text-neutral">Mulai Sesi Diskusi Baru</h3>
            <p className="py-2 text-xs text-neutral-500">Pilih pasien untuk memulai sesi konsultasi medis tersupervisi.</p>
            
            <div className="form-control w-full my-4">
              <label className="label"><span className="label-text text-xs font-bold">Pilih Pasien</span></label>
              <select 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="select select-bordered rounded-2xl text-xs w-full focus:outline-none"
              >
                <option value="">-- Pilih Pasien --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>

            <div className="modal-action">
              <button onClick={() => { setShowCreateModal(false); setSelectedPatientId(''); }} className="btn btn-ghost rounded-xl btn-sm">Batal</button>
              <button onClick={handleCreateSession} className="btn btn-primary rounded-xl btn-sm font-bold">Mulai Diskusi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
