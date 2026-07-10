import React, { useState } from 'react';
import { getDb, saveDb } from '../mockDb';
import { Plus, Trash, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function FormBuilder({ doctorId, onFormSaved }) {
  const [db, setDb] = useState(getDb());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [rules, setRules] = useState([
    { min_score: 0, max_score: 5, diagnosis: 'Kondisi Baik/Normal', recommendation: 'Pertahankan gaya hidup sehat dan tetap aktif.' },
    { min_score: 6, max_score: 15, diagnosis: 'Gejala Ringan-Sedang', recommendation: 'Dianjurkan konsultasi mandiri/relaksasi.' },
    { min_score: 16, max_score: 30, diagnosis: 'Gejala Berat', recommendation: 'Segera hubungi tim dokter spesialis terdekat.' }
  ]);

  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');
  const [isRequired, setIsRequired] = useState(true);
  const [choices, setChoices] = useState([
    { text: 'Tidak Pernah', score: 0 },
    { text: 'Jarang', score: 1 },
    { text: 'Sering', score: 2 },
    { text: 'Hampir Setiap Hari', score: 3 }
  ]);

  const [newChoiceText, setNewChoiceText] = useState('');
  const [newChoiceScore, setNewChoiceScore] = useState(0);

  const addChoice = () => {
    if (!newChoiceText) return;
    setChoices([...choices, { text: newChoiceText, score: Number(newChoiceScore) }]);
    setNewChoiceText('');
    setNewChoiceScore(0);
  };

  const removeChoice = (index) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    if (!questionText) return;

    const newQ = {
      id: Date.now(),
      question: questionText,
      question_type: questionType,
      required: isRequired,
      question_order: questions.length + 1,
      choices: questionType === 'MULTIPLE_CHOICE' ? [...choices] : []
    };

    setQuestions([...questions, newQ]);
    
    // Reset Question Builder Form
    setQuestionText('');
    setIsRequired(true);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addRule = () => {
    setRules([...rules, { min_score: 0, max_score: 0, diagnosis: '', recommendation: '' }]);
  };

  const updateRule = (index, field, value) => {
    const updated = [...rules];
    updated[index][field] = field === 'min_score' || field === 'max_score' ? Number(value) : value;
    setRules(updated);
  };

  const removeRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSaveForm = () => {
    if (!title) {
      alert('Judul Form screening wajib diisi!');
      return;
    }
    if (questions.length === 0) {
      alert('Form minimal harus memiliki 1 pertanyaan!');
      return;
    }

    const currentDb = getDb();
    
    // 1. Save Form Header
    const newFormId = currentDb.forms.length + 1;
    const newForm = {
      id: newFormId,
      title,
      description,
      version: 1,
      is_active: true,
      created_by: doctorId,
      created_at: new Date().toISOString()
    };
    currentDb.forms.push(newForm);

    // 2. Save Questions & Options
    let qCounter = currentDb.questions.length + 1;
    let oCounter = currentDb.options.length + 1;

    questions.forEach((q) => {
      const dbQId = qCounter++;
      currentDb.questions.push({
        id: dbQId,
        form_id: newFormId,
        question: q.question,
        question_type: q.question_type,
        required: q.required,
        question_order: q.question_order
      });

      if (q.question_type === 'MULTIPLE_CHOICE') {
        q.choices.forEach((c) => {
          currentDb.options.push({
            id: oCounter++,
            question_id: dbQId,
            option_text: c.text,
            option_value: c.text.toLowerCase().replace(/ /g, '_'),
            score: c.score
          });
        });
      } else if (q.question_type === 'YES_NO') {
        currentDb.options.push(
          { id: oCounter++, question_id: dbQId, option_text: 'Ya', option_value: 'yes', score: 2 },
          { id: oCounter++, question_id: dbQId, option_text: 'Tidak', option_value: 'no', score: 0 }
        );
      }
    });

    // 3. Save Diagnosis Rules
    let rCounter = currentDb.rules.length + 1;
    rules.forEach((rule) => {
      currentDb.rules.push({
        id: rCounter++,
        form_id: newFormId,
        min_score: rule.min_score,
        max_score: rule.max_score,
        diagnosis: rule.diagnosis,
        recommendation: rule.recommendation
      });
    });

    saveDb(currentDb);
    alert('Form Screening baru berhasil diterbitkan!');
    onFormSaved();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Metadata and Rule Manager */}
      <div className="lg:col-span-1 space-y-6">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-6 space-y-4">
            <h3 className="font-heading font-black text-lg text-neutral flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Info Screening
            </h3>
            
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Judul Screening</span></label>
              <input 
                type="text" 
                placeholder="cth: Screening Stres Pasca Trauma" 
                className="input input-bordered w-full rounded-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Deskripsi</span></label>
              <textarea 
                placeholder="Penjelasan ringkas instruksi screening" 
                className="textarea textarea-bordered w-full rounded-lg"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Diagnosis Rules Generator */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-base text-neutral">Rules Penilaian</h3>
              <button onClick={addRule} className="btn btn-ghost btn-xs text-primary font-bold">
                + Tambah Rule
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {rules.map((rule, idx) => (
                <div key={idx} className="p-3 bg-base-200 rounded-xl relative space-y-2 text-xs">
                  <button onClick={() => removeRule(idx)} className="absolute top-2 right-2 text-error">
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">Min Score</label>
                      <input 
                        type="number" 
                        className="input input-bordered input-xs w-full rounded-md" 
                        value={rule.min_score} 
                        onChange={(e) => updateRule(idx, 'min_score', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">Max Score</label>
                      <input 
                        type="number" 
                        className="input input-bordered input-xs w-full rounded-md" 
                        value={rule.max_score}
                        onChange={(e) => updateRule(idx, 'max_score', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Hasil Diagnosis</label>
                    <input 
                      type="text" 
                      placeholder="Diagnosis Dokter" 
                      className="input input-bordered input-xs w-full rounded-md" 
                      value={rule.diagnosis}
                      onChange={(e) => updateRule(idx, 'diagnosis', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500">Rekomendasi</label>
                    <textarea 
                      placeholder="Saran medis..." 
                      className="textarea textarea-bordered textarea-xs w-full rounded-md" 
                      value={rule.recommendation}
                      onChange={(e) => updateRule(idx, 'recommendation', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Question Creator */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-6">
            <h3 className="font-heading font-bold text-lg text-neutral mb-4">Buat Pertanyaan Baru</h3>
            <div className="space-y-4 bg-base-200/50 p-4 rounded-2xl">
              
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Teks Pertanyaan</span></label>
                <input 
                  type="text" 
                  placeholder="Apakah Anda merasa..." 
                  className="input input-bordered w-full rounded-lg"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Tipe Input</span></label>
                  <select 
                    className="select select-bordered w-full rounded-lg"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Skor Dinamis)</option>
                    <option value="YES_NO">Ya / Tidak (Skor 2 / 0)</option>
                    <option value="TEXT">Teks Bebas / Deskriptif</option>
                    <option value="NUMBER">Angka Eksak</option>
                  </select>
                </div>
                <div className="form-control flex justify-end pb-3">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-primary" 
                      checked={isRequired} 
                      onChange={(e) => setIsRequired(e.target.checked)} 
                    />
                    <span className="label-text font-semibold">Wajib Diisi (Required)</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Multiple Choice Builder */}
              {questionType === 'MULTIPLE_CHOICE' && (
                <div className="bg-base-100 p-4 rounded-xl border border-base-200 space-y-3">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Pilihan Jawaban (Options & Scores)</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Teks opsi jawaban" 
                      className="input input-bordered input-sm flex-1 rounded-lg"
                      value={newChoiceText}
                      onChange={(e) => setNewChoiceText(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Skor" 
                      className="input input-bordered input-sm w-20 rounded-lg text-center"
                      value={newChoiceScore}
                      onChange={(e) => setNewChoiceScore(e.target.value)}
                    />
                    <button type="button" onClick={addChoice} className="btn btn-primary btn-sm rounded-lg">
                      Tambah Opsi
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {choices.map((c, index) => (
                      <div key={index} className="badge badge-lg gap-2 pl-3 py-4 rounded-xl bg-base-200 border-none">
                        <span className="text-xs font-medium">{c.text}</span>
                        <span className="badge badge-sm badge-neutral text-[10px] px-1">{c.score} pt</span>
                        <button type="button" onClick={() => removeChoice(index)} className="text-error font-bold hover:scale-115">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" onClick={addQuestion} className="btn btn-primary btn-block rounded-lg shadow-md mt-4">
                <Plus className="w-4 h-4 mr-1.5" /> Tambahkan Pertanyaan ke Daftar
              </button>
            </div>
          </div>
        </div>

        {/* Scaffold Question Queue Preview */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-6">
            <h3 className="font-heading font-bold text-lg text-neutral mb-4">Daftar Pertanyaan Screening ({questions.length})</h3>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                Belum ada pertanyaan. Gunakan form di atas untuk menambahkan pertanyaan.
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-base-200 rounded-2xl flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">
                        {idx + 1}. {q.question} {q.required && <span className="text-error">*</span>}
                      </p>
                      <div className="flex gap-2">
                        <span className="badge badge-sm badge-neutral font-mono text-[10px]">{q.question_type}</span>
                        {q.question_type === 'MULTIPLE_CHOICE' && (
                          <span className="text-xs text-neutral-500 font-medium">({q.choices.length} Opsi)</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeQuestion(q.id)} className="btn btn-ghost btn-circle btn-xs text-error">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="pt-4 border-t border-base-300 flex justify-end">
                  <button onClick={handleSaveForm} className="btn btn-success text-success-content px-8 rounded-lg shadow-lg">
                    <Check className="w-5 h-5 mr-2" /> Terbitkan Form Screening
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
