import React from 'react';
import { useLang } from '../contexts/LanguageContext';

const CATEGORIES = ['All', 'Powder', 'Metal', 'Statues', 'Monk', 'Talisman', 'Frame', 'Case', 'Necklace', 'Accessory'];

export default function CategoryFilter({ selected, onChange }) {
  const { t } = useLang();
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${
            selected === cat
              ? 'bg-gold text-charcoal-dark border-gold shadow-gold'
              : 'border-charcoal-light text-cream-muted hover:border-gold hover:text-gold'
          }`}
        >
          {t(`categories.${cat}`)}
        </button>
      ))}
    </div>
  );
}
