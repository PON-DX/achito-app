import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%230e0b03'/%3E%3Ccircle cx='200' cy='160' r='65' fill='none' stroke='%23D4AF37' stroke-width='1' opacity='0.25'/%3E%3Ccircle cx='200' cy='160' r='40' fill='none' stroke='%23D4AF37' stroke-width='0.5' opacity='0.15'/%3E%3Ctext x='200' y='170' font-family='serif' font-size='52' fill='%23D4AF37' text-anchor='middle' opacity='0.22'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

export default function AmuletCard({ amulet }) {
  const { t } = useLang();

  return (
    <Link to={`/amulet/${amulet.id}`} className="card group block relative">
      {/* Top shimmer line */}
      <div className="card-shimmer-line" />

      {/* Inner ring — depth illusion */}
      <div
        className="absolute inset-[1px] rounded-xl pointer-events-none z-[1] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ border: '1px solid rgba(212,175,55,0.08)' }}
      />

      {/* ── IMAGE AREA ─────────────────────────────── */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(28,22,6,0.95) 0%, rgba(8,6,2,0.99) 100%)' }}
      >
        <img
          src={amulet.image_url || PLACEHOLDER}
          alt={amulet.name}
          className="w-full h-full object-cover group-hover:scale-[1.11] transition-transform duration-700"
          style={{ transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />

        {/* Multi-layer vignette — bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(6,4,1,0.98) 0%, rgba(6,4,1,0.5) 50%, transparent 100%)' }}
        />
        {/* Subtle top vignette */}
        <div
          className="absolute inset-x-0 top-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(6,4,1,0.45) 0%, transparent 100%)' }}
        />

        {/* Ambient inner glow on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-600"
          style={{ boxShadow: 'inset 0 0 60px rgba(212,175,55,0.08)' }}
        />

        {/* Sold-out overlay */}
        {amulet.status === 'sold_out' && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'rgba(5,3,1,0.78)', backdropFilter: 'blur(3px)' }}
          >
            <span
              className="font-serif text-red-400/80 text-base border border-red-400/30 px-4 py-1.5 tracking-widest"
              style={{
                transform: 'rotate(-12deg)',
                background: 'rgba(100,20,20,0.4)',
                boxShadow: '0 0 20px rgba(200,50,50,0.15)',
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.15em',
              }}
            >
              {t('status.sold_out')}
            </span>
          </div>
        )}

        {/* Category badge — premium */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className="text-gold text-[9px] px-2.5 py-1 tracking-widest uppercase"
            style={{
              background: 'rgba(6,4,1,0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '3px',
              boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.08), 0 2px 8px rgba(0,0,0,0.5)',
              display: 'inline-block',
            }}
          >
            {t(`categories.${amulet.category}`) || amulet.category}
          </span>
        </div>

        {/* View icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-500"
            style={{
              background: 'rgba(6,4,1,0.75)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(212,175,55,0.55)',
              boxShadow: '0 0 30px rgba(212,175,55,0.3), inset 0 1px 0 rgba(212,175,55,0.15)',
            }}
          >
            <svg className="w-4.5 h-4.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        {/* Corner frame accents — animate on hover */}
        {[
          'top-2 left-2 border-t border-l rounded-tl',
          'top-2 right-2 border-t border-r rounded-tr',
          'bottom-2 left-2 border-b border-l rounded-bl',
          'bottom-2 right-2 border-b border-r rounded-br',
        ].map((cls, i) => (
          <div
            key={i}
            className={`absolute pointer-events-none w-5 h-5 transition-all duration-500 ${cls}`}
            style={{
              borderColor: 'rgba(212,175,55,0)',
            }}
          >
            <div
              className={`absolute inset-0 ${cls} transition-all duration-500`}
              style={{
                borderColor: 'inherit',
              }}
            />
          </div>
        ))}
        <div className="absolute top-2 left-2 w-5 h-5 border-t border-l border-gold/0 group-hover:border-gold/55 transition-colors duration-500" style={{ borderRadius: '2px 0 0 0' }} />
        <div className="absolute top-2 right-2 w-5 h-5 border-t border-r border-gold/0 group-hover:border-gold/55 transition-colors duration-500" style={{ borderRadius: '0 2px 0 0' }} />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-gold/0 group-hover:border-gold/55 transition-colors duration-500" style={{ borderRadius: '0 0 0 2px' }} />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-gold/0 group-hover:border-gold/55 transition-colors duration-500" style={{ borderRadius: '0 0 2px 0' }} />
      </div>

      {/* ── INFO PLAQUE ─────────────────────────────── */}
      <div
        className="relative p-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(14,10,3,0.96) 0%, rgba(8,5,1,0.99) 100%)',
          borderTop: '1px solid rgba(212,175,55,0.07)',
        }}
      >
        {/* Subtle inner top highlight */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,175,55,0.12) 50%, transparent 90%)' }}
        />

        <h3
          className="font-serif text-cream text-base leading-snug mb-1.5 line-clamp-2 transition-colors duration-300"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
        >
          {amulet.name}
        </h3>

        {amulet.temple && (
          <p className="text-cream-muted/55 text-[11px] mb-2.5 truncate flex items-center gap-1.5 leading-tight">
            <span
              className="text-gold/40 text-[10px] flex-shrink-0 transition-colors duration-300 group-hover:text-gold/65"
              style={{ textShadow: '0 0 8px rgba(212,175,55,0.4)' }}
            >☸</span>
            {amulet.temple}
          </p>
        )}

        {/* Price + status row */}
        <div className="flex items-center justify-between mt-2.5">
          <span
            className="font-serif text-gold font-semibold text-base transition-all duration-400"
            style={{
              textShadow: '0 0 0 transparent',
            }}
          >
            <span className="group-hover:[text-shadow:0_0_16px_rgba(212,175,55,0.7),0_0_32px_rgba(212,175,55,0.25)] transition-all duration-400">
              ฿{Number(amulet.price).toLocaleString()}
            </span>
          </span>
          <span className={amulet.status === 'available' ? 'status-available' : 'status-sold-out'}>
            {t(`status.${amulet.status}`)}
          </span>
        </div>

        {/* Year */}
        {amulet.year && (
          <p className="text-cream-muted/35 text-[9px] mt-2 tracking-widest uppercase">
            {t('product.year')}: {amulet.year}
          </p>
        )}

        {/* Seller */}
        {amulet.seller_username && (
          <p className="text-cream-muted/22 text-[9px] mt-0.5 flex items-center gap-1">
            <span className="text-gold/18">⊹</span>{amulet.seller_username}
          </p>
        )}
      </div>
    </Link>
  );
}
