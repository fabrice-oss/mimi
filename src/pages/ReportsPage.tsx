import { useMemo, useState } from 'react';
import { format, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileDown, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../contexts/AppContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function buildSummary(
  monthYear: string,
  transactions: ReturnType<typeof useApp>['transactions'],
  categories: ReturnType<typeof useApp>['categories'],
) {
  const txns = transactions.filter((t) => t.date.startsWith(monthYear));
  const income  = txns.filter((t) => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, { name: string; icon: string; income: number; expense: number }> = {};
  txns.forEach((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    if (!byCategory[t.categoryId]) byCategory[t.categoryId] = { name: cat?.name ?? t.categoryId, icon: cat?.icon ?? '•', income: 0, expense: 0 };
    byCategory[t.categoryId][t.type] += t.amount;
  });
  return { monthYear, income, expense, balance: income - expense, byCategory, txns };
}

export default function ReportsPage() {
  const { transactions, categories, user } = useApp();
  const [exporting, setExporting] = useState<string | null>(null);

  const months = useMemo(() => {
    const seen = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return Array.from({ length: 24 }, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM')).filter((m) => seen.has(m));
  }, [transactions]);

  const exportPDF = async (monthYear: string) => {
    setExporting(monthYear);
    try {
      const s = buildSummary(monthYear, transactions, categories);
      const label = format(parseISO(`${monthYear}-01`), 'MMMM yyyy', { locale: fr });
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      let y = 0;

      // En-tête rose
      doc.setFillColor(255, 143, 171);
      doc.rect(0, 0, W, 40, 'F');
      doc.setFillColor(255, 107, 142);
      doc.rect(0, 0, W, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('🌸 Mimi Compta', 14, 14);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(`Rapport · ${label.charAt(0).toUpperCase() + label.slice(1)}`, 14, 22);
      if (user) { doc.setFontSize(8); doc.text(user.email, W - 14, 20, { align: 'right' }); }
      y = 50;

      // KPIs
      const kpis = [
        { l: 'Revenus',  v: fmt(s.income),   r: [134, 239, 172] as [number,number,number], t: [22, 101, 52] as [number,number,number] },
        { l: 'Dépenses', v: fmt(s.expense),  r: [252, 165, 165] as [number,number,number], t: [153, 27, 27] as [number,number,number] },
        { l: 'Solde',    v: fmt(s.balance),  r: s.balance >= 0 ? [147, 197, 253] as [number,number,number] : [253, 186, 116] as [number,number,number], t: [30, 58, 138] as [number,number,number] },
      ];
      const bw = (W - 28 - 8) / 3;
      kpis.forEach((k, i) => {
        const x = 14 + i * (bw + 4);
        doc.setFillColor(...k.r);
        doc.roundedRect(x, y, bw, 20, 3, 3, 'F');
        doc.setTextColor(...k.t);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(k.l, x + bw / 2, y + 7, { align: 'center' });
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(k.v, x + bw / 2, y + 15, { align: 'center' });
      });
      y += 30;
      doc.setTextColor(0, 0, 0);

      // Répartition
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Répartition par catégorie', 14, y); y += 7;
      doc.setFillColor(250, 240, 245); doc.rect(14, y, W - 28, 7, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text('Catégorie', 17, y + 5); doc.text('Revenus', W - 70, y + 5); doc.text('Dépenses', W - 45, y + 5); doc.text('Solde', W - 16, y + 5, { align: 'right' });
      y += 9; doc.setFont('helvetica', 'normal');
      Object.values(s.byCategory).sort((a, b) => b.expense - a.expense).forEach((c, idx) => {
        if (y > 260) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) { doc.setFillColor(255, 250, 252); doc.rect(14, y - 1, W - 28, 7, 'F'); }
        doc.setTextColor(0, 0, 0); doc.text(`${c.icon} ${c.name}`, 17, y + 4);
        doc.setTextColor(22, 163, 74);  doc.text(c.income  > 0 ? fmt(c.income)  : '-', W - 70, y + 4);
        doc.setTextColor(220, 38, 38);  doc.text(c.expense > 0 ? fmt(c.expense) : '-', W - 45, y + 4);
        const bal = c.income - c.expense;
        doc.setTextColor(bal >= 0 ? 22 : 220, bal >= 0 ? 163 : 38, bal >= 0 ? 74 : 38);
        doc.text(fmt(bal), W - 16, y + 4, { align: 'right' });
        y += 7;
      });
      y += 8;

      // Transactions
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
      doc.text('Détail des transactions', 14, y); y += 7;
      doc.setFillColor(250, 240, 245); doc.rect(14, y, W - 28, 7, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text('Date', 17, y + 5); doc.text('Description', 38, y + 5); doc.text('Catégorie', 110, y + 5); doc.text('Montant', W - 16, y + 5, { align: 'right' });
      y += 9; doc.setFont('helvetica', 'normal');
      [...s.txns].sort((a, b) => a.date.localeCompare(b.date)).forEach((t, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) { doc.setFillColor(255, 250, 252); doc.rect(14, y - 1, W - 28, 6, 'F'); }
        const cat = categories.find((c) => c.id === t.categoryId);
        doc.setTextColor(0, 0, 0); doc.text(format(parseISO(t.date), 'dd/MM/yy'), 17, y + 3.5);
        doc.text(t.description.slice(0, 38), 38, y + 3.5);
        doc.text(cat ? `${cat.icon} ${cat.name}` : '', 110, y + 3.5);
        doc.setTextColor(t.type === 'income' ? 22 : 220, t.type === 'income' ? 163 : 38, t.type === 'income' ? 74 : 38);
        doc.text(`${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}`, W - 16, y + 3.5, { align: 'right' });
        y += 6;
      });

      // Pied de page
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFontSize(7); doc.setTextColor(200, 150, 170);
        doc.text(`Mimi Compta · Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} · Page ${p}/${pages}`, W / 2, doc.internal.pageSize.getHeight() - 7, { align: 'center' });
      }

      doc.save(`mimi-rapport-${monthYear}.pdf`);
    } finally { setExporting(null); }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#3d1c2e' }}>Rapports</h1>
        <p className="text-sm" style={{ color: '#b89aaa' }}>Historique de tes finances mois par mois</p>
      </div>

      {months.length === 0 ? (
        <div className="glass-card-lg p-14 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#3d1c2e' }}>Aucune donnée disponible</h3>
          <p className="text-sm" style={{ color: '#b89aaa' }}>Ajoute des transactions pour générer tes premiers rapports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map((m) => {
            const s = buildSummary(m, transactions, categories);
            const label = format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: fr });
            return (
              <div key={m} className="glass-card p-5 flex items-center gap-5">
                {/* Mois */}
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#FFB3C6,#FF8FAB)' }}>
                  <div className="text-white text-xs font-semibold uppercase leading-none">
                    {format(parseISO(`${m}-01`), 'MMM', { locale: fr })}
                  </div>
                  <div className="text-white text-sm font-bold leading-none mt-0.5">
                    {format(parseISO(`${m}-01`), 'yyyy')}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="font-bold capitalize mb-2" style={{ color: '#3d1c2e' }}>{label}</div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1" style={{ color: '#16a34a' }}>
                      <TrendingUp size={11} /> {fmt(s.income)}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#FF4D6D' }}>
                      <TrendingDown size={11} /> {fmt(s.expense)}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: s.balance >= 0 ? '#2563eb' : '#ea580c' }}>
                      <Wallet size={11} /> {fmt(s.balance)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-right shrink-0" style={{ color: '#c9a0b0' }}>
                  {s.txns.length} transaction{s.txns.length > 1 ? 's' : ''}
                </div>

                <button onClick={() => exportPDF(m)} disabled={exporting === m}
                  className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 shrink-0">
                  {exporting === m
                    ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    : <FileDown size={15} />}
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
