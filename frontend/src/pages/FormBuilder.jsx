import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Edit,
  RefreshCw,
  Eye,
  Settings,
  CheckSquare,
  Sliders,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export default function FormBuilder({ onBack }) {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('ONCE');
  const [targetAudience, setTargetAudience] = useState(['PESERTA']);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await api.getForms();
      setForms(data);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil daftar form.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = async (formId) => {
    setLoading(true);
    try {
      const details = await api.getFormDetails(formId);
      setSelectedFormId(formId);
      setTitle(details.title);
      setDescription(details.description || '');
      setFrequency(details.frequency);
      setTargetAudience(details.target_audience || ['PESERTA']);
      setQuestions(details.questions || []);
      setIsEditing(true);
    } catch (e) {
      alert('Gagal memuat rincian form: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setSelectedFormId(null);
    setTitle('Form Kustom Baru');
    setDescription('Deskripsi form pemantauan kesehatan lapangan.');
    setFrequency('ONCE');
    setTargetAudience(['PESERTA']);
    setQuestions([
      {
        question_code: 'Q01',
        text: 'Masukkan pertanyaan pertama Anda di sini',
        type: 'text',
        options: [],
        order_number: 1,
        trigger_condition: null,
        trigger_action_text: ''
      }
    ]);
    setIsEditing(true);
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus form ini beserta seluruh riwayat jawabannya?")) {
      return;
    }
    setLoading(true);
    try {
      await api.deleteForm(formId);
      alert("Form berhasil dihapus!");
      fetchForms();
    } catch (e) {
      alert("Gagal menghapus form: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async () => {
    if (!title.trim()) {
      alert("Judul form wajib diisi!");
      return;
    }
    if (questions.length === 0) {
      alert("Form harus memiliki minimal 1 pertanyaan!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: selectedFormId,
        title,
        description,
        frequency,
        target_audience: targetAudience,
        questions
      };
      await api.saveForm(payload);
      alert("Form berhasil disimpan!");
      setIsEditing(false);
      fetchForms();
    } catch (e) {
      alert("Gagal menyimpan form: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const nextCode = `Q${nextNum < 10 ? '0' + nextNum : nextNum}`;
    setQuestions([
      ...questions,
      {
        question_code: nextCode,
        text: '',
        type: 'text',
        options: [],
        order_number: nextNum,
        trigger_condition: null,
        trigger_action_text: ''
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    // Re-adjust order numbers
    const reordered = updated.map((q, idx) => ({
      ...q,
      order_number: idx + 1
    }));
    setQuestions(reordered);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setQuestions(updated);
  };

  const handleAddOption = (qIdx) => {
    const q = questions[qIdx];
    const opts = q.options ? [...q.options] : [];
    opts.push(`Pilihan ${opts.length + 1}`);
    handleQuestionChange(qIdx, 'options', opts);
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    const q = questions[qIdx];
    const opts = [...q.options];
    opts.splice(optIdx, 1);
    handleQuestionChange(qIdx, 'options', opts);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const q = questions[qIdx];
    const opts = [...q.options];
    opts[optIdx] = val;
    handleQuestionChange(qIdx, 'options', opts);
  };

  const toggleAudience = (role) => {
    if (targetAudience.includes(role)) {
      setTargetAudience(targetAudience.filter(r => r !== role));
    } else {
      setTargetAudience([...targetAudience, role]);
    }
  };

  const moveQuestion = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Fix order numbers
    const reordered = updated.map((q, i) => ({
      ...q,
      order_number: i + 1
    }));
    setQuestions(reordered);
  };

  if (isEditing) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button onClick={() => setIsEditing(false)} className="btn btn-ghost gap-2 rounded-xl text-neutral">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
          </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="btn btn-primary gap-2 rounded-xl text-white flex-1 sm:flex-initial"
            >
              {saving ? <span className="loading loading-spinner w-4 h-4" /> : <Save className="w-4 h-4" />}
              Simpan Form
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Section */}
          <div className="card bg-base-100 shadow-lg border border-base-200 p-6 rounded-3xl lg:col-span-1 space-y-6 h-fit">
            <div className="flex items-center gap-2 border-b pb-3">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-neutral">Pengaturan Form</h2>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label font-bold text-xs text-neutral">Judul Form</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full rounded-xl"
                  placeholder="Contoh: Form 3 — Check-in Harian"
                />
              </div>

              <div className="form-control">
                <label className="label font-bold text-xs text-neutral">Deskripsi Singkat</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea textarea-bordered w-full rounded-xl h-24"
                  placeholder="Informasi pengisian..."
                />
              </div>

              <div className="form-control">
                <label className="label font-bold text-xs text-neutral">Frekuensi Pengisian</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="select select-bordered w-full rounded-xl"
                >
                  <option value="ONCE">Satu Kali Saja (Sekali)</option>
                  <option value="DAILY">Harian</option>
                  <option value="WEEKLY">Mingguan</option>
                  <option value="BI_WEEKLY">Dua Mingguan</option>
                  <option value="CONDITIONAL">Kondisional (Bila terpicu/kejadian khusus)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label font-bold text-xs text-neutral">Target Audiens (Role)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-xl bg-base-50">
                  {['PESERTA', 'TIM_KESEHATAN', 'PENANGGUNG_JAWAB_TIM', 'PETUGAS_KESEHATAN', 'TEMAN_PENDAMPING', 'DOKTER', 'ADMIN'].map((role) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={targetAudience.includes(role)}
                        onChange={() => toggleAudience(role)}
                        className="checkbox checkbox-xs checkbox-primary"
                      />
                      <span className="text-xs text-neutral font-medium">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-lg border border-base-200 p-6 rounded-3xl">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-neutral">Daftar Pertanyaan ({questions.length})</h2>
                </div>
                <button
                  onClick={handleAddQuestion}
                  className="btn btn-outline btn-primary btn-sm gap-1 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Tambah Pertanyaan
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl bg-base-50 border-base-200 relative group space-y-4">
                    {/* Position controls */}
                    <div className="absolute right-4 top-4 flex gap-1 items-center">
                      <button
                        onClick={() => moveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="btn btn-ghost btn-xs text-neutral p-1 disabled:opacity-35"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(idx, 'down')}
                        disabled={idx === questions.length - 1}
                        className="btn btn-ghost btn-xs text-neutral p-1 disabled:opacity-35"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Code */}
                      <div className="form-control sm:col-span-1">
                        <label className="label text-[10px] uppercase tracking-wider font-bold text-neutral-500">Kode Pertanyaan</label>
                        <input
                          type="text"
                          value={q.question_code}
                          onChange={(e) => handleQuestionChange(idx, 'question_code', e.target.value)}
                          className="input input-bordered input-sm rounded-lg"
                          placeholder="Misal: A01"
                        />
                      </div>

                      {/* Type */}
                      <div className="form-control sm:col-span-3">
                        <label className="label text-[10px] uppercase tracking-wider font-bold text-neutral-500">Tipe Input Jawaban</label>
                        <select
                          value={q.type}
                          onChange={(e) => handleQuestionChange(idx, 'type', e.target.value)}
                          className="select select-bordered select-sm rounded-lg"
                        >
                          <option value="text">Isian Singkat (Text)</option>
                          <option value="textarea">Isian Panjang (Textarea)</option>
                          <option value="radio">Pilihan Ganda Tunggal (Radio)</option>
                          <option value="checkbox">Pilihan Ganda Banyak (Checkbox)</option>
                          <option value="scale">Skala Likert (DASS-21 style 0-3)</option>
                        </select>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="form-control">
                      <label className="label text-[10px] uppercase tracking-wider font-bold text-neutral-500">Teks Pertanyaan</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                        className="input input-bordered input-sm rounded-lg w-full"
                        placeholder="Contoh: Apakah Anda pernah mengalami demam?"
                      />
                    </div>

                    {/* Options (Only if Radio or Checkbox or Scale) */}
                    {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'scale') && (
                      <div className="p-3 border rounded-xl bg-white border-base-200 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-neutral-600">Pilihan Jawaban</label>
                          <button
                            onClick={() => handleAddOption(idx)}
                            className="btn btn-xs btn-ghost text-primary font-bold gap-1"
                          >
                            <Plus className="w-3 h-3" /> Tambah Opsi
                          </button>
                        </div>
                        {q.options && q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                              className="input input-bordered input-xs rounded-md flex-1"
                              placeholder={`Opsi ${optIdx + 1}`}
                            />
                            <button
                              onClick={() => handleRemoveOption(idx, optIdx)}
                              className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Conditional Logic */}
                    <div className="p-3 border rounded-xl bg-yellow-50/50 border-yellow-100 space-y-3">
                      <span className="text-xs font-bold text-yellow-800 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5" /> Logika Bersyarat & Kondisi Klinis
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-control">
                          <label className="label text-[9px] uppercase tracking-wider font-bold text-neutral-500">Tampilkan Bila (Kode Pertanyaan)</label>
                          <input
                            type="text"
                            value={q.trigger_condition?.depends_on || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updatedCond = val ? { ...q.trigger_condition, depends_on: val } : null;
                              handleQuestionChange(idx, 'trigger_condition', updatedCond);
                            }}
                            className="input input-bordered input-xs rounded-md"
                            placeholder="Misal: A08 (kosongkan jika selalu muncul)"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label text-[9px] uppercase tracking-wider font-bold text-neutral-500">Nilai Jawaban Pemicu</label>
                          <input
                            type="text"
                            value={q.trigger_condition?.value || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updatedCond = q.trigger_condition?.depends_on ? { ...q.trigger_condition, value: val } : null;
                              handleQuestionChange(idx, 'trigger_condition', updatedCond);
                            }}
                            className="input input-bordered input-xs rounded-md"
                            placeholder="Misal: Ya"
                          />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label text-[9px] uppercase tracking-wider font-bold text-neutral-500">Bila Terpicu (Rekomendasi Tindakan / Alert Klinis)</label>
                        <input
                          type="text"
                          value={q.trigger_action_text || ''}
                          onChange={(e) => handleQuestionChange(idx, 'trigger_action_text', e.target.value)}
                          className="input input-bordered input-xs rounded-md"
                          placeholder="Misal: Rujuk ke petugas medis lapangan sebelum bertugas"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-neutral">Form Builder</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola Form Pemantauan Kesehatan Lapangan Dinamis (Form 1 hingga Form 6).</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleStartNew} className="btn btn-primary gap-2 rounded-xl text-white flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" /> Buat Form Baru
          </button>
          <button onClick={fetchForms} className="btn btn-ghost rounded-xl p-3 border border-base-200">
            <RefreshCw className="w-4 h-4 text-neutral" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <span className="loading loading-spinner text-primary" />
            <p className="text-xs text-neutral-500 mt-2">Memuat data form...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-500 border-2 border-dashed border-base-300 rounded-3xl bg-base-50">
            Belum ada form yang dibuat. Silakan klik "Buat Form Baru".
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all rounded-3xl p-6 flex flex-col justify-between h-64">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="badge badge-primary badge-outline text-[10px] font-bold rounded-lg px-2 py-1 uppercase tracking-wide">
                    {form.frequency}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">
                    {form.questions_count ?? form.questions?.length ?? 0} Pertanyaan
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-neutral text-base line-clamp-1">{form.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-3 h-12 leading-relaxed">
                    {form.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {form.target_audience && form.target_audience.slice(0, 3).map((role) => (
                    <span key={role} className="badge bg-neutral-100 text-neutral-600 border-0 text-[8px] font-bold uppercase rounded-md px-1.5 py-0.5">
                      {role}
                    </span>
                  ))}
                  {form.target_audience && form.target_audience.length > 3 && (
                    <span className="text-[8px] text-neutral-400 font-bold self-center">
                      +{form.target_audience.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditForm(form.id)}
                    className="btn btn-outline btn-neutral btn-sm rounded-xl flex-1 text-xs gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Sunting
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-xl px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
