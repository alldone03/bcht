import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DokterDashboard from './pages/DokterDashboard';
import PesertaDashboard from './pages/PesertaDashboard';
import ChatbotWindow from './components/ChatbotWindow';
import { api } from './api';

function DashboardWrapper({ currentUser, activeTab, setActiveTab }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboardContent = () => {
    switch (currentUser.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'DOKTER':
        return <DokterDashboard user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'PESERTA':
        return <PesertaDashboard user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <div className="flex">
      <Sidebar role={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-full">
        {renderDashboardContent()}
      </main>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(api.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') {
        setActiveTab('overview');
      } else if (currentUser.role === 'DOKTER') {
        setActiveTab('mews-submissions');
      } else {
        setActiveTab('mews');
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-base-300/40 text-neutral">
        <Navbar 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route 
            path="/login" 
            element={
              currentUser ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              currentUser ? <Navigate to="/dashboard" replace /> : <Register onRegisterSuccess={handleLoginSuccess} />
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              <DashboardWrapper 
                currentUser={currentUser} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
            } 
          />

          <Route 
            path="/chatbot" 
            element={
              currentUser && currentUser.role === 'PESERTA' ? (
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                  <ChatbotWindow user={currentUser} />
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
