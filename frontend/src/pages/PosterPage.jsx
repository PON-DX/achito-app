import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import useScrollReveal from '../hooks/useScrollReveal';

function RevealCard({ children, delay = 0 }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.05 });
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function PosterPage() {
  const { isAdmin } = useAuth();
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const fileRef = useRef();

  const downloadPoster = async (poster) => {
    setDownloading(poster.id);
    try {
      const res = await fetch(poster.image_url);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${poster.title.replace(/[^฀-๿a-zA-Z0-9\s]/g, '').trim() || 'poster'}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('ไม่สามารถดาวน์โหลดได้');
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    axios.get('/api/posters')
      .then(res => setPosters(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openModal = (poster = null) => {
    setForm({ title: poster?.title || '', description: poster?.description || '' });
    setFile(null);
    setPreview('');
    setModal(poster || { id: null });
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!form.title.trim()) { alert('กรุณากรอกชื่อโปสเตอร์'); return; }
    if (!modal.id && !file) { alert('กรุณาเลือกรูปโปสเตอร์'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (file) fd.append('image', file);
      if (modal.id) {
        await axios.put(`/api/posters/${modal.id}`, fd);
      } else {
        await axios.post('/api/posters', fd);
      }
      const res = await axios.get('/api/posters');
      setPosters(res.data);
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const deletePoster = async (id) => {
    if (!window.confirm('ลบโปสเตอร์นี้?')) return;
    try {
      await axios.delete(`/api/posters/${id}`);
      setPosters(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#080603]">

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 50% 10%, rgba(212,175,55,0.05) 0%, transparent 70%)',
        }}
      />

      {/* HERO */}
      <section className="relative pt-12 pb-10 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gold/50 hover:text-gold text-sm mb-10 transition-colors"
          >
            ← กลับหน้าหลัก
          </Link>

          <p className="text-gold/45 text-xs tracking-[0.55em] uppercase mb-3">อชิโต</p>
          <h1 className="font-serif text-4xl md:text-5xl text-cream mb-3">
            โปสเตอร์พระ
          </h1>
          <p className="text-cream/45 text-sm leading-relaxed">
            รวมโปสเตอร์พระเครื่องและบันทึกพิธีกรรมศักดิ์สิทธิ์
          </p>
          <div className="gold-divider-flow w-28 mx-auto mt-6" />

          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="mt-6 inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-medium transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(184,148,31,0.12))',
                border: '1px solid rgba(212,175,55,0.38)',
                color: '#D4AF37',
              }}
            >
              <span>+</span> เพิ่มโปสเตอร์
            </button>
          )}
        </div>
      </section>

      {/* POSTER GRID */}
      <section className="relative max-w-6xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="text-center py-24 text-cream/25 text-sm">กำลังโหลด...</div>
        ) : posters.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-5 select-none" style={{ opacity: 0.15 }}>🖼</p>
            <p className="text-cream/25 text-sm">ยังไม่มีโปสเตอร์</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {posters.map((poster, i) => (
              <RevealCard key={poster.id} delay={Math.min(i * 0.05, 0.3)}>
                <div
                  className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02]"
                  style={{
                    border: '1px solid rgba(212,175,55,0.1)',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.55)',
                    background: '#0d0a05',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.28)'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(0,0,0,0.65), 0 0 24px rgba(212,175,55,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.1)'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(0,0,0,0.55)'; }}
                >
                  {/* Image area */}
                  <div
                    className="relative overflow-hidden cursor-pointer"
                    style={{ aspectRatio: '3/4' }}
                    onClick={() => setLightbox(poster)}
                  >
                    <img
                      src={poster.image_url}
                      alt={poster.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'rgba(0,0,0,0.38)' }}>
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.55)', backdropFilter: 'blur(6px)' }}
                      >
                        <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                      <span className="text-cream/75 text-xs tracking-wide">ดูขนาดเต็ม</span>
                    </div>

                    {/* Download button — bottom-right corner of image */}
                    <button
                      onClick={e => { e.stopPropagation(); downloadPoster(poster); }}
                      disabled={downloading === poster.id}
                      title="ดาวน์โหลด"
                      className="absolute bottom-2 right-2 z-10 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-40"
                      style={{ background: 'rgba(8,5,1,0.88)', border: '1px solid rgba(212,175,55,0.45)', backdropFilter: 'blur(8px)' }}
                    >
                      {downloading === poster.id ? (
                        <div className="w-3.5 h-3.5 border border-gold/30 border-t-gold rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </button>

                    {/* Admin action buttons */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); openModal(poster); }}
                          title="แก้ไข"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110"
                          style={{ background: 'rgba(14,10,3,0.92)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', backdropFilter: 'blur(6px)' }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deletePoster(poster.id); }}
                          title="ลบ"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-base leading-none transition-all hover:scale-110"
                          style={{ background: 'rgba(14,10,3,0.92)', border: '1px solid rgba(220,50,50,0.35)', color: '#f87171', backdropFilter: 'blur(6px)' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3.5" style={{ borderTop: '1px solid rgba(212,175,55,0.07)' }}>
                    <h3 className="font-serif text-cream text-sm md:text-base leading-snug line-clamp-2 mb-1">
                      {poster.title}
                    </h3>
                    {poster.description && (
                      <p className="text-cream/40 text-xs leading-relaxed line-clamp-2 mb-2">{poster.description}</p>
                    )}
                    <button
                      onClick={() => downloadPoster(poster)}
                      disabled={downloading === poster.id}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                      style={{
                        background: 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        color: '#D4AF37',
                      }}
                    >
                      {downloading === poster.id ? (
                        <>
                          <div className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
                          กำลังดาวน์โหลด...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          ดาวน์โหลด
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.96)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative flex flex-col items-center w-full"
            style={{ maxWidth: '520px', maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.image_url}
              alt={lightbox.title}
              className="rounded-2xl object-contain w-full"
              style={{ maxHeight: '76vh', boxShadow: '0 16px 80px rgba(0,0,0,0.8)' }}
            />
            <div className="mt-5 text-center px-4">
              <p className="font-serif text-gold text-xl">{lightbox.title}</p>
              {lightbox.description && (
                <p className="text-cream/50 text-sm mt-2 leading-relaxed">{lightbox.description}</p>
              )}
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-cream/55 hover:text-cream transition-colors text-sm"
              style={{ background: '#1c140a', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(7px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#14100a', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.75)' }}
          >
            <h3 className="font-serif text-xl text-gold mb-5">
              {modal.id ? 'แก้ไขโปสเตอร์' : 'เพิ่มโปสเตอร์ใหม่'}
            </h3>

            {/* Image picker */}
            <div className="flex justify-center mb-4">
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer flex items-center justify-center"
                style={{ width: '200px', aspectRatio: '3/4', border: '2px dashed rgba(212,175,55,0.22)', background: 'rgba(212,175,55,0.03)' }}
                onClick={() => fileRef.current.click()}
              >
                {(preview || modal.image_url) ? (
                  <>
                    <img src={preview || modal.image_url} className="w-full h-full object-cover absolute inset-0" alt="" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs border border-white/30 px-3 py-1.5 rounded-lg">เปลี่ยนรูป</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4 text-center">
                    <span className="text-4xl select-none" style={{ opacity: 0.15 }}>🖼</span>
                    <p className="text-cream/25 text-xs leading-relaxed">คลิกเพื่อเลือกรูปโปสเตอร์<br />(แนะนำสัดส่วน 3:4)</p>
                  </div>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <label className="block text-gold/60 text-xs mb-1">ชื่อโปสเตอร์ *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50"
              placeholder="เช่น พระผงพรายสมุทร รุ่นแรก"
            />

            <label className="block text-gold/60 text-xs mb-1">รายละเอียด</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-5 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
              placeholder="รายละเอียดโปสเตอร์..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-cream/50 text-sm hover:border-white/20 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
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
