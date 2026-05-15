import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Transaction } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

// ── Formulaire ────────────────────────────────────────────────────────────────

interface FormData {
  date: string;
  description: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: string;
}

function emptyForm(selectedMonth: string): FormData {
  const today = new Date();
  const date = today.toISOString().slice(0, 7) === selectedMonth
    ? today.toISOString().slice(0, 10)
    : `${selectedMonth}-01`;
  return { date, description: '', categoryId: '', type: 'expense', amount: '' };
}

interface ModalProps {
  initial?: Transaction;
  selectedMonth: string;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}

function TransactionModal({ initial, selectedMonth, onClose, onSave }: ModalProps) {
  const { categories } = useApp();
  const [form, setForm] = useState<FormData>(
    initial
      ? { date: initial.date, description: initial.description, categoryId: initial.categoryId, type: initial.type, amount: String(initial.amount) }
      : emptyForm(selectedMonth),
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const filteredCats = categories.filter((c) => c.type === form.type || c.type === 'both');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { setErr('Ajoutez une description'); return; }
    if (!form.categoryId) { setErr('Choisissez une catégorie'); return; }
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setErr('Montant invalide');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onSave(form);
      onClose();
    } catch {
      setErr('Erreur lors de la sauvegarde');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800">{initial ? 'Modifier' : 'Ajouter'} une transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(['expense', 'income'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type, categoryId: '' })}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${form.type === type ? (type === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {type === 'expense' ? '💸 Dépense' : '💰 Revenu'}
              </button>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Courses Lidl"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            >
              <option value="">Choisir…</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Montant */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Montant (€)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0,00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {err && <p className="text-red-500 text-xs">{err}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsPage() {
  const { transactions, categories, selectedMonth, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const monthTxns = useMemo(
    () => transactions
      .filter((t) => t.date.startsWith(selectedMonth) && (filter === 'all' || t.type === filter))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth, filter],
  );

  const handleSave = async (data: FormData) => {
    const payload = {
      date: data.date,
      description: data.description.trim(),
      categoryId: data.categoryId,
      type: data.type,
      amount: parseFloat(data.amount),
    };
    if (editing) {
      await updateTransaction({ ...editing, ...payload });
    } else {
      await addTransaction(payload);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteTransaction(id);
    } finally {
      setDeleting(null);
    }
  };

  const totalIncome = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Transactions</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 font-medium">Revenus</div>
          <div className="text-lg font-bold text-green-700">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-xs text-red-600 font-medium">Dépenses</div>
          <div className="text-lg font-bold text-red-700">{fmt(totalExpense)}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 font-medium">Solde</div>
          <div className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
            {fmt(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['all', 'expense', 'income'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'Tout' : f === 'expense' ? '💸 Dépenses' : '💰 Revenus'}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {monthTxns.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Aucune transaction ce mois-ci</p>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="mt-3 text-green-600 text-sm hover:underline"
            >
              Ajouter la première transaction
            </button>
          </div>
        ) : (
          <ul>
            {monthTxns.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ background: (cat?.color ?? '#6b7280') + '20' }}
                  >
                    {cat?.icon ?? '•'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{t.description}</div>
                    <div className="text-xs text-gray-400">
                      {format(parseISO(t.date), 'EEEE d MMMM', { locale: fr })} · {cat?.name}
                    </div>
                  </div>
                  <span className={`font-bold text-sm shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(t); setShowModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === t.id
                        ? <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-red-400 rounded-full animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showModal && (
        <TransactionModal
          initial={editing ?? undefined}
          selectedMonth={selectedMonth}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
