import React from 'react';
import { useLang } from '../contexts/LanguageContext';

const CATEGORIES = ['All', 'Powder', 'Metal', 'Statues', 'Monk', 'Talisman', 'Frame', 'Case', 'Necklace', 'Accessory'];

export default function CategoryFilter({ selected, onChange }) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
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
