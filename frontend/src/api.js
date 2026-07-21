const originalFetch = window.fetch;
const fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) {
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pt_user');
    window.location.href = import.meta.env.BASE_URL || '/';
  }
  return res;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('pt_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Email atau password salah.');
    }
    const data = await res.json();
    localStorage.setItem('pt_token', data.token);
    localStorage.setItem('pt_user', JSON.stringify(data.user));
    return data.user;
  },

  register: async (name, email, password, role, tanggal_lahir, participant_id) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, role, tanggal_lahir, participant_id })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Email ini sudah terdaftar.');
    }
    const data = await res.json();
    localStorage.setItem('pt_token', data.token);
    localStorage.setItem('pt_user', JSON.stringify(data.user));
    return data.user;
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
    } catch (e) {}
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pt_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('pt_user');
    return user ? JSON.parse(user) : null;
  },

  // Admin User Manager
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil daftar pengguna.');
    return await res.json();
  },

  createUser: async (userPayload) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userPayload)
    });
    if (!res.ok) throw new Error('Gagal membuat pengguna.');
    return await res.json();
  },

  updateUser: async (id, userPayload) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userPayload)
    });
    if (!res.ok) throw new Error('Gagal memperbarui pengguna.');
    return await res.json();
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal menghapus pengguna.');
    return true;
  },

  // Chatbot Sessions & Messages
  getChatSessions: async () => {
    const res = await fetch(`${API_URL}/chat/sessions`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil daftar sesi chat.');
    return await res.json();
  },

  createChatSession: async () => {
    const res = await fetch(`${API_URL}/chat/sessions`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal membuat sesi chat baru.');
    return await res.json();
  },

  deleteChatSession: async (id) => {
    const res = await fetch(`${API_URL}/chat/sessions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal menghapus sesi chat.');
    return true;
  },

  getChatMessages: async (sessionId) => {
    const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil pesan chat.');
    return await res.json();
  },

  sendChatMessage: async (sessionId, message) => {
    const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Gagal mengirim pesan.');
    const data = await res.json();
    return data.messages;
  },

  chatGetLlmStatus: async () => {
    const res = await fetch(`${API_URL}/chat/status`, { headers: getHeaders() });
    if (!res.ok) return { active: false };
    return await res.json();
  },

  chatGetSupervisionSessions: async () => {
    const res = await fetch(`${API_URL}/chat/supervision/sessions`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil sesi supervisi.');
    return await res.json();
  },

  chatGetSupervisionMessages: async (sessionId) => {
    const res = await fetch(`${API_URL}/chat/supervision/sessions/${sessionId}/messages`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil pesan supervisi.');
    return await res.json();
  },

  chatSupervisionCreateSession: async (participantId) => {
    const res = await fetch(`${API_URL}/chat/supervision/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ participant_id: participantId })
    });
    if (!res.ok) throw new Error('Gagal membuat sesi supervisi.');
    return await res.json();
  },

  chatSupervisionDeleteSession: async (sessionId) => {
    const res = await fetch(`${API_URL}/chat/supervision/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal menghapus sesi supervisi.');
    return await res.json();
  },

  chatSupervisionSendMessage: async (sessionId, message) => {
    const res = await fetch(`${API_URL}/chat/supervision/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Gagal mengirim pesan supervisi.');
    return await res.json();
  },

  chatSupervisionUpdateMessage: async (messageId, message) => {
    const res = await fetch(`${API_URL}/chat/supervision/messages/${messageId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Gagal mengubah pesan supervisi.');
    return await res.json();
  },

  chatSupervisionDeleteMessage: async (messageId) => {
    const res = await fetch(`${API_URL}/chat/supervision/messages/${messageId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal menghapus pesan supervisi.');
    return await res.json();
  },

  // Dynamic Form Builder APIs
  _formsPromise: null,
  getForms: async () => {
    if (api._formsPromise) {
      return api._formsPromise;
    }
    api._formsPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/forms`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Gagal mengambil daftar form.');
        return await res.json();
      } finally {
        setTimeout(() => {
          api._formsPromise = null;
        }, 1000);
      }
    })();
    return api._formsPromise;
  },

  getFormDetails: async (id) => {
    const res = await fetch(`${API_URL}/forms/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil rincian form.');
    return await res.json();
  },

  saveForm: async (form) => {
    const isEdit = !!form.id;
    const url = isEdit ? `${API_URL}/forms/${form.id}` : `${API_URL}/forms`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(form)
    });
    if (!res.ok) throw new Error('Gagal menyimpan form.');
    return await res.json();
  },

  deleteForm: async (id) => {
    const res = await fetch(`${API_URL}/forms/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Gagal menghapus form.');
    return await res.json();
  },

  // Dynamic Form Response APIs
  _formResponsesPromise: null,
  getFormResponses: async () => {
    if (api._formResponsesPromise) {
      return api._formResponsesPromise;
    }
    api._formResponsesPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/form-responses`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Gagal mengambil daftar respon form.');
        return await res.json();
      } finally {
        setTimeout(() => {
          api._formResponsesPromise = null;
        }, 1000);
      }
    })();
    return api._formResponsesPromise;
  },

  getFormResponseDetails: async (id) => {
    const res = await fetch(`${API_URL}/form-responses/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal mengambil rincian respon.');
    return await res.json();
  },

  submitFormResponse: async (payload) => {
    const res = await fetch(`${API_URL}/form-responses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Gagal mengirimkan respon form.');
    return await res.json();
  },

  submitDiagnosis: async (id, diagnosis) => {
    const res = await fetch(`${API_URL}/form-responses/${id}/diagnosis`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ diagnosis })
    });
    if (!res.ok) throw new Error('Gagal menyimpan diagnosis.');
    return await res.json();
  }
};
