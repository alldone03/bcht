import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { formatDateWithAge } from '../utils/dateUtils';
import {
  FileText,
  Search,
  User,
  Activity,
  Clock,
  CheckCircle,
  Edit3,
  ArrowLeft,
  X,
  Stethoscope,
  ChevronRight,
  Filter,
  RefreshCw,
  Calendar
} from 'lucide-react';

export default function FormResponsesList({ onBack }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [responseDetails, setResponseDetails] = useState(null);

  // Diagnosis inputs
  const [diagnosis, setDiagnosis] = useState('');
  const [submittingDiag, setSubmittingDiag] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormTitle, setSelectedFormTitle] = useState('ALL');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(api.getCurrentUser());
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const data = await api.getFormResponses();
      setResponses(data);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil riwayat respon form.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (resp) => {
    setSelectedResponse(resp);
    setLoadingDetails(true);
    try {
      const details = await api.getFormResponseDetails(resp.id);
      setResponseDetails(details);
      setDiagnosis(details.diagnosis || '');
    } catch (e) {
      alert('Gagal memuat rincian respon: ' + e.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseReview = () => {
    setSelectedResponse(null);
    setResponseDetails(null);
    setDiagnosis('');
  };

  const handleSubmitDiagnosis = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Diagnosa dokter tidak boleh kosong!");
      return;
    }

    setSubmittingDiag(true);
    try {
      const res = await api.submitDiagnosis(responseDetails.id, diagnosis);
      alert('Diagnosa berhasil disimpan!');
      setResponseDetails({
        ...responseDetails,
        diagnosis: res.submission.diagnosis,
        diagnosed_by: res.submission.diagnosed_by,
        diagnosed_at: res.submission.diagnosed_at
      });
      // Refresh listing data
      fetchResponses();
    } catch (e) {
      alert('Gagal menyimpan diagnosa: ' + e.message);
    } finally {
      setSubmittingDiag(false);
    }
  };

  // Filter logic
  const filteredResponses = responses.filter(r => {
    const matchesSearch =
      r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.form?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesForm = selectedFormTitle === 'ALL' || r.form?.title === selectedFormTitle;

    return matchesSearch && matchesForm;
  });

  // Extract unique form titles for filtering
  const uniqueFormTitles = ['ALL', ...new Set(responses.map(r => r.form?.title).filter(Boolean))];

  const canDiagnose = currentUser && (currentUser.role === 'DOKTER' || currentUser.role === 'TIM_KESEHATAN' || currentUser.role === 'ADMIN');

  if (selectedResponse) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <button onClick={handleCloseReview} className="btn btn-ghost rounded-xl gap-2 text-neutral">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
          </button>
        </div>

        {loadingDetails ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner text-primary" />
            <p className="text-xs text-neutral-500 mt-2">Memuat detail respon...</p>
          </div>
        ) : !responseDetails ? (
          <div className="text-center py-12 text-red-500 font-semibold">
            Gagal memuat data detail.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Answer details */}
            <div className="card bg-base-100 shadow-xl border border-base-200 p-6 rounded-3xl lg:col-span-2 space-y-6">
              <div className="border-b pb-4 space-y-2">
                <span className="badge badge-primary badge-outline text-[10px] font-bold uppercase rounded-lg">
                  {responseDetails.form?.frequency}
                </span>
                <h2 className="text-xl font-bold text-neutral">{responseDetails.form?.title}</h2>
                <p className="text-xs text-neutral-500">{responseDetails.form?.description}</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-neutral-800 border-l-4 border-primary pl-2 uppercase tracking-wide">
                  Jawaban Pertanyaan
                </h3>

                <div className="space-y-4">
                  {responseDetails.answers && responseDetails.answers.map((ans, idx) => {
                    let parsedVal = ans.answer_value;
                    try {
                      const jsonVal = JSON.parse(ans.answer_value);
                      if (Array.isArray(jsonVal)) {
                        parsedVal = jsonVal.join(', ');
                      }
                    } catch (e) { }

                    return (
                      <div key={idx} className="p-4 border border-base-150 rounded-2xl bg-base-50/50 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                            {ans.question?.question_code || `Q${idx + 1}`}
                          </span>
                          <span className="text-xs font-semibold text-neutral-500">
                            {ans.question?.text}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-neutral pl-8">
                          {parsedVal || <span className="text-neutral-400 italic">Kosong</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Medical Info & Diagnosis Panel */}
            <div className="space-y-6 lg:col-span-1">
              {/* Participant metadata info */}
              <div className="card bg-base-100 shadow-xl border border-base-200 p-6 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Informasi Responden</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Nama Pasien</div>
                      <div className="text-sm font-bold text-neutral">{responseDetails.user?.name}</div>
                    </div>
                  </div>

                  {responseDetails.user?.tanggal_lahir && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Tanggal Lahir / Usia</div>
                        <div className="text-xs font-bold text-neutral">
                          {formatDateWithAge(responseDetails.user.tanggal_lahir)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Tanggal Pengisian</div>
                      <div className="text-xs font-bold text-neutral">
                        {new Date(responseDetails.submitted_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Pengisi Formulir</div>
                      <div className="text-xs font-semibold text-neutral">
                        {responseDetails.filler?.name}
                        {responseDetails.user_id !== responseDetails.filled_by && (
                          <span className="text-[10px] text-primary block">(Teman Pendamping)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis box */}
              <div className="card bg-base-100 shadow-xl border border-base-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 border-b pb-3 text-neutral-800">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-sm uppercase">Diagnosa Medis Dokter</h3>
                </div>

                {responseDetails.diagnosis ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs text-neutral leading-relaxed">
                      <p className="font-semibold text-neutral-700 whitespace-pre-wrap">{responseDetails.diagnosis}</p>
                    </div>
                    <div className="text-[10px] text-neutral-500 flex flex-col gap-0.5">
                      <span>Didiagnosa oleh: <strong className="text-neutral-700">{responseDetails.diagnosed_by?.name || 'Dokter'}</strong></span>
                      <span>Pada: <strong>{new Date(responseDetails.diagnosed_at).toLocaleString('id-ID')}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 italic">Belum ada diagnosa dari dokter.</div>
                )}

                {canDiagnose && (
                  <form onSubmit={handleSubmitDiagnosis} className="space-y-3 pt-2">
                    <div className="form-control">
                      <label className="label text-[10px] uppercase font-bold text-neutral-500">
                        {responseDetails.diagnosis ? 'Ubah Diagnosa' : 'Tulis Diagnosa Baru'}
                      </label>
                      <textarea
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="textarea textarea-bordered w-full text-xs rounded-xl h-24"
                        placeholder="Ketik catatan medis atau diagnosa hasil evaluasi form..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingDiag}
                      className="btn btn-primary btn-sm rounded-xl w-full text-white"
                    >
                      {submittingDiag ? <span className="loading loading-spinner w-4 h-4" /> : 'Simpan Diagnosa'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-black text-neutral">Riwayat Respon Form</h1>
          <p className="text-sm text-neutral-500 mt-1">Daftar lengkap respon kuesioner dan pemantauan klinis lapangan.</p>
        </div>
        <button onClick={fetchResponses} className="btn btn-ghost rounded-xl p-3 border border-base-200">
          <RefreshCw className="w-4 h-4 text-neutral" />
        </button>
      </div>

      {/* Filter panel */}
      <div className="card bg-base-100 shadow border border-base-200 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-sm rounded-xl pl-9 w-full font-medium"
            placeholder="Cari nama pasien..."
          />
        </div>

        <div className="flex gap-2 items-center w-full md:w-auto">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <select
            value={selectedFormTitle}
            onChange={(e) => setSelectedFormTitle(e.target.value)}
            className="select select-bordered select-sm rounded-xl w-full md:w-auto font-medium"
          >
            {uniqueFormTitles.map((title) => (
              <option key={title} value={title}>
                {title === 'ALL' ? 'Semua Form' : title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responses Table list */}
      <div className="card bg-base-100 shadow-xl border border-base-200 p-6 rounded-3xl">
        {loading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner text-primary" />
            <p className="text-xs text-neutral-500 mt-2">Memuat data respon...</p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Tidak ada respon yang cocok dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full text-xs">
              <thead>
                <tr className="bg-base-100 text-neutral-500 text-[10px] uppercase font-black">
                  <th>Pasien</th>
                  <th>Formulir</th>
                  <th>Frekuensi</th>
                  <th>Tanggal Kirim</th>
                  <th>Status Diagnosa</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((r, idx) => (
                  <tr key={idx} className="hover">
                    <td>
                      <div className="font-bold text-neutral">{r.user?.name}</div>
                      <div className="text-[10px] text-neutral-400">Tim: {r.user?.team?.name || 'Umum/Tanpa Tim'}</div>
                    </td>
                    <td>
                      <div className="font-bold text-neutral-700 line-clamp-1">{r.form?.title}</div>
                    </td>
                    <td>
                      <span className="badge badge-sm bg-neutral-100 text-neutral-600 border-0 font-semibold uppercase text-[9px] rounded px-1.5 py-0.5">
                        {r.form?.frequency}
                      </span>
                    </td>
                    <td>
                      <span className="text-neutral-500 font-semibold">{new Date(r.submitted_at).toLocaleDateString('id-ID')}</span>
                    </td>
                    <td>
                      {r.diagnosis ? (
                        <span className="badge badge-success text-white font-bold gap-1 badge-sm rounded-lg px-2">
                          <CheckCircle className="w-3 h-3" /> Sudah Didiagnosa
                        </span>
                      ) : (
                        <span className="badge badge-ghost text-neutral-400 font-semibold badge-sm rounded-lg px-2">
                          Menunggu Ulasan
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenReview(r)}
                        className="btn btn-ghost btn-xs text-primary font-bold gap-1 hover:bg-primary/10 rounded-lg px-2"
                      >
                        Lihat <ChevronRight className="w-3.5 h-3.5" />
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
  );
}
