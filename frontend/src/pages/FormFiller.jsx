import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { formatDateWithAge } from '../utils/dateUtils';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  AlertTriangle, 
  User, 
  Info,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function FormFiller({ formId, onBack, onSubmitted }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Who is this form for?
  const [currentUser, setCurrentUser] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Answers state: { [question_id]: value }
  const [answers, setAnswers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const user = api.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setTargetUserId(user.id);
      fetchTeamMembers(user);
    }
    fetchFormDetails();
  }, [formId]);

  useEffect(() => {
    if (!targetUserId || !form?.questions) return;
    const selectedUser = teamMembers.find(u => u.id === Number(targetUserId)) || (currentUser?.id === Number(targetUserId) ? currentUser : null);
    if (!selectedUser) return;

    setAnswers(prev => {
      const updated = { ...prev };
      let updatedCount = 0;
      form.questions.forEach(q => {
        const text = q.text.toLowerCase();
        if (text.includes('nama lengkap') && selectedUser.name) {
          if (updated[q.id] !== selectedUser.name) {
            updated[q.id] = selectedUser.name;
            updatedCount++;
          }
        } else if ((text.includes('id peserta') || text.includes('id')) && selectedUser.participant_id) {
          if (updated[q.id] !== selectedUser.participant_id) {
            updated[q.id] = selectedUser.participant_id;
            updatedCount++;
          }
        } else if ((text.includes('tanggal lahir') || text.includes('lahir')) && selectedUser.tanggal_lahir) {
          const valWithAge = formatDateWithAge(selectedUser.tanggal_lahir);
          if (updated[q.id] !== valWithAge) {
            updated[q.id] = valWithAge;
            updatedCount++;
          }
        }
      });
      return updatedCount > 0 ? updated : prev;
    });
  }, [targetUserId, teamMembers, form, currentUser]);

  const fetchFormDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getFormDetails(formId);
      setForm(data);
      
      // Initialize empty answers
      const initialAnswers = {};
      data.questions.forEach(q => {
        if (q.type === 'checkbox') {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (e) {
      alert('Gagal memuat form: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (user) => {
    try {
      // In a real environment, we'd have a specific endpoint.
      // We will fetch users and filter by team.
      const allUsers = await api.getUsers();
      if (user.team_id) {
        const members = allUsers.filter(u => u.team_id === user.team_id);
        setTeamMembers(members);
      } else {
        // Fallback for mock/doctors who can choose any participant
        const participants = allUsers.filter(u => u.role === 'PESERTA');
        setTeamMembers(participants);
      }
    } catch (e) {
      console.warn('Gagal memuat anggota tim.', e);
    }
  };

  const handleAnswerChange = (qId, val, type) => {
    if (type === 'checkbox') {
      const currentVal = answers[qId] || [];
      const updated = currentVal.includes(val)
        ? currentVal.filter(item => item !== val)
        : [...currentVal, val];
      setAnswers({ ...answers, [qId]: updated });
    } else {
      setAnswers({ ...answers, [qId]: val });
    }
  };

  // Evaluate if a question should be shown based on logic conditions
  const shouldShowQuestion = (q) => {
    if (!q.trigger_condition) return true;
    
    const { depends_on, value } = q.trigger_condition;
    // Find the question that this depends on by code
    const dependencyQuestion = form.questions.find(quest => quest.question_code === depends_on);
    if (!dependencyQuestion) return true;

    const dependencyAnswer = answers[dependencyQuestion.id];
    
    if (dependencyQuestion.type === 'checkbox') {
      return Array.isArray(dependencyAnswer) && dependencyAnswer.includes(value);
    }

    return dependencyAnswer === value;
  };

  // Check if a warning alert should be shown for a question answer
  const isTriggered = (q) => {
    if (!q.trigger_action_text) return false;
    
    const ansVal = answers[q.id];
    
    // Check if answered yes/positive trigger or specific conditions
    if (q.type === 'radio' && (ansVal === 'Ya' || ansVal === 'Belum' || ansVal === 'Ada masalah')) {
      return true;
    }
    
    if (q.type === 'checkbox' && Array.isArray(ansVal) && ansVal.length > 0 && !ansVal.includes('Tidak ada') && !ansVal.includes('Tidak')) {
      return true;
    }

    // Likert scale triggered on scores > 0
    if (q.type === 'scale' && ansVal !== '' && Number(ansVal?.toString().charAt(0)) > 0) {
      return true;
    }

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUserId) {
      alert("Pilih peserta terlebih dahulu!");
      return;
    }

    // Validation: make sure all visible questions are answered
    const visibleQuestions = form.questions.filter(shouldShowQuestion);
    for (const q of visibleQuestions) {
      const ansVal = answers[q.id];
      if (q.type === 'checkbox') {
        if (!ansVal || ansVal.length === 0) {
          alert(`Pertanyaan ${q.question_code} wajib diisi!`);
          return;
        }
      } else {
        if (ansVal === undefined || ansVal === '') {
          alert(`Pertanyaan ${q.question_code} wajib diisi!`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Map answers format to match payload structure
      const formattedAnswers = Object.keys(answers).map(qId => {
        return {
          question_id: Number(qId),
          value: answers[qId]
        };
      });

      const payload = {
        form_id: form.id,
        user_id: Number(targetUserId),
        answers: formattedAnswers
      };

      await api.submitFormResponse(payload);
      alert('Form berhasil dikirim!');
      if (onSubmitted) {
        onSubmitted();
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      alert('Gagal mengirim form: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="loading loading-spinner text-primary" />
        <p className="text-xs text-neutral-500 mt-2">Memuat Form...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12 text-red-500 font-semibold">
        Form tidak ditemukan.
      </div>
    );
  }

  const visibleQuestions = form.questions.filter(shouldShowQuestion);

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="btn btn-ghost rounded-xl gap-2 text-neutral">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden rounded-3xl">
        {/* Form Header banner */}
        <div className="bg-primary/10 p-6 sm:p-8 border-b border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <span className="badge badge-primary font-bold text-[10px] rounded-lg tracking-wide uppercase">
              {form.frequency}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral">{form.title}</h1>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{form.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Target Participant Selector */}
          <div className="card bg-base-50 border border-base-200 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-stretch md:items-center">
            <div className="flex gap-4 items-center">
              <div className="avatar placeholder">
                <div className="bg-primary/20 text-primary rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 block">Formulir diisi untuk:</label>
                {currentUser && (currentUser.role === 'PESERTA' && teamMembers.length <= 1) ? (
                  <div className="text-sm font-bold text-neutral">{currentUser.name} (Diri Sendiri)</div>
                ) : (
                  <select 
                    value={targetUserId} 
                    onChange={(e) => setTargetUserId(e.target.value)} 
                    className="select select-bordered select-sm rounded-lg w-full max-w-xs font-semibold text-xs"
                  >
                    <option value={currentUser?.id}>Diri Sendiri ({currentUser?.name})</option>
                    {teamMembers
                      .filter(m => m.id !== currentUser?.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.participant_id || 'Anggota Tim'})
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            {/* Live Search & Auto-Fill tool */}
            {!(currentUser && (currentUser.role === 'PESERTA' && teamMembers.length <= 1)) && (
              <div className="flex-1 relative">
                <label className="text-xs font-bold text-neutral-600 block mb-1">Cari Peserta (Auto-Fill data profil):</label>
                <input
                  type="text"
                  placeholder="Ketik nama atau ID peserta..."
                  className="input input-bordered input-sm rounded-xl w-full text-xs"
                  value={searchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    if (q.trim()) {
                      const matched = teamMembers.filter(u => 
                        u.name.toLowerCase().includes(q.toLowerCase()) || 
                        (u.participant_id && u.participant_id.toLowerCase().includes(q.toLowerCase()))
                      );
                      setFilteredUsers(matched);
                    } else {
                      setFilteredUsers([]);
                    }
                  }}
                />
                {filteredUsers.length > 0 && (
                  <div className="absolute left-0 right-0 bg-base-100 border rounded-xl shadow-2xl mt-1.5 z-10 max-h-48 overflow-y-auto p-1 divide-y border-base-200">
                    {filteredUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setTargetUserId(u.id);
                          setSearchQuery('');
                          setFilteredUsers([]);
                        }}
                        className="p-2.5 hover:bg-primary hover:text-white rounded-lg cursor-pointer text-xs font-semibold flex justify-between transition-colors"
                      >
                        <span>{u.name}</span>
                        <span className="font-mono opacity-80 text-[10px]">{u.participant_id || u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Render Dynamic Questions */}
          <div className="space-y-6">
            {form.questions.map((q, idx) => {
              const isVisible = shouldShowQuestion(q);
              if (!isVisible) return null;

              const isTrigger = isTriggered(q);

              return (
                <div key={q.id} className="space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-start gap-3">
                    <label className="text-sm font-bold text-neutral-800">
                      <span className="text-primary font-mono text-xs mr-1 bg-primary/10 px-1.5 py-0.5 rounded-md">
                        {q.question_code}
                      </span>
                      {q.text}
                    </label>
                  </div>

                  {/* Input Types rendering */}
                  {q.type === 'text' && (
                    <input 
                      type="text" 
                      value={answers[q.id] || ''} 
                      onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')}
                      className="input input-bordered w-full rounded-xl"
                      placeholder="Masukkan jawaban..." 
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea 
                      value={answers[q.id] || ''} 
                      onChange={(e) => handleAnswerChange(q.id, e.target.value, 'textarea')}
                      className="textarea textarea-bordered w-full rounded-xl h-24"
                      placeholder="Tuliskan detail..." 
                    />
                  )}

                  {q.type === 'radio' && q.options && (
                    <div className="flex flex-col gap-2 p-3 bg-base-50 rounded-2xl border border-base-200">
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-3 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-base-200/50 transition-colors">
                          <input 
                            type="radio" 
                            name={`radio-${q.id}`} 
                            value={opt} 
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswerChange(q.id, opt, 'radio')}
                            className="radio radio-primary" 
                          />
                          <span className="text-sm text-neutral font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'checkbox' && q.options && (
                    <div className="flex flex-col gap-2 p-3 bg-base-50 rounded-2xl border border-base-200">
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-3 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-base-200/50 transition-colors">
                          <input 
                            type="checkbox" 
                            value={opt} 
                            checked={(answers[q.id] || []).includes(opt)}
                            onChange={() => handleAnswerChange(q.id, opt, 'checkbox')}
                            className="checkbox checkbox-primary rounded-md" 
                          />
                          <span className="text-sm text-neutral font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'scale' && q.options && (
                    <div className="flex flex-col gap-2 p-3 bg-base-50 rounded-2xl border border-base-200">
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-3 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-base-200/50 transition-colors">
                          <input 
                            type="radio" 
                            name={`scale-${q.id}`} 
                            value={opt} 
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswerChange(q.id, opt, 'scale')}
                            className="radio radio-primary" 
                          />
                          <span className="text-sm text-neutral font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Warning message if clinical logic is triggered */}
                  {isTrigger && (
                    <div className="alert alert-warning shadow border border-yellow-200 rounded-2xl py-3 px-4 flex gap-2 items-start bg-yellow-50 text-yellow-900">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold">Saran/Tindakan Pemicu: </span>
                        {q.trigger_action_text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t pt-6 flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={onBack} 
              className="btn btn-ghost rounded-xl"
            >
              Batalkan
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn btn-primary gap-2 rounded-xl text-white px-8"
            >
              {submitting ? <span className="loading loading-spinner w-4 h-4" /> : <Send className="w-4 h-4" />}
              Kirim Jawaban
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
