import React from 'react';
import { Link } from 'react-router-dom';
import SparkleOverlay from '../components/SparkleOverlay';
import useScrollReveal from '../hooks/useScrollReveal';
import { useLang } from '../contexts/LanguageContext';
import sorLogo from '../assets/images/sor.png';

const REVEAL = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(28px)',
  transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
});

export default function ProfileSor() {
  const { t } = useLang();
  const [bioRef, bioVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [contactRef, contactVisible] = useScrollReveal();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Fixed background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0a0d05] via-[#141a08] to-[#080a03]" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 100%)',
        }}
      />
      <SparkleOverlay count={20} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gold/50 hover:text-gold text-sm mb-10 transition-colors duration-300"
        >
          {t('profile.back')}
        </Link>

        {/* ── Hero Card ─────────────────────────── */}
        <div className="glass-strong rounded-3xl p-8 md:p-12 text-center mb-6 animate-hero-entrance">
          {/* Sacred symbol above */}
          <p className="text-gold/30 text-2xl tracking-[1em] mb-6 rotate-sacred-slow inline-block">☸</p>

          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div
              className="absolute inset-[-6px] rounded-full animate-sacred-aura"
              style={{ borderRadius: '50%' }}
            />
            <img
              src={sorLogo}
              alt="Sor"
              className="relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-2 border-gold/40"
              style={{ boxShadow: '0 0 50px rgba(212,175,55,0.35), 0 0 100px rgba(212,175,55,0.1)' }}
            />
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-cream mb-1">
            {t('profile_sor.name')}
          </h1>
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-1">
            {t('profile.role')}
          </p>
          <p className="text-cream-muted text-xs tracking-wider">
            Amulet Specialist · 专业佛牌鉴定师
          </p>

          <div className="gold-divider-flow max-w-[160px] mx-auto my-6" />

          <p className="text-cream/70 text-sm italic leading-relaxed">
            {t('profile_sor.tagline')}
          </p>
        </div>

        {/* ── Bio Section ─────────────────────────── */}
        <div
          ref={bioRef}
          className="glass rounded-2xl p-8 mb-6"
          style={REVEAL(bioVisible)}
        >
          <h2 className="font-serif text-gold text-xl mb-4 flex items-center gap-3">
            <span className="text-gold/40">✦</span> {t('profile.bio_title')}
          </h2>
          <p className="text-cream-muted leading-relaxed text-sm md:text-base">
            {t('profile_sor.bio')}
          </p>
        </div>

        {/* ── Stats ─────────────────────────── */}
        <div
          ref={statsRef}
          className="grid grid-cols-3 gap-4 mb-6"
          style={REVEAL(statsVisible, 0.1)}
        >
          {[
            { icon: '☸', label: t('profile_sor.stat_1_label'), value: t('profile_sor.stat_1_value') },
            { icon: '✦', label: t('profile_sor.stat_2_label'), value: t('profile_sor.stat_2_value') },
            { icon: '❋', label: t('profile_sor.stat_3_label'), value: t('profile_sor.stat_3_value') },
          ].map((s, i) => (
            <div
              key={i}
              className="glass rounded-xl p-4 text-center"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <p className="text-gold text-xl mb-1">{s.icon}</p>
              <p className="text-cream font-serif text-sm leading-tight">{s.value}</p>
              <p className="text-cream-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Contact ─────────────────────────── */}
        <div
          ref={contactRef}
          className="glass-strong rounded-2xl p-8 text-center"
          style={REVEAL(contactVisible, 0.05)}
        >
          <p className="text-gold/50 text-xs tracking-[0.4em] uppercase mb-2">{t('profile.contact_title')}</p>
          <p className="text-cream-muted text-sm mb-6">
            {t('profile.contact_desc')}
          </p>
          <a
            href="https://www.facebook.com/share/1Ma34JZ9yf/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center gap-3 px-8 py-3 text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t('profile.fb_btn')}
          </a>
        </div>
      </div>
    </div>
  );
}
