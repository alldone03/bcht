import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ShieldCheck, HeartHandshake, ArrowRight, BrainCircuit, Sparkles, MessageCircleHeart } from 'lucide-react';
import patriotLogo from '../assets/Patriot Logo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-12 md:gap-8 items-center">



            {/* Left Content */}
            <div className="sm:text-center md:max-w-2xl md:mx-auto md:col-span-6 md:text-left order-1 md:order-2 bg-base-100/10 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-base-200">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Teknologi Deteksi Dini Kesehatan</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight leading-none text-neutral mb-6">
                Pantau <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Kesehatan
                </span> Anda
              </h1>
              <p className="text-base md:text-lg text-neutral-500 mb-8 leading-relaxed">
                Patriot ITS memfasilitasi deteksi dini kesehatan klinis menggunakan sistem screening valid, dipantau langsung oleh dokter ahli, serta didukung chatbot pintar AI yang siap mendampingi Anda 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/register')}
                  className="btn btn-primary btn-lg shadow-lg shadow-primary/30 group px-8"
                >
                  Mulai Screening Sekarang
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-outline btn-lg"
                >
                  Masuk Akun
                </button>
              </div>
            </div>

            {/* Left Graphic Panel (Logo) */}
            <div className="mt-16 md:mt-0 md:col-span-6 flex justify-center order-2 md:order-1">
              <div className="relative w-full max-w-md flex justify-center items-center">
                {/* Decorative gradients */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 right-4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

                <img 
                  src={patriotLogo} 
                  alt="Patriot Logo" 
                  className="relative w-full max-w-[380px] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105" 
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="py-20 bg-base-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-neutral">Mengapa Patriot ITS?</h2>
            <p className="text-neutral-500 mt-4">Solusi kesehatan digital terpadu untuk kesejahteraan Anda.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="card-body">
                <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-4">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="card-title font-heading">Screening Tervalidasi</h3>
                <p className="text-sm text-neutral-500">Pertanyaan dan metode penilaian terstandarisasi medis yang dibuat langsung oleh dokter profesional.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="card-body">
                <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="card-title font-heading">Ulasan Dokter Ahli</h3>
                <p className="text-sm text-neutral-500">Setiap hasil diagnosis screening Anda akan divalidasi langsung oleh dokter terdaftar dengan resep/rekomendasi.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="card-body">
                <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-4">
                  <MessageCircleHeart className="w-6 h-6" />
                </div>
                <h3 className="card-title font-heading">Konsultasi AI Chatbot</h3>
                <p className="text-sm text-neutral-500">Pendampingan AI interaktif yang mengingat histori kondisi medis Anda untuk kenyamanan ekstra.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
