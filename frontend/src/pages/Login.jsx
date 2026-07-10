import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login(email, password);
      onLoginSuccess(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email atau password salah.');
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
            <h2 className="font-heading font-black text-2xl text-neutral">Selamat Datang Kembali</h2>
            <p className="text-xs text-neutral-500 mt-1">Masuk untuk mengelola screening kesehatan Anda</p>
          </div>

          {error && (
            <div className="alert alert-error text-xs py-2 px-3 rounded-lg mb-4 flex items-start gap-2 shadow-inner">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="label flex justify-between">
                <span className="label-text font-semibold">Password</span>
                <a href="#" className="label-text-alt link link-hover text-primary font-medium">Lupa Password?</a>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-400" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-bordered w-full pl-11 focus:input-primary transition-all rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary w-full rounded-lg shadow-lg shadow-primary/20 ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {!loading && (
                <>
                  Masuk Akun
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Options Helper */}
          <div className="mt-6 bg-base-200/60 p-3 rounded-xl border border-base-200 text-xs">
            <p className="font-semibold text-neutral mb-2">Akun Uji Coba Quick Login:</p>
            <div className="flex flex-col gap-1 text-[11px] font-mono">
              <button 
                onClick={() => { setEmail('dokter@patriot.com'); setPassword('password'); }} 
                className="text-left text-primary hover:underline"
              >
                🏥 Dokter: dokter@patriot.com (password)
              </button>
              <button 
                onClick={() => { setEmail('peserta@patriot.com'); setPassword('password'); }} 
                className="text-left text-secondary hover:underline"
              >
                👤 Peserta: peserta@patriot.com (password)
              </button>
              <button 
                onClick={() => { setEmail('admin@patriot.com'); setPassword('password'); }} 
                className="text-left text-neutral hover:underline"
              >
                ⚙️ Admin: admin@patriot.com (password)
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <span className="text-sm text-neutral-500">Belum punya akun? </span>
            <a 
              onClick={() => navigate('/register')} 
              className="text-sm text-primary font-bold hover:underline cursor-pointer"
            >
              Daftar Sekarang
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
