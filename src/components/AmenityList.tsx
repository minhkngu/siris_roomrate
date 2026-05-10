import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AmenityListProps {
  included: string[];
  excluded?: string[];
  compact?: boolean;
}

export const AmenityList: React.FC<AmenityListProps> = ({ included, excluded = [], compact = false }) => {
  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // Sắp xếp theo độ dài (ngắn trước dài sau) để tối ưu diện tích hiển thị (packing)
  const sortedIncluded = [...included].sort((a, b) => a.length - b.length);
  const sortedExcluded = [...excluded].sort((a, b) => a.length - b.length);

  return (
    <div className={`flex flex-wrap gap-x-1 gap-y-1 ${compact ? 'mb-0' : 'mb-6'}`}>
      {sortedIncluded.map((amenity, idx) => (
        <span key={`inc-${idx}`} className={`bg-green-50 text-green-700 ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-lg font-bold border border-green-100 flex items-center`}>
          {capitalize(amenity)}
        </span>
      ))}
      {sortedExcluded.map((amenity, idx) => (
        <span key={`exc-${idx}`} className={`bg-red-50 text-red-400/80 ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-lg font-medium border border-red-100/50 flex items-center line-through decoration-red-300/50`}>
          {capitalize(amenity)}
        </span>
      ))}
    </div>
  );
};