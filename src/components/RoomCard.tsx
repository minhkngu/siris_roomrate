import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Maximize, AlertCircle } from 'lucide-react';
import { RoomType } from '../types';
import { Language } from '../translations';
import { useCloudinaryImages } from '../hooks/useCloudinaryImages';
import { AmenityList } from './AmenityList';
import { MonthlyRateCard, NightlyRateCard } from './RoomPricing';

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
    <article className="bg-white rounded-[1.75rem] overflow-hidden border border-slate-200/80 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_48px_-24px_rgba(79,70,229,0.3)] transition-all duration-300 group h-full flex flex-col">
      <div
        ref={containerRef}
        className={`relative h-64 sm:h-72 overflow-hidden group/carousel bg-slate-100 shrink-0 select-none ${loading ? 'animate-shimmer bg-gray-200' : ''}`}
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

      <div className="p-4 sm:p-6 flex flex-col flex-1">
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-1.5">
            <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-[0.14em] shrink-0">
              {branchTag || 'Siris'}
            </span>
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
          <div className="w-full overflow-x-auto scrollbar-hide">
            <h3 className="inline-block whitespace-nowrap text-lg font-extrabold text-slate-900 leading-snug" title={room.name}>
              {room.name}
            </h3>
          </div>
        </div>

        <div className="mb-4 sm:mb-5">
          <AmenityList included={room.amenities} excluded={room.excludedAmenities} compact={true} />
        </div>

        <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-3.5 sm:space-y-3 sm:pt-4">
          <NightlyRateCard
            weekday={room.pricing.weekday}
            weekend={room.pricing.weekend}
            lang={lang}
          />
          <MonthlyRateCard price={room.pricing.monthlyUnder3} lang={lang} />
        </div>
      </div>
    </article>
  );
};
