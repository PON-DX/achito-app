import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AmuletCard from '../components/AmuletCard';
import CategoryFilter from '../components/CategoryFilter';
import SparkleOverlay from '../components/SparkleOverlay';
import useScrollReveal from '../hooks/useScrollReveal';
import { useLang } from '../contexts/LanguageContext';
import ponLogo from '../assets/images/pon.png';
import sorLogo from '../assets/images/sor.png';
import mewLogo from '../assets/images/mew.png';

const REVEAL_STYLE = (visible, delay = 0, dir = 'up') => {
  const from = dir === 'left' ? 'translateX(-32px)' : dir === 'right' ? 'translateX(32px)' : 'translateY(32px)';
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translate(0)' : from,
    transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  };
};

const STORY_PANELS = [
  { icon: '🏺', titleKey: 'home.story_1_title', descKey: 'home.story_1_desc', dir: 'left' },
  { icon: '🕯️', titleKey: 'home.story_2_title', descKey: 'home.story_2_desc', dir: 'up' },
  { icon: '🛡️', titleKey: 'home.story_3_title', descKey: 'home.story_3_desc', dir: 'right' },
];

function OrnateDivider({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="flex-1 max-w-[180px] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.45))' }} />
      <div className="flex items-center gap-2 text-gold/40 text-xs select-none">
        <span>✦</span>
        <span className="rotate-sacred-slow text-sm inline-block">☸</span>
        <span>✦</span>
      </div>
      <div className="flex-1 max-w-[180px] h-px" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.45), transparent)' }} />
    </div>
  );
}

export default function Home() {
  const { t } = useLang();
  const [amulets, setAmulets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');

  const [storyRef, storyVisible] = useScrollReveal({ threshold: 0.08 });
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.05 });

  const fetchAmulets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const res = await axios.get('/api/products', { params });
      setAmulets(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { fetchAmulets(); }, [fetchAmulets]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div>
      {/* ══════════════════════════════════════════
          HERO — deep atmospheric
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '540px' }}>

        {/* Base background — warm dark */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0d0b05 0%, #1c1508 40%, #0a0803 100%)' }} />

        {/* Radial gold corona — center/left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 65% at 35% 50%, rgba(212,175,55,0.09) 0%, rgba(212,175,55,0.02) 55%, transparent 100%)' }}
        />
        {/* Secondary radial — right edge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 40% 50% at 90% 60%, rgba(180,140,30,0.04) 0%, transparent 70%)' }}
        />

        {/* Large rotating dharma wheel */}
        <div className="absolute right-[-5rem] top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden select-none">
          <span
            className="text-gold rotate-sacred-slow"
            style={{ fontSize: '30rem', opacity: 0.028, lineHeight: 1, display: 'block', filter: 'blur(1px)' }}
          >☸</span>
        </div>

        {/* Secondary smaller wheel — top left */}
        <div className="absolute left-[-2rem] top-[-3rem] pointer-events-none overflow-hidden select-none">
          <span
            className="rotate-sacred-slow"
            style={{ fontSize: '14rem', opacity: 0.022, lineHeight: 1, display: 'block', color: '#D4AF37', filter: 'blur(0.5px)', animationDuration: '48s', animationDirection: 'reverse' }}
          >☸</span>
        </div>

        {/* Floating orbs — depth layers */}
        <div className="orb-glow animate-float-slow animate-deep-breathe"
          style={{ width: '600px', height: '600px', left: '-180px', top: '-150px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)' }} />
        <div className="orb-glow animate-float-delayed"
          style={{ width: '420px', height: '420px', right: '2%', bottom: '-120px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.055) 0%, transparent 70%)' }} />
        <div className="orb-glow animate-float"
          style={{ width: '240px', height: '240px', left: '40%', top: '5%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.045) 0%, transparent 70%)' }} />
        {/* Small accent orbs */}
        <div className="orb-glow animate-float-slow"
          style={{ width: '160px', height: '160px', right: '20%', top: '10%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.035) 0%, transparent 70%)', animationDelay: '1.5s' }} />

        {/* Light ray sweep */}
        <div
          className="absolute inset-y-0 pointer-events-none animate-ray-sweep"
          style={{ width: '80px', left: '0', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.06), transparent)' }}
        />

        <SparkleOverlay count={35} />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">

            {/* ── Hero text ─────────────────────── */}
            <div className="max-w-2xl animate-hero-entrance">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 max-w-[40px]" style={{ background: 'rgba(212,175,55,0.4)' }} />
                <p className="text-gold/70 text-[10px] tracking-[0.45em] uppercase font-medium"
                   style={{ textShadow: '0 0 20px rgba(212,175,55,0.5)' }}>
                  Authentic Thai Sacred Objects
                </p>
                <div className="h-px flex-1 max-w-[40px]" style={{ background: 'rgba(212,175,55,0.4)' }} />
              </div>

              <h1 className="font-serif text-4xl md:text-6xl text-cream leading-tight mb-4"
                  style={{ textShadow: '0 4px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)' }}>
                {t('home.hero_title')}
                <br />
                <span className="gold-shimmer">{t('home.hero_subtitle')}</span>
              </h1>

              <div className="gold-divider-flow w-28 my-6" />

              <p className="text-cream-muted/80 text-lg leading-relaxed max-w-lg"
                 style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                {t('home.hero_desc')}
              </p>

              {/* Ornamental row */}
              <div className="flex items-center gap-3 mt-7 select-none">
                {['✦','☸','✦','☸','✦'].map((ch, i) => (
                  <span key={i} className="text-gold/25 text-xs" style={{ letterSpacing: '0.3em' }}>{ch}</span>
                ))}
              </div>
            </div>

            {/* ── Seller logos ──────────────────── */}
            <div className="flex flex-row md:flex-col gap-6 items-center animate-logos-entrance">
              {[
                { to: '/profile/pon', src: ponLogo, alt: 'Pon' },
                { to: '/profile/sor', src: sorLogo, alt: 'Sor' },
                { to: '/profile/mew', src: mewLogo, alt: 'Mew' },
              ].map(({ to, src, alt }) => (
                <Link key={to} to={to} className="group block relative">
                  {/* Multi-layer glow on hover */}
                  <div
                    className="absolute inset-[-4px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                    style={{ boxShadow: '0 0 40px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.18)' }}
                  />
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.2)' }}
                  />
                  <img
                    src={src}
                    alt={alt}
                    className="relative w-28 h-28 md:w-36 md:h-36 object-contain rounded-2xl transition-all duration-500 group-hover:scale-[1.07]"
                    style={{
                      border: '1px solid rgba(212,175,55,0.2)',
                      boxShadow: '0 4px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(212,175,55,0.08)',
                      background: 'radial-gradient(ellipse at 50% 30%, rgba(28,22,6,0.7) 0%, rgba(10,7,2,0.85) 100%)',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(8,6,2,0.85))' }} />
      </section>

      {/* ── Ornate section break ────────────────── */}
      <OrnateDivider className="py-2" />

      {/* ══════════════════════════════════════════
          STORY / WHY SECTION
          ══════════════════════════════════════════ */}
      <section ref={storyRef} className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14" style={REVEAL_STYLE(storyVisible)}>
          <p className="text-gold/45 text-[10px] tracking-[0.55em] uppercase mb-3 select-none">✦ {t('home.story_label')} ✦</p>
          <h2 className="font-serif text-3xl md:text-4xl text-cream"
              style={{ textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}>
            {t('home.story_why')} <span className="gold-shimmer">{t('appName')}</span>
          </h2>
          <div className="gold-divider-flow max-w-[120px] mx-auto mt-5" />
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORY_PANELS.map((p, i) => (
            <div key={i} style={REVEAL_STYLE(storyVisible, i * 0.14, p.dir)}>
              <div
                className="story-panel rounded-2xl p-8 h-full relative overflow-hidden"
                style={{
                  background: 'linear-gradient(160deg, rgba(26,20,7,0.78) 0%, rgba(10,7,2,0.92) 100%)',
                  backdropFilter: 'blur(18px)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.07), inset 0 -1px 0 rgba(0,0,0,0.4), 0 8px 30px rgba(0,0,0,0.5)',
                }}
              >
                {/* Interior ambient glow */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 70%)' }}
                />

                {/* Watermark number */}
                <span className="sacred-number">{String(i + 1).padStart(2, '0')}</span>

                {/* Icon */}
                <div
                  className="text-3xl mb-6 relative z-10 w-14 h-14 flex items-center justify-center rounded-xl"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 100%)',
                    border: '1px solid rgba(212,175,55,0.18)',
                    boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.1), 0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  {p.icon}
                </div>

                {/* Accent line under icon */}
                <div className="w-8 h-px mb-4 relative z-10"
                  style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), transparent)' }} />

                <h3 className="font-serif text-gold text-lg mb-3 relative z-10"
                    style={{ textShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
                  {t(p.titleKey)}
                </h3>
                <p className="text-cream-muted/70 text-sm leading-relaxed relative z-10">
                  {t(p.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ornate section break ────────────────── */}
      <OrnateDivider className="py-2 opacity-50" />

      {/* ══════════════════════════════════════════
          FILTER & SEARCH STICKY
          ══════════════════════════════════════════ */}
      <section className="glass-nav border-b border-gold/15 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CategoryFilter selected={category} onChange={setCategory} />
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('home.search_placeholder')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="input-field pl-10 py-2 text-sm"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted/50 hover:text-cream transition-colors">✕</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRODUCT GRID
          ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-7">
          <p className="text-cream-muted/50 text-xs tracking-wider uppercase">
            {loading ? t('home.loading') : `${amulets.length} ${t('home.items_found')}`}
          </p>
          {(searchInput || category !== 'All') && (
            <button
              onClick={() => { setSearchInput(''); setCategory('All'); }}
              className="text-gold/60 text-xs hover:text-gold transition-colors tracking-wider"
            >
              {t('home.clear_filters')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="aspect-square" style={{ background: 'linear-gradient(135deg, rgba(30,24,8,0.6), rgba(12,9,2,0.8))' }} />
                <div className="p-4 space-y-2.5" style={{ background: 'linear-gradient(to bottom, rgba(14,10,3,0.96), rgba(8,5,1,0.99))' }}>
                  <div className="h-3.5 rounded-sm w-3/4" style={{ background: 'rgba(212,175,55,0.08)' }} />
                  <div className="h-2.5 rounded-sm w-1/2" style={{ background: 'rgba(212,175,55,0.05)' }} />
                  <div className="h-3.5 rounded-sm w-1/3 mt-3" style={{ background: 'rgba(212,175,55,0.07)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : amulets.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl text-charcoal-light rotate-sacred-slow inline-block" style={{ opacity: 0.35 }}>☸</span>
            <p className="font-serif text-cream text-xl mt-6">{t('home.no_items')}</p>
            <p className="text-cream-muted/50 text-sm mt-2">{t('home.no_items_desc')}</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {amulets.map((a, i) => (
              <div
                key={a.id}
                style={{
                  opacity: gridVisible ? (a.status === 'sold_out' ? 0.52 : 1) : 0,
                  transform: gridVisible ? 'translateY(0)' : 'translateY(32px)',
                  transition: `opacity 0.65s ease ${i * 0.045}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${i * 0.045}s`,
                }}
              >
                <AmuletCard amulet={a} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
