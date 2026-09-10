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
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
      <h4 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
        {lang === 'en' ? 'Nightly rates' : 'Giá theo đêm'}
      </h4>
      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
        VND
      </span>
    </div>

    <div className="grid grid-cols-2 divide-x divide-slate-100">
      <div className="px-4 py-3.5">
        <span className="mb-1 block whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-400">
          {lang === 'en' ? 'Sun - Thu' : 'CN - T5'}
        </span>
        <span className="whitespace-nowrap text-lg font-black tracking-tight text-slate-900">
          {formatPrice(weekday)}
        </span>
      </div>
      <div className="bg-indigo-50/60 px-4 py-3.5">
        <span className="mb-1 block whitespace-nowrap text-xs font-bold uppercase tracking-wider text-indigo-400">
          {lang === 'en' ? 'Fri - Sat' : 'T6 - T7'}
        </span>
        <span className="whitespace-nowrap text-lg font-black tracking-tight text-indigo-700">
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
    className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3.5"
    aria-label={lang === 'en' ? 'Monthly rate under 3 months' : 'Giá tháng dưới 3 tháng'}
  >
    <div className="min-w-0">
      <h4 className="text-xs font-extrabold uppercase tracking-[0.12em] text-indigo-700">
        {lang === 'en' ? 'Under 3 months' : 'Dưới 3 tháng'}
      </h4>
      <p className="mt-0.5 text-sm text-indigo-600/70">
        {lang === 'en' ? 'Monthly rate' : 'Giá thuê theo tháng'}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <span className="block whitespace-nowrap text-lg font-black tracking-tight text-indigo-700">
        {formatPrice(price)}
      </span>
      {price > 0 && <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">VND / {lang === 'en' ? 'month' : 'tháng'}</span>}
    </div>
  </section>
);
