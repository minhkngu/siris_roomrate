import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AmenityListProps {
  included: string[];
  excluded?: string[];
  compact?: boolean;
}

export const AmenityList: React.FC<AmenityListProps> = ({ included, excluded = [], compact = false }) => {
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div className={`flex flex-wrap gap-x-1 gap-y-0.5 ${compact ? 'mb-0' : 'mb-6'}`}>
      {included.map((amenity, idx) => (
        <span key={`inc-${idx}`} className={`bg-gray-50 text-slate-600 ${compact ? 'py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-lg font-medium border border-gray-100 flex items-center gap-1`}>
          <CheckCircle2 size={compact ? 10 : 12} className="text-indigo-400" /> {capitalize(amenity)}
        </span>
      ))}
      {excluded.map((amenity, idx) => (
        <span key={`exc-${idx}`} className={`bg-red-50 text-slate-500 ${compact ? 'py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-lg font-medium border border-red-100/50 flex items-center gap-1`}>
          <XCircle size={compact ? 10 : 12} className="text-red-300" /> {capitalize(amenity)}
        </span>
      ))}
    </div>
  );
};