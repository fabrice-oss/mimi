import { useMemo } from 'react';
import { format, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// Tip de l'assistante Mimi
function getMimiTip(income: number, expense: number, prevExpense: number): string {
  if (income === 0 && expense === 0)
    return "Bienvenue ! Commence par ajouter tes revenus et dépenses du mois. Je suis là pour t'accompagner 🌸";
  if (expense === 0)
    return `Super début de mois ! Tu as enregistré ${fmt(income)} de revenus. Pense à noter tes dépenses au fur et à mesure 💕`;
  const saving = income - expense;
  const ratio = income > 0 ? (expense / income) * 100 : 0;
  if (prevExpense > 0 && expense < prevExpense)
    return `Tu as dépensé ${fmt(prevExpense - expense)} de moins que le mois dernier. Bravo, tu te rapproches de tes objectifs ! 🎉`;
  if (saving > 0 && ratio < 70)
    return `Excellente gestion ! Tu mets de côté ${fmt(saving)} ce mois-ci. Continue comme ça, tu es sur la bonne voie ✨`;
  if (ratio > 90)
    return `Attention, tes dépenses représentent ${ratio.toFixed(0)}% de tes revenus. Essaie de trouver de petites économies dans le shopping ou les loisirs 💪`;
  return `Tu gères bien ton budget ! Reste à vivre : ${fmt(saving)}. Pense à mettre un peu de côté pour tes objectifs 🌷`;
}

export default function DashboardPage() {
  const { transactions, categories, budgets, selectedMonth } = useApp();
  const navigate = useNavigate();

  const monthTxns = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth],
  );

  const totalIncome  = useMemo(() => monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const totalExpense = useMemo(() => monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const balance = totalIncome - totalExpense;

  const prevMonth = format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM');
  const prevExpense = useMemo(
    () => transactions.filter((t) => t.date.startsWith(prevMonth) && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions, prevMonth],
  );

  // Épargne = solde positif
  const saving = Math.max(balance, 0);
  const savingRate = totalIncome > 0 ? (saving / totalIncome) * 100 : 0;

  // Données graphique 6 mois
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM', { locale: fr });
      const txns = transactions.filter((t) => t.date.startsWith(key));
      return {
        label,
        revenus:  txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        dépenses: txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  // Camembert
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ name: categories.find((c) => c.id === id)?.name ?? id, value: v, color: categories.find((c) => c.id === id)?.color ?? '#FFB3C6', icon: categories.find((c) => c.id === id)?.icon ?? '•' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [monthTxns, categories]);

  // Budget vs réel
  const budgetRows = useMemo(() => {
    return budgets.filter((b) => b.monthYear === selectedMonth).map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = monthTxns.filter((t) => t.type === 'expense' && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
      return { ...b, cat, spent, pct: b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0, over: spent > b.amount };
    });
  }, [budgets, selectedMonth, monthTxns, categories]);

  const monthLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr });
  const mimiTip = getMimiTip(totalIncome, totalExpense, prevExpense);

  return (
    <div className="space-y-4 animate-fade-in pb-4">

      {/* ── Assistante Mimi ─── */}
      <div className="glass-card p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(255,214,231,0.4), rgba(243,232,255,0.35))', borderRadius: '1.5rem' }}>
        <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-lg"
          style={{ background: 'linear-gradient(135deg,#FFB3C6,#FF6B8E)', boxShadow: '0 4px 12px rgba(255,107,142,0.3)' }}>
          ✨
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold" style={{ color: '#FF6B8E' }}>Assistante Mimi</span>
            <Sparkles size={11} style={{ color: '#FF8FAB' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#6b3a50' }}>{mimiTip}</p>
        </div>
      </div>

      {/* ── KPI cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Revenus', value: fmt(totalIncome),  icon: TrendingUp,   gradient: 'linear-gradient(135deg,#d1fae5,#6ee7b7)', iconColor: '#059669', textColor: '#065f46' },
          { label: 'Dépenses', value: fmt(totalExpense), icon: TrendingDown,  gradient: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', iconColor: '#db2777', textColor: '#831843' },
          { label: 'Solde',    value: fmt(balance),      icon: Wallet,        gradient: balance >= 0 ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)' : 'linear-gradient(135deg,#ffedd5,#fed7aa)', iconColor: balance >= 0 ? '#2563eb' : '#ea580c', textColor: balance >= 0 ? '#1e3a8a' : '#7c2d12' },
          { label: 'Épargne',  value: fmt(saving),       icon: '🐷',          gradient: 'linear-gradient(135deg,#fef9c3,#fde68a)', iconColor: '#b45309', textColor: '#78350f' },
          { label: 'Reste à vivre', value: fmt(balance), icon: '🌸',          gradient: 'linear-gradient(135deg,#fce7f3,#f3e8ff)', iconColor: '#9333ea', textColor: '#581c87' },
        ].map((k) => (
          <div key={k.label} className="glass-card p-4">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: k.gradient }}>
              {typeof k.icon === 'string'
                ? <span className="text-lg">{k.icon}</span>
                : <k.icon size={16} style={{ color: k.iconColor }} />}
            </div>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#b89aaa' }}>{k.label}</div>
            <div className="text-lg font-bold" style={{ color: k.textColor }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Graphiques ─── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Évolution 6 mois */}
        <div className="glass-card-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#3d1c2e' }}>Évolution sur 6 mois</h2>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#b89aaa' }}>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#4ade80' }} />Revenus</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#ff8fab' }} />Dépenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDepense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff8fab" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff8fab" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,143,171,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#c9a0b0' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#c9a0b0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,179,198,0.4)', borderRadius: '1rem', fontSize: 12 }}
                formatter={(v: number) => fmt(v)}
              />
              <Area type="monotone" dataKey="revenus"  stroke="#4ade80" strokeWidth={2.5} fill="url(#gradRevenu)"  dot={false} />
              <Area type="monotone" dataKey="dépenses" stroke="#ff8fab" strokeWidth={2.5} fill="url(#gradDepense)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Camembert */}
        <div className="glass-card-lg p-5">
          <h2 className="font-bold text-base mb-4" style={{ color: '#3d1c2e' }}>Répartition</h2>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <span className="text-4xl mb-2">🌸</span>
              <p className="text-sm" style={{ color: '#b89aaa' }}>Aucune dépense ce mois</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '1rem', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 mt-2">
                {pieData.slice(0, 4).map((e) => (
                  <li key={e.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span style={{ color: '#6b3a50' }}>{e.icon} {e.name}</span>
                    </span>
                    <span className="font-semibold" style={{ color: '#4a3040' }}>{fmt(e.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── Taux d'épargne + Budget ─── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Taux d'épargne */}
        <div className="glass-card-lg p-5">
          <h2 className="font-bold text-base mb-4" style={{ color: '#3d1c2e' }}>Taux d'épargne du mois</h2>
          <div className="flex items-end gap-3 mb-4">
            <div className="text-4xl font-extrabold" style={{ color: '#FF4D6D' }}>{savingRate.toFixed(0)}%</div>
            <div className="text-sm pb-1" style={{ color: '#b89aaa' }}>de tes revenus épargnés</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${savingRate}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: '#c9a0b0' }}>
            <span>Objectif recommandé : 20%</span>
            <span>{fmt(saving)} épargnés</span>
          </div>
        </div>

        {/* Budget vs réel */}
        <div className="glass-card-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#3d1c2e' }}>Budget vs Réel</h2>
            <button onClick={() => navigate('/budget')} className="btn-glass text-xs px-3 py-1.5 flex items-center gap-1">
              Gérer <ArrowRight size={12} />
            </button>
          </div>
          {budgetRows.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm mb-3" style={{ color: '#b89aaa' }}>Aucun budget défini ce mois-ci</p>
              <button onClick={() => navigate('/budget')} className="btn-primary text-sm px-4 py-2">
                Définir mes budgets
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetRows.slice(0, 4).map((b) => (
                <div key={b.id}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span style={{ color: '#6b3a50' }}>{b.cat?.icon} {b.cat?.name}</span>
                    <span className={`font-semibold ${b.over ? 'text-red-500' : ''}`} style={b.over ? {} : { color: '#4a3040' }}>
                      {fmt(b.spent)} / {fmt(b.amount)}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${b.pct}%`, background: b.over ? 'linear-gradient(90deg,#fca5a5,#ef4444)' : undefined }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dernières transactions + Actions rapides ─── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Transactions récentes */}
        <div className="glass-card-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#3d1c2e' }}>Dernières transactions</h2>
            <button onClick={() => navigate('/transactions')} className="btn-glass text-xs px-3 py-1.5 flex items-center gap-1">
              Tout voir <ArrowRight size={12} />
            </button>
          </div>
          {monthTxns.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">💸</span>
              <p className="text-sm mt-3" style={{ color: '#b89aaa' }}>Aucune transaction ce mois-ci</p>
              <button onClick={() => navigate('/transactions')} className="btn-primary mt-3 text-sm px-4 py-2">
                Ajouter une transaction
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {[...monthTxns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                return (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors"
                    style={{ background: 'rgba(255,255,255,0.35)' }}>
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: (cat?.color ?? '#FFB3C6') + '25' }}>
                      {cat?.icon ?? '•'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#4a3040' }}>{t.description}</div>
                      <div className="text-xs" style={{ color: '#c9a0b0' }}>
                        {format(parseISO(t.date), 'd MMM', { locale: fr })} · {cat?.name}
                      </div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-500' : ''}`}
                      style={t.type === 'expense' ? { color: '#FF6B8E' } : {}}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="glass-card-lg p-5">
          <h2 className="font-bold text-base mb-4" style={{ color: '#3d1c2e' }}>Actions rapides</h2>
          <div className="space-y-2.5">
            {[
              { emoji: '💸', label: 'Ajouter une dépense',  to: '/transactions', color: '#FF8FAB' },
              { emoji: '💰', label: 'Ajouter un revenu',    to: '/transactions', color: '#4ade80' },
              { emoji: '🧾', label: 'Payer une facture',    to: '/factures',     color: '#f59e0b' },
              { emoji: '🎯', label: 'Voir mes objectifs',   to: '/objectifs',    color: '#c084fc' },
              { emoji: '📊', label: 'Générer un rapport',   to: '/rapports',     color: '#60a5fa' },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.to)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all"
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.65)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: a.color + '20' }}>
                  {a.emoji}
                </span>
                <span className="text-sm font-medium" style={{ color: '#4a3040' }}>{a.label}</span>
                <ArrowRight size={13} className="ml-auto opacity-40" style={{ color: a.color }} />
              </button>
            ))}
          </div>

          {/* Mini objectif */}
          <div className="mt-4 p-3 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(255,179,198,0.2),rgba(212,170,255,0.15))', border: '1px solid rgba(255,179,198,0.3)' }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold" style={{ color: '#FF6B8E' }}>🏖️ Objectif Vacances</span>
              <span style={{ color: '#b89aaa' }}>67%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '67%' }} />
            </div>
            <div className="text-xs mt-1.5 flex justify-between" style={{ color: '#c9a0b0' }}>
              <span>1 340 € / 2 000 €</span>
              <button onClick={() => navigate('/objectifs')} className="text-xs font-medium" style={{ color: '#FF6B8E' }}>Voir →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
