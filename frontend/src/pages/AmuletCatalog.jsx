import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import useScrollReveal from '../hooks/useScrollReveal';

const GROUPS = ['พิมพ์ใหญ่', 'พิมพ์กลาง', 'พิมพ์เล็ก', 'พิมพ์ปิดตา', 'พระประจำวัน', 'เหรียญ', 'ผ้ายันต์'];

const GROUP_META = {
  'พิมพ์ใหญ่':    { icon: '🏛️', desc: 'พิมพ์ขนาดใหญ่' },
  'พิมพ์กลาง':   { icon: '☸',  desc: 'พิมพ์ขนาดกลาง' },
  'พิมพ์เล็ก':   { icon: '✦',  desc: 'พิมพ์ขนาดเล็ก' },
  'พิมพ์ปิดตา':  { icon: '🙏', desc: 'พิมพ์ปิดตา' },
  'พระประจำวัน': { icon: '📿', desc: 'พระประจำวันเกิด' },
  'เหรียญ':      { icon: '🪙', desc: 'เหรียญมงคล' },
  'ผ้ายันต์':    { icon: '📜', desc: 'ผ้ายันต์ศักดิ์สิทธิ์' },
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%231a1408'/%3E%3Ctext x='150' y='162' font-family='serif' font-size='64' fill='%23D4AF37' text-anchor='middle' opacity='0.3'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

const EMPTY_FORM = { group_name: 'พิมพ์ใหญ่', name: '', description: '' };

const CARD_STYLE = {
  background: 'rgba(20,15,5,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(212,175,55,0.15)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

function GroupSection({ group, items, isAdmin, onAdd, onEdit, onDelete }) {
  const [ref, visible] = useScrollReveal({ threshold: 0.05 });
  const meta = GROUP_META[group] || { icon: '✦', desc: '' };

  return (
    <section
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Group header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{meta.icon}</span>
          <div>
            <h2 className="font-serif text-xl md:text-2xl text-gold leading-tight">{group}</h2>
            {meta.desc && <p className="text-gold/40 text-xs">{meta.desc}</p>}
          </div>
          <span
            className="text-gold/50 text-xs px-2 py-0.5 rounded-full"
            style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.05)' }}
          >
            {items.length} รายการ
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => onAdd(group)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
          >
            <span className="text-base leading-none">+</span>
            เพิ่มพิมพ์
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.05) 100%)' }} />

      {items.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: 'rgba(212,175,55,0.02)', border: '1px dashed rgba(212,175,55,0.12)' }}
        >
          <p className="text-gold/20 text-3xl mb-2">{meta.icon}</p>
          <p className="text-cream/25 text-sm">ยังไม่มีรายการในกลุ่มนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden group cursor-default transition-all duration-300 hover:scale-[1.03]"
              style={{
                ...CARD_STYLE,
                transitionDelay: `${idx * 0.04}s`,
              }}
            >
              <div className="relative aspect-square overflow-hidden bg-[#0d0a04]">
                <img
                  src={item.image_url || PLACEHOLDER}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={e => { e.target.src = PLACEHOLDER; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                {/* Admin controls — appear on hover */}
                {isAdmin && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onEdit(item)}
                      className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:scale-110"
                      style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}
                      title="แก้ไข"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:scale-110"
                      style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                      title="ลบ"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {/* Gold corner accents */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t border-l border-gold/20 rounded-tl pointer-events-none" />
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b border-r border-gold/20 rounded-br pointer-events-none" />
              </div>
              <div className="p-2.5">
                <p className="text-cream text-xs font-medium leading-snug line-clamp-2">{item.name}</p>
                {item.description && (
                  <p className="text-cream/40 text-[11px] mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AmuletCatalog() {
  const { isAdmin } = useAuth();
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const fetchCatalog = async () => {
    try {
      const res = await axios.get('/api/catalog');
      setCatalog(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCatalog(); }, []);

  const openAdd = (group) => {
    setForm({ ...EMPTY_FORM, group_name: group });
    setImageFile(null);
    setImagePreview('');
    setModal({ mode: 'add' });
  };

  const openEdit = (item) => {
    setForm({ group_name: item.group_name, name: item.name, description: item.description || '' });
    setImageFile(null);
    setImagePreview('');
    setModal({ mode: 'edit', item });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('กรุณากรอกชื่อพิมพ์'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('group_name', form.group_name);
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (imageFile) fd.append('image', imageFile);
      if (modal.mode === 'edit') {
        await axios.put(`/api/catalog/${modal.item.id}`, fd);
      } else {
        await axios.post('/api/catalog', fd);
      }
      await fetchCatalog();
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`ลบ "${item.name}"?`)) return;
    try {
      await axios.delete(`/api/catalog/${item.id}`);
      await fetchCatalog();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const currentImage = imagePreview || (modal?.mode === 'edit' ? modal.item?.image_url : null);

  return (
    <div className="relative min-h-screen" style={{ background: '#080603' }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 100%)' }}
      />

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-gold/50 hover:text-gold text-sm mb-8 transition-colors duration-300">
          ← กลับหน้าหลัก
        </Link>

        {/* Page header */}
        <div className="text-center mb-14 animate-hero-entrance">
          <p className="text-gold/50 text-xs tracking-[0.6em] uppercase mb-3">พระผงพรายสมุทร</p>
          <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">
            ทำเนียบ<span className="gold-shimmer">พิมพ์พระ</span>
          </h1>
          <div className="gold-divider-flow max-w-[120px] mx-auto mb-4" />
          <p className="text-cream-muted text-sm max-w-md mx-auto leading-7">
            รวมพิมพ์พระผงพรายสมุทร อชิโต ทุกแบบพิมพ์ จากพ่อท่านเจิม วัดหอยราก
          </p>
          <div className="flex items-center justify-center gap-4 mt-5 text-gold/25 tracking-[0.8em] text-sm select-none">
            <span>✦</span><span>☸</span><span>✦</span><span>☸</span><span>✦</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gold font-serif animate-pulse text-xl">กำลังโหลด...</div>
        ) : (
          <div className="space-y-14">
            {GROUPS.map(group => (
              <GroupSection
                key={group}
                group={group}
                items={catalog[group] || []}
                isAdmin={isAdmin}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#14100a', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 32px 80px rgba(0,0,0,0.75)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl text-gold">
                {modal.mode === 'edit' ? 'แก้ไขพิมพ์พระ' : 'เพิ่มพิมพ์พระ'}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="text-cream/30 hover:text-cream/70 text-xl w-7 h-7 flex items-center justify-center transition-colors"
              >✕</button>
            </div>

            {/* Image upload area */}
            <div className="mb-5">
              <label className="block text-gold/60 text-xs mb-2">รูปภาพ</label>
              <div
                onClick={() => fileRef.current.click()}
                className="relative w-full rounded-xl overflow-hidden cursor-pointer transition-all hover:border-gold/50"
                style={{ aspectRatio: '4/3', border: '2px dashed rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.03)' }}
              >
                {currentImage ? (
                  <>
                    <img src={currentImage} alt="" className="w-full h-full object-cover absolute inset-0"
                      onError={e => { e.target.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm border border-white/30 px-3 py-1.5 rounded-lg">เปลี่ยนรูป</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <span className="text-gold/25 text-4xl">☸</span>
                    <p className="text-cream/25 text-xs">คลิกเพื่อเลือกรูปภาพ</p>
                    <p className="text-cream/15 text-[10px]">JPG, PNG, WEBP · สูงสุด 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Group selector (add mode only) */}
            <label className="block text-gold/60 text-xs mb-1">กลุ่มพิมพ์</label>
            <select
              value={form.group_name}
              onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}
              disabled={modal.mode === 'edit'}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50 disabled:opacity-50"
            >
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <label className="block text-gold/60 text-xs mb-1">ชื่อพิมพ์ *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-4 focus:outline-none focus:border-gold/50"
              placeholder="เช่น พิมพ์ใหญ่ อาจารย์ทิม"
            />

            <label className="block text-gold/60 text-xs mb-1">คำอธิบาย</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm mb-5 focus:outline-none focus:border-gold/50 resize-none leading-relaxed"
              placeholder="รายละเอียดพิมพ์..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
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
