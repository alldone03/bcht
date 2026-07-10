import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Plus, 
  Trash2, 
  Save, 
  Activity, 
  PlusCircle, 
  AlertCircle,
  ArrowLeft,
  Edit,
  FilePlus,
  RefreshCw
} from 'lucide-react';

export default function MewsBuilder({ doctorId, onTemplateSaved }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [parameters, setParameters] = useState([]);
  const [deletedParamIds, setDeletedParamIds] = useState([]);
  const [deletedAnswerIds, setDeletedAnswerIds] = useState([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.mewsGetTemplates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus template M-EWS ini beserta seluruh parameter dan histori screening terkait?")) {
      return;
    }
    setLoading(true);
    try {
      await api.mewsDeleteTemplate(templateId);
      alert("Template M-EWS berhasil dihapus!");
      fetchTemplates();
    } catch (e) {
      alert("Gagal menghapus template: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setSelectedTemplateId(null);
    setTemplateName('Template M-EWS Baru');
    setTemplateDesc('Screening fisiologis klinis terkonfigurasi.');
    setParameters([
      {
        name: 'Kesadaran',
        order_number: 1,
        question: 'Bagaimana kondisi kesadaran pasien?',
        answers: [
          { answer: 'Sadar penuh', score: 0, severity_color: 'GREEN' },
          { answer: 'Mengantuk / Bingung', score: 1, severity_color: 'YELLOW' },
          { answer: 'Tidak sadar / Kejang', score: 2, severity_color: 'RED' }
        ]
      }
    ]);
    setDeletedParamIds([]);
    setDeletedAnswerIds([]);
    setIsEditing(true);
  };

  const handleEditTemplate = async (templateId) => {
    setLoading(true);
    try {
      const details = await api.mewsGetTemplateDetails(templateId);
      setSelectedTemplateId(templateId);
      setTemplateName(details.name);
      setTemplateDesc(details.description || '');
      
      // Parse parameters with nested question & answers
      const parsedParams = details.parameters.map(p => {
        const q = p.question || { id: null, question: '' };
        const answers = q.answers || [];
        return {
          id: p.id,
          name: p.name,
          order_number: p.order_number,
          question: {
            id: q.id,
            question: q.question
          },
          answers: answers.map(a => ({
            id: a.id,
            answer: a.answer,
            score: a.score,
            severity_color: a.severity_color
          }))
        };
      });

      setParameters(parsedParams);
      setDeletedParamIds([]);
      setDeletedAnswerIds([]);
      setIsEditing(true);
    } catch (e) {
      alert("Gagal memuat template: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: `Parameter #${parameters.length + 1}`,
        order_number: parameters.length + 1,
        question: { id: null, question: 'Tuliskan pertanyaan parameter di sini?' },
        answers: [
          { answer: 'Jawaban Normal', score: 0, severity_color: 'GREEN' },
          { answer: 'Jawaban Sedang', score: 1, severity_color: 'YELLOW' },
          { answer: 'Jawaban Parah', score: 2, severity_color: 'RED' }
        ]
      }
    ]);
  };

  const handleRemoveParameter = (pIndex) => {
    const param = parameters[pIndex];
    if (parameters.length === 1) {
      alert("Template harus memiliki minimal 1 parameter.");
      return;
    }
    
    // If it exists in DB, track to delete
    if (param.id) {
      setDeletedParamIds(prev => [...prev, param.id]);
    }

    const updated = parameters.filter((_, idx) => idx !== pIndex);
    // Recalculate order numbers
    const reordered = updated.map((p, idx) => ({ ...p, order_number: idx + 1 }));
    setParameters(reordered);
  };

  const handleParameterNameChange = (pIndex, val) => {
    const updated = [...parameters];
    updated[pIndex].name = val;
    setParameters(updated);
  };

  const handleQuestionChange = (pIndex, val) => {
    const updated = [...parameters];
    updated[pIndex].question.question = val;
    setParameters(updated);
  };

  const handleAddAnswer = (pIndex) => {
    const updated = [...parameters];
    updated[pIndex].answers.push({ answer: 'Pilihan Jawaban', score: 0, severity_color: 'GREEN' });
    setParameters(updated);
  };

  const handleRemoveAnswer = (pIndex, aIndex) => {
    const updated = [...parameters];
    const ans = updated[pIndex].answers[aIndex];
    
    if (updated[pIndex].answers.length === 1) {
      alert("Pertanyaan harus memiliki minimal 1 pilihan jawaban.");
      return;
    }

    // If it exists in DB, track to delete
    if (ans.id) {
      setDeletedAnswerIds(prev => [...prev, ans.id]);
    }

    updated[pIndex].answers = updated[pIndex].answers.filter((_, idx) => idx !== aIndex);
    setParameters(updated);
  };

  const handleAnswerChange = (pIndex, aIndex, field, val) => {
    const updated = [...parameters];
    updated[pIndex].answers[aIndex][field] = field === 'score' ? Number(val) : val;
    setParameters(updated);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Nama template wajib diisi!");
      return;
    }

    // Validate parameters
    for (let p of parameters) {
      if (!p.name.trim() || !p.question.question.trim()) {
        alert("Nama parameter dan pertanyaan tidak boleh kosong!");
        return;
      }
      for (let a of p.answers) {
        if (!a.answer.trim()) {
          alert("Pilihan jawaban tidak boleh kosong!");
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (selectedTemplateId) {
        // --- UPDATE TEMPLATE MODE ---
        // 1. Update template details
        await api.mewsUpdateTemplate(selectedTemplateId, {
          name: templateName,
          description: templateDesc
        });

        // 2. Perform deletes first
        for (let pId of deletedParamIds) {
          await api.mewsDeleteParameter(pId);
        }
        for (let aId of deletedAnswerIds) {
          await api.mewsDeleteAnswer(aId);
        }

        // 3. Update / Create parameters, questions, answers
        for (let p of parameters) {
          let paramId = p.id;
          if (paramId) {
            // Update parameter
            await api.mewsUpdateParameter(paramId, {
              name: p.name,
              order_number: p.order_number
            });
            // Update question
            if (p.question.id) {
              await api.mewsUpdateQuestion(p.question.id, {
                question: p.question.question
              });
            } else {
              await api.mewsCreateQuestion({
                parameter_id: paramId,
                question: p.question.question
              });
            }
          } else {
            // Create parameter
            const newParam = await api.mewsCreateParameter({
              template_id: selectedTemplateId,
              name: p.name,
              order_number: p.order_number
            });
            paramId = newParam.id;
            
            // Create question
            const newQ = await api.mewsCreateQuestion({
              parameter_id: paramId,
              question: p.question.question
            });
            p.question.id = newQ.id;
          }

          // Handle answers
          for (let a of p.answers) {
            if (a.id) {
              await api.mewsUpdateAnswer(a.id, {
                answer: a.answer,
                score: a.score,
                severity_color: a.severity_color
              });
            } else {
              await api.mewsCreateAnswer({
                question_id: p.question.id,
                answer: a.answer,
                score: a.score,
                severity_color: a.severity_color
              });
            }
          }
        }
        alert("Perubahan template M-EWS berhasil disimpan!");
      } else {
        // --- CREATE TEMPLATE MODE ---
        const payload = {
          name: templateName,
          description: templateDesc,
          parameters: parameters.map(p => ({
            name: p.name,
            order_number: p.order_number,
            question: p.question.question,
            answers: p.answers
          }))
        };
        await api.mewsCreateTemplate(payload);
        alert("Template M-EWS baru berhasil disimpan!");
      }

      setIsEditing(false);
      fetchTemplates();
      if (onTemplateSaved) onTemplateSaved();
    } catch (e) {
      alert("Gagal menyimpan perubahan: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-black text-neutral">Manajer Template M-EWS</h1>
            <p className="text-sm text-neutral-500 mt-1">Kelola, sunting, dan buat template screening beserta parameter pertanyaannya.</p>
          </div>
          <button 
            onClick={handleStartNew}
            className="btn btn-primary rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Buat Template
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-xs text-neutral-500 mt-2">Memuat template...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-3xl border border-base-200 text-neutral-500">
            Belum ada template screening M-EWS.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tpl) => (
              <div key={tpl.id} className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl p-6 justify-between flex flex-col hover:border-primary/30 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="badge badge-accent badge-sm font-semibold rounded-md">General M-EWS</span>
                    <span className="text-[10px] font-mono text-neutral-400">Template ID: #{tpl.id}</span>
                  </div>
                  <h3 className="card-title font-heading font-extrabold text-neutral text-lg">{tpl.name}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">{tpl.description}</p>
                </div>
                
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-base-200/50">
                  <button 
                    onClick={() => handleEditTemplate(tpl.id)}
                    className="btn btn-outline btn-primary btn-sm rounded-xl px-4 flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Pertanyaan
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="btn btn-outline btn-error btn-sm rounded-xl px-4 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditing(false)}
            className="btn btn-ghost btn-circle btn-sm text-neutral-500 hover:text-neutral-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-black text-neutral">
              {selectedTemplateId ? 'Edit Pertanyaan M-EWS' : 'Template M-EWS Baru'}
            </h1>
            <p className="text-xs text-neutral-500">Konfigurasi parameter klinis, pertanyaan, dan pilihan jawaban untuk screening.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsEditing(false)}
            className="btn btn-ghost btn-sm rounded-xl"
          >
            Batal
          </button>
          <button 
            onClick={handleSaveTemplate}
            disabled={saving}
            className="btn btn-primary btn-sm rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-primary/20 px-5"
          >
            {saving ? <span className="loading loading-spinner loading-xs" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-bold text-neutral text-base">Rincian Template</h3>
            
            <div className="form-control">
              <label className="label"><span className="label-text font-bold text-xs">Nama Template</span></label>
              <input 
                type="text" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="input input-bordered w-full rounded-xl text-xs font-semibold"
                placeholder="Contoh: GAD-7 atau M-EWS"
                required
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-bold text-xs">Deskripsi Singkat</span></label>
              <textarea 
                rows="4"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="textarea textarea-bordered w-full rounded-xl text-xs"
                placeholder="Rincian mengenai kegunaan screening template ini..."
              />
            </div>

            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3 text-neutral-500 text-xs">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-neutral-700">Petunjuk Editor:</p>
                <p className="leading-relaxed">
                  Semua edit di sebelah kanan akan disimpan langsung ke database setelah menekan tombol <strong>Simpan Perubahan</strong>. Anda dapat menambah, menghapus, atau mengubah teks parameter serta pilihan skornya.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Parameters List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-extrabold text-neutral text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Parameter & Pertanyaan ({parameters.length})
            </h3>
            <button 
              onClick={handleAddParameter}
              className="btn btn-outline btn-primary btn-sm rounded-xl font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Tambah Parameter
            </button>
          </div>

          <div className="space-y-6">
            {parameters.map((param, pIdx) => (
              <div key={pIdx} className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl p-6 space-y-5 transition-all relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-primary" />
                
                {/* Header Parameter */}
                <div className="flex justify-between items-center pb-3 border-b border-base-200">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-bold text-xs flex justify-center items-center font-mono">
                      #{param.order_number}
                    </span>
                    <input 
                      type="text" 
                      value={param.name}
                      onChange={(e) => handleParameterNameChange(pIdx, e.target.value)}
                      className="input input-ghost text-neutral font-heading font-bold text-base w-48 rounded-lg focus:bg-base-200 p-1"
                      placeholder="Nama Parameter"
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveParameter(pIdx)}
                    className="btn btn-ghost btn-circle btn-sm text-error hover:bg-error/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Row */}
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold text-xs">Teks Pertanyaan</span></label>
                  <input 
                    type="text"
                    value={param.question.question}
                    onChange={(e) => handleQuestionChange(pIdx, e.target.value)}
                    className="input input-bordered w-full rounded-xl text-xs"
                    placeholder="Masukkan pertanyaan parameter ini..."
                  />
                </div>

                {/* Answers Choice Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Pilihan Jawaban (Severity & Skor)</span>
                    <button 
                      onClick={() => handleAddAnswer(pIdx)}
                      className="btn btn-ghost btn-xs text-primary font-bold flex items-center gap-1 rounded-lg"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Tambah Pilihan
                    </button>
                  </div>

                  <div className="space-y-2">
                    {param.answers.map((ans, aIdx) => (
                      <div key={aIdx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-base-200/50 p-3 rounded-2xl border border-base-200/40">
                        <input 
                          type="text"
                          value={ans.answer}
                          onChange={(e) => handleAnswerChange(pIdx, aIdx, 'answer', e.target.value)}
                          className="input input-bordered input-sm flex-1 rounded-xl text-xs font-semibold"
                          placeholder="Label Jawaban"
                        />

                        <div className="flex gap-2">
                          <select 
                            value={ans.score}
                            onChange={(e) => handleAnswerChange(pIdx, aIdx, 'score', e.target.value)}
                            className="select select-bordered select-sm rounded-xl text-xs font-mono font-bold"
                          >
                            <option value={0}>Skor 0</option>
                            <option value={1}>Skor 1</option>
                            <option value={2}>Skor 2</option>
                          </select>

                          <select 
                            value={ans.severity_color}
                            onChange={(e) => handleAnswerChange(pIdx, aIdx, 'severity_color', e.target.value)}
                            className={`select select-bordered select-sm rounded-xl text-xs font-bold uppercase ${
                              ans.severity_color === 'RED' ? 'text-red-500 bg-red-500/10' : ans.severity_color === 'YELLOW' ? 'text-yellow-500 bg-yellow-500/10' : 'text-green-500 bg-green-500/10'
                            }`}
                          >
                            <option value="GREEN">GREEN</option>
                            <option value="YELLOW">YELLOW</option>
                            <option value="RED">RED</option>
                          </select>

                          <button 
                            onClick={() => handleRemoveAnswer(pIdx, aIdx)}
                            className="btn btn-ghost btn-circle btn-sm text-error hover:bg-error/10 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSaveTemplate}
              disabled={saving}
              className="btn btn-primary rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-primary/20 px-6 py-2"
            >
              {saving ? <span className="loading loading-spinner loading-xs" /> : <Save className="w-4 h-4" />}
              Simpan Perubahan Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
