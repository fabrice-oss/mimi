import { useState, useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

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

  const usedCategoryIds = useMemo(() => new Set(monthBudgets.map((b) => b.categoryId)), [monthBudgets]);

  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense' && !usedCategoryIds.has(c.id)),
    [categories, usedCategoryIds],
  );

  const monthLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr });

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = useMemo(() => {
    return monthBudgets.reduce((s, b) => {
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(selectedMonth))
        .reduce((ss, t) => ss + t.amount, 0);
      return s + spent;
    }, 0);
  }, [monthBudgets, transactions, selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setErr('Choisissez une catégorie'); return; }
    if (!amount || parseFloat(amount) <= 0) { setErr('Montant invalide'); return; }
    setSaving(true);
    setErr('');
    try {
      await saveBudget({ monthYear: selectedMonth, categoryId, amount: parseFloat(amount) });
      setCategoryId('');
      setAmount('');
      setShowForm(false);
    } catch {
      setErr('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteBudget(id); } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 capitalize">Budget · {monthLabel}</h1>
        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Ajouter un budget
          </button>
        )}
      </div>

      {/* Résumé global */}
      {monthBudgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Total budgeté</span>
            <span className="font-bold text-gray-800">{fmt(totalBudget)}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">Dépensé</span>
            <span className={`font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
              {fmt(totalSpent)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-right">
            {fmt(Math.max(totalBudget - totalSpent, 0))} restant
          </div>
        </div>
      )}

      {/* Formulaire ajout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-semibold text-gray-700">Nouveau budget</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              >
                <option value="">Choisir…</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Montant (€)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
          {err && <p className="text-red-500 text-xs">{err}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? 'Sauvegarde…' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des budgets */}
      {monthBudgets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          <div className="text-5xl mb-3">🎯</div>
          <p className="font-medium">Aucun budget défini pour ce mois</p>
          <p className="text-sm mt-1">Ajoutez des budgets par catégorie pour suivre vos dépenses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthBudgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = transactions
              .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(selectedMonth))
              .reduce((s, t) => s + t.amount, 0);
            const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
            const over = spent > b.amount;
            const remaining = b.amount - spent;

            return (
              <div key={b.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                    style={{ background: (cat?.color ?? '#6b7280') + '20' }}
                  >
                    {cat?.icon ?? '•'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{cat?.name ?? b.categoryId}</div>
                    <div className="text-xs text-gray-400">
                      {fmt(spent)} dépensé sur {fmt(b.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${over ? 'text-red-600' : 'text-gray-700'}`}>
                      {over ? `Dépassé de ${fmt(Math.abs(remaining))}` : `${fmt(remaining)} restant`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deleting === b.id}
                    className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors ml-2"
                  >
                    {deleting === b.id
                      ? <span className="inline-block w-3.5 h-3.5 border-2 border-gray-200 border-t-red-400 rounded-full animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{pct.toFixed(0)}% utilisé</span>
                  <span>Budget : {fmt(b.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
