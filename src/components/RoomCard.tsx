import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [showNudge, setShowNudge] = useState(true);
  const preloadedRef = useRef<Set<number>>(new Set());
  const imageRef = useRef<HTMLDivElement>(null);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const totalImages = images.length;
  const hasMultipleImages = totalImages > 1;

  // Preload adjacent images
  useEffect(() => {
    if (totalImages === 0) return;

    const preload = (index: number) => {
      if (preloadedRef.current.has(index)) return;
      preloadedRef.current.add(index);
      const img = new Image();
      img.src = images[index];
    };

    // Preload current, next, and prev
    preload(currentImageIndex);
    preload((currentImageIndex + 1) % totalImages);
    preload((currentImageIndex - 1 + totalImages) % totalImages);
  }, [images, currentImageIndex, totalImages]);

  // Preload all remaining images in background after first load
  useEffect(() => {
    if (totalImages <= 2 || preloadedRef.current.size >= totalImages) return;
    const timer = setTimeout(() => {
      for (let i = 0; i < totalImages; i++) {
        if (!preloadedRef.current.has(i)) {
          preloadedRef.current.add(i);
          const img = new Image();
          img.src = images[i];
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [totalImages, images]);

  // One-time nudge animation on first load when multiple images
  useEffect(() => {
    if (hasMultipleImages && !loading && showNudge) {
      const timer = setTimeout(() => setShowNudge(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasMultipleImages, loading, showNudge]);

  // Reset index when images change
  useEffect(() => {
    if (currentImageIndex >= totalImages) {
      setCurrentImageIndex(0);
    }
  }, [totalImages, currentImageIndex]);

  const goToImage = useCallback((newIndex: number) => {
    setCurrentImageIndex(newIndex);
  }, []);

  const nextImg = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = (currentImageIndex + 1) % totalImages;
    goToImage(newIndex);
  }, [currentImageIndex, totalImages, goToImage]);

  const prevImg = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = (currentImageIndex - 1 + totalImages) % totalImages;
    goToImage(newIndex);
  }, [currentImageIndex, totalImages, goToImage]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) < minSwipeDistance) return;

    if (swipeDistance > 0) {
      const newIndex = (currentImageIndex + 1) % totalImages;
      goToImage(newIndex);
    } else {
      const newIndex = (currentImageIndex - 1 + totalImages) % totalImages;
      goToImage(newIndex);
    }
  }, [currentImageIndex, totalImages, goToImage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasMultipleImages) return;
      if (e.key === 'ArrowLeft') {
        const newIndex = (currentImageIndex - 1 + totalImages) % totalImages;
        goToImage(newIndex);
      } else if (e.key === 'ArrowRight') {
        const newIndex = (currentImageIndex + 1) % totalImages;
        goToImage(newIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, totalImages, hasMultipleImages, goToImage]);

  // Check if current image is ready (preloaded or only 1 image)
  const isImageReady = preloadedRef.current.has(currentImageIndex) || totalImages <= 1;

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden border-2 border-gray-200/80 shadow-md hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group h-full flex flex-col">
      <div
        ref={imageRef}
        className="relative h-56 sm:h-72 overflow-hidden group/carousel bg-gray-100 shrink-0 border-b border-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : images.length > 0 ? (
          <div className="relative w-full h-full">
            <img
              key={`img-${currentImageIndex}`}
              src={images[currentImageIndex]}
              alt={room.name}
              className={`w-full h-full object-cover transition-opacity duration-200 group-hover/carousel:scale-105 ${isImageReady ? 'opacity-100' : 'opacity-0'} ${showNudge && currentImageIndex === 0 ? 'animate-nudge-left' : ''}`}
              referrerPolicy="no-referrer"
              fetchPriority={currentImageIndex === 0 ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />

            {/* Navigation arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1 sm:p-1.5 rounded-full z-20 transition-all active:scale-90 shadow-sm opacity-0 group-hover/carousel:opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1 sm:p-1.5 rounded-full z-20 transition-all active:scale-90 shadow-sm opacity-0 group-hover/carousel:opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNudge(false);
                        goToImage(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/70'}`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Waves size={40} strokeWidth={1} />
          </div>
        )}

        {/* SQM badge */}
        {room.sqm && room.sqm > 0 && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-indigo-600/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold shadow-md z-20 text-white border border-indigo-400/30">
            <Maximize size={12} className="text-white sm:w-3.5 sm:h-3.5" />
            {room.sqm} {t.sqm}
          </div>
        )}

        {/* Image counter badge */}
        {hasMultipleImages && (
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white z-20">
            {currentImageIndex + 1}/{totalImages}
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