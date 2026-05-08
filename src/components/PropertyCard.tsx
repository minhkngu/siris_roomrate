import React, { useState, useMemo } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Property } from '../types';
import { Language } from '../translations';
import { AmenityList } from './AmenityList';
import { RoomCard } from './RoomCard';

const priceFormatter = new Intl.NumberFormat('vi-VN');

const formatPrice = (price: number | null | undefined) => {
  if (!price || price === 0) return 'N/A';
  return `${priceFormatter.format(price)} VND`;
};

interface PropertyCardProps {
  property: Property;
  t: any;
  lang: Language;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, t, lang }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleRooms = useMemo(() => 
    property.rooms.filter(room => !room.isHidden),
    [property.rooms]
  );

  const minPrice = useMemo(() => {
    if (visibleRooms.length === 0) return null;
    return Math.min(...visibleRooms.map(r => r.pricing.weekday));
  }, [visibleRooms]);

  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / (width * 0.85));
    setActiveRoomIndex(index);
  };

  return (
    <div 
      id={`property-${property.id}`}
      className="bg-white rounded-none sm:rounded-[32px] shadow-sm sm:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border-y sm:border border-slate-200 overflow-hidden mb-4 sm:mb-8 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 scroll-mt-24"
    >
      <div className="flex flex-col">
        <div className="p-4 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight flex-1">{property.name}</h2>
            <div className="flex items-center shrink-0 pt-1">
              <span className="text-[11px] sm:text-lg font-bold text-slate-900">
                {t.priceFrom}: {minPrice ? formatPrice(minPrice) : '...'}
                <span className="text-[10px] sm:text-sm font-normal text-slate-500">{t.perDay}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] sm:text-sm mb-4">
            <MapPin size={12} className="text-brand-primary sm:w-4 sm:h-4 shrink-0" />
            <span className="line-clamp-1">{property.address}</span>
          </div>

          <p className="text-slate-500 text-[11px] sm:text-sm line-clamp-2 mb-4 leading-relaxed">
            {property.description}
          </p>

          <div className="mb-4 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 bg-slate-50/50 border-y border-slate-100">
            <AmenityList included={property.amenities} excluded={property.excludedAmenities} />
          </div>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] sm:text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
          >
            {isExpanded ? t.closeDetails : t.viewDetails}
            <ChevronRight size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''} sm:w-[18px] sm:h-[18px]`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
          className="overflow-hidden bg-slate-50 border-t border-slate-200"
        >
          <div className="p-5 sm:p-8 space-y-8 sm:space-y-10">
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 sm:mb-5 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                {t.policiesAndRules}
              </h3>
              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
                {property.policies.map((policy, idx) => (
                  <div key={idx} className={idx !== 0 ? 'pt-4 border-t border-slate-100' : ''}>
                    {policy.title && <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 mb-1">{policy.title}</h4>}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic whitespace-pre-line">
                      {policy.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 sm:mb-5 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                {t.roomTypeList}
              </h3>
              <div 
                onScroll={handleScroll}
                className="flex sm:grid sm:grid-cols-1 gap-4 sm:gap-5 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 snap-x snap-mandatory -mx-5 sm:mx-0 px-5 sm:px-0 scrollbar-hide"
              >
                {visibleRooms.length > 0 ? (
                  visibleRooms.map(room => (
                    <div key={room.id} className="min-w-[85vw] sm:min-w-0 snap-center">
                      <RoomCard room={room} t={t} lang={lang} branchTag={property.tag} />
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 sm:p-10 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 text-center">
                    <p className="text-slate-500 text-xs sm:text-sm">...</p>
                  </div>
                )}
              </div>
              
              {visibleRooms.length > 1 && (
                <div className="flex sm:hidden justify-center gap-1.5 mt-2">
                  {visibleRooms.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 rounded-full transition-all duration-300 ${idx === activeRoomIndex ? 'w-4 bg-brand-primary' : 'w-1 bg-slate-200'}`} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
