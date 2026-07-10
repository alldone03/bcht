import React from 'react';
import {
  ClipboardList,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  MessageSquare,
  Settings,
  HelpCircle,
  FilePlus,
  History
} from 'lucide-react';

export default function Sidebar({ role, activeTab, setActiveTab }) {
  const menuItems = {
    ADMIN: [
      { id: 'overview', name: 'Overview', icon: LayoutDashboard },
      { id: 'users', name: 'Manajemen User', icon: Users }
    ],
    DOKTER: [
      { id: 'mews-submissions', name: 'Hasil M-EWS', icon: ClipboardList },
      { id: 'mews-builder', name: 'Builder M-EWS', icon: FilePlus },
    ],
    PESERTA: [
      { id: 'mews', name: 'Screening M-EWS', icon: ClipboardList },
      { id: 'mews-history', name: 'Riwayat M-EWS', icon: History },
      { id: 'chat', name: 'Chatbot AI', icon: MessageSquare }
    ]
  };

  const currentMenu = menuItems[role] || [];

  return (
    <div className="w-64 bg-base-100 min-h-[calc(100vh-4rem)] shadow-xl p-4 hidden md:flex flex-col justify-between border-r border-base-200">
      <div>
        <div className="px-3 mb-6">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Menu Navigasi</p>
        </div>
        <ul className="menu menu-md w-full p-0 gap-1">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <a
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id
                    ? 'active bg-primary text-primary-content shadow-lg shadow-primary/20'
                    : 'hover:bg-base-200'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-base-200/50 p-4 rounded-xl text-center">
        <HelpCircle className="w-8 h-8 mx-auto text-primary mb-2" />
        <h4 className="font-heading font-bold text-sm">Butuh Bantuan?</h4>
        <p className="text-xs text-neutral-500 mt-1">Hubungi support kami untuk kendala teknis.</p>
        <button className="btn btn-outline btn-primary btn-xs mt-3 w-full">Kontak Kami</button>
      </div>
    </div>
  );
}
