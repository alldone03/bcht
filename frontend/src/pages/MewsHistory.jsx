import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { 
  History, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  ClipboardList, 
  Sparkles,
  Search,
  Eye
} from 'lucide-react';

export default function MewsHistory({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const isFetchingHistory = useRef(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (isFetchingHistory.current) return;
    isFetchingHistory.current = true;
    setLoading(true);
    try {
      const data = await api.mewsGetAllResults();
      setHistory(data);
    } catch (e) {
      console.error("Gagal memuat riwayat: ", e);
    } finally {
      setLoading(false);
      isFetchingHistory.current = false;
    }
  };

  const handleToggleExpand = async (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      setSessionDetail(null);
    } else {
      setExpandedSession(sessionId);
      setDetailLoading(true);
      try {
        const details = await api.mewsGetResult(sessionId);
        setSessionDetail(details);
      } catch (e) {
        console.error("Gagal mengambil rincian hasil: ", e);
        setExpandedSession(null);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'RED': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'YELLOW': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border border-green-500/20';
    }
  };

  const getClassColor = (cls) => {
    switch (cls) {
      case 'RED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'YELLOW': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-black text-neutral">Riwayat Screening M-EWS</h1>
        <p className="text-sm text-neutral-500 mt-1">Lihat riwayat parameter klinis dan status warning klinis Anda secara komprehensif.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-base-100/50 backdrop-blur rounded-3xl border border-base-200 text-neutral-500 space-y-4">
          <History className="w-12 h-12 mx-auto text-neutral-400 animate-spin" />
          <p className="text-sm">Memuat riwayat...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 bg-base-100/50 backdrop-blur rounded-3xl border border-base-200 text-neutral-500 space-y-4">
          <History className="w-12 h-12 mx-auto text-neutral-400" />
          <p className="text-sm">Anda belum pernah melakukan screening medis M-EWS.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const isExpanded = expandedSession === item.session_id;
            return (
              <div key={item.session_id} className="card bg-base-100 shadow-lg border border-base-200 rounded-3xl overflow-hidden transition-all duration-300">
                {/* Header Summary */}
                <div 
                  onClick={() => handleToggleExpand(item.session_id)}
                  className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-base-200/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-base text-neutral">{item.template_name}</h4>
                      <span className={`badge badge-sm font-extrabold uppercase px-2 py-0.5 rounded ${getClassColor(item.classification)}`}>
                        {item.classification}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.finished_at).toLocaleString('id-ID', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-base-200/50 pt-3.5 md:border-t-0 md:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="text-center bg-base-200 px-3 py-1 rounded-xl">
                        <p className="text-[8px] font-bold text-neutral-400 uppercase">Skor Total</p>
                        <p className="font-bold font-mono text-sm text-neutral">{item.total_score}</p>
                      </div>
                      <div className="text-center bg-base-200 px-3 py-1 rounded-xl">
                        <p className="text-[8px] font-bold text-neutral-400 uppercase">Skor Max</p>
                        <p className="font-bold font-mono text-sm text-neutral">{item.highest_score}</p>
                      </div>
                    </div>

                    <button className="btn btn-ghost btn-circle btn-sm text-neutral-500 hover:text-neutral-700">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-base-200/30 border-t border-base-200/60 p-5 md:p-6 space-y-4">
                    {detailLoading ? (
                      <div className="flex justify-center items-center py-6 gap-2">
                        <div className="loading loading-spinner loading-sm text-primary" />
                        <span className="text-xs font-semibold text-neutral-500">Mengambil rincian jawaban...</span>
                      </div>
                    ) : sessionDetail ? (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Recommendations Alert Box */}
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                          item.classification === 'RED' ? 'bg-red-500/10 border-red-500/20 text-red-700' : item.classification === 'YELLOW' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700' : 'bg-green-500/10 border-green-500/20 text-green-700'
                        }`}>
                          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-black tracking-wider">Rekomendasi Tindakan</span>
                            <p className="text-xs font-bold leading-relaxed">"{sessionDetail.recommendation}"</p>
                          </div>
                        </div>

                        {/* Breakdown Table */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Breakdown Parameter</span>
                          <div className="overflow-x-auto w-full bg-base-100 rounded-2xl border border-base-200/60 p-3">
                            <table className="table table-sm w-full">
                              <thead>
                                <tr className="border-b border-base-200/60">
                                  <th>Parameter</th>
                                  <th>Pertanyaan</th>
                                  <th>Jawaban Anda</th>
                                  <th className="text-center">Keparahan</th>
                                  <th className="text-center">Skor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionDetail.answers.map((ans, idx) => (
                                  <tr key={idx} className="border-b border-base-200/40 hover:bg-base-200/20">
                                    <td className="font-extrabold text-xs text-neutral">{ans.parameter}</td>
                                    <td className="text-xs text-neutral-400 max-w-[200px] truncate">{ans.question}</td>
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
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-error">Gagal memuat rincian.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
