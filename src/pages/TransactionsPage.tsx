import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, X, Check, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Transaction } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// ── Modal ─────────────────────────────────────────────────────────────────────

interface FormData { date: string; description: string; categoryId: string; type: 'income' | 'expense'; amount: string; }

function emptyForm(selectedMonth: string): FormData {
  const today = new Date();
  const date = today.toISOString().slice(0, 7) === selectedMonth
    ? today.toISOString().slice(0, 10) : `${selectedMonth}-01`;
  return { date, description: '', categoryId: '', type: 'expense', amount: '' };
}

function Modal({ initial, selectedMonth, onClose, onSave }: { initial?: Transaction; selectedMonth: string; onClose: () => void; onSave: (d: FormData) => Promise<void>; }) {
  const { categories } = useApp();
  const [form, setForm] = useState<FormData>(
    initial ? { date: initial.date, description: initial.description, categoryId: initial.categoryId, type: initial.type, amount: String(initial.amount) }
            : emptyForm(selectedMonth),
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const cats = categories.filter((c) => c.type === form.type || c.type === 'both');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { setErr('Ajoute une description'); return; }
    if (!form.categoryId) { setErr('Choisis une catégorie'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setErr('Montant invalide'); return; }
    setSaving(true); setErr('');
    try { await onSave(form); onClose(); } catch { setErr('Erreur lors de la sauvegarde'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,46,0.3)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card-lg w-full max-w-md animate-slide-up" style={{ borderRadius: '2rem' }}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-bold text-lg" style={{ color: '#3d1c2e' }}>
            {initial ? '✏️ Modifier' : '✨ Nouvelle transaction'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center transition-colors hover:bg-red-50" style={{ color: '#b89aaa' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-2xl overflow-hidden p-1" style={{ background: 'rgba(255,179,198,0.15)' }}>
            {(['expense', 'income'] as const).map((type) => (
              <button key={type} type="button"
                onClick={() => setForm({ ...form, type, categoryId: '' })}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all"
                style={form.type === type
                  ? { background: type === 'expense' ? 'linear-gradient(135deg,#FFB3C6,#FF6B8E)' : 'linear-gradient(135deg,#bbf7d0,#4ade80)', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                  : { color: '#b89aaa' }}>
                {type === 'expense' ? '💸 Dépense' : '💰 Revenu'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-glass" required />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Montant (€)</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="input-glass" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex : Courses Lidl…" className="input-glass" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Catégorie</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-glass" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <option value="">Choisir…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {err && <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{err}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
            {saving ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Check size={15} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'income' | 'expense';

export default function TransactionsPage() {
  const { transactions, categories, selectedMonth, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const monthTxns = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth) && (filter === 'all' || t.type === filter))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth, filter],
  );

  const income  = useMemo(() => transactions.filter((t) => t.date.startsWith(selectedMonth) && t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions, selectedMonth]);
  const expense = useMemo(() => transactions.filter((t) => t.date.startsWith(selectedMonth) && t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions, selectedMonth]);

  const handleSave = async (d: FormData) => {
    const p = { date: d.date, description: d.description.trim(), categoryId: d.categoryId, type: d.type, amount: parseFloat(d.amount) };
    if (editing) await updateTransaction({ ...editing, ...p }); else await addTransaction(p);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteTransaction(id); } finally { setDeleting(null); }
  };

  // Regroupement par date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof monthTxns>();
    monthTxns.forEach((t) => {
      const k = t.date;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return Array.from(map.entries());
  }, [monthTxns]);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#3d1c2e' }}>Dépenses & Revenus</h1>
          <p className="text-sm" style={{ color: '#b89aaa' }}>{format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr })}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Revenus',  value: fmt(income),           icon: TrendingUp,   bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46' },
          { label: 'Dépenses', value: fmt(expense),          icon: TrendingDown,  bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#831843' },
          { label: 'Solde',    value: fmt(income - expense),  icon: Wallet,        bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#4c1d95' },
        ].map((k) => (
          <div key={k.label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
              <k.icon size={17} style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: '#b89aaa' }}>{k.label}</div>
              <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['all', 'expense', 'income'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
            style={filter === f
              ? { background: 'linear-gradient(135deg,#FFB3C6,#FF6B8E)', color: 'white', boxShadow: '0 4px 12px rgba(255,107,142,0.3)' }
              : { background: 'rgba(255,255,255,0.5)', color: '#b89aaa', border: '1px solid rgba(255,255,255,0.6)' }}>
            {f === 'all' ? '✨ Tout' : f === 'expense' ? '💸 Dépenses' : '💰 Revenus'}
          </button>
        ))}
      </div>

      {/* Liste groupée par date */}
      {grouped.length === 0 ? (
        <div className="glass-card-lg p-12 text-center">
          <div className="text-5xl mb-4">🌸</div>
          <p className="font-semibold mb-1" style={{ color: '#3d1c2e' }}>Aucune transaction</p>
          <p className="text-sm mb-4" style={{ color: '#b89aaa' }}>Commence à enregistrer tes dépenses et revenus du mois.</p>
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary text-sm px-5 py-2.5">
            Ajouter la première transaction
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txns]) => (
            <div key={date}>
              <div className="text-xs font-semibold mb-2 capitalize px-1" style={{ color: '#c9a0b0' }}>
                {format(parseISO(date), 'EEEE d MMMM', { locale: fr })}
              </div>
              <div className="glass-card-lg overflow-hidden" style={{ borderRadius: '1.5rem' }}>
                {txns.map((t, i) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  return (
                    <div key={t.id}
                      className="flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-white/30"
                      style={{ borderBottom: i < txns.length - 1 ? '1px solid rgba(255,179,198,0.15)' : 'none' }}>
                      <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: (cat?.color ?? '#FFB3C6') + '25' }}>
                        {cat?.icon ?? '•'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: '#3d1c2e' }}>{t.description}</div>
                        <div className="text-xs" style={{ color: '#c9a0b0' }}>{cat?.name}</div>
                      </div>
                      <span className="text-sm font-bold shrink-0"
                        style={{ color: t.type === 'income' ? '#16a34a' : '#FF4D6D' }}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(t); setShowModal(true); }}
                          className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-blue-50"
                          style={{ color: '#93c5fd' }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                          className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-50"
                          style={{ color: '#fca5a5' }}>
                          {deleting === t.id
                            ? <span className="w-3 h-3 rounded-full border-2 border-red-200 border-t-red-400 animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal initial={editing ?? undefined} selectedMonth={selectedMonth}
          onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
