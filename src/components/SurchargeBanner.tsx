import React, { useMemo } from 'react';
import { DateAdjustment } from '../types';
import { AlertCircle } from 'lucide-react';
import { Language, Translation } from '../translations';

interface SurchargeBannerProps {
  adjustments: DateAdjustment[];
  lang: Language;
  t: Translation;
}

export const SurchargeBanner: React.FC<SurchargeBannerProps> = ({ adjustments, lang, t }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(adj => {
      if (adj.type !== 'surcharge') return false;
      const adjDate = new Date(adj.date);
      adjDate.setHours(0, 0, 0, 0);

      if (adjDate < today) return false;

      const adjMonth = adjDate.getMonth();
      const adjYear = adjDate.getFullYear();

      const isCurrentMonth = adjMonth === currentMonth && adjYear === currentYear;
      const isNextMonth = adjMonth === nextMonth && adjYear === nextMonthYear;

      return isCurrentMonth || isNextMonth;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [adjustments, today, currentMonth, currentYear, nextMonth, nextMonthYear]);

  if (filteredAdjustments.length === 0) return null;

  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <div className="bg-white border border-amber-100 shadow-sm rounded-xl sm:rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="shrink-0 mt-0.5 text-amber-500" size={20} />
        <div className="flex-1">
          <p className="font-semibold text-amber-900 mb-2">{t.surchargeNotification}</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {filteredAdjustments.map((adj) => (
              <li key={adj.id} className="flex items-center justify-between gap-x-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="bg-amber-100 text-amber-800 font-medium px-1 py-0.5 rounded-md text-[10px] sm:text-xs whitespace-nowrap shrink-0">
                    {new Date(adj.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="text-amber-900 font-medium truncate">{adj.note && adj.note.trim() !== '' ? adj.note : t.surcharge}</span>
                </div>
                <span className="text-amber-600 font-semibold whitespace-nowrap flex-shrink-0 text-xs sm:text-sm">
                  +{(adj.amount || 0).toLocaleString()}{adj.ispercentage ? '%' : ` ${t.vnd}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
