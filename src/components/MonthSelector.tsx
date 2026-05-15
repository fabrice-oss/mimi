import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';

export default function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useApp();

  const date = parseISO(`${selectedMonth}-01`);

  const prev = () => setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'));
  const next = () => setSelectedMonth(format(addMonths(date, 1), 'yyyy-MM'));

  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} className="p-1 rounded hover:bg-gray-100 transition-colors">
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm font-semibold w-36 text-center capitalize">
        {format(date, 'MMMM yyyy', { locale: fr })}
      </span>
      <button onClick={next} className="p-1 rounded hover:bg-gray-100 transition-colors">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
