import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23161005'/%3E%3Ccircle cx='200' cy='160' r='60' fill='none' stroke='%23D4AF37' stroke-width='1.5' opacity='0.4'/%3E%3Ctext x='200' y='168' font-family='serif' font-size='48' fill='%23D4AF37' text-anchor='middle' opacity='0.3'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

export default function AmuletCard({ amulet }) {
  const { t } = useLang();

  return (
    <Link to={`/amulet/${amulet.id}`} className="card group block relative">
      {/* Gold shimmer line at top on hover */}
      <div className="card-shimmer-line" />

      {/* Image */}
      <div className="relative aspect-square overflow-hidden" style={{ background: 'rgba(12,9,3,0.9)' }}>
        <img
          src={amulet.image_url || PLACEHOLDER}
          alt={amulet.name}
          className="w-full h-full object-cover group-hover:scale-[1.13] transition-transform duration-700"
          style={{ transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(8,6,2,0.92) 0%, transparent 100%)' }}
        />

        {/* Sold out overlay */}
        {amulet.status === 'sold_out' && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(8,6,2,0.75)', backdropFilter: 'blur(4px)' }}
          >
            <span
              className="font-serif text-red-400 text-base border border-red-400/50 px-3 py-1 tracking-wider"
              style={{ transform: 'rotate(-12deg)', background: 'rgba(127,29,29,0.3)' }}
            >
              {t('status.sold_out')}
            </span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className="text-gold text-[10px] px-2.5 py-1 rounded-full tracking-wide"
            style={{
              background: 'rgba(8,6,2,0.82)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(212,175,55,0.28)',
            }}
          >
            {t(`categories.${amulet.category}`) || amulet.category}
          </span>
        </div>

        {/* View icon — floats up on hover */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="w-12 h-12 rounded-full border border-gold/50 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 transition-all duration-500"
            style={{
              background: 'rgba(8,6,2,0.65)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 24px rgba(212,175,55,0.25)',
            }}
          >
            <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        {/* Corner accents — TL */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <div className="w-5 h-[1px] bg-gold/0 group-hover:bg-gold/55 transition-colors duration-500" />
          <div className="w-[1px] h-5 bg-gold/0 group-hover:bg-gold/55 transition-colors duration-500 mt-0" />
        </div>
        {/* Corner accents — BR */}
        <div className="absolute bottom-2 right-2 pointer-events-none flex flex-col items-end">
          <div className="w-[1px] h-5 bg-gold/0 group-hover:bg-gold/55 transition-colors duration-500" />
          <div className="w-5 h-[1px] bg-gold/0 group-hover:bg-gold/55 transition-colors duration-500" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-serif text-cream text-base leading-snug mb-1 line-clamp-2 group-hover:text-gold transition-colors duration-300">
          {amulet.name}
        </h3>
        {amulet.temple && (
          <p className="text-cream-muted text-xs mb-2 truncate flex items-center gap-1">
            <span className="text-gold/35 text-[10px]">☸</span>
            {amulet.temple}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span
            className="font-serif text-gold font-semibold text-base transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.7)]"
          >
            ฿{Number(amulet.price).toLocaleString()}
          </span>
          <span className={amulet.status === 'available' ? 'status-available' : 'status-sold-out'}>
            {t(`status.${amulet.status}`)}
          </span>
        </div>
        {amulet.year && (
          <p className="text-cream-muted/45 text-[10px] mt-1.5 tracking-wider uppercase">
            {t('product.year')}: {amulet.year}
          </p>
        )}
      </div>
    </Link>
  );
}
