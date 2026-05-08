import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';

interface LanguageSelectorProps {
  value: Language;
  onChange: (val: Language) => void;
  t: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { value: Language, label: string, flag: string }[] = [
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'en', label: 'English', flag: '🇺🇸' }
  ];

  const selectedFlag = options.find(opt => opt.value === value)?.flag || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1 px-2 py-2 text-lg hover:opacity-70 transition-opacity min-w-[54px] h-[44px]"
      >
        <span>{selectedFlag}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 w-[50px] mt-2 bg-white border border-slate-100 rounded-xl sm:rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-center py-3 text-lg transition-colors hover:bg-slate-50 flex items-center justify-center ${value === opt.value ? 'bg-brand-primary/5' : ''}`}
              >
                <span>{opt.flag}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
