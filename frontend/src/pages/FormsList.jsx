import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FileText, Clipboard, ArrowRight, RefreshCw } from 'lucide-react';
import FormFiller from './FormFiller';

export default function FormsList({ user, setActiveTab }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await api.getForms();
      // Filter forms targeted to user role
      const targetedForms = data.filter(f => 
        f.target_audience && f.target_audience.includes(user.role)
      );
      setForms(targetedForms);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil daftar form.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedFormId) {
    return (
      <FormFiller 
        formId={selectedFormId} 
        onBack={() => setSelectedFormId(null)} 
        onSubmitted={() => {
          setSelectedFormId(null);
          // Redirect to responses history tab
          setActiveTab('forms-responses');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-black text-neutral">Formulir Kesehatan</h1>
          <p className="text-sm text-neutral-500 mt-1">Daftar form pemantauan kesehatan lapangan yang wajib Anda isi berkala.</p>
        </div>
        <button onClick={fetchForms} className="btn btn-ghost rounded-xl p-3 border border-base-200">
          <RefreshCw className="w-4 h-4 text-neutral" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <span className="loading loading-spinner text-primary" />
            <p className="text-xs text-neutral-500 mt-2">Memuat daftar formulir...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-500 border-2 border-dashed border-base-300 rounded-3xl bg-base-50">
            Tidak ada formulir aktif untuk peran Anda saat ini.
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all rounded-3xl p-6 flex flex-col justify-between h-60">
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

              <div className="border-t pt-4 mt-4">
                <button 
                  onClick={() => setSelectedFormId(form.id)}
                  className="btn btn-primary btn-sm rounded-xl w-full text-white text-xs gap-2"
                >
                  Isi Formulir <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
