import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SparkleOverlay from '../components/SparkleOverlay';
import useScrollReveal from '../hooks/useScrollReveal';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSiteContent } from '../hooks/useSiteContent';
import ponLogo from '../assets/images/pon.png';

const REVEAL = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(28px)',
  transition: `opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
});

export default function ProfilePon() {
  const { t } = useLang();
  const { isAdmin } = useAuth();
  const { content, loading, refetch } = useSiteContent('profile_pon');
  const [bioRef, bioVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [contactRef, contactVisible] = useScrollReveal();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', tagline: '', bio: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const openEdit = () => {
    setForm({
      name: content.name || t('profile_pon.name'),
      tagline: content.tagline || t('profile_pon.tagline'),
      bio: content.bio || t('profile_pon.bio'),
    });
    setImageFile(null);
    setImagePreview(null);
    setEditing(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(form));
      if (imageFile) fd.append('image', imageFile);
      await axios.put('/api/content/profile_pon', fd);
      await refetch();
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const displayImage = content.image_url || ponLogo;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080603]">
      <div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0d0b05] via-[#1a1408] to-[#0a0803]" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 100%)' }}
      />
      <SparkleOverlay count={20} />

      {/* Admin edit button */}
      {isAdmin && (
        <button
          onClick={openEdit}
          className="fixed top-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          แก้ไข
        </button>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-gold/50 hover:text-gold text-sm mb-10 transition-colors duration-300">
          {t('profile.back')}
        </Link>

        {/* Hero Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-12 text-center mb-6 animate-hero-entrance">
          <p className="text-gold/30 text-2xl tracking-[1em] mb-6 rotate-sacred-slow inline-block">☸</p>

          <div className="relative inline-block mb-6">
            <div className="absolute inset-[-6px] rounded-full animate-sacred-aura" style={{ borderRadius: '50%' }} />
            <img
              src={displayImage}
              alt="Pon"
              className="relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-2 border-gold/40"
              style={{ boxShadow: '0 0 50px rgba(212,175,55,0.35), 0 0 100px rgba(212,175,55,0.1)' }}
            />
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-cream mb-1">
            {content.name || t('profile_pon.name')}
          </h1>
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-1">{t('profile.role')}</p>
          <p className="text-cream-muted text-xs tracking-wider">Amulet Specialist · 专业佛牌鉴定师</p>

          <div className="gold-divider-flow max-w-[160px] mx-auto my-6" />

          <p className="text-cream/70 text-sm italic leading-relaxed">
            {content.tagline || t('profile_pon.tagline')}
          </p>
        </div>

        {/* Bio */}
        <div ref={bioRef} className="glass rounded-2xl p-8 mb-6" style={REVEAL(bioVisible)}>
          <h2 className="font-serif text-gold text-xl mb-4 flex items-center gap-3">
            <span className="text-gold/40">✦</span> {t('profile.bio_title')}
          </h2>
          <p className="text-cream-muted leading-relaxed text-sm md:text-base">
            {content.bio || t('profile_pon.bio')}
          </p>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="grid grid-cols-3 gap-4 mb-6" style={REVEAL(statsVisible, 0.1)}>
          {[
            { icon: '☸', label: t('profile_pon.stat_1_label'), value: t('profile_pon.stat_1_value') },
            { icon: '✦', label: t('profile_pon.stat_2_label'), value: t('profile_pon.stat_2_value') },
            { icon: '❋', label: t('profile_pon.stat_3_label'), value: t('profile_pon.stat_3_value') },
          ].map((s, i) => (
            <div key={i} className="glass rounded-xl p-4 text-center" style={{ transitionDelay: `${i * 0.08}s` }}>
              <p className="text-gold text-xl mb-1">{s.icon}</p>
              <p className="text-cream font-serif text-sm leading-tight">{s.value}</p>
              <p className="text-cream-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div ref={contactRef} className="glass-strong rounded-2xl p-8 text-center" style={REVEAL(contactVisible, 0.05)}>
          <p className="text-gold/50 text-xs tracking-[0.4em] uppercase mb-2">{t('profile.contact_title')}</p>
          <p className="text-cream-muted text-sm mb-6">{t('profile.contact_desc')}</p>
          <a
            href="https://www.facebook.com/share/1Msx46aT6c/?mibextid=wwXIfr"
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

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#14100a', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
          >
            <h3 className="font-serif text-xl text-gold mb-5">แก้ไขโปรไฟล์ — พล</h3>

            {/* Image */}
            <div className="mb-5 text-center">
              <img
                src={imagePreview || displayImage}
                alt="preview"
                className="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-2 border-gold/30"
              />
              <button
                onClick={() => fileRef.current.click()}
                className="text-gold/70 hover:text-gold text-xs border border-gold/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                เปลี่ยนรูปโปรไฟล์
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <label className="block text-gold/60 text-xs mb-1">ชื่อ</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50"
            />

            <label className="block text-gold/60 text-xs mb-1">Tagline</label>
            <input
              value={form.tagline}
              onChange={e => setForm({ ...form, tagline: e.target.value })}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50"
            />

            <label className="block text-gold/60 text-xs mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows={5}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-5 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-cream/50 text-sm hover:border-white/20 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#0a0803' }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
