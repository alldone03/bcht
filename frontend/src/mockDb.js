// Mock Database implementation simulating Laravel models & relations
// Stored in localStorage for persistent client-side states.

// Initial Data Population
const initialUsers = [
  { id: 1, name: 'Admin Patriot', email: 'admin@patriot.com', password: 'password', role: 'ADMIN', created_at: new Date().toISOString() },
  { id: 2, name: 'Dr. Jane Smith', email: 'dokter@patriot.com', password: 'password', role: 'DOKTER', created_at: new Date().toISOString() },
  { id: 3, name: 'Budi Santoso', email: 'peserta@patriot.com', password: 'password', role: 'PESERTA', created_at: new Date().toISOString() },
];

const initialForms = [];
const initialQuestions = [];
const initialOptions = [];
const initialRules = [];

// M-EWS Configurable Tables Initial Seed
const initialMewsTemplates = [
  { id: 1, name: 'Modified Early Warning Score (M-EWS)', description: 'Sistem deteksi dini parameter klinis (Kesadaran, Pernapasan, Nadi, Suhu, Kemampuan Fisik) untuk mengidentifikasi tingkat urgensi evakuasi atau penanganan medis.' }
];

const initialMewsParameters = [
  { id: 1, template_id: 1, name: 'Kesadaran', order_number: 1 },
  { id: 2, template_id: 1, name: 'Pernapasan', order_number: 2 },
  { id: 3, template_id: 1, name: 'Nadi', order_number: 3 },
  { id: 4, template_id: 1, name: 'Suhu', order_number: 4 },
  { id: 5, template_id: 1, name: 'Kemampuan Fisik', order_number: 5 }
];

const initialMewsQuestions = [
  { id: 1, parameter_id: 1, question: 'Bagaimana kondisi kesadaran pasien?' },
  { id: 2, parameter_id: 2, question: 'Bagaimana laju pernapasan pasien per menit?' },
  { id: 3, parameter_id: 3, question: 'Berapa denyut nadi pasien per menit?' },
  { id: 4, parameter_id: 4, question: 'Berapa suhu tubuh pasien (Celcius)?' },
  { id: 5, parameter_id: 5, question: 'Bagaimana kemampuan fisik/mobilisasi pasien?' }
];

const initialMewsAnswers = [
  // Kesadaran
  { id: 1, question_id: 1, answer: 'Sadar penuh', score: 0, severity_color: 'GREEN' },
  { id: 2, question_id: 1, answer: 'Mengantuk / Bingung', score: 1, severity_color: 'YELLOW' },
  { id: 3, question_id: 1, answer: 'Tidak sadar / Kejang', score: 2, severity_color: 'RED' },
  // Pernapasan
  { id: 4, question_id: 2, answer: 'Normal (12 - 20 kali/menit)', score: 0, severity_color: 'GREEN' },
  { id: 5, question_id: 2, answer: 'Sedikit cepat/lambat (9-11 atau 21-24 kali/menit)', score: 1, severity_color: 'YELLOW' },
  { id: 6, question_id: 2, answer: 'Sangat cepat/lambat (<9 atau >24 kali/menit)', score: 2, severity_color: 'RED' },
  // Nadi
  { id: 7, question_id: 3, answer: 'Normal (51 - 100 kali/menit)', score: 0, severity_color: 'GREEN' },
  { id: 8, question_id: 3, answer: 'Sedikit cepat/lambat (41-50 atau 101-110 kali/menit)', score: 1, severity_color: 'YELLOW' },
  { id: 9, question_id: 3, answer: 'Sangat cepat/lambat (<41 atau >110 kali/menit)', score: 2, severity_color: 'RED' },
  // Suhu
  { id: 10, question_id: 4, answer: 'Normal (36.0°C - 37.9°C)', score: 0, severity_color: 'GREEN' },
  { id: 11, question_id: 4, answer: 'Subfebris/Hipotermia ringan (35.0°C-35.9°C atau 38.0°C-38.9°C)', score: 1, severity_color: 'YELLOW' },
  { id: 12, question_id: 4, answer: 'Hipertermia/Hipotermia berat (<35.0°C atau >38.9°C)', score: 2, severity_color: 'RED' },
  // Kemampuan Fisik
  { id: 13, question_id: 5, answer: 'Mandiri / Aktivitas normal', score: 0, severity_color: 'GREEN' },
  { id: 14, question_id: 5, answer: 'Butuh bantuan minimal / Kelemahan ringan', score: 1, severity_color: 'YELLOW' },
  { id: 15, question_id: 5, answer: 'Imobilisasi / Lumpuh / Butuh bantuan penuh', score: 2, severity_color: 'RED' }
];

// Helper to manage storage
const getStorage = (key, initial) => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(val);
};

const setStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getDb = () => {
  return {
    users: getStorage('pt_users', initialUsers),
    forms: getStorage('pt_forms', initialForms),
    questions: getStorage('pt_questions', initialQuestions),
    options: getStorage('pt_options', initialOptions),
    rules: getStorage('pt_rules', initialRules),
    results: getStorage('pt_results', []),
    answers: getStorage('pt_answers', []),
    reviews: getStorage('pt_reviews', []),
    sessions: getStorage('pt_sessions', []),
    messages: getStorage('pt_messages', []),
    // Mews Collections
    mewsTemplates: getStorage('pt_mews_templates', initialMewsTemplates),
    mewsParameters: getStorage('pt_mews_parameters', initialMewsParameters),
    mewsQuestions: getStorage('pt_mews_questions', initialMewsQuestions),
    mewsAnswers: getStorage('pt_mews_answers', initialMewsAnswers),
    mewsSessions: getStorage('pt_mews_sessions', []),
    mewsSessionAnswers: getStorage('pt_mews_session_answers', []),
    mewsResults: getStorage('pt_mews_results', [])
  };
};

export const saveDb = (db) => {
  setStorage('pt_users', db.users);
  setStorage('pt_forms', db.forms);
  setStorage('pt_questions', db.questions);
  setStorage('pt_options', db.options);
  setStorage('pt_rules', db.rules);
  setStorage('pt_results', db.results);
  setStorage('pt_answers', db.answers);
  setStorage('pt_reviews', db.reviews);
  setStorage('pt_sessions', db.sessions);
  setStorage('pt_messages', db.messages);
  // Mews Collections
  setStorage('pt_mews_templates', db.mewsTemplates);
  setStorage('pt_mews_parameters', db.mewsParameters);
  setStorage('pt_mews_questions', db.mewsQuestions);
  setStorage('pt_mews_answers', db.mewsAnswers);
  setStorage('pt_mews_sessions', db.mewsSessions);
  setStorage('pt_mews_session_answers', db.mewsSessionAnswers);
  setStorage('pt_mews_results', db.mewsResults);
};

