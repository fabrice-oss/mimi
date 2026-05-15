import { useMemo, useState } from 'react';
import { format, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../contexts/AppContext';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function buildMonthSummary(
  monthYear: string,
  transactions: ReturnType<typeof useApp>['transactions'],
  categories: ReturnType<typeof useApp>['categories'],
) {
  const txns = transactions.filter((t) => t.date.startsWith(monthYear));
  const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, { name: string; icon: string; income: number; expense: number }> = {};
  txns.forEach((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { name: cat?.name ?? t.categoryId, icon: cat?.icon ?? '•', income: 0, expense: 0 };
    }
    byCategory[t.categoryId][t.type] += t.amount;
  });

  return { monthYear, income, expense, balance: income - expense, byCategory, txns };
}

export default function ReportsPage() {
  const { transactions, categories, user } = useApp();
  const [exporting, setExporting] = useState<string | null>(null);

  // Génère les 12 derniers mois qui ont des transactions
  const months = useMemo(() => {
    const result: string[] = [];
    const seen = new Set(transactions.map((t) => t.date.slice(0, 7)));
    for (let i = 0; i < 24; i++) {
      const m = format(subMonths(new Date(), i), 'yyyy-MM');
      if (seen.has(m)) result.push(m);
    }
    return result;
  }, [transactions]);

  const exportPDF = async (monthYear: string) => {
    setExporting(monthYear);
    try {
      const summary = buildMonthSummary(monthYear, transactions, categories);
      const label = format(parseISO(`${monthYear}-01`), 'MMMM yyyy', { locale: fr });

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // En-tête
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, pageW, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Mimi Comptabilité', 15, 15);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text(`Rapport · ${label.charAt(0).toUpperCase() + label.slice(1)}`, 15, 25);
      if (user) {
        doc.setFontSize(9);
        doc.text(user.email, pageW - 15, 20, { align: 'right' });
      }

      doc.setTextColor(0, 0, 0);
      let y = 50;

      // KPIs
      const kpis = [
        { label: 'Revenus', value: fmt(summary.income), color: [34, 197, 94] as [number, number, number] },
        { label: 'Dépenses', value: fmt(summary.expense), color: [239, 68, 68] as [number, number, number] },
        { label: 'Solde', value: fmt(summary.balance), color: summary.balance >= 0 ? [59, 130, 246] as [number, number, number] : [249, 115, 22] as [number, number, number] },
      ];
      const boxW = (pageW - 30 - 10) / 3;
      kpis.forEach((kpi, i) => {
        const x = 15 + i * (boxW + 5);
        doc.setFillColor(...kpi.color);
        doc.roundedRect(x, y, boxW, 18, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.label, x + boxW / 2, y + 6, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, x + boxW / 2, y + 13, { align: 'center' });
      });
      doc.setTextColor(0, 0, 0);
      y += 28;

      // Répartition par catégorie
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Répartition par catégorie', 15, y);
      y += 6;

      const catEntries = Object.values(summary.byCategory).sort((a, b) => b.expense - a.expense);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // En-tête tableau
      doc.setFillColor(243, 244, 246);
      doc.rect(15, y, pageW - 30, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Catégorie', 18, y + 5);
      doc.text('Revenus', pageW - 80, y + 5);
      doc.text('Dépenses', pageW - 50, y + 5);
      doc.text('Solde', pageW - 20, y + 5, { align: 'right' });
      y += 9;

      doc.setFont('helvetica', 'normal');
      catEntries.forEach((cat, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, y - 1, pageW - 30, 7, 'F');
        }
        doc.text(`${cat.icon} ${cat.name}`, 18, y + 4);
        doc.setTextColor(34, 197, 94);
        doc.text(cat.income > 0 ? fmt(cat.income) : '-', pageW - 80, y + 4);
        doc.setTextColor(239, 68, 68);
        doc.text(cat.expense > 0 ? fmt(cat.expense) : '-', pageW - 50, y + 4);
        const bal = cat.income - cat.expense;
        doc.setTextColor(bal >= 0 ? 34 : 239, bal >= 0 ? 197 : 68, bal >= 0 ? 94 : 68);
        doc.text(fmt(bal), pageW - 20, y + 4, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y += 7;
      });

      y += 8;

      // Détail des transactions
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Détail des transactions', 15, y);
      y += 6;

      doc.setFillColor(243, 244, 246);
      doc.rect(15, y, pageW - 30, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 18, y + 5);
      doc.text('Description', 40, y + 5);
      doc.text('Catégorie', 110, y + 5);
      doc.text('Montant', pageW - 20, y + 5, { align: 'right' });
      y += 9;

      const sorted = [...summary.txns].sort((a, b) => a.date.localeCompare(b.date));
      doc.setFont('helvetica', 'normal');
      sorted.forEach((t, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, y - 1, pageW - 30, 6, 'F');
        }
        const cat = categories.find((c) => c.id === t.categoryId);
        doc.setTextColor(0, 0, 0);
        doc.text(format(parseISO(t.date), 'dd/MM/yyyy'), 18, y + 3.5);
        doc.text(t.description.slice(0, 35), 40, y + 3.5);
        doc.text(cat ? `${cat.icon} ${cat.name}` : '', 110, y + 3.5);
        doc.setTextColor(t.type === 'income' ? 34 : 239, t.type === 'income' ? 197 : 68, t.type === 'income' ? 94 : 68);
        doc.text(`${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}`, pageW - 20, y + 3.5, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y += 6;
      });

      // Pied de page
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} · Page ${p}/${pages}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' },
        );
      }

      doc.save(`mimi-rapport-${monthYear}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-800">Rapports</h1>

      {months.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p>Aucune donnée disponible pour l'instant.</p>
          <p className="text-sm mt-1">Ajoutez des transactions pour générer des rapports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map((m) => {
            const summary = buildMonthSummary(m, transactions, categories);
            const label = format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: fr });
            return (
              <div key={m} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 capitalize">{label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {summary.txns.length} transaction{summary.txns.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <div className="text-xs text-gray-400">Revenus</div>
                    <div className="font-semibold text-green-600">{fmt(summary.income)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Dépenses</div>
                    <div className="font-semibold text-red-500">{fmt(summary.expense)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Solde</div>
                    <div className={`font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                      {fmt(summary.balance)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => exportPDF(m)}
                  disabled={exporting === m}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {exporting === m ? (
                    <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <FileDown size={15} />
                  )}
                  {exporting === m ? 'Export…' : 'PDF'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
