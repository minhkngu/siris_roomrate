import React, { useState } from 'react';
import { Shield, ChevronDown, Check } from 'lucide-react';
import { Policy } from '../types';

interface GeneralPoliciesProps {
  policies: Policy[];
  t: any;
}

export const GeneralPolicies: React.FC<GeneralPoliciesProps> = ({ policies, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      id="policies-section"
      className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200 shadow-sm mb-6 sm:mb-10 overflow-hidden"
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 sm:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
            <Shield size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{t.generalPolicies}</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">{t.generalPoliciesSub}</p>
          </div>
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      
      {isExpanded && (
        <div
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 sm:px-8 sm:pb-8 space-y-3 sm:space-y-4 border-t border-slate-50 pt-5 sm:pt-8">
            {policies.map((policy, idx) => (
              <div key={idx} className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="mt-1 w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">{policy.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{policy.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
