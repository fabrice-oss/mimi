import { useState, useEffect } from 'react';
import { Plus, X, Check, AlertCircle, Clock, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

type BillStatus = 'paid' | 'upcoming' | 'late';
type BillFrequency = 'monthly' | 'quarterly' | 'annual' | 'once';

interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDay: number; // jour du mois
  status: BillStatus;
  frequency: BillFrequency;
  icon: string;
  color: string;
}

const CATEGORIES = [
  { value: 'logement',     label: 'Logement',     icon: '🏠', color: '#fbbf24' },
  { value: 'energie',      label: 'Énergie',       icon: '⚡', color: '#f59e0b' },
  { value: 'internet',     label: 'Internet/Tél',  icon: '📡', color: '#3b82f6' },
  { value: 'assurance',    label: 'Assurance',     icon: '🛡️', color: '#8b5cf6' },
  { value: 'streaming',    label: 'Streaming',     icon: '🎬', color: '#ec4899' },
  { value: 'sante',        label: 'Santé',         icon: '💊', color: '#10b981' },
  { value: 'abonnement',   label: 'Abonnement',    icon: '📱', color: '#06b6d4' },
  { value: 'autre',        label: 'Autre',         icon: '📋', color: '#6b7280' },
];

const DEFAULT_BILLS: Bill[] = [];

const STATUS_CONFIG = {
  paid:     { label: 'Payé',    icon: CheckCircle2,  className: 'badge-paid' },
  upcoming: { label: 'À venir', icon: Clock,         className: 'badge-soon' },
  late:     { label: 'En retard', icon: AlertCircle, className: 'badge-late' },
};

const FREQ_LABEL: Record<BillFrequency, string> = {
  monthly:   'Mensuel',
  quarterly: 'Trimestriel',
  annual:    'Annuel',
  once:      'Ponctuel',
};

function Modal({ initial, onClose, onSave }: { initial?: Bill; onClose: () => void; onSave: (b: Omit<Bill, 'id'>) => void; }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? 'logement',
    amount: initial ? String(initial.amount) : '',
    dueDay: initial ? String(initial.dueDay) : '1',
    status: initial?.status ?? 'upcoming' as BillStatus,
    frequency: initial?.frequency ?? 'monthly' as BillFrequency,
  });
  const [err, setErr] = useState('');

  const cat = CATEGORIES.find((c) => c.value === form.category);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Donne un nom à cette facture'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setErr('Montant invalide'); return; }
    onSave({
      name: form.name.trim(), category: form.category, amount: parseFloat(form.amount),
      dueDay: parseInt(form.dueDay), status: form.status, frequency: form.frequency,
      icon: cat?.icon ?? '📋', color: cat?.color ?? '#6b7280',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,46,0.3)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card-lg w-full max-w-md animate-slide-up" style={{ borderRadius: '2rem' }}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-bold text-lg" style={{ color: '#3d1c2e' }}>
            {initial ? '✏️ Modifier' : '🧾 Nouvelle facture'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center" style={{ color: '#b89aaa' }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Nom</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Loyer, Netflix…" className="input-glass" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Catégorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-glass" style={{ background: 'rgba(255,255,255,0.6)' }}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Montant (€)</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="input-glass" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Jour d'échéance</label>
              <input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Fréquence</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as BillFrequency })} className="input-glass" style={{ background: 'rgba(255,255,255,0.6)' }}>
                {(Object.entries(FREQ_LABEL) as [BillFrequency, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Statut</label>
            <div className="flex gap-2">
              {(['paid', 'upcoming', 'late'] as BillStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
                  style={form.status === s
                    ? { background: s === 'paid' ? '#dcfce7' : s === 'upcoming' ? '#fef9c3' : '#fee2e2', color: s === 'paid' ? '#16a34a' : s === 'upcoming' ? '#b45309' : '#dc2626', border: '1px solid currentColor' }
                    : { background: 'rgba(255,255,255,0.4)', color: '#b89aaa' }}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{err}</p>}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
            <Check size={15} /> Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>(() => {
    try { const s = localStorage.getItem('mimi_bills'); return s ? JSON.parse(s) : DEFAULT_BILLS; } catch { return DEFAULT_BILLS; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);

  useEffect(() => { localStorage.setItem('mimi_bills', JSON.stringify(bills)); }, [bills]);

  const save = (data: Omit<Bill, 'id'>) => {
    if (editing) setBills((prev) => prev.map((b) => b.id === editing.id ? { ...data, id: b.id } : b));
    else setBills((prev) => [...prev, { ...data, id: uuidv4() }]);
    setEditing(null);
  };

  const toggleStatus = (id: string) => {
    setBills((prev) => prev.map((b) => b.id === id ? { ...b, status: b.status === 'paid' ? 'upcoming' : 'paid' } : b));
  };

  const remove = (id: string) => setBills((prev) => prev.filter((b) => b.id !== id));

  const totalMonthly = bills.filter((b) => b.frequency === 'monthly').reduce((s, b) => s + b.amount, 0);
  const totalPaid    = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
  const totalLate    = bills.filter((b) => b.status === 'late').reduce((s, b) => s + b.amount, 0);

  const byStatus = (s: BillStatus) => bills.filter((b) => b.status === s).sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#3d1c2e' }}>Factures & Abonnements</h1>
          <p className="text-sm" style={{ color: '#b89aaa' }}>Suivi de tes charges fixes</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total mensuel', value: fmt(totalMonthly), color: '#3d1c2e',  bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)',  emoji: '🧾' },
          { label: 'Payées',       value: fmt(totalPaid),    color: '#065f46',  bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',  emoji: '✅' },
          { label: 'En retard',    value: fmt(totalLate),    color: '#991b1b',  bg: 'linear-gradient(135deg,#fee2e2,#fecaca)',  emoji: '⚠️' },
        ].map((k) => (
          <div key={k.label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: k.bg }}>
              {k.emoji}
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: '#b89aaa' }}>{k.label}</div>
              <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections par statut */}
      {(['late', 'upcoming', 'paid'] as BillStatus[]).map((status) => {
        const list = byStatus(status);
        if (list.length === 0) return null;
        const cfg = STATUS_CONFIG[status];
        const Icon = cfg.icon;
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Icon size={14} style={{ color: status === 'paid' ? '#16a34a' : status === 'upcoming' ? '#b45309' : '#dc2626' }} />
              <h2 className="text-sm font-bold" style={{ color: '#3d1c2e' }}>{cfg.label}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>{list.length}</span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((bill) => (
                <div key={bill.id} className="glass-card p-4 group">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: bill.color + '20' }}>
                      {bill.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: '#3d1c2e' }}>{bill.name}</div>
                      <div className="text-xs" style={{ color: '#c9a0b0' }}>
                        Le {bill.dueDay} · {FREQ_LABEL[bill.frequency]}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="text-xl font-extrabold mb-3" style={{ color: '#3d1c2e' }}>
                    {fmt(bill.amount)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleStatus(bill.id)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all"
                      style={bill.status === 'paid'
                        ? { background: 'rgba(220,252,231,0.5)', color: '#16a34a', border: '1px solid rgba(134,239,172,0.4)' }
                        : { background: 'rgba(255,179,198,0.2)', color: '#FF6B8E', border: '1px solid rgba(255,179,198,0.4)' }}>
                      {bill.status === 'paid' ? '✅ Marqué payé' : '○ Marquer payé'}
                    </button>
                    <button onClick={() => { setEditing(bill); setShowModal(true); }}
                      className="w-7 h-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50"
                      style={{ color: '#93c5fd' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => remove(bill.id)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                      style={{ color: '#fca5a5' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {bills.length === 0 && (
        <div className="glass-card-lg p-14 text-center">
          <div className="text-5xl mb-4">🧾</div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#3d1c2e' }}>Aucune facture enregistrée</h3>
          <p className="text-sm mb-4" style={{ color: '#b89aaa' }}>Ajoute tes charges fixes pour ne jamais oublier une échéance.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary px-6 py-2.5">
            Ajouter une facture 🌸
          </button>
        </div>
      )}

      {showModal && (
        <Modal initial={editing ?? undefined} onClose={() => { setShowModal(false); setEditing(null); }} onSave={save} />
      )}
    </div>
  );
}
