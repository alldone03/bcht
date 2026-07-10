import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Send, Plus, Sparkles, MessageCircle, Bot, User, Trash2 } from 'lucide-react';

export default function ChatbotWindow({ user }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadSessions();
  }, [user]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setMessages(updatedMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-10rem)] max-h-[600px]">
      {/* Session List Column */}
      <div className="md:col-span-1 bg-base-100 rounded-2xl shadow-xl border border-base-200 p-4 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-sm text-neutral">Daftar Diskusi</h3>
            <button 
              onClick={handleCreateSession}
              className="btn btn-ghost btn-circle btn-xs text-primary"
              title="Mulai Sesi Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {sessions.map((sess) => (
              <div 
                key={sess.id} 
                onClick={() => handleSelectSession(sess)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center text-xs ${
                  activeSession?.id === sess.id 
                    ? 'bg-primary text-primary-content font-bold shadow-md shadow-primary/20' 
                    : 'bg-base-200 hover:bg-base-300 text-neutral'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{sess.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(e, sess.id)} 
                  className="hover:scale-110 text-error-content hover:text-error-content/85"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-4">Belum ada diskusi. Klik "+" untuk memulai.</p>
            )}
          </div>
        </div>

        <div className="p-3 bg-base-200 rounded-xl mt-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] text-neutral-500">Konteks terikat dengan riwayat hasil screening kesehatan Anda.</span>
        </div>
      </div>

      {/* Active Conversation Interface Column */}
      <div className="md:col-span-3 bg-base-100 rounded-2xl shadow-xl border border-base-200 flex flex-col justify-between overflow-hidden">
        {activeSession ? (
          <>
            {/* Chat header info */}
            <div className="p-4 border-b border-base-200 bg-base-200/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-neutral">{activeSession.title}</h4>
                  <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{activeSession.llm_model}</p>
                </div>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[400px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat ${msg.role === 'USER' ? 'chat-end' : 'chat-start'}`}>
                  <div className="chat-image avatar placeholder">
                    <div className="w-8 rounded-full bg-neutral text-neutral-content">
                      {msg.role === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className={`chat-bubble text-xs leading-relaxed ${msg.role === 'USER' ? 'bg-primary text-primary-content' : 'bg-base-200 text-neutral'}`}>
                    {msg.message}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat chat-start">
                  <div className="chat-image avatar placeholder">
                    <div className="w-8 rounded-full bg-neutral text-neutral-content">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="chat-bubble bg-base-200 text-neutral text-xs">
                    <span className="loading loading-dots loading-xs"></span> Patriot AI sedang menganalisis...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-base-200 bg-base-200/20 flex gap-2">
              <input 
                type="text" 
                placeholder="Ketik keluhan atau pertanyaan Anda di sini..." 
                className="input input-bordered flex-1 rounded-xl text-xs"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="btn btn-primary rounded-xl btn-sm h-10 px-4"
                disabled={loading}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
            <Bot className="w-12 h-12 text-primary mb-3 animate-bounce" />
            <h4 className="font-heading font-bold text-sm text-neutral">Mulai Konsultasi AI Anda</h4>
            <p className="text-xs max-w-sm mt-1">Pilih salah satu sesi diskusi medis di sidebar atau buat sesi baru untuk berkonsultasi.</p>
            <button onClick={handleCreateSession} className="btn btn-primary btn-sm mt-4 rounded-lg">
              Mulai Diskusi Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
