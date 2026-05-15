import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, TrendingUp, Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const FEATURES = [
  { icon: '💳', title: 'Dépenses & Revenus', desc: 'Suivi en temps réel de chaque centime' },
  { icon: '🎯', title: 'Budgets malins',     desc: 'Des objectifs doux et atteignables' },
  { icon: '🌸', title: 'Assistante Mimi',    desc: 'Des conseils bienveillants chaque jour' },
  { icon: '📊', title: 'Rapports clairs',    desc: 'Visualise ton évolution en un coup d\'œil' },
];

export default function LoginPage() {
  const { login, user, loading, error } = useApp();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #FFE4EE 30%, #F8F0FF 60%, #FFF0F3 100%)' }}>

      {/* Orbes animées */}
      <div className="orb w-[500px] h-[500px] bg-blush-200/60 -top-32 -left-32 animate-float" />
      <div className="orb w-96 h-96 bg-petal-200/50 -bottom-24 -right-24 animate-float-slow" />
      <div className="orb w-64 h-64 bg-gold-100/60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float-fast" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-2 gap-12 items-center">

        {/* ── Colonne gauche ─── */}
        <div className="animate-slide-up space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg,#FFB3C6,#FF4D6D)', boxShadow: '0 8px 24px rgba(255,77,109,0.4)' }}>
              🌸
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#FF4D6D' }}>Mimi Compta</h1>
              <p className="text-sm" style={{ color: '#c9a0b0' }}>Ton budget devient doux, clair et simple.</p>
            </div>
          </div>

          {/* Headline */}
          <div>
            <h2 className="text-4xl font-extrabold leading-tight mb-3" style={{ color: '#3d1c2e' }}>
              Tes finances,{' '}
              <span style={{ background: 'linear-gradient(135deg,#FF8FAB,#FF4D6D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                enfin simples
              </span>
              {' '}et belles 🌷
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#9d7b8a' }}>
              Suis tes dépenses, atteins tes objectifs et reçois des conseils bienveillants — tout en rose, tout en douceur.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-semibold text-sm mb-0.5" style={{ color: '#4a3040' }}>{f.title}</div>
                <div className="text-xs" style={{ color: '#b89aaa' }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Garanties */}
          <div className="flex items-center gap-5 text-xs" style={{ color: '#b89aaa' }}>
            {[
              { icon: ShieldCheck, label: 'Données dans ton Google Drive' },
              { icon: Heart,        label: 'Aucun partage tiers' },
              { icon: TrendingUp,   label: '100% gratuit' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={13} style={{ color: '#FF8FAB' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite — Carte de connexion ─── */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="glass-card-lg p-8 text-center space-y-6">

            {/* Avatar déco */}
            <div className="relative mx-auto w-24 h-24">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg,#FFE4EE,#FFB3C6)', boxShadow: '0 12px 40px rgba(255,143,171,0.3)' }}>
                🌸
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full glass flex items-center justify-center">
                <Sparkles size={14} style={{ color: '#FF6B8E' }} />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1.5" style={{ color: '#3d1c2e' }}>Bienvenue ✨</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#b89aaa' }}>
                Connecte-toi avec Google pour accéder à ton espace personnel. Tes données restent dans <strong>ton</strong> Google Drive.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl p-3 text-sm"
                style={{ background: 'rgba(252,165,165,0.2)', border: '1px solid rgba(252,165,165,0.4)', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button onClick={login} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4">
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#fff" fillOpacity=".9" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.1c-.6 3-2.4 5.5-5 7.2v6h8c4.7-4.3 7.4-10.7 7.4-17.2z"/>
                  <path fill="#fff" fillOpacity=".75" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8-6c-2.1 1.4-4.8 2.2-7.9 2.2-6.1 0-11.2-4.1-13-9.6H2.7v6.2C6.7 42.9 14.8 48 24 48z"/>
                  <path fill="#fff" fillOpacity=".6" d="M11 28.8c-.5-1.4-.7-2.8-.7-4.3s.3-3 .7-4.3v-6.2H2.7C1 17.4 0 20.6 0 24s1 6.6 2.7 9.5l8.3-4.7z"/>
                  <path fill="#fff" fillOpacity=".85" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.5 0 24 0 14.8 0 6.7 5.1 2.7 12.5l8.3 4.7c1.8-5.5 6.9-7.7 13-7.7z"/>
                </svg>
              )}
              {loading ? 'Connexion…' : 'Continuer avec Google'}
            </button>

            {/* Astro message */}
            <div className="rounded-2xl p-4 text-left"
              style={{ background: 'linear-gradient(135deg,rgba(255,214,231,0.3),rgba(243,232,255,0.3))', border: '1px solid rgba(255,179,198,0.3)' }}>
              <div className="flex gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: '#FF6B8E' }}>Assistante Mimi</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#9d7b8a' }}>
                    "Prête à t'aider à atteindre tes objectifs financiers avec douceur et bienveillance 🌸"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
