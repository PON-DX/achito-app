import React, { createContext, useContext, useState } from 'react';
import th from '../locales/th';
import en from '../locales/en';
import zh from '../locales/zh';

const LanguageContext = createContext(null);

const locales = { th, en, zh };
const langCycle = ['th', 'en', 'zh'];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('achito_lang');
    return langCycle.includes(saved) ? saved : 'th';
  });

  const t = (key) => {
    const keys = key.split('.');
    let val = locales[lang];
    for (const k of keys) val = val?.[k];
    return val ?? key;
  };

  const toggleLang = () => {
    const idx = langCycle.indexOf(lang);
    const next = langCycle[(idx + 1) % langCycle.length];
    setLang(next);
    localStorage.setItem('achito_lang', next);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
