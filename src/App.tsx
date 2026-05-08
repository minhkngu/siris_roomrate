import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MapPin } from 'lucide-react';
import { Property, Policy } from './types';
import { fetchProperties } from './services/dataService';
import { translations, Language } from './translations';
import { LanguageSelector } from './components/LanguageSelector';
import { SurchargeBanner } from './components/SurchargeBanner';
import { DateAdjustment } from './types';

const GeneralPolicies = lazy(() => import('./components/GeneralPolicies').then(m => ({ default: m.GeneralPolicies })));
const PropertyCard = lazy(() => import('./components/PropertyCard').then(m => ({ default: m.PropertyCard })));

export default function App() {
  const [lang, setLang] = useState<Language>('vi');
  const [properties, setProperties] = useState<Property[]>([]);
  const [generalPolicies, setGeneralPolicies] = useState<Policy[]>([]);
  const [dateAdjustments, setDateAdjustments] = useState<DateAdjustment[]>([]);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { properties, generalPolicies, dateAdjustments } = await fetchProperties(lang);
        setProperties(properties);
        setGeneralPolicies(generalPolicies);
        setDateAdjustments(dateAdjustments);
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lang]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Siris Residences</h1>
          <LanguageSelector value={lang} onChange={setLang} t={t} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">{t.loading}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <SurchargeBanner adjustments={dateAdjustments} lang={lang} t={t} />

            <Suspense fallback={<div className="h-20 animate-pulse bg-slate-200 rounded-2xl" />}>
              {generalPolicies.length > 0 && <GeneralPolicies policies={generalPolicies} t={t} />}
            </Suspense>
            
            {properties.length > 0 ? (
              <div className="space-y-8">
                <Suspense fallback={<div className="h-64 animate-pulse bg-slate-200 rounded-3xl" />}>
                  {properties.map(property => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      t={t} 
                      lang={lang} 
                    />
                  ))}
                </Suspense>
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin size={32} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.noProperties}</h2>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">{t.noPropertiesSub}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
