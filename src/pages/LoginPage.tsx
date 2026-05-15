import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function LoginPage() {
  const { login, user, loading, error } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">💰</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mimi Comptabilité</h1>
        <p className="text-gray-500 mb-8">
          Gérez vos finances personnelles simplement. Vos données sont stockées dans votre Google Drive, en toute sécurité.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 mb-6">
            {[
              { icon: '📊', label: 'Tableau de bord' },
              { icon: '💳', label: 'Transactions' },
              { icon: '🎯', label: 'Budgets' },
            ].map((f) => (
              <div key={f.label} className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="font-medium text-xs">{f.label}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-2">
              {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 rounded-xl py-3 px-6 font-semibold text-gray-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.1c-.6 3-2.4 5.5-5 7.2v6h8c4.7-4.3 7.4-10.7 7.4-17.2z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8-6c-2.1 1.4-4.8 2.2-7.9 2.2-6.1 0-11.2-4.1-13-9.6H2.7v6.2C6.7 42.9 14.8 48 24 48z"/>
                <path fill="#FBBC05" d="M11 28.8c-.5-1.4-.7-2.8-.7-4.3s.3-3 .7-4.3v-6.2H2.7C1 17.4 0 20.6 0 24s1 6.6 2.7 9.5l8.3-4.7z"/>
                <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.5 0 24 0 14.8 0 6.7 5.1 2.7 12.5l8.3 4.7c1.8-5.5 6.9-7.7 13-7.7z"/>
              </svg>
            )}
            {loading ? 'Connexion en cours…' : 'Se connecter avec Google'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Vos données sont uniquement stockées dans votre Google Drive. Aucune donnée n'est partagée avec des tiers.
        </p>
      </div>
    </div>
  );
}
