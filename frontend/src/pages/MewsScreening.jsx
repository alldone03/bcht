import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import {
  ClipboardList,
  Activity,
  ArrowRight,
  ArrowLeft,
  Heart,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';

export default function MewsScreening({ user }) {
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentParamIndex, setCurrentParamIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // question_id: answer_id
  const [result, setResult] = useState(null);

  const isFetchingTemplates = useRef(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (isFetchingTemplates.current) return;
    isFetchingTemplates.current = true;
    try {
      const data = await api.mewsGetTemplates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      isFetchingTemplates.current = false;
    }
  };

  const handleStartScreening = async (templateId) => {
    setLoading(true);
    try {
      const details = await api.mewsGetTemplateDetails(templateId);
      setActiveTemplate(details);

      const startRes = await api.mewsStartSession(templateId);
      setSession(startRes);

      setCurrentParamIndex(0);
      setAnswers({});
      setResult(null);
    } catch (e) {
      alert("Gagal memulai screening: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = async (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));

    // Auto-save to backend session
    if (session) {
      try {
        await api.mewsSubmitAnswer(session.session_id, questionId, answerId);
      } catch (e) {
        console.warn("Gagal menyimpan jawaban otomatis: ", e);
      }
    }
  };

  const handleNext = () => {
    if (!activeTemplate) return;
    const currentParam = activeTemplate.parameters[currentParamIndex];
    if (!answers[currentParam.question.id]) {
      alert("Harap pilih salah satu jawaban terlebih dahulu!");
      return;
    }

    if (currentParamIndex < activeTemplate.parameters.length - 1) {
      setCurrentParamIndex(currentParamIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentParamIndex > 0) {
      setCurrentParamIndex(currentParamIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!activeTemplate || !session) return;

    // Verify all answered
    for (let param of activeTemplate.parameters) {
      if (!answers[param.question.id]) {
        alert(`Parameter "${param.name}" belum dijawab!`);
        return;
      }
    }

    setLoading(true);
    try {
      const finalResult = await api.mewsFinishSession(session.session_id);
      setResult(finalResult);
    } catch (e) {
      alert("Gagal merampungkan screening: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'RED': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'YELLOW': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border border-green-500/20';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'RED': return 'border-red-500/50 bg-red-950/20 hover:bg-red-950/40 shadow-red-900/10';
      case 'YELLOW': return 'border-yellow-500/50 bg-yellow-950/20 hover:bg-yellow-950/40 shadow-yellow-900/10';
      default: return 'border-green-500/50 bg-green-950/20 hover:bg-green-950/40 shadow-green-900/10';
    }
  };

  const getClassColor = (cls) => {
    switch (cls) {
      case 'RED': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'YELLOW': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
  };

  // 1. Dashboard Mode: Select template
  if (!activeTemplate && !result) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 p-8 shadow-2xl border border-emerald-500/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative space-y-2 max-w-2xl">
            <span className="badge badge-accent badge-sm font-semibold rounded-md uppercase tracking-wider">Screening Klinis</span>
            <h1 className="text-4xl font-heading font-black text-white tracking-tight">Deteksi Dini Pasien (M-EWS)</h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Sistem Scoring Peringatan Dini (Modified Early Warning Score) mengukur 5 parameter fisiologis klinis penting untuk mendeteksi dini pemburukan kondisi pasien secara real-time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-base-100/50 backdrop-blur rounded-3xl border border-base-200 text-neutral-500 space-y-4">
              <ClipboardList className="w-12 h-12 mx-auto text-neutral-400 animate-pulse" />
              <p className="text-sm">Tidak ada screening template M-EWS aktif.</p>
            </div>
          ) : (
            templates.map((tpl) => (
              <div key={tpl.id} className="group card bg-base-100/80 backdrop-blur shadow-xl border border-base-200 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 rounded-3xl flex flex-col justify-between overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 bg-base-200 px-2.5 py-1 rounded-full">Configurable DB</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-neutral text-xl group-hover:text-primary transition-colors">{tpl.name}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{tpl.description}</p>
                </div>
                <div className="p-6 bg-base-200/30 border-t border-base-200/50 flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" /> 5 Parameter Vital
                  </span>
                  <button
                    onClick={() => handleStartScreening(tpl.id)}
                    className="btn btn-primary btn-sm rounded-xl px-5 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    Mulai Tes <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 2. Screening Wizard Mode: Filling out the test
  if (activeTemplate && !result) {
    const currentParam = activeTemplate.parameters[currentParamIndex];
    const totalSteps = activeTemplate.parameters.length;
    const progressPercent = ((currentParamIndex + 1) / totalSteps) * 100;
    const currentQuestion = currentParam.question;
    const selectedAnswerId = answers[currentQuestion.id];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stepper Header Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => { setActiveTemplate(null); setSession(null); }}
              className="btn btn-ghost btn-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Keluar
            </button>
            <span className="text-xs font-mono font-bold text-neutral-500 bg-base-200 px-3 py-1 rounded-full">
              Parameter {currentParamIndex + 1} dari {totalSteps}
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Parameter Fisiologis</h4>
            <h2 className="text-2xl font-heading font-black text-neutral">{currentParam.name}</h2>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Mulai</span>
              <span>Selesai</span>
            </div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="card bg-base-100 shadow-2xl border border-base-200 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-primary" />

          <div className="space-y-2">
            <p className="text-sm text-neutral-500 italic">Pertanyaan:</p>
            <h3 className="text-lg font-bold text-neutral leading-relaxed">{currentQuestion.question}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {currentQuestion.answers.map((opt) => {
              const isSelected = selectedAnswerId === opt.id;
              const severityBg = getSeverityBg(opt.severity_color);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectAnswer(currentQuestion.id, opt.id)}
                  type="button"
                  className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex justify-between items-center gap-4 ${isSelected
                    ? `${severityBg} ring-2 ring-offset-2 ring-primary/30 scale-[1.01]`
                    : 'border-base-200 bg-base-100 hover:bg-base-200/50 hover:border-neutral-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-base-300 bg-base-100'
                      }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span className="font-semibold text-xs text-neutral">{opt.answer}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm font-extrabold uppercase px-2 py-0.5 rounded ${getSeverityBadgeColor(opt.severity_color)}`}>
                      {opt.severity_color}
                    </span>
                    <span className="text-[11px] font-mono bg-base-200 px-2 py-0.5 rounded text-neutral-500">
                      Skor: {opt.score}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stepper Footer Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-base-200">
            <button
              onClick={handlePrev}
              disabled={currentParamIndex === 0}
              className="btn btn-outline btn-sm rounded-xl px-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            {currentParamIndex < totalSteps - 1 ? (
              <button
                onClick={handleNext}
                disabled={!selectedAnswerId}
                className="btn btn-primary btn-sm rounded-xl px-5 font-bold flex items-center gap-1 shadow-lg shadow-primary/10"
              >
                Lanjut <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswerId || loading}
                className="btn btn-accent btn-sm rounded-xl px-6 font-bold flex items-center gap-1.5 shadow-lg shadow-accent/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Kirim Hasil Screening
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Results Summary Mode: Display details
  if (result) {
    const isRed = result.classification === 'RED';
    const isYellow = result.classification === 'YELLOW';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Classification Visual Card */}
        <div className={`card shadow-2xl rounded-3xl p-6 md:p-8 border relative overflow-hidden ${isRed ? 'bg-red-950/70 border-red-500/30' : isYellow ? 'bg-yellow-950/70 border-yellow-500/30' : 'bg-green-950/70 border-green-500/30'
          }`}>
          <div className="absolute top-0 right-0 w-96 h-96 opacity-10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" style={{ backgroundColor: isRed ? 'red' : isYellow ? 'yellow' : 'green' }} />

          <div className="flex flex-col md:flex-row justify-between gap-6 relative">
            <div className="space-y-4 flex-1">
              <span className={`badge border text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${getClassColor(result.classification)}`}>
                Hasil M-EWS: {result.classification}
              </span>

              <div className="space-y-1">
                <h1 className="text-3xl font-heading font-black text-white">Hasil Screening Klinis</h1>
                <p className="text-neutral-300 text-xs">Skrining Modified Early Warning Score selesai dianalisis oleh Rule Engine.</p>
              </div>

              <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Rekomendasi Medis</span>
                <p className="text-sm font-bold text-white leading-relaxed">"{result.recommendation}"</p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col justify-center items-center gap-4 shrink-0 md:border-l md:border-white/10 md:pl-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Skor</p>
                <h2 className="text-5xl font-heading font-black text-white font-mono mt-1">{result.total_score}</h2>
              </div>
              <div className="text-center border-l border-white/10 pl-4 md:border-l-0 md:pl-0 md:border-t md:border-white/10 md:pt-4 w-full">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Skor Tertinggi</p>
                <h2 className="text-3xl font-heading font-bold text-white font-mono mt-0.5">{result.highest_score}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl p-6 space-y-6">
          <h3 className="font-heading font-extrabold text-neutral text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Rincian Jawaban per Parameter
          </h3>

          <div className="overflow-x-auto w-full">
            <table className="table table-md w-full">
              <thead>
                <tr className="border-b border-base-200">
                  <th>Parameter</th>
                  <th>Pertanyaan</th>
                  <th>Jawaban Terpilih</th>
                  <th className="text-center">Tingkat Keparahan</th>
                  <th className="text-center">Skor</th>
                </tr>
              </thead>
              <tbody>
                {result.answers.map((ans, idx) => (
                  <tr key={idx} className="hover border-b border-base-200/50">
                    <td className="font-bold text-xs text-neutral">{ans.parameter}</td>
                    <td className="text-xs text-neutral-500 max-w-[200px] truncate">{ans.question}</td>
                    <td className="font-semibold text-xs text-neutral">{ans.answer}</td>
                    <td className="text-center">
                      <span className={`badge badge-sm font-extrabold uppercase px-2 py-0.5 rounded ${getSeverityBadgeColor(ans.severity)}`}>
                        {ans.severity}
                      </span>
                    </td>
                    <td className="text-center font-mono font-bold text-xs">{ans.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-base-200">
            <button
              onClick={() => { setActiveTemplate(null); setSession(null); setResult(null); }}
              className="btn btn-outline btn-sm rounded-xl px-5 flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Ulangi Screening
            </button>

            <button
              onClick={() => { window.location.href = (import.meta.env.BASE_URL || '/') + 'chatbot'; }}
              className="btn btn-primary btn-sm rounded-xl px-5 font-bold shadow-lg shadow-primary/10 flex items-center gap-1.5"
            >
              Diskusi dengan Patriot AI <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}
