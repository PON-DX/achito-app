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

const REVEAL_STYLE = (visible, delay = 0, dir = 'up') => {
  const from = dir === 'left' ? 'translateX(-28px)' : dir === 'right' ? 'translateX(28px)' : 'translateY(28px)';
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translate(0)' : from,
    transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  };
};

const STORY_PANELS = [
  { icon: '🏺', titleKey: 'home.story_1_title', descKey: 'home.story_1_desc', dir: 'left' },
  { icon: '🕯️', titleKey: 'home.story_2_title', descKey: 'home.story_2_desc', dir: 'up' },
  { icon: '🛡️', titleKey: 'home.story_3_title', descKey: 'home.story_3_desc', dir: 'right' },
];

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
          HERO SECTION
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        {/* Deep background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0b05] via-[#1a1408] to-[#0a0803]" />
        {/* Radial gold aura */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 40% 50%, rgba(212,175,55,0.07) 0%, transparent 100%)',
          }}
        />
        {/* Large rotating dharma wheel */}
        <div className="absolute right-[-4rem] top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden">
          <span
            className="text-gold rotate-sacred-slow select-none"
            style={{ fontSize: '28rem', opacity: 0.035, lineHeight: 1, display: 'block' }}
          >
            ☸
          </span>
        </div>

        {/* Floating gold orbs — depth atmosphere */}
        <div
          className="orb-glow animate-float-slow"
          style={{
            width: '520px', height: '520px',
            left: '-160px', top: '-120px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="orb-glow animate-float-delayed"
          style={{
            width: '380px', height: '380px',
            right: '4%', bottom: '-90px',
            background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
          }}
        />
        <div
          className="orb-glow animate-float"
          style={{
            width: '220px', height: '220px',
            left: '38%', top: '8%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
          }}
        />
        <SparkleOverlay count={30} />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">

            {/* Hero text */}
            <div className="max-w-2xl animate-hero-entrance">
              <p
                className="text-gold text-xs tracking-[0.4em] uppercase mb-4 font-medium"
                style={{ textShadow: '0 0 16px rgba(212,175,55,0.6)' }}
              >
                ✦ Authentic Thai Sacred Objects ✦
              </p>
              <h1 className="font-serif text-4xl md:text-6xl text-cream leading-tight mb-4">
                {t('home.hero_title')}
                <br />
                <span className="gold-shimmer">{t('home.hero_subtitle')}</span>
              </h1>
              <div className="gold-divider-flow w-24 my-6" />
              <p className="text-cream-muted text-lg leading-relaxed max-w-lg">
                {t('home.hero_desc')}
              </p>
              <div className="flex items-center gap-3 mt-6 text-gold/30 text-sm tracking-[0.6em] select-none">
                <span>✦</span><span>☸</span><span>✦</span><span>☸</span><span>✦</span>
              </div>
            </div>

            {/* Logos → Profile pages */}
            <div className="flex flex-row md:flex-col gap-8 items-center animate-logos-entrance">
              {[
                { to: '/profile/pon', src: ponLogo, alt: 'Pon' },
                { to: '/profile/sor', src: sorLogo, alt: 'Sor' },
              ].map(({ to, src, alt }) => (
                <Link key={to} to={to} className="group block relative">
                  {/* Glow ring on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: '0 0 32px rgba(212,175,55,0.45), 0 0 64px rgba(212,175,55,0.15)' }}
                  />
                  <img
                    src={src}
                    alt={alt}
                    className="relative w-28 h-28 md:w-36 md:h-36 object-contain rounded-2xl transition-all duration-500 group-hover:scale-105"
                    style={{
                      border: '1px solid rgba(212,175,55,0.18)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
                      background: 'rgba(20,16,5,0.5)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom vignette */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(10,8,3,0.7))' }}
        />
      </section>

      <div className="gold-divider-flow" />

      {/* ══════════════════════════════════════════
          STATS BAR
          ══════════════════════════════════════════ */}
      <section className="glass-nav border-b border-gold/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-gold/10">
            {[
              { value: '15+',  label: 'ปีประสบการณ์' },
              { value: '500+', label: 'ชิ้นคัดสรรแท้' },
              { value: '100%', label: 'รับประกันของแท้' },
            ].map(s => (
              <div key={s.label} className="stat-block">
                <div className="stat-value animate-count-glow">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STORY / SCROLLYTELLING SECTION
          ══════════════════════════════════════════ */}
      <section
        ref={storyRef}
        className="max-w-7xl mx-auto px-4 py-16"
      >
        {/* Section header */}
        <div
          className="text-center mb-12"
          style={REVEAL_STYLE(storyVisible)}
        >
          <p className="text-gold/50 text-xs tracking-[0.5em] uppercase mb-3">✦ {t('home.story_label')} ✦</p>
          <h2 className="font-serif text-3xl md:text-4xl text-cream">
            {t('home.story_why')} <span className="gold-shimmer">{t('appName')}</span>
          </h2>
          <div className="gold-divider-flow max-w-[140px] mx-auto mt-4" />
        </div>

        {/* Story panels — staggered left/up/right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORY_PANELS.map((p, i) => (
            <div key={i} style={REVEAL_STYLE(storyVisible, i * 0.12, p.dir)}>
              <div className="glass story-panel rounded-2xl p-7 relative overflow-hidden h-full">
                {/* Watermark number */}
                <span className="sacred-number">{String(i + 1).padStart(2, '0')}</span>
                <div className="text-4xl mb-5 select-none relative z-10">{p.icon}</div>
                <h3 className="font-serif text-gold text-lg mb-3 relative z-10">{t(p.titleKey)}</h3>
                <p className="text-cream-muted text-sm leading-relaxed relative z-10">{t(p.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="gold-divider-flow opacity-40" />

      {/* ══════════════════════════════════════════
          FILTER & SEARCH (STICKY GLASS)
          ══════════════════════════════════════════ */}
      <section className="glass-nav border-b border-gold/15 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CategoryFilter selected={category} onChange={setCategory} />
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('home.search_placeholder')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="input-field pl-10 py-2 text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream"
                >✕</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRODUCT GRID — SCROLLYTELLING STAGGER
          ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-cream-muted text-sm">
            {loading ? t('home.loading') : `${amulets.length} ${t('home.items_found')}`}
          </p>
          {(searchInput || category !== 'All') && (
            <button
              onClick={() => { setSearchInput(''); setCategory('All'); }}
              className="text-gold text-sm hover:text-gold-light transition-colors"
            >
              {t('home.clear_filters')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square" style={{ background: 'rgba(40,32,12,0.6)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded w-3/4" style={{ background: 'rgba(40,32,12,0.8)' }} />
                  <div className="h-3 rounded w-1/2" style={{ background: 'rgba(40,32,12,0.8)' }} />
                  <div className="h-4 rounded w-1/3 mt-3" style={{ background: 'rgba(40,32,12,0.8)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : amulets.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl text-charcoal-light rotate-sacred-slow">☸</span>
            <p className="font-serif text-cream text-xl mt-4">{t('home.no_items')}</p>
            <p className="text-cream-muted text-sm mt-2">{t('home.no_items_desc')}</p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {amulets.map((a, i) => (
              <div
                key={a.id}
                style={{
                  opacity: gridVisible ? 1 : 0,
                  transform: gridVisible ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.6s ease ${i * 0.05}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s`,
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
