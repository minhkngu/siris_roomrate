import React from 'react';
import { Translation } from '../translations';

interface FooterProps {
  t: Translation;
  contactEmail?: string;
  contactPhone?: string;
  showPoliciesLink?: boolean;
  onNavigate?: (view: 'home' | 'policies') => void;
  loading?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ t, contactEmail, contactPhone, showPoliciesLink = true, onNavigate, loading = false }) => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Desktop layout: organized two-column view */}
        {loading ? (
          /* Loading skeleton for footer */
          <div className="animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-start justify-between gap-10 text-sm">
              {/* Left Side: Brand & Copyright */}
              <div className="flex flex-col gap-2">
                <div className="font-bold text-slate-900">
                  <span className="tracking-tight uppercase">Siris Residences</span>
                </div>
                <div className="text-slate-400 text-xs font-medium">
                  © {new Date().getFullYear()} Siris. All rights reserved.
                </div>
              </div>

              {/* Right Side: Contact Details */}
              <div className="flex flex-col items-end gap-2 text-slate-500">
                {contactPhone && (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-xs md:text-sm">Hotline:</span>
                    <a href={`tel:${contactPhone}`} className="text-slate-900 font-bold hover:text-indigo-600 transition-colors">
                      {contactPhone}
                    </a>
                  </div>
                )}
                {contactEmail && (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-medium text-xs md:text-sm">Email:</span>
                    <a href={`mailto:${contactEmail}`} className="text-slate-900 font-bold hover:text-indigo-600 transition-colors">
                      {contactEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile/Tablet layout: centered stacked - now up to md breakpoint */}
            <div className="flex flex-col items-center gap-4 md:hidden text-center">
              <div className="font-bold text-slate-900">
                <span className="tracking-tight uppercase text-sm">Siris Residences</span>
              </div>

              <div className="flex flex-col items-center gap-2 text-slate-500">
                {contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs">Hotline:</span>
                    <a href={`tel:${contactPhone}`} className="text-slate-900 font-bold text-xs hover:text-indigo-600 transition-colors">
                      {contactPhone}
                    </a>
                  </div>
                )}
                {contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs shrink-0">Email:</span>
                    <a href={`mailto:${contactEmail}`} className="text-slate-900 font-bold text-xs hover:text-indigo-600 transition-colors truncate max-w-[220px]">
                      {contactEmail}
                    </a>
                  </div>
                )}
                {showPoliciesLink && (
                  <button
                    onClick={() => onNavigate ? onNavigate('policies') : window.location.href = '?view=policies'}
                    className="text-indigo-600 hover:text-indigo-700 font-bold underline decoration-indigo-200 underline-offset-4 text-xs mt-1"
                  >
                    {t.generalPolicies}
                  </button>
                )}
              </div>

              <div className="text-slate-400 text-[10px] font-medium">
                © {new Date().getFullYear()} Siris. All rights reserved.
              </div>
            </div>
          </>
        )}
      </div>
    </footer>
  );
};
