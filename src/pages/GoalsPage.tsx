import { useState, useEffect } from 'react';
import { Plus, X, Check, Pencil, Trash2, Flag, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
  description: string;
}

const GOAL_EMOJIS = ['🏖️','🚗','🏠','💍','🎓','🌍','🐷','🎁','💻','🏋️','✈️','🛋️','🐾','🎹','🍕'];
const GOAL_COLORS = [
  { label: 'Rose',    value: '#FF8FAB' },
  { label: 'Violet',  value: '#C084FC' },
  { label: 'Bleu',    value: '#60A5FA' },
  { label: 'Vert',    value: '#4ADE80' },
  { label: 'Or',      value: '#FBBF24' },
  { label: 'Corail',  value: '#FB923C' },
];

const DEFAULT_GOALS: Goal[] = [];

function getMimiGoalTip(goals: Goal[]): string {
  const totalProgress = goals.length > 0 ? goals.reduce((s, g) => s + (g.target > 0 ? g.current / g.target : 0), 0) / goals.length * 100 : 0;
  if (goals.length === 0) return "Commence par créer ton premier objectif financier. Même un petit objectif te motivera à épargner chaque mois 🌸";
  if (totalProgress > 80) return `Incroyable ! Tu es à ${totalProgress.toFixed(0)}% de tes objectifs. Tu es tellement près du but, continue ! 🎉`;
  if (totalProgress > 50) return `Tu as déjà atteint ${totalProgress.toFixed(0)}% de tes objectifs. Tu fais des progrès remarquables. Bravo ! 💪`;
  return `Chaque petit pas compte ! Pour accélérer vers tes objectifs, essaie de virer automatiquement une petite somme en début de mois 🌷`;
}

function Modal({ initial, onClose, onSave }: { initial?: Goal; onClose: () => void; onSave: (g: Omit<Goal, 'id'>) => void; }) {
  const [form, setForm] = useState({
    name:        initial?.name        ?? '',
    emoji:       initial?.emoji       ?? '🏖️',
    target:      initial ? String(initial.target)  : '',
    current:     initial ? String(initial.current) : '0',
    deadline:    initial?.deadline    ?? '',
    color:       initial?.color       ?? '#FF8FAB',
    description: initial?.description ?? '',
  });
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Donne un nom à ton objectif'); return; }
    if (!form.target || parseFloat(form.target) <= 0) { setErr('Montant cible invalide'); return; }
    onSave({
      name: form.name.trim(), emoji: form.emoji, target: parseFloat(form.target),
      current: Math.min(parseFloat(form.current) || 0, parseFloat(form.target)),
      deadline: form.deadline, color: form.color, description: form.description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,46,0.3)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card-lg w-full max-w-md animate-slide-up" style={{ borderRadius: '2rem' }}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-bold text-lg" style={{ color: '#3d1c2e' }}>
            {initial ? '✏️ Modifier' : '🎯 Nouvel objectif'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center" style={{ color: '#b89aaa' }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#b89aaa' }}>Emoji</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                  className="w-9 h-9 rounded-xl text-xl transition-all"
                  style={form.emoji === e ? { background: 'linear-gradient(135deg,#FFB3C6,#FF6B8E)', boxShadow: '0 4px 12px rgba(255,107,142,0.3)' } : { background: 'rgba(255,255,255,0.5)' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Nom de l'objectif</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Vacances en Espagne…" className="input-glass" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Description (optionnel)</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Pourquoi cet objectif ?" className="input-glass" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Montant cible (€)</label>
              <input type="number" min="1" step="1" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="2 000" className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Déjà épargné (€)</label>
              <input type="number" min="0" step="1" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} placeholder="0" className="input-glass" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Date limite</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#b89aaa' }}>Couleur</label>
              <div className="flex gap-1.5 mt-1">
                {GOAL_COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => setForm({ ...form, color: c.value })}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{ background: c.value, transform: form.color === c.value ? 'scale(1.25)' : 'scale(1)', boxShadow: form.color === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : 'none' }} />
                ))}
              </div>
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

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    try { const s = localStorage.getItem('mimi_goals'); return s ? JSON.parse(s) : DEFAULT_GOALS; } catch { return DEFAULT_GOALS; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<Goal | null>(null);
  const [adding,    setAdding]    = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => { localStorage.setItem('mimi_goals', JSON.stringify(goals)); }, [goals]);

  const save = (data: Omit<Goal, 'id'>) => {
    if (editing) setGoals((prev) => prev.map((g) => g.id === editing.id ? { ...data, id: g.id } : g));
    else setGoals((prev) => [...prev, { ...data, id: uuidv4() }]);
    setEditing(null);
  };

  const addSavings = (id: string) => {
    const n = parseFloat(addAmount);
    if (!n || n <= 0) return;
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, current: Math.min(g.current + n, g.target) } : g));
    setAdding(null); setAddAmount('');
  };

  const totalTarget  = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const tip = getMimiGoalTip(goals);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#3d1c2e' }}>Objectifs financiers</h1>
          <p className="text-sm" style={{ color: '#b89aaa' }}>Tes rêves, un pas à la fois 🌸</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus size={15} /> Nouvel objectif
        </button>
      </div>

      {/* Mimi tip */}
      <div className="glass-card p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(255,214,231,0.4),rgba(243,232,255,0.35))' }}>
        <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#FFB3C6,#FF6B8E)', boxShadow: '0 4px 12px rgba(255,107,142,0.3)' }}>
          <Sparkles size={16} style={{ color: 'white' }} />
        </div>
        <div>
          <div className="text-xs font-bold mb-0.5" style={{ color: '#FF6B8E' }}>Assistante Mimi</div>
          <p className="text-sm leading-relaxed" style={{ color: '#6b3a50' }}>{tip}</p>
        </div>
      </div>

      {/* Vue globale */}
      {goals.length > 0 && (
        <div className="glass-card-lg p-5 flex items-center gap-6">
          <div>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#b89aaa' }}>Total épargné</div>
            <div className="text-2xl font-extrabold" style={{ color: '#3d1c2e' }}>{fmt(totalCurrent)}</div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: '#c9a0b0' }}>
              <span>{fmt(totalCurrent)} / {fmt(totalTarget)}</span>
              <span>{totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-0.5" style={{ color: '#b89aaa' }}>Objectif total</div>
            <div className="text-2xl font-extrabold" style={{ color: '#FF4D6D' }}>{fmt(totalTarget)}</div>
          </div>
        </div>
      )}

      {/* Cartes objectifs */}
      {goals.length === 0 ? (
        <div className="glass-card-lg p-14 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#FFE4EE,#FFB3C6)' }}>
            <Flag size={32} style={{ color: '#FF6B8E' }} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#3d1c2e' }}>Pas encore d'objectif</h3>
          <p className="text-sm mb-4" style={{ color: '#b89aaa' }}>Crée ton premier objectif et commence à épargner avec motivation !</p>
          <button onClick={() => setShowModal(true)} className="btn-primary px-6 py-2.5">
            Créer mon premier objectif 🎯
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            const done = goal.current >= goal.target;
            const remaining = goal.target - goal.current;
            const daysLeft = goal.deadline
              ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000))
              : null;

            return (
              <div key={goal.id} className="glass-card p-5 group relative overflow-hidden">
                {/* Fond coloré subtil */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ background: `radial-gradient(circle at top right, ${goal.color}, transparent 70%)` }} />

                {done && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(74,222,128,0.2)', color: '#16a34a', border: '1px solid rgba(74,222,128,0.4)' }}>
                    ✅ Atteint !
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: goal.color + '20' }}>
                    {goal.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: '#3d1c2e' }}>{goal.name}</div>
                    {goal.description && <div className="text-xs truncate mt-0.5" style={{ color: '#c9a0b0' }}>{goal.description}</div>}
                    {daysLeft !== null && (
                      <div className="text-xs mt-0.5" style={{ color: daysLeft < 30 ? '#ef4444' : '#c9a0b0' }}>
                        {daysLeft === 0 ? '⚠️ Échéance aujourd\'hui' : `${daysLeft} jours restants`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditing(goal); setShowModal(true); }}
                      className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-blue-50"
                      style={{ color: '#93c5fd' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setGoals((prev) => prev.filter((g) => g.id !== goal.id))}
                      className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-red-50"
                      style={{ color: '#fca5a5' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Montants */}
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-2xl font-extrabold" style={{ color: goal.color }}>{fmt(goal.current)}</div>
                    <div className="text-xs" style={{ color: '#c9a0b0' }}>sur {fmt(goal.target)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: '#3d1c2e' }}>{pct.toFixed(0)}%</div>
                    {!done && <div className="text-xs" style={{ color: '#c9a0b0' }}>{fmt(remaining)} restant</div>}
                  </div>
                </div>

                {/* Barre */}
                <div className="progress-bar mb-3">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${goal.color}80, ${goal.color})` }} />
                </div>

                {/* Ajouter épargne */}
                {!done && (
                  adding === goal.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number" min="1" step="1" value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        placeholder="Montant à ajouter…"
                        className="input-glass flex-1 text-sm py-2"
                        autoFocus
                      />
                      <button onClick={() => addSavings(goal.id)} className="btn-primary px-3 py-2 text-sm">✓</button>
                      <button onClick={() => { setAdding(null); setAddAmount(''); }} className="btn-glass px-3 py-2 text-sm">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAdding(goal.id)}
                      className="w-full py-2 text-sm font-semibold rounded-2xl transition-all"
                      style={{ background: goal.color + '15', color: goal.color, border: `1px solid ${goal.color}30` }}>
                      + Ajouter une épargne
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal initial={editing ?? undefined} onClose={() => { setShowModal(false); setEditing(null); }} onSave={save} />
      )}
    </div>
  );
}
