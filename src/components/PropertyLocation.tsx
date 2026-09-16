import React, { CSSProperties } from 'react';
import { Language } from '../translations';
import { MapPoint, propertyLocations } from '../data/propertyLocations';

const ZOOM = 16;
const TILE_SIZE = 256;
const MAP_WIDTH = 1536;
const MAP_SOURCE_HEIGHT = 1024;
const MAP_DISPLAY_HEIGHT = 864;
const MAP_CROP_TOP = (MAP_SOURCE_HEIGHT - MAP_DISPLAY_HEIGHT) / 2;
const MOBILE_ASPECT_RATIO = 5 / 4;
const MOBILE_DISPLAY_WIDTH = MAP_SOURCE_HEIGHT * MOBILE_ASPECT_RATIO;
const MOBILE_CROP_LEFT = (MAP_WIDTH - MOBILE_DISPLAY_WIDTH) / 2;

const toWorldPixel = (lat: number, lon: number) => {
  const scale = TILE_SIZE * (2 ** ZOOM);
  const sinLat = Math.sin(lat * Math.PI / 180);
  return {
    x: (lon + 180) / 360 * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
};

const getPosition = (
  point: Pick<MapPoint, 'lat' | 'lon'>,
  center: { lat: number; lon: number },
  mobilePoint: Pick<MapPoint, 'lat' | 'lon'> = point,
) => {
  const pointPixel = toWorldPixel(point.lat, point.lon);
  const mobilePixel = toWorldPixel(mobilePoint.lat, mobilePoint.lon);
  const centerPixel = toWorldPixel(center.lat, center.lon);
  const sourceX = MAP_WIDTH / 2 + pointPixel.x - centerPixel.x;
  const sourceY = MAP_SOURCE_HEIGHT / 2 + pointPixel.y - centerPixel.y;
  const mobileSourceX = MAP_WIDTH / 2 + mobilePixel.x - centerPixel.x;
  const mobileSourceY = MAP_SOURCE_HEIGHT / 2 + mobilePixel.y - centerPixel.y;

  return {
    '--map-left-mobile': `${((mobileSourceX - MOBILE_CROP_LEFT) / MOBILE_DISPLAY_WIDTH) * 100}%`,
    '--map-top-mobile': `${(mobileSourceY / MAP_SOURCE_HEIGHT) * 100}%`,
    '--map-left-desktop': `${(sourceX / MAP_WIDTH) * 100}%`,
    '--map-top-desktop': `${((sourceY - MAP_CROP_TOP) / MAP_DISPLAY_HEIGHT) * 100}%`,
  } as CSSProperties;
};

interface PropertyLocationProps {
  propertyName: string;
  propertyTag?: string;
  lang: Language;
}

const labelPosition = (placement: 'left' | 'right' | 'above' | 'below') => ({
  left: 'right-4 top-0 -translate-y-1/2',
  right: 'left-4 top-0 -translate-y-1/2',
  above: 'bottom-4 left-0 -translate-x-1/2',
  below: 'left-0 top-4 -translate-x-1/2',
}[placement]);

export const PropertyLocation: React.FC<PropertyLocationProps> = ({
  propertyName,
  propertyTag,
  lang,
}) => {
  const location = propertyLocations[(propertyTag || propertyName).toLowerCase()];
  if (!location) return null;

  return (
    <section
      className="relative mb-8 aspect-[5/4] w-full overflow-hidden rounded-[1.5rem] border border-indigo-100 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:aspect-video sm:rounded-[1.75rem]"
      aria-label={lang === 'en' ? `Nearby map for ${propertyName}` : `Bản đồ lân cận ${propertyName}`}
    >
      <img
        src={location.mapImage}
        alt={lang === 'en'
          ? `Street map of ${propertyName} and nearby landmarks with distances`
          : `Bản đồ đường phố ${propertyName} và các địa điểm lân cận kèm khoảng cách`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {location.roadLabels.map((road) => (
        <div
          key={road.name}
          className="pointer-events-none absolute left-[var(--map-left-mobile)] top-[var(--map-top-mobile)] z-[5] sm:left-[var(--map-left-desktop)] sm:top-[var(--map-top-desktop)]"
          style={getPosition(road, location.center, {
            lat: road.mobileLat ?? road.lat,
            lon: road.mobileLon ?? road.lon,
          })}
        >
          <span
            className="absolute left-0 top-0 whitespace-nowrap text-[8px] font-semibold text-slate-700 sm:text-[10px] sm:font-medium sm:text-slate-600"
            style={{ transform: `translate(-50%, -50%) rotate(${road.rotation}deg)`, textShadow: '0 1px 2px white, 0 -1px 2px white, 1px 0 2px white, -1px 0 2px white' }}
          >
            {road.name}
          </span>
        </div>
      ))}
      {location.points.map((point) => (
        <div
          key={point.name}
          className="absolute left-[var(--map-left-mobile)] top-[var(--map-top-mobile)] z-10 sm:left-[var(--map-left-desktop)] sm:top-[var(--map-top-desktop)]"
          style={getPosition(point, location.center)}
        >
          <span className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow-sm ${point.primary ? 'h-4 w-4 ring-4 ring-indigo-500/20 sm:h-5 sm:w-5' : 'h-2.5 w-2.5 sm:h-3 sm:w-3'}`} />
          <span className={`absolute hidden whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-semibold leading-none shadow-sm backdrop-blur-sm lg:flex ${labelPosition(point.labelSide === 'left' ? 'left' : 'right')} ${point.primary ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200/90 bg-white/95 text-slate-800'}`}>
            {lang === 'en' && point.nameEn ? point.nameEn : point.name}{point.distance && <span className="ml-1 font-bold text-indigo-600">· {point.distance}</span>}
          </span>
          <span className={`absolute hidden whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold leading-none shadow-sm backdrop-blur-sm sm:flex lg:hidden ${labelPosition(point.compactLabelPlacement ?? (point.labelSide === 'left' ? 'left' : 'right'))} ${point.primary ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200/90 bg-white/95 text-slate-800'}`}>
            {lang === 'en' && point.nameEn ? point.nameEn : point.name}{point.distance && <span className="ml-1 font-bold text-indigo-600">· {point.distance}</span>}
          </span>
          <span className={`absolute flex whitespace-nowrap rounded-md border px-1.5 py-1 text-[9px] font-semibold leading-none shadow-sm backdrop-blur-sm sm:hidden ${labelPosition(point.mobileLabelPlacement ?? point.compactLabelPlacement ?? (point.labelSide === 'left' ? 'left' : 'right'))} ${point.primary ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200/90 bg-white/95 text-slate-800'}`}>
            {lang === 'en' && point.nameEn ? point.nameEn : point.name}{point.distance && <span className="ml-1 font-bold text-indigo-600">· {point.distance}</span>}
          </span>
        </div>
      ))}
      <span className="absolute bottom-1.5 right-2 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[7px] text-slate-500 backdrop-blur-sm sm:bottom-2 sm:right-3 sm:text-[9px]">
        © OpenStreetMap contributors
      </span>
    </section>
  );
};
