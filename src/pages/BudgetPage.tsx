import { useState, useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, Target } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export default function BudgetPage() {
  const { budgets, categories, transactions, selectedMonth, saveBudget, deleteBudget } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.monthYear === selectedMonth),
    [budgets, selectedMonth],
  );

  const usedCatIds = useMemo(() => new Set(monthBudgets.map((b) => b.categoryId)), [monthBudgets]);
  const availableCats = useMemo(() => categories.filter((c) => c.type === 'expense' && !usedCatIds.has(c.id)), [categories, usedCatIds]);

  const rows = useMemo(() => monthBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = transactions.filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(selectedMonth)).reduce((s, t) => s + t.amount, 0);
    const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
    return { ...b, cat, spent, pct, over: spent > b.amount, remaining: b.amount - spent };
  }), [monthBudgets, categories, transactions, selectedMonth]);

  const totalBudget = rows.reduce((s, r) => s + r.amount, 0);
  const totalSpent  = rows.reduce((s, r) => s + r.spent, 0);
  const globalPct   = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const monthLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setErr('Choisis une catégorie'); return; }
    if (!amount || parseFloat(amount) <= 0) { setErr('Montant invalide'); return; }
    setSaving(true); setErr('');
    try {
      await saveBudget({ monthYear: selectedMonth, categoryId, amount: parseFloat(amount) });
      setCategoryId(''); setAmount(''); setShowForm(false);
    } catch { setErr('Erreur lors de la sauvegarde'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteBudget(id); } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#3d1c2e' }}>Budget</h1>
          <p className="text-sm capitalize" style={{ color: '#b89aaa' }}>{monthLabel}</p>
        </div>
        {availableCats.length > 0 && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus size={15} /> Nouveau budget
          </button>
        )}
      </div>

      {/* Vue globale */}
      {rows.length > 0 && (
        <div className="glass-card-lg p-6" style={{ background: 'linear-gradient(135deg,rgba(255,214,231,0.35),rgba(243,232,255,0.3))' }}>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg,#FFB3C6,#FF6B8E)', boxShadow: '0 6px 20px rgba(255,107,142,0.35)' }}>
              🎯
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: '#b89aaa' }}>Budget total du mois</div>
              <div className="text-2xl font-extrabold" style={{ color: '#3d1c2e' }}>{fmt(totalBudget)}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm font-medium" style={{ color: '#b89aaa' }}>Dépensé</div>
              <div className="text-xl font-bold" style={{ color: totalSpent > totalBudget ? '#ef4444' : '#16a34a' }}>{fmt(totalSpent)}</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill" style={{ width: `${globalPct}%`, background: totalSpent > totalBudget ? 'linear-gradient(90deg,#fca5a5,#ef4444)' : undefined }} />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: '#c9a0b0' }}>
            <span>{globalPct.toFixed(0)}% utilisé</span>
            <span>{fmt(Math.max(totalBudget - totalSpent, 0))} restant</span>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="glass-card-lg p-5 animate-slide-up">
          <h3 className="font-bold mb-4" style={{ color: '#3d1c2e' }}>✨ Nouveau budget</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Catégorie</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-glass" style={{ background: 'rgba(255,255,255,0.6)' }}>
                  <option value="">Choisir…</option>
                  {availableCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Montant (€)</label>
                <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="input-glass" />
              </div>
            </div>
            {err && <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{err}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                {saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Plus size={14} />}
                {saving ? 'Ajout…' : 'Ajouter'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-glass text-sm px-4 py-2">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Cartes budgets */}
      {rows.length === 0 ? (
        <div className="glass-card-lg p-14 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#FFE4EE,#FFB3C6)' }}>
            <Target size={32} style={{ color: '#FF6B8E' }} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#3d1c2e' }}>Aucun budget pour ce mois</h3>
          <p className="text-sm mb-4" style={{ color: '#b89aaa' }}>Définir des budgets par catégorie t'aide à garder le contrôle de tes dépenses.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-2.5">
            Créer mon premier budget 🌸
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="glass-card p-5 group">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: (r.cat?.color ?? '#FFB3C6') + '22' }}>
                  {r.cat?.icon ?? '•'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: '#3d1c2e' }}>{r.cat?.name ?? r.categoryId}</div>
                  <div className="text-xs" style={{ color: '#c9a0b0' }}>
                    {fmt(r.spent)} dépensé sur {fmt(r.amount)}
                  </div>
                </div>
                <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                  className="w-7 h-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 disabled:opacity-50"
                  style={{ color: '#fca5a5' }}>
                  {deleting === r.id
                    ? <span className="w-3 h-3 rounded-full border border-red-300 border-t-red-500 animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              </div>

              <div className="progress-bar mb-2">
                <div className="progress-fill"
                  style={{ width: `${r.pct}%`, background: r.over ? 'linear-gradient(90deg,#fca5a5,#ef4444)' : r.pct > 80 ? 'linear-gradient(90deg,#fcd34d,#f59e0b)' : undefined }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#c9a0b0' }}>{r.pct.toFixed(0)}% utilisé</span>
                <span className={`text-xs font-bold ${r.over ? 'text-red-500' : ''}`}
                  style={r.over ? {} : { color: '#16a34a' }}>
                  {r.over ? `⚠️ Dépassé de ${fmt(Math.abs(r.remaining))}` : `${fmt(r.remaining)} restant`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
