import React, { useState, useEffect } from 'react';
import MewsScreening from './MewsScreening';
import MewsHistory from './MewsHistory';
import ChatbotWindow from '../components/ChatbotWindow';
import { api } from '../api';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert,
  MessageSquare,
  ClipboardList,
  History
} from 'lucide-react';

export default function PesertaDashboard({ user, activeTab, setActiveTab }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      const data = await api.mewsGetNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Gagal memuat notifikasi", e);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.mewsMarkNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <div className="space-y-6">
      {/* Notifications Panel */}
      {unreadNotifications.length > 0 && (
        <div className="card bg-warning/10 border border-warning/20 shadow-xl rounded-3xl p-6 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-warning animate-bounce" />
            <h3 className="font-heading font-black text-neutral text-sm">Pemberitahuan Medis</h3>
            <span className="badge badge-warning badge-sm font-bold">{unreadNotifications.length} Baru</span>
          </div>
          <div className="space-y-3">
            {unreadNotifications.map((notif) => (
              <div key={notif.id} className="flex justify-between items-start gap-4 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm text-xs font-semibold text-neutral-600">
                <div className="flex items-start gap-2.5">
                  {notif.message.includes("Peringatan") ? (
                    <ShieldAlert className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{notif.message}</span>
                </div>
                <button 
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="btn btn-ghost btn-xs text-primary font-bold hover:bg-primary/10 shrink-0"
                >
                  Tandai Dibaca
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab Render */}
      {activeTab === 'mews-history' ? (
        <MewsHistory user={user} />
      ) : activeTab === 'chat' ? (
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl overflow-hidden p-4">
          <ChatbotWindow user={user} />
        </div>
      ) : (
        <MewsScreening user={user} onSubmitted={fetchNotifications} />
      )}
    </div>
  );
}
