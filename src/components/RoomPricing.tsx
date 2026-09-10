import React from 'react';
import { Language } from '../translations';

const priceFormatter = new Intl.NumberFormat('vi-VN');

const formatPrice = (price: number | null | undefined) => {
  if (!price || price === 0) return 'N/A';
  return priceFormatter.format(price);
};

interface NightlyRateCardProps {
  weekday: number;
  weekend: number;
  lang: Language;
}

export const NightlyRateCard: React.FC<NightlyRateCardProps> = ({ weekday, weekend, lang }) => (
  <section
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    aria-label={lang === 'en' ? 'Nightly rates' : 'Giá theo đêm'}
  >
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
      <h4 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600 sm:text-xs sm:tracking-[0.12em]">
        {lang === 'en' ? 'Nightly rates' : 'Giá theo đêm'}
      </h4>
      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm sm:px-2.5 sm:py-1 sm:text-[11px]">
        VND
      </span>
    </div>

    <div className="grid grid-cols-2 divide-x divide-slate-100">
      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
        <span className="mb-1 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
          {lang === 'en' ? 'Sun - Thu' : 'CN - T5'}
        </span>
        <span className="whitespace-nowrap text-base font-black tracking-tight text-slate-900 sm:text-lg">
          {formatPrice(weekday)}
        </span>
      </div>
      <div className="bg-indigo-50/60 px-3 py-3 sm:px-4 sm:py-3.5">
        <span className="mb-1 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-indigo-400 sm:text-xs">
          {lang === 'en' ? 'Fri - Sat' : 'T6 - T7'}
        </span>
        <span className="whitespace-nowrap text-base font-black tracking-tight text-indigo-700 sm:text-lg">
          {formatPrice(weekend)}
        </span>
      </div>
    </div>
  </section>
);

interface MonthlyRateCardProps {
  price: number;
  lang: Language;
}

export const MonthlyRateCard: React.FC<MonthlyRateCardProps> = ({ price, lang }) => (
  <section
    className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2.5"
    aria-label={lang === 'en' ? 'Monthly rate under 3 months' : 'Giá tháng dưới 3 tháng'}
  >
    <h4 className="whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.08em] text-indigo-700">
      {lang === 'en' ? 'Under 3 months' : 'Dưới 3 tháng'}
    </h4>
    <div className="mt-0.5 flex min-w-0 items-baseline gap-1.5">
      <span className="whitespace-nowrap text-base font-black tracking-tight text-indigo-700">
        {formatPrice(price)}
      </span>
      {price > 0 && (
        <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-wide text-indigo-400">
          VND / {lang === 'en' ? 'month' : 'tháng'}
        </span>
      )}
    </div>
  </section>
);
