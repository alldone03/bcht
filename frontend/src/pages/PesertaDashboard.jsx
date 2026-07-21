import React from 'react';
import ChatbotWindow from '../components/ChatbotWindow';
import FormsList from './FormsList';
import FormResponsesList from './FormResponsesList';

export default function PesertaDashboard({ user, activeTab, setActiveTab }) {
  return (
    <div className="space-y-6">
      {activeTab === 'chat' ? (
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl overflow-hidden p-4">
          <ChatbotWindow user={user} />
        </div>
      ) : activeTab === 'forms-responses' ? (
        <FormResponsesList />
      ) : (
        <FormsList user={user} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
