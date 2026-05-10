import React from 'react';
import { Policy } from '../types';
import { Language } from '../translations';

interface GeneralPoliciesProps {
  policies: Policy[];
  t: any;
  contactEmail?: string;
  contactPhone?: string;
  lang?: Language;
}

export const GeneralPolicies: React.FC<GeneralPoliciesProps> = ({ policies, t, contactEmail, contactPhone, lang = 'vi' }) => {
  return (
    <article className="bg-white p-6 sm:p-10 md:p-16 sm:shadow-sm sm:rounded-3xl sm:border border-gray-100 max-w-4xl mx-auto -mx-4 sm:mx-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 sm:mb-4 text-center tracking-tight">
        {t.generalPolicies}
      </h1>
      <p className="text-gray-400 mb-10 sm:mb-12 text-[10px] sm:text-sm italic text-center uppercase tracking-widest font-medium">
        {t.lastUpdated || (lang === 'en' ? 'Last updated: May 09, 2026' : 'Cập nhật lần cuối: 09/05/2026')}
      </p>

      <div className="space-y-10 sm:space-y-12 md:space-y-16">
        {policies.map((policy, idx) => (
          <section key={idx} className="relative">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <span className="w-1.5 h-6 sm:h-8 bg-indigo-600 rounded-full shrink-0 mt-1"></span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {idx + 1}. {policy.title}
              </h2>
            </div>
            <div className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-line pl-4 sm:pl-6 border-l border-gray-100 ml-[3px] sm:ml-[4px]">
              {policy.content}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
};