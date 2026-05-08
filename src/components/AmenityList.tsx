import React from 'react';
import { Check, X } from 'lucide-react';

interface AmenityListProps {
  included: string[];
  excluded?: string[];
  compact?: boolean;
}

export const AmenityList: React.FC<AmenityListProps> = ({ included, excluded = [], compact = false }) => {
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${compact ? 'gap-y-1 sm:gap-y-1.5 gap-x-2' : 'gap-y-2 sm:gap-y-3.5 gap-x-2 sm:gap-x-4'}`}>
      {included.map((amenity, idx) => (
        <div key={`inc-${idx}`} className={`flex items-center gap-1.5 sm:gap-2.5 text-text font-medium ${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'}`}>
          <div className={`${compact ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} rounded-full bg-positive-soft flex items-center justify-center text-positive shrink-0`}>
            <Check size={compact ? 7 : 9} strokeWidth={3} />
          </div>
          <span className="leading-tight">{capitalize(amenity)}</span>
        </div>
      ))}
      {excluded.map((amenity, idx) => (
        <div key={`exc-${idx}`} className={`flex items-center gap-1.5 sm:gap-2.5 text-negative ${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'}`}>
          <div className={`${compact ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} rounded-full bg-negative-soft flex items-center justify-center text-negative shrink-0`}>
            <X size={compact ? 7 : 9} strokeWidth={3} />
          </div>
          <span className="leading-tight">{capitalize(amenity)}</span>
        </div>
      ))}
    </div>
  );
};