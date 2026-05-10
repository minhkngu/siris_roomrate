import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../translations';

interface LanguageSelectorProps {
  value: Language;
  onChange: (val: Language) => void;
  t: any;
  theme?: 'light' | 'dark';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, theme = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: Language) => {
    onChange(lang);
    setIsOpen(false);
  };

  return (
    <div className={`relative flex items-center gap-2 sm:border-l-2 cursor-pointer py-2 ${isDark ? 'sm:border-slate-800' : 'sm:border-gray-100'} sm:pl-6 group transition-all`} ref={dropdownRef} onClick={() => setIsOpen(!isOpen)}>
      <span className={`font-bold uppercase tracking-tight text-sm ${isDark ? 'text-white group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-600'} transition-colors`}>{value}</span>
      <ChevronDown size={14} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} ${isOpen ? 'rotate-180' : ''} transition-transform`} />

      {/* Dropdown */}
      <div className={`absolute top-full right-0 mt-3 w-40 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden transition-all transform origin-top-right z-50 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="p-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleSelect('vi'); }}
            className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all ${value === 'vi' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 hover:bg-indigo-50 font-medium'}`}
          >
            Tiếng Việt
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSelect('en'); }}
            className={`w-full text-left px-4 py-2.5 text-sm rounded-xl mt-1 transition-all ${value === 'en' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 hover:bg-indigo-50 font-medium'}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
};