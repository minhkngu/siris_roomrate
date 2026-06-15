import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Property, Policy, DateAdjustment } from './types';
import { fetchProperties } from './services/dataService';
import { translations, Language } from './translations';
import { LanguageSelector } from './components/LanguageSelector';
import { SurchargeBanner } from './components/SurchargeBanner';
import { RoomCard } from './components/RoomCard';
import { AmenityList } from './components/AmenityList';
import { Footer } from './components/Footer';
import { GeneralPolicies } from './components/GeneralPolicies';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('siris_lang') as Language | null;
    return saved === 'en' || saved === 'vi' ? saved : 'vi';
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [generalPolicies, setGeneralPolicies] = useState<Policy[]>([]);
  const [dateAdjustments, setDateAdjustments] = useState<DateAdjustment[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  const [activeFacility, setActiveFacility] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'home' | 'policies'>(
    new URLSearchParams(window.location.search).get('view') === 'policies' ? 'policies' : 'home'
  );
  const t = translations[lang];

  const isFirstLoad = useRef(true);

  useEffect(() => {
    localStorage.setItem('siris_lang', lang);
  }, [lang]);

  useEffect(() => {
    const loadData = async () => {
      if (isFirstLoad.current) {
        setLoading(true);
      }
      try {
        const { properties, generalPolicies, dateAdjustments, settings } = await fetchProperties(lang);
        setProperties(properties);
        setGeneralPolicies(generalPolicies);
        setDateAdjustments(dateAdjustments);
        setSettings(settings || []);
        if (isFirstLoad.current && properties.length > 0) {
          setActiveFacility(properties[0].id);
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        if (isFirstLoad.current) {
          setLoading(false);
          isFirstLoad.current = false;
          // Small delay to trigger fade-in after loading state is removed
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setContentReady(true);
            });
          });
        }
      }
    };
    loadData();
  }, [lang]);

  useEffect(() => {
    const handlePopState = () => {
      const view = new URLSearchParams(window.location.search).get('view');
      setCurrentView(view === 'policies' ? 'policies' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'home' | 'policies') => {
    setCurrentView(view);
    const url = view === 'home' ? '/' : '?view=policies';
    window.history.pushState({}, '', url);
    window.scrollTo(0, 0);
  };

  const filteredRooms = useMemo(() => {
    return properties.flatMap(prop => {
      if (activeFacility && activeFacility !== 'all' && prop.id !== activeFacility) return [];

      return prop.rooms
        .filter(room => !room.isHidden)
        .filter(room => {
          const searchLower = searchQuery.toLowerCase();
          return room.name.toLowerCase().includes(searchLower) ||
            (room.tag && room.tag.toLowerCase().includes(searchLower));
        })
        .map(room => ({
          ...room,
          property: prop
        }));
    });
  }, [properties, activeFacility, searchQuery]);

  const selectedProperty = useMemo(() => properties.find(p => p.id === activeFacility), [properties, activeFacility]);

  const getSettingValue = useMemo(() => {
    return (setting: any, fallback: string = '') => {
      if (!setting) return fallback;
      const val = (lang === 'en' && setting.value_en) ? setting.value_en : setting.value;
      return typeof val === 'string' ? val : (val?.value || val || fallback);
    };
  }, [lang]);

  const { contactEmail, contactPhone, heroTitle, heroSubtitle } = useMemo(() => {
    const emailSetting = settings.find(s => s.key === 'email' || s.key === 'contact_email' || s.name === 'email');
    const phoneSetting = settings.find(s => s.key === 'phone' || s.key === 'contact_phone' || s.name === 'phone');
    const titleSetting = settings.find(s => s.key === 'hero_title' || s.name === 'hero_title');
    const subtitleSetting = settings.find(s => s.key === 'hero_subtitle' || s.name === 'hero_subtitle');

    return {
      contactEmail: getSettingValue(emailSetting, 'siris.residences@gmail.com'),
      contactPhone: getSettingValue(phoneSetting, ''),
      heroTitle: getSettingValue(titleSetting, t.heroTitle),
      heroSubtitle: getSettingValue(subtitleSetting, t.heroSubtitle)
    };
  }, [settings, getSettingValue, t]);

  const heroTitleElements = useMemo(() => {
    return heroTitle.split(' ').map((word: string, i: number, arr: string[]) => {
      if (i >= arr.length - 2) {
        return <React.Fragment key={i}><span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">{word}</span> </React.Fragment>;
      }
      return word + ' ';
    });
  }, [heroTitle]);

  if (currentView === 'policies') {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <button
                onClick={() => navigateTo('home')}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <span className="text-xl font-black tracking-tight text-white">
                  Siris Residences
                </span>
              </button>
              <div className="flex items-center gap-4 sm:gap-8 text-sm font-medium text-slate-300">
                <LanguageSelector value={lang} onChange={setLang} t={t} theme="dark" />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto">
          {loading ? (
            <div className="px-6 sm:px-10 md:px-16 py-8 sm:py-12 md:py-16 animate-pulse">
              <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-12" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="mb-10">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-1.5 h-6 sm:h-8 bg-gray-200 rounded-full shrink-0 mt-1" />
                    <div className="h-7 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2 pl-4 sm:pl-6 ml-[3px] sm:ml-[4px]">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <GeneralPolicies policies={generalPolicies} t={t} contactEmail={contactEmail} contactPhone={contactPhone} lang={lang} />
          )}
        </main>

        <Footer t={t} contactEmail={contactEmail} contactPhone={contactPhone} showPoliciesLink={false} onNavigate={navigateTo} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-xl font-black tracking-tight text-white">
                Siris Residences
              </span>
            </button>
            <div className="flex items-center gap-4 sm:gap-8 text-sm font-medium text-slate-300">
              <button
                onClick={() => navigateTo('policies')}
                className="hidden md:block text-white hover:text-indigo-400 transition-colors font-semibold text-xs sm:text-sm whitespace-nowrap"
              >
                {t.generalPolicies}
              </button>
              <LanguageSelector value={lang} onChange={setLang} t={t} theme="dark" />
            </div>
          </div>
        </div>
      </nav>

      {!loading && properties.length > 0 && (
        <nav className="sticky top-16 z-40 bg-white/75 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex space-x-2 md:space-x-4 overflow-x-auto w-full scrollbar-hide pt-2">
              {properties.map(fac => (
                <li key={fac.id}>
                  <button
                    onClick={() => setActiveFacility(fac.id)}
                    className={`py-3 md:py-4 px-4 font-semibold text-sm md:text-base relative transition-all duration-300 rounded-t-xl whitespace-nowrap ${activeFacility === fac.id
                      ? 'text-indigo-600 bg-indigo-50/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    {fac.name}
                    {activeFacility === fac.id && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.25)]"></span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className={`transition-all duration-500 ease-out ${loading ? 'opacity-0' : contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {!loading && properties.length > 0 && (
            <>
              {dateAdjustments.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <SurchargeBanner adjustments={dateAdjustments} lang={lang} t={t} />
                </div>
              )}

              {/* Header Section */}
              <div className="mb-4 sm:mb-6 min-h-[60px] sm:min-h-[80px] flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1 sm:mb-2 text-slate-900 leading-tight">
                  {heroTitleElements}
                </h1>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {heroSubtitle}
                </p>
              </div>

              {/* Unified Facility Card - Info */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] mb-10 overflow-hidden">
                {/* Card Body */}
                <div className="p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold mb-1">
                      <MapPin size={18} />
                      <span className="text-lg">{selectedProperty.name}</span>
                    </div>
                    <p className="text-indigo-600/80 text-sm mb-6">
                      {selectedProperty.address}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-widest">{t.propertyAmenities}</h4>
                        <AmenityList included={selectedProperty.amenities} excluded={selectedProperty.excludedAmenities} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-widest">{t.leasePolicy}</h4>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100/50 shadow-sm space-y-2">
                          {selectedProperty.policies.map((policy, idx) => (
                            <div key={idx}>
                              {policy.title && <strong className="text-xs text-slate-700 block">{policy.title}</strong>}
                              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{policy.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {filteredRooms.map((room, idx) => (
                  <RoomCard
                    key={`${room.property.id}-${room.id}`}
                    room={room}
                    t={t}
                    lang={lang}
                    branchTag={room.property.tag || room.property.name}
                    priority={idx < 3}
                  />
                ))}
              </div>

              {/* Empty State */}
              {filteredRooms.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 mt-8">
                  <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400 mb-4">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{t.notFoundTitle}</h3>
                  <p className="text-slate-500 mt-2">{t.notFoundSub}</p>
                  <button
                    onClick={() => { setActiveFacility('all'); setSearchQuery(''); }}
                    className="mt-6 text-indigo-600 font-bold hover:underline"
                  >
                    {t.resetFilters}
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && properties.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin size={32} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.noProperties}</h2>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">{t.noPropertiesSub}</p>
            </div>
          )}

        </div>

        {loading && (
          <div className="flex flex-col gap-8 animate-pulse">
            <div className="h-32 bg-gray-200 animate-pulse rounded-[2rem]" />
            <div className="h-16 bg-gray-200 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-[2rem]" />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer t={t} contactEmail={contactEmail} contactPhone={contactPhone} onNavigate={navigateTo} />

    </div>
  );
}