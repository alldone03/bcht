import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Register({ onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PESERTA');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = await api.register(name, email, password, role);
      setSuccess('Pendaftaran berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        onRegisterSuccess(user);
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-base-200 px-4 py-12">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body p-8">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-3 bg-primary text-primary-content rounded-2xl shadow-lg mb-3">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-black text-2xl text-neutral">Mulai Akun Baru</h2>
            <p className="text-xs text-neutral-500 mt-1">Dapatkan akses instan ke screening kesehatan Anda</p>
          </div>

          {error && (
            <div className="alert alert-error text-xs py-2 px-3 rounded-lg mb-4 flex items-start gap-2 shadow-inner">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success text-xs py-2 px-3 rounded-lg mb-4 flex items-start gap-2 shadow-inner">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-success-content" />
              <span className="text-success-content font-medium">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nama Lengkap</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Nama Lengkap Anda" 
                  className="input input-bordered w-full pl-11 focus:input-primary transition-all rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Alamat Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-400" />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="input input-bordered w-full pl-11 focus:input-primary transition-all rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-400" />
                <input 
                  type="password" 
                  placeholder="Minimal 6 Karakter" 
                  className="input input-bordered w-full pl-11 focus:input-primary transition-all rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Daftar Sebagai</span>
              </label>
              <select 
                className="select select-bordered w-full focus:select-primary rounded-lg"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="PESERTA">👤 Peserta (Umum/Pasien)</option>
                <option value="DOKTER">🏥 Dokter Ahli</option>
              </select>
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary w-full rounded-lg shadow-lg shadow-primary/20 mt-4 ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {!loading && (
                <>
                  Mulai Registrasi
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-sm text-neutral-500">Sudah punya akun? </span>
            <a 
              onClick={() => navigate('/login')} 
              className="text-sm text-primary font-bold hover:underline cursor-pointer"
            >
              Masuk Akun
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
