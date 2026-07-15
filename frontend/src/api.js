import { getDb, saveDb } from './mockDb';

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

// Handle API requests, falling back to mockDb if Laravel backend is not running.
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
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('pt_token', data.token);
        localStorage.setItem('pt_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) {
      console.warn('API connection failed, falling back to mockDb', e);
    }
    // Mock Fallback
    const db = getDb();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('pt_user', JSON.stringify(user));
      return user;
    }
    throw new Error('Email atau password salah.');
  },

  register: async (name, email, password, role) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password, role })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('pt_token', data.token);
        localStorage.setItem('pt_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) {
      console.warn('API connection failed, falling back to mockDb', e);
    }
    // Mock Fallback
    const db = getDb();
    const exists = db.users.find(u => u.email === email);
    if (exists) throw new Error('Email ini sudah terdaftar.');
    
    const newUser = { id: db.users.length + 1, name, email, password, role, created_at: new Date().toISOString() };
    db.users.push(newUser);
    saveDb(db);
    localStorage.setItem('pt_user', JSON.stringify(newUser));
    return newUser;
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
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getDb().users;
  },

  createUser: async (userPayload) => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userPayload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getDb();
    const newUser = { id: db.users.length + 1, ...userPayload, created_at: new Date().toISOString() };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  },

  deleteUser: async (id) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch (e) {}
    const db = getDb();
    db.users = db.users.filter(u => u.id !== id);
    saveDb(db);
    return true;
  },

  // Screening Forms
  getForms: async () => {
    try {
      const res = await fetch(`${API_URL}/forms`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getDb().forms;
  },

  createForm: async (formPayload) => {
    try {
      const res = await fetch(`${API_URL}/forms`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formPayload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    
    // Mock Fallback
    const db = getDb();
    const newFormId = db.forms.length + 1;
    db.forms.push({
      id: newFormId,
      title: formPayload.title,
      description: formPayload.description,
      version: 1,
      is_active: true,
      created_by: formPayload.doctorId,
      created_at: new Date().toISOString()
    });

    let qCounter = db.questions.length + 1;
    let oCounter = db.options.length + 1;
    formPayload.questions.forEach((q, idx) => {
      const qId = qCounter++;
      db.questions.push({
        id: qId,
        form_id: newFormId,
        question: q.question,
        question_type: q.question_type,
        required: q.required ?? true,
        question_order: idx + 1
      });
      if (q.question_type === 'MULTIPLE_CHOICE' && q.choices) {
        q.choices.forEach(c => {
          db.options.push({
            id: oCounter++,
            question_id: qId,
            option_text: c.text,
            option_value: c.text.toLowerCase().replace(/ /g, '_'),
            score: c.score
          });
        });
      }
    });

    let rCounter = db.rules.length + 1;
    formPayload.rules.forEach(r => {
      db.rules.push({
        id: rCounter++,
        form_id: newFormId,
        min_score: r.min_score,
        max_score: r.max_score,
        diagnosis: r.diagnosis,
        recommendation: r.recommendation
      });
    });

    saveDb(db);
    return { form_id: newFormId };
  },

  // Results & Answers
  getResults: async () => {
    try {
      const res = await fetch(`${API_URL}/results`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    const results = cur.role === 'PESERTA' 
      ? db.results.filter(r => r.participant_id === cur.id)
      : db.results;
    
    return results.map(r => {
      const participant = db.users.find(u => u.id === r.participant_id);
      const form = db.forms.find(f => f.id === r.form_id);
      const review = db.reviews.find(rev => rev.screening_result_id === r.id);
      return {
        ...r,
        participantName: participant?.name || 'Pasien',
        formTitle: form?.title || 'Screening',
        review
      };
    });
  },

  submitResult: async (formId, answers) => {
    try {
      const res = await fetch(`${API_URL}/results`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ form_id: formId, answers })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    let totalScore = 0;
    Object.values(answers).forEach(ans => { totalScore += ans.score; });

    const matchedRule = db.rules.find(r => r.form_id === formId && totalScore >= r.min_score && totalScore <= r.max_score);
    const diagnosis = matchedRule ? matchedRule.diagnosis : 'Membutuhkan review dokter';
    const recommendation = matchedRule ? matchedRule.recommendation : 'Tunggu dokter meninjau.';

    const newResultId = db.results.length + 1;
    db.results.push({
      id: newResultId,
      participant_id: cur.id,
      form_id: formId,
      total_score: totalScore,
      diagnosis,
      recommendation,
      screening_date: new Date().toISOString()
    });
    saveDb(db);
    return { total_score: totalScore, diagnosis };
  },

  submitReview: async (screeningResultId, diagnosis, note) => {
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          screening_result_id: screeningResultId,
          doctor_diagnosis: diagnosis,
          doctor_note: note
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    const existingIdx = db.reviews.findIndex(r => r.screening_result_id === screeningResultId);
    const reviewPayload = {
      id: existingIdx !== -1 ? db.reviews[existingIdx].id : db.reviews.length + 1,
      screening_result_id: screeningResultId,
      doctor_id: cur.id,
      doctor_diagnosis: diagnosis,
      doctor_note: note,
      status: 'APPROVED',
      reviewed_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      db.reviews[existingIdx] = reviewPayload;
    } else {
      db.reviews.push(reviewPayload);
    }
    saveDb(db);
    return true;
  },

  // Chatbot Sessions & Messages
  getChatSessions: async () => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getDb();
    const cur = api.getCurrentUser();
    return db.sessions.filter(s => s.participant_id === cur.id);
  },

  createChatSession: async () => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    const newSession = {
      id: db.sessions.length + 1,
      participant_id: cur.id,
      title: `Diskusi Medis #${db.sessions.length + 1}`,
      llm_model: 'Gemini 3.5 Flash',
      summary_context: 'General medical consultation.',
      status: 'ACTIVE',
      started_at: new Date().toISOString()
    };
    db.sessions.push(newSession);

    db.messages.push({
      id: db.messages.length + 1,
      session_id: newSession.id,
      role: 'ASSISTANT',
      message: 'Halo! Saya Patriot AI, asisten pendamping kesehatan Anda.',
      created_at: new Date().toISOString()
    });

    saveDb(db);
    return newSession;
  },

  deleteChatSession: async (id) => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    } catch (e) {}
    const db = getDb();
    db.sessions = db.sessions.filter(s => s.id !== id);
    db.messages = db.messages.filter(m => m.session_id !== id);
    saveDb(db);
    return true;
  },

  getChatMessages: async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getDb();
    return db.messages.filter(m => m.session_id === sessionId);
  },

  sendChatMessage: async (sessionId, message) => {
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        const data = await res.json();
        return data.messages;
      }
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    db.messages.push({
      id: db.messages.length + 1,
      session_id: Number(sessionId),
      role: 'USER',
      message,
      created_at: new Date().toISOString()
    });

    const myResults = db.mewsResults?.filter(r => {
      const sess = db.mewsSessions?.find(s => s.id === r.session_id);
      return sess && sess.participant_id === cur.id;
    }) || [];
    const latest = myResults[myResults.length - 1];
    let reply = `Halo. Sebagai Patriot AI pendamping Anda, saya menganalisis keluhan Anda mengenai '${message}'.`;
    if (latest) {
      reply += ` Catatan: Kami memperhatikan hasil screening M-EWS terakhir Anda dengan klasifikasi ${latest.classification} (Skor: ${latest.total_score}). Rekomendasi: "${latest.recommendation}".`;
      if (latest.doctor_notes) {
        reply += ` Serta ikuti saran dokter Anda: "${latest.doctor_notes}".`;
      }
    } else {
      reply += ` Silakan lakukan screening kesehatan M-EWS terlebih dahulu agar kami dapat memberikan saran pendampingan yang akurat.`;
    }

    db.messages.push({
      id: db.messages.length + 1,
      session_id: Number(sessionId),
      role: 'ASSISTANT',
      message: reply,
      created_at: new Date().toISOString()
    });

    saveDb(db);
    return db.messages.filter(m => m.session_id === Number(sessionId));
  },

  // M-EWS API Methods
  mewsGetTemplates: async () => {
    try {
      const res = await fetch(`${API_URL}/mews/templates`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return getDb().mewsTemplates;
  },

  mewsGetTemplateDetails: async (id) => {
    try {
      const res = await fetch(`${API_URL}/mews/templates/${id}`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Mock Fallback
    const db = getDb();
    const template = db.mewsTemplates.find(t => t.id === Number(id));
    if (!template) throw new Error('Template not found');
    
    // Build nested structure
    const parameters = db.mewsParameters
      .filter(p => p.template_id === template.id)
      .sort((a, b) => a.order_number - b.order_number)
      .map(p => {
        const question = db.mewsQuestions.find(q => q.parameter_id === p.id);
        const answers = question ? db.mewsAnswers.filter(a => a.question_id === question.id) : [];
        return {
          ...p,
          question: question ? { ...question, answers } : null
        };
      });
    return { ...template, parameters };
  },

  mewsCreateTemplate: async (payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const newTemplateId = db.mewsTemplates.length + 1;
    const newTemplate = { id: newTemplateId, name: payload.name, description: payload.description };
    db.mewsTemplates.push(newTemplate);

    let paramCounter = db.mewsParameters.length + 1;
    let questionCounter = db.mewsQuestions.length + 1;
    let answerCounter = db.mewsAnswers.length + 1;

    payload.parameters.forEach(p => {
      const paramId = paramCounter++;
      db.mewsParameters.push({
        id: paramId,
        template_id: newTemplateId,
        name: p.name,
        order_number: p.order_number
      });

      const qId = questionCounter++;
      db.mewsQuestions.push({
        id: qId,
        parameter_id: paramId,
        question: p.question
      });

      p.answers.forEach(a => {
        db.mewsAnswers.push({
          id: answerCounter++,
          question_id: qId,
          answer: a.answer,
          score: Number(a.score),
          severity_color: a.severity_color
        });
      });
    });

    saveDb(db);
    return { template_id: newTemplateId };
  },

  mewsStartSession: async (templateId) => {
    try {
      const res = await fetch(`${API_URL}/mews/sessions/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ template_id: templateId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    const newSessionId = db.mewsSessions.length + 1;
    const newSession = {
      id: newSessionId,
      participant_id: cur ? cur.id : 3,
      template_id: Number(templateId),
      started_at: new Date().toISOString(),
      finished_at: null
    };
    db.mewsSessions.push(newSession);
    saveDb(db);
    return { session_id: newSessionId };
  },

  mewsSubmitAnswer: async (sessionId, questionId, answerId) => {
    try {
      const res = await fetch(`${API_URL}/mews/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question_id: questionId, answer_id: answerId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const ansOption = db.mewsAnswers.find(a => a.id === Number(answerId));
    if (!ansOption) throw new Error('Answer option not found');

    const existingIdx = db.mewsSessionAnswers.findIndex(sa => sa.session_id === Number(sessionId) && sa.question_id === Number(questionId));
    const payload = {
      id: existingIdx !== -1 ? db.mewsSessionAnswers[existingIdx].id : db.mewsSessionAnswers.length + 1,
      session_id: Number(sessionId),
      question_id: Number(questionId),
      answer_id: Number(answerId),
      score: ansOption.score
    };

    if (existingIdx !== -1) {
      db.mewsSessionAnswers[existingIdx] = payload;
    } else {
      db.mewsSessionAnswers.push(payload);
    }
    saveDb(db);
    return { answer: payload };
  },

  mewsFinishSession: async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/mews/sessions/${sessionId}/finish`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const session = db.mewsSessions.find(s => s.id === Number(sessionId));
    if (!session) throw new Error('Session not found');
    session.finished_at = new Date().toISOString();

    const answers = db.mewsSessionAnswers.filter(sa => sa.session_id === Number(sessionId));
    if (answers.length === 0) throw new Error('No answers submitted');

    let totalScore = 0;
    let highestScore = 0;
    answers.forEach(a => {
      totalScore += a.score;
      if (a.score > highestScore) highestScore = a.score;
    });

    let classification = 'GREEN';
    let recommendation = 'Lanjutkan aktivitas normal.';

    if (highestScore === 2) {
      classification = 'RED';
      recommendation = 'Segera lakukan evakuasi medis.';
    } else if (highestScore === 1) {
      classification = 'YELLOW';
      recommendation = 'Istirahat, observasi ulang 2-4 jam, konsultasikan apabila memburuk.';
    }

    const newResult = {
      id: db.mewsResults.length + 1,
      session_id: Number(sessionId),
      total_score: totalScore,
      highest_score: highestScore,
      classification,
      recommendation,
      created_at: new Date().toISOString()
    };
    db.mewsResults.push(newResult);
    saveDb(db);

    return api.mewsGetResult(sessionId);
  },

  mewsGetResult: async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/mews/sessions/${sessionId}/result`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const session = db.mewsSessions.find(s => s.id === Number(sessionId));
    if (!session) throw new Error('Session not found');
    const result = db.mewsResults.find(r => r.session_id === Number(sessionId));
    if (!result) throw new Error('Result not found');

    const sessionAnswers = db.mewsSessionAnswers.filter(sa => sa.session_id === Number(sessionId));
    const formattedAnswers = sessionAnswers.map(sa => {
      const question = db.mewsQuestions.find(q => q.id === sa.question_id);
      const parameter = question ? db.mewsParameters.find(p => p.id === question.parameter_id) : null;
      const answer = db.mewsAnswers.find(a => a.id === sa.answer_id);
      return {
        parameter: parameter ? parameter.name : '',
        question: question ? question.question : '',
        answer: answer ? answer.answer : '',
        score: sa.score,
        severity: answer ? answer.severity_color : ''
      };
    });

    return {
      session_id: Number(sessionId),
      total_score: result.total_score,
      highest_score: result.highest_score,
      classification: result.classification,
      recommendation: result.recommendation,
      answers: formattedAnswers
    };
  },

  mewsGetAllResults: async () => {
    try {
      const res = await fetch(`${API_URL}/mews/results`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const cur = api.getCurrentUser();
    
    let sessions = db.mewsSessions.filter(s => s.finished_at !== null);
    if (cur && cur.role === 'PESERTA') {
      sessions = sessions.filter(s => s.participant_id === cur.id);
    }

    return sessions.map(session => {
      const result = db.mewsResults.find(r => r.session_id === session.id);
      const participant = db.users.find(u => u.id === session.participant_id);
      const template = db.mewsTemplates.find(t => t.id === session.template_id);
      return {
        session_id: session.id,
        participant_name: participant ? participant.name : 'Pasien',
        template_name: template ? template.name : 'Screening M-EWS',
        total_score: result ? result.total_score : 0,
        highest_score: result ? result.highest_score : 0,
        classification: result ? result.classification : 'GREEN',
        recommendation: result ? result.recommendation : '',
        finished_at: session.finished_at
      };
    });
  },

  mewsUpdateTemplate: async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/templates/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    const tIdx = db.mewsTemplates.findIndex(t => t.id === Number(id));
    if (tIdx !== -1) {
      db.mewsTemplates[tIdx].name = payload.name;
      db.mewsTemplates[tIdx].description = payload.description;
      saveDb(db);
    }
    return { id };
  },

  mewsCreateParameter: async (payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/parameters`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const newId = db.mewsParameters.length + 1;
    db.mewsParameters.push({ id: newId, ...payload });
    saveDb(db);
    return { id: newId };
  },

  mewsUpdateParameter: async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/parameters/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const pIdx = db.mewsParameters.findIndex(p => p.id === Number(id));
    if (pIdx !== -1) {
      db.mewsParameters[pIdx] = { ...db.mewsParameters[pIdx], ...payload };
      saveDb(db);
    }
    return { id };
  },

  mewsDeleteParameter: async (id) => {
    try {
      const res = await fetch(`${API_URL}/mews/parameters/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    db.mewsParameters = db.mewsParameters.filter(p => p.id !== Number(id));
    const question = db.mewsQuestions.find(q => q.parameter_id === Number(id));
    if (question) {
      db.mewsQuestions = db.mewsQuestions.filter(q => q.id !== question.id);
      db.mewsAnswers = db.mewsAnswers.filter(a => a.question_id !== question.id);
    }
    saveDb(db);
    return { success: true };
  },

  mewsCreateQuestion: async (payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/questions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const newId = db.mewsQuestions.length + 1;
    db.mewsQuestions.push({ id: newId, ...payload });
    saveDb(db);
    return { id: newId };
  },

  mewsUpdateQuestion: async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/questions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const qIdx = db.mewsQuestions.findIndex(q => q.id === Number(id));
    if (qIdx !== -1) {
      db.mewsQuestions[qIdx] = { ...db.mewsQuestions[qIdx], ...payload };
      saveDb(db);
    }
    return { id };
  },

  mewsDeleteQuestion: async (id) => {
    try {
      const res = await fetch(`${API_URL}/mews/questions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    db.mewsQuestions = db.mewsQuestions.filter(q => q.id !== Number(id));
    db.mewsAnswers = db.mewsAnswers.filter(a => a.question_id !== Number(id));
    saveDb(db);
    return { success: true };
  },

  mewsCreateAnswer: async (payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/answers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const newId = db.mewsAnswers.length + 1;
    db.mewsAnswers.push({ id: newId, ...payload });
    saveDb(db);
    return { id: newId };
  },

  mewsUpdateAnswer: async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/mews/answers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const aIdx = db.mewsAnswers.findIndex(a => a.id === Number(id));
    if (aIdx !== -1) {
      db.mewsAnswers[aIdx] = { ...db.mewsAnswers[aIdx], ...payload };
      saveDb(db);
    }
    return { id };
  },

  mewsDeleteAnswer: async (id) => {
    try {
      const res = await fetch(`${API_URL}/mews/answers/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    db.mewsAnswers = db.mewsAnswers.filter(a => a.id !== Number(id));
    saveDb(db);
    return { success: true };
  },

  mewsDeleteTemplate: async (id) => {
    try {
      const res = await fetch(`${API_URL}/mews/templates/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Mock Fallback
    const db = getDb();
    db.mewsTemplates = db.mewsTemplates.filter(t => t.id !== Number(id));
    const paramsToDelete = db.mewsParameters.filter(p => p.template_id === Number(id));
    const paramIds = paramsToDelete.map(p => p.id);
    db.mewsParameters = db.mewsParameters.filter(p => p.template_id !== Number(id));
    
    const questionsToDelete = db.mewsQuestions.filter(q => paramIds.includes(q.parameter_id));
    const questionIds = questionsToDelete.map(q => q.id);
    db.mewsQuestions = db.mewsQuestions.filter(q => !paramIds.includes(q.parameter_id));
    
    db.mewsAnswers = db.mewsAnswers.filter(a => !questionIds.includes(a.question_id));
    db.mewsSessions = db.mewsSessions.filter(s => s.template_id !== Number(id));
    
    saveDb(db);
    return { success: true };
  },

  mewsGetNotifications: async () => {
    try {
      const res = await fetch(`${API_URL}/mews/notifications`, {
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const cur = api.getCurrentUser();
    if (!db.notifications) db.notifications = [];
    return db.notifications.filter(n => n.user_id === cur?.id);
  },

  mewsMarkNotificationRead: async (id) => {
    try {
      const res = await fetch(`${API_URL}/mews/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    if (!db.notifications) db.notifications = [];
    const n = db.notifications.find(item => item.id === Number(id));
    if (n) {
      n.is_read = true;
      saveDb(db);
    }
    return { success: true };
  },

  mewsApproveResult: async (resultId, advice) => {
    try {
      const res = await fetch(`${API_URL}/mews/results/${resultId}/approve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ doctor_notes: advice })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const result = db.mewsResults?.find(r => r.id === Number(resultId)) || 
                   db.mewsResults?.find(r => r.session_id === Number(resultId)); // fallback
    const doctor = api.getCurrentUser();
    if (result) {
      result.status = 'APPROVED';
      result.doctor_id = doctor?.id;
      result.doctor_name = doctor?.name;
      result.doctor_notes = advice;
      result.reviewed_at = new Date().toISOString();
      
      const session = db.mewsSessions.find(s => s.id === result.session_id);
      if (session) {
        if (!db.notifications) db.notifications = [];
        db.notifications.push({
          id: db.notifications.length + 1,
          user_id: session.participant_id,
          message: `Dokter ${doctor?.name || 'Dokter'} telah menyetujui screening M-EWS Anda dan memberikan saran: "${advice}"`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
      saveDb(db);
    }
    return { success: true };
  },

  chatGetLlmStatus: async () => {
    try {
      const res = await fetch(`${API_URL}/chat/status`, {
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { active: true };
  },

  chatGetSupervisionSessions: async () => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/sessions`, {
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const sessions = db.chatSessions || [];
    return sessions.map(s => {
      const u = db.users?.find(usr => usr.id === s.participant_id);
      return {
        ...s,
        participant_name: u ? u.name : 'Peserta',
        participant_email: u ? u.email : 'peserta@example.com'
      };
    });
  },

  chatGetSupervisionMessages: async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/sessions/${sessionId}/messages`, {
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    return db.chatMessages?.filter(m => m.session_id === Number(sessionId)) || [];
  },

  chatSupervisionCreateSession: async (participantId) => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ participant_id: participantId })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const newSession = {
      id: (db.chatSessions?.length || 0) + 1,
      participant_id: Number(participantId),
      title: 'Diskusi Medis #' + ((db.chatSessions?.filter(s => s.participant_id === Number(participantId))?.length || 0) + 1),
      llm_model: 'qwen2.5-7b-instruct',
      status: 'ACTIVE',
      started_at: new Date().toISOString()
    };
    db.chatSessions = db.chatSessions || [];
    db.chatSessions.push(newSession);

    db.chatMessages = db.chatMessages || [];
    db.chatMessages.push({
      id: db.chatMessages.length + 1,
      session_id: newSession.id,
      role: 'ASSISTANT',
      message: 'Halo! Saya Patriot AI. Sesi ini telah diinisiasi dan disupervisi langsung oleh Dokter Anda. Ada yang bisa kami bantu hari ini?',
      created_at: new Date().toISOString()
    });

    saveDb(db);
    const user = db.users?.find(u => u.id === Number(participantId));
    return {
      ...newSession,
      participant_name: user ? user.name : 'Peserta',
      participant_email: user ? user.email : 'peserta@example.com'
    };
  },

  chatSupervisionDeleteSession: async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    db.chatSessions = db.chatSessions?.filter(s => s.id !== Number(sessionId)) || [];
    db.chatMessages = db.chatMessages?.filter(m => m.session_id !== Number(sessionId)) || [];
    saveDb(db);
    return { success: true };
  },

  chatSupervisionSendMessage: async (sessionId, message) => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    db.chatMessages = db.chatMessages || [];
    db.chatMessages.push({
      id: db.chatMessages.length + 1,
      session_id: Number(sessionId),
      role: 'ASSISTANT',
      message,
      created_at: new Date().toISOString()
    });
    saveDb(db);
    return db.chatMessages.filter(m => m.session_id === Number(sessionId));
  },

  chatSupervisionUpdateMessage: async (messageId, message) => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/messages/${messageId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ message })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    const msg = db.chatMessages?.find(m => m.id === Number(messageId));
    if (msg) {
      msg.message = message;
      saveDb(db);
    }
    return msg || { id: messageId, message };
  },

  chatSupervisionDeleteMessage: async (messageId) => {
    try {
      const res = await fetch(`${API_URL}/chat/supervision/messages/${messageId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getDb();
    db.chatMessages = db.chatMessages?.filter(m => m.id !== Number(messageId)) || [];
    saveDb(db);
    return { success: true };
  }
};
