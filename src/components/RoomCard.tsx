import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Maximize, AlertCircle } from 'lucide-react';
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
  priority?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, t, lang, branchTag, priority }) => {
  const cloudinaryTag = branchTag && room.tag ? `${branchTag}_${room.tag}` : undefined;
  const { images, loading } = useCloudinaryImages(cloudinaryTag, priority);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [showNudge, setShowNudge] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [warningPos, setWarningPos] = useState<{ x: number; y: number } | null>(null);
  const warningBtnRef = useRef<HTMLButtonElement>(null);
  const getButtonPos = (e?: React.MouseEvent | React.TouchEvent) => {
    const el = e ? (e.currentTarget as HTMLElement) : warningBtnRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const popupWidth = 300;
    const estimatedHeight = 200;
    let x = Math.min(rect.left, window.innerWidth - popupWidth - 12);
    let y = rect.bottom + 8;
    if (x < 12) x = 12;
    if (y + estimatedHeight > window.innerHeight) {
      y = rect.top - estimatedHeight - 8;
      if (y < 12) y = 12;
    }
    return { x, y };
  };
  const preloadedRef = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch state
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  const total = images.length;
  const hasMultiple = total > 1;

  // Preload images: first, adjacent, then rest in background
  useEffect(() => {
    if (total === 0) return;
    const pl = (idx: number) => {
      if (!preloadedRef.current.has(idx)) {
        preloadedRef.current.add(idx);
        const img = new Image();
        img.src = images[idx].src;
        img.srcset = images[idx].srcSet;
      }
    };
    pl(0);
    pl((currentIndex + 1) % total);
    pl((currentIndex - 1 + total) % total);
    if (total > 2 && preloadedRef.current.size < total) {
      const timer = setTimeout(() => { for (let i = 0; i < total; i++) pl(i); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [images, currentIndex, total]);

  // Auto-dismiss nudge
  useEffect(() => {
    if (hasMultiple && !loading && showNudge) {
      const timer = setTimeout(() => setShowNudge(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasMultiple, loading, showNudge]);

  // Reset index on image change
  useEffect(() => {
    if (currentIndex >= total) setCurrentIndex(0);
  }, [total, currentIndex]);

  const slideTo = useCallback((newIndex: number, dir: 'left' | 'right') => {
    if (isSliding || newIndex === currentIndex) return;
    setCurrentIndex(newIndex);
    setIsSliding(true);
    setTimeout(() => setIsSliding(false), 300);
  }, [isSliding, currentIndex]);

  const nextImg = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    slideTo((currentIndex + 1) % total, 'right');
  }, [currentIndex, total, slideTo]);

  const prevImg = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    slideTo((currentIndex - 1 + total) % total, 'left');
  }, [currentIndex, total, slideTo]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  }, []);

  const handleTouchMove = useCallback(() => { }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) >= 50) {
      if (diff > 0) slideTo((currentIndex + 1) % total, 'right');
      else slideTo((currentIndex - 1 + total) % total, 'left');
    }
  }, [currentIndex, total, slideTo]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasMultiple) return;
      if (e.key === 'ArrowLeft') slideTo((currentIndex - 1 + total) % total, 'left');
      else if (e.key === 'ArrowRight') slideTo((currentIndex + 1) % total, 'right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total, hasMultiple, slideTo]);

  // Popup positioning + click outside
  useEffect(() => {
    if (!showWarning) return;
    const handleViewChange = () => setWarningPos(getButtonPos());
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (warningBtnRef.current && !warningBtnRef.current.contains(e.target as Node)) {
        setShowWarning(false);
      }
    };
    window.addEventListener('scroll', handleViewChange, true);
    window.addEventListener('resize', handleViewChange);
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleViewChange, true);
      window.removeEventListener('resize', handleViewChange);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showWarning]);

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden border-2 border-gray-200/80 shadow-md hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group h-full flex flex-col">
      <div
        ref={containerRef}
        className={`relative h-64 sm:h-80 overflow-hidden group/carousel bg-gray-100 shrink-0 border-b border-gray-100 select-none ${loading ? 'animate-shimmer bg-gray-200' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!loading && images.length > 0 ? (
          <div className="relative w-full h-full overflow-hidden">
            {/* Slide track - holds all images side by side */}
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((imgData, idx) => (
                <div key={idx} className="w-full h-full shrink-0 relative">
                  <img
                    src={imgData.src}
                    srcSet={imgData.srcSet}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    alt={idx === currentIndex ? room.name : ''}
                    className="w-full h-full object-cover"
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>

            {/* Nudge hint */}
            {hasMultiple && showNudge && currentIndex === 0 && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/30 to-transparent animate-pulse" />
              </div>
            )}

            {/* Navigation arrows */}
            {hasMultiple && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 sm:p-2 rounded-full z-20 transition-all active:scale-90 shadow-md backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 sm:p-2 rounded-full z-20 transition-all active:scale-90 shadow-md backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNudge(false);
                        const dir = idx > currentIndex ? 'right' : 'left';
                        slideTo(idx, dir);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/70'}`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>
          </div>
        )}

        {/* SQM badge */}
        {room.sqm && room.sqm > 0 && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-indigo-600/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold shadow-md z-20 text-white border border-indigo-400/30">
            <Maximize size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            {room.sqm} {t.sqm}
          </div>
        )}

        {/* Counter */}
        {hasMultiple && (
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white z-20">
            {currentIndex + 1}/{total}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="text-base sm:text-lg font-bold text-indigo-600 uppercase tracking-tight shrink-0">
              {branchTag || 'Siris'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 break-words flex-1 min-w-0" title={room.name}>
              {room.name}
            </h3>
            {room.warning && (
              <>
                <button
                  ref={warningBtnRef}
                  onClick={(e) => { setShowWarning(prev => !prev); setWarningPos(getButtonPos(e)); }}
                  className="bg-orange-100 active:bg-orange-200 rounded-full px-2 py-1 flex items-center justify-center gap-1 active:scale-[0.96] transition-all shadow-sm cursor-pointer shrink-0 ml-auto sm:ml-0"
                  title={lang === 'en' ? 'Notice' : 'Chú ý'}
                >
                  <AlertCircle size={13} className="w-3.5 h-3.5 text-orange-600 shrink-0" strokeWidth={2.5} />
                  <span className="text-orange-600 font-bold text-[10px] leading-none tracking-wider uppercase whitespace-nowrap">{lang === 'en' ? 'NOTICE' : 'CHÚ Ý'}</span>
                  <ChevronRight size={10} className="w-2.5 h-2.5 text-orange-700 shrink-0" strokeWidth={2.5} />
                </button>
                {showWarning && warningPos && createPortal(
                  <div
                    className="fixed z-[9999] max-w-[300px] sm:max-w-sm bg-white border border-amber-200 rounded-xl shadow-lg p-3.5 text-sm text-slate-700 leading-relaxed"
                    style={{
                      left: `max(12px, min(${warningPos.x}px, calc(100vw - 312px)))`,
                      top: warningPos.y > window.innerHeight - 220 ? 'auto' : `${warningPos.y}px`,
                      bottom: warningPos.y > window.innerHeight - 220 ? '12px' : 'auto',
                    }}
                  >
                    <p className="text-slate-600 whitespace-pre-wrap">{room.warning}</p>
                  </div>,
                  document.body
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
          <AmenityList included={room.amenities} excluded={room.excludedAmenities} compact={true} />
        </div>

        <div className="pt-4 border-t-2 border-gray-100 mt-auto">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5 whitespace-nowrap">
                {lang === 'en' ? 'Sun - Thu' : 'CN - T5'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                {formatPrice(room.pricing.weekday)} VND
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5 whitespace-nowrap">
                {lang === 'en' ? 'Fri - Sat' : 'T6 - T7'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">
                {formatPrice(room.pricing.weekend)} VND
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5 whitespace-nowrap">
                {t.monthlyUnder3Label || (lang === 'en' ? 'MONTH (<3M)' : 'THÁNG (<3TH)')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-indigo-600 whitespace-nowrap">
                {formatPrice(room.pricing.monthlyUnder3)} VND
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5 whitespace-nowrap">
                {t.monthlyOver3Label || (lang === 'en' ? 'MONTH (>3M) + FEES' : 'THÁNG (>3TH) + PHÍ')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-indigo-600 mb-1 whitespace-nowrap">
                {formatPrice(room.pricing.monthlyOver3)} {room.pricing.monthlyOver3 && room.pricing.monthlyOver3 > 0 ? 'VND' : ''}
              </span>
              {room.pricing.fees && (
                <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight font-medium">
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