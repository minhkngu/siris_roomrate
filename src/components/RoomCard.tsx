import React, { useState, useEffect } from 'react';
import { Waves, ChevronRight, Maximize2 } from 'lucide-react';
import { RoomType } from '../types';
import { Language } from '../translations';
import { useCloudinaryImages } from '../hooks/useCloudinaryImages';
import { AmenityList } from './AmenityList';

const priceFormatter = new Intl.NumberFormat('vi-VN');

const formatPrice = (price: number | null | undefined) => {
  if (!price || price === 0) return 'N/A';
  return `${priceFormatter.format(price)} VND`;
};

interface RoomCardProps {
  room: RoomType;
  t: any;
  lang: Language;
  branchTag?: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, t, lang, branchTag }) => {
  const cloudinaryTag = branchTag && room.tag ? `${branchTag}_${room.tag}` : undefined;
  const { images, loading } = useCloudinaryImages(cloudinaryTag);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:shadow-brand/5 transition-all duration-300">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full aspect-[16/9] sm:w-80 sm:aspect-[4/3] relative group bg-surface-alt shrink-0 overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
            </div>
          ) : images.length > 0 ? (
            <>
              <img
                key={images[currentImageIndex]}
                src={images[currentImageIndex]}
                alt={room.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-dim">
              <Waves size={40} strokeWidth={1} />
            </div>
          )}
          {images.length > 1 && (
            <>
              <div className="absolute inset-0 flex items-center justify-between px-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none">
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1)); }}
                  className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-text hover:bg-white transition-all active:scale-90 shadow-sm pointer-events-auto"
                >
                  <ChevronRight size={14} className="rotate-180" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)); }}
                  className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-text hover:bg-white transition-all active:scale-90 shadow-sm pointer-events-auto"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/20 backdrop-blur-md rounded-full">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
              <h4 className="text-[22px] font-bold text-text">{room.name}</h4>
              {room.sqm && room.sqm > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-positive-soft text-positive border border-positive-soft rounded-md text-[9px] sm:text-[10px] font-bold shrink-0">
                  <Maximize2 size={10} className="sm:w-3 sm:h-3" strokeWidth={3} />
                  <span>{room.sqm} {t.sqm}</span>
                </div>
              )}
            </div>
            <AmenityList included={room.amenities} excluded={room.excludedAmenities} compact={true} />
          </div>

          <div className="bg-white px-4 py-3.5 sm:p-5 border-t border-t-border sm:border-t-0 sm:border-l border-l-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 sm:gap-4">
              {[
                { label: t.weekday, price: room.pricing.weekday },
                { label: t.weekend, price: room.pricing.weekend },
                { label: t.monthlyShort, price: room.pricing.monthlyUnder3, color: 'text-positive' },
                { label: t.monthlyLong, price: room.pricing.monthlyOver3, color: 'text-positive', showFees: true }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] text-text-muted uppercase font-bold tracking-wider mb-0.5">{item.label}</span>
                  <span className={`text-[10px] sm:text-xs font-bold ${item.color || 'text-text'}`}>
                    {item.price ? formatPrice(item.price) : 'N/A'}
                  </span>
                  {item.showFees && room.pricing.fees && (
                    <span className="text-[8px] sm:text-[9px] text-text-muted mt-1 leading-tight whitespace-pre-line">
                      {room.pricing.fees}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};