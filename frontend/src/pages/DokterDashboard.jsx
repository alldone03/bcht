import React, { useState, useEffect } from 'react';
import MewsBuilder from './MewsBuilder';
import { api } from '../api';
import { 
  ClipboardList, 
  FilePlus, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Send,
  X,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function DokterDashboard({ user, activeTab, setActiveTab }) {
  const [mewsSubmissions, setMewsSubmissions] = useState([]);
  const [mewsLoading, setMewsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [adviceText, setAdviceText] = useState('');
  const [submittingAdvice, setSubmittingAdvice] = useState(false);

  useEffect(() => {
    fetchMewsSubmissions();
  }, [activeTab]);

  const fetchMewsSubmissions = async () => {
    setMewsLoading(true);
    try {
      const data = await api.mewsGetAllResults();
      setMewsSubmissions(data);
    } catch (e) {
      console.error("Gagal mengambil submissions M-EWS", e);
    } finally {
      setMewsLoading(false);
    }
  };

  const handleOpenReview = (sub) => {
    setSelectedResult(sub);
    setAdviceText(sub.doctor_notes || '');
  };

  const handleCloseReview = () => {
    setSelectedResult(null);
    setAdviceText('');
  };

  const handleSubmitAdvice = async () => {
    if (!adviceText.trim()) {
      alert("Saran klinis dokter tidak boleh kosong!");
      return;
    }

    setSubmittingAdvice(true);
    try {
      // If we don't have result_id directly, fallback to session_id
      const id = selectedResult.result_id || selectedResult.session_id;
      await api.mewsApproveResult(id, adviceText);
      alert("Hasil screening berhasil divalidasi dan saran telah dikirim ke pasien!");
      handleCloseReview();
      fetchMewsSubmissions();
    } catch (e) {
      alert("Gagal memberikan ulasan: " + e.message);
    } finally {
      setSubmittingAdvice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Tab Nav */}
      <div className="tabs tabs-boxed md:hidden bg-base-100 p-2 shadow rounded-xl flex-wrap">
        <a 
          className={`tab ${activeTab === 'mews-submissions' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('mews-submissions')}
        >
          Hasil M-EWS
        </a>
        <a 
          className={`tab ${activeTab === 'mews-builder' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('mews-builder')}
        >
          Builder M-EWS
        </a>
      </div>

      {activeTab === 'mews-builder' ? (
        <div>
          <MewsBuilder doctorId={user.id} onTemplateSaved={() => setActiveTab('mews-submissions')} />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-black text-neutral">Hasil Screening M-EWS</h1>
            <p className="text-sm text-neutral-500 mt-1">Daftar lengkap hasil skrining klinis parameter M-EWS dari seluruh pasien.</p>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-200 p-6 rounded-3xl">
            {mewsLoading ? (
              <div className="text-center py-12">
                <span className="loading loading-spinner text-primary" />
                <p className="text-xs text-neutral-500 mt-2">Memuat data...</p>
              </div>
            ) : mewsSubmissions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                Belum ada pasien yang melakukan screening M-EWS.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Pasien</th>
                      <th>Template</th>
                      <th>Skor Total</th>
                      <th>Klasifikasi</th>
                      <th>Status Verifikasi</th>
                      <th>Rincian Review</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mewsSubmissions.map((sub, idx) => (
                      <tr key={idx} className="hover">
                        <td>
                          <div className="font-bold text-xs text-neutral">{sub.participant_name}</div>
                        </td>
                        <td>
                          <div className="text-xs text-neutral-500">{sub.template_name}</div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold font-mono text-xs text-neutral">Total: {sub.total_score}</span>
                            <span className="text-[10px] text-neutral-400">Max: {sub.highest_score}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-sm font-extrabold uppercase px-2 py-0.5 rounded ${
                            sub.classification === 'RED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : sub.classification === 'YELLOW' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
                          }`}>
                            {sub.classification}
                          </span>
                        </td>
                        <td>
                          {sub.status === 'APPROVED' ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                              <ShieldCheck className="w-4 h-4 shrink-0" /> Diverifikasi
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-neutral-400 font-bold text-xs">
                              <Clock className="w-4 h-4 shrink-0" /> Tertunda
                            </span>
                          )}
                        </td>
                        <td className="max-w-[200px] truncate text-xs text-neutral-500">
                          {sub.status === 'APPROVED' ? (
                            <div>
                              <div className="font-bold text-neutral-700">Dr. {sub.doctor_name}</div>
                              <div className="italic text-[10px] truncate">{sub.doctor_notes}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-normal">Belum ada saran</span>
                          )}
                        </td>
                        <td className="text-xs text-neutral-400">
                          {new Date(sub.finished_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button 
                            onClick={() => handleOpenReview(sub)}
                            className="btn btn-primary btn-xs rounded-xl font-bold flex items-center gap-1"
                          >
                            {sub.status === 'APPROVED' ? 'Edit Saran' : 'Beri Saran'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedResult && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-xl p-6 relative">
            <button 
              onClick={handleCloseReview}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading font-black text-lg text-neutral mb-2">Validasi & Rekomendasi Medis</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Berikan saran klinis untuk pasien <strong>{selectedResult.participant_name}</strong> berdasarkan hasil M-EWS dengan klasifikasi <strong>{selectedResult.classification}</strong> (Skor: {selectedResult.total_score}).
            </p>

            <div className="bg-base-200/60 border border-base-200 p-4 rounded-2xl mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-neutral-500">Klasifikasi M-EWS:</span>
                <span className="font-black text-neutral">{selectedResult.classification}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-neutral-500">Rekomendasi Awal:</span>
                <span className="font-medium text-neutral">{selectedResult.recommendation}</span>
              </div>
            </div>

            <div className="form-control mb-5">
              <label className="label"><span className="label-text font-bold text-xs">Saran / Catatan Khusus Dokter</span></label>
              <textarea 
                rows="4"
                value={adviceText}
                onChange={(e) => setAdviceText(e.target.value)}
                className="textarea textarea-bordered rounded-2xl text-xs w-full focus:outline-none"
                placeholder="Tulis instruksi observasi, saran obat, atau langkah rujukan selanjutnya..."
                required
              />
            </div>

            <div className="modal-action">
              <button 
                onClick={handleCloseReview}
                className="btn btn-ghost rounded-xl btn-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitAdvice}
                disabled={submittingAdvice}
                className="btn btn-primary rounded-xl btn-sm font-bold flex items-center gap-1 px-4"
              >
                {submittingAdvice ? <span className="loading loading-spinner loading-xs" /> : <Send className="w-3.5 h-3.5" />}
                Kirim Validasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
