import React, { useState, useEffect } from 'react';
import { Waves, ChevronRight, ChevronLeft, Maximize } from 'lucide-react';
import { RoomType } from '../types';
import { Language } from '../translations';
import { useCloudinaryImages } from '../hooks/useCloudinaryImages';
import { AmenityList } from './AmenityList';

const priceFormatter = new Intl.NumberFormat('vi-VN');

const formatPrice = (price: number | null | undefined) => {
  if (!price || price === 0) return 'N/A';
  return `${priceFormatter.format(price)}`;
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

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden border-2 border-gray-200/80 shadow-md hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group h-full flex flex-col">
      <div className="relative h-48 sm:h-64 overflow-hidden group/carousel bg-gray-50 shrink-0 border-b border-gray-100">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : images.length > 0 ? (
          <img
            key={images[currentImageIndex]}
            src={images[currentImageIndex]}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/carousel:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Waves size={40} strokeWidth={1} />
          </div>
        )}

        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1 sm:p-1.5 rounded-full z-10 transition-all active:scale-90 shadow-sm">
              <ChevronLeft className="w-4 h-4 sm:w-5 h-5" strokeWidth={2.5} />
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1 sm:p-1.5 rounded-full z-10 transition-all active:scale-90 shadow-sm">
              <ChevronRight className="w-4 h-4 sm:w-5 h-5" strokeWidth={2.5} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {room.sqm && room.sqm > 0 && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-indigo-600/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold shadow-md z-10 text-white border border-indigo-400/30">
            <Maximize size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            {room.sqm} {t.sqm}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-base sm:text-lg font-bold text-indigo-600 uppercase tracking-tight shrink-0">
              {branchTag || 'Siris'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate" title={room.name}>
              {room.name}
            </h3>
          </div>
        </div>

        <div className="mb-4 flex-1">
          <AmenityList included={room.amenities} excluded={room.excludedAmenities} compact={true} />
        </div>

        <div className="pt-4 border-t-2 border-gray-100 mt-auto">
          {/* Daily Prices */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {lang === 'en' ? 'Sun - Thu' : 'CN - T5'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                {formatPrice(room.pricing.weekday)} VND
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {lang === 'en' ? 'Fri - Sat' : 'T6 - T7'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                {formatPrice(room.pricing.weekend)} VND
              </span>
            </div>
          </div>

          {/* Monthly Prices */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {t.monthlyUnder3Label || (lang === 'en' ? 'MONTH (<3M)' : 'THÁNG (<3TH)')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-indigo-600 whitespace-nowrap">
                {formatPrice(room.pricing.monthlyUnder3)} VND
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {t.monthlyOver3Label || (lang === 'en' ? 'MONTH (>3M) + FEES' : 'THÁNG (>3TH) + PHÍ')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-indigo-600 mb-1 whitespace-nowrap">
                {formatPrice(room.pricing.monthlyOver3)} {room.pricing.monthlyOver3 && room.pricing.monthlyOver3 > 0 ? 'VND' : ''}
              </span>

              {/* Fees Detail aligned under column 2 */}
              {room.pricing.fees && (
                <p className="text-[10px] text-slate-400 whitespace-pre-line leading-normal font-medium">
                  {room.pricing.fees}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};