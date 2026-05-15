import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';

export default function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useApp();
  const date = parseISO(`${selectedMonth}-01`);

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'))}
        className="w-7 h-7 rounded-xl glass flex items-center justify-center transition-all hover:bg-white/60"
        style={{ color: '#FF8FAB' }}>
        <ChevronLeft size={15} />
      </button>
      <span className="text-sm font-bold w-36 text-center capitalize"
        style={{ color: '#3d1c2e' }}>
        {format(date, 'MMMM yyyy', { locale: fr })}
      </span>
      <button onClick={() => setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'))}
        className="w-7 h-7 rounded-xl glass flex items-center justify-center transition-all hover:bg-white/60"
        style={{ color: '#FF8FAB' }}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
