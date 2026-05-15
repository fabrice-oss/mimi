import { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function DashboardPage() {
  const { transactions, categories, budgets, selectedMonth } = useApp();

  const monthTxns = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth],
  );

  const totalIncome = useMemo(
    () => monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTxns],
  );
  const totalExpense = useMemo(
    () => monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTxns],
  );
  const balance = totalIncome - totalExpense;

  // Répartition des dépenses par catégorie
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return { name: cat ? `${cat.icon} ${cat.name}` : catId, amount, color: cat?.color ?? '#6b7280' };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxns, categories]);

  // Évolution sur les 6 derniers mois
  const last6Months = useMemo(() => {
    const months: { month: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM', { locale: fr });
      const txns = transactions.filter((t) => t.date.startsWith(key));
      months.push({
        month: key,
        label,
        income: txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions]);

  // Budget vs réel pour le mois sélectionné
  const budgetComparison = useMemo(() => {
    const monthBudgets = budgets.filter((b) => b.monthYear === selectedMonth);
    return monthBudgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = monthTxns
        .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      return {
        name: cat ? `${cat.icon} ${cat.name}` : b.categoryId,
        budget: b.amount,
        réel: spent,
        color: cat?.color ?? '#6b7280',
      };
    });
  }, [budgets, selectedMonth, monthTxns, categories]);

  const monthLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 capitalize">{monthLabel}</h1>

      {/* Cartes KPI */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Revenus"
          value={fmt(totalIncome)}
          icon={<TrendingUp className="text-green-500" />}
          bg="bg-green-50"
          text="text-green-700"
        />
        <KpiCard
          label="Dépenses"
          value={fmt(totalExpense)}
          icon={<TrendingDown className="text-red-500" />}
          bg="bg-red-50"
          text="text-red-700"
        />
        <KpiCard
          label="Solde"
          value={fmt(balance)}
          icon={<Wallet className={balance >= 0 ? 'text-blue-500' : 'text-orange-500'} />}
          bg={balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}
          text={balance >= 0 ? 'text-blue-700' : 'text-orange-700'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Camembert dépenses */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Dépenses par catégorie</h2>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune dépense ce mois-ci</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <ul className="mt-3 space-y-1">
            {expenseByCategory.slice(0, 5).map((e) => (
              <li key={e.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: e.color }} />
                  {e.name}
                </span>
                <span className="font-medium text-gray-700">{fmt(e.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Évolution 6 mois */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Évolution sur 6 mois</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last6Months} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Revenus" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget vs Réel */}
      {budgetComparison.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Budget vs Réel</h2>
          <div className="space-y-3">
            {budgetComparison.map((b) => {
              const pct = b.budget > 0 ? Math.min((b.réel / b.budget) * 100, 100) : 0;
              const over = b.réel > b.budget;
              return (
                <div key={b.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{b.name}</span>
                    <span className={over ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {fmt(b.réel)} / {fmt(b.budget)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dernières transactions */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Dernières transactions</h2>
        {monthTxns.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune transaction ce mois-ci</p>
        ) : (
          <ul className="space-y-2">
            {[...monthTxns]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 8)
              .map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                return (
                  <li key={t.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-lg w-7 text-center">{cat?.icon ?? '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{t.description}</div>
                      <div className="text-gray-400 text-xs">
                        {format(parseISO(t.date), 'd MMM', { locale: fr })} · {cat?.name}
                      </div>
                    </div>
                    <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, bg, text }: { label: string; value: string; icon: React.ReactNode; bg: string; text: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-4`}>
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className={`text-xl font-bold ${text}`}>{value}</div>
      </div>
    </div>
  );
}
