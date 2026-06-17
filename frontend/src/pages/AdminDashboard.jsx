import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['Powder', 'Metal', 'Statues', 'Monk', 'Talisman', 'Frame', 'Case', 'Necklace', 'Accessory'];
const EMPTY_FORM = { name: '', category: 'Powder', temple: '', batch_version: '', year: '', price: '', status: 'available', description: '', stock: '' };
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%230e0b03'/%3E%3Ctext x='100' y='115' font-size='60' fill='%23D4AF37' text-anchor='middle' opacity='0.3'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

/* ── icons ── */
const IcBox   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>;
const IcCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IcUsers = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IcEdit  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const IcPlus  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const IcSearch= () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>;
const IcUpload= () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{width:'100%',height:'100%'}}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;


/* ── shared input ── */
function DarkInput({ label, as: Tag = 'input', type = 'text', className = '', children, ...p }) {
  const s = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.15)',
    borderRadius: 10, color: '#f5f0e8', fontSize: 13, padding: '10px 14px', outline: 'none',
  };
  return (
    <div className={className}>
      {label && <label style={{ display: 'block', fontSize: 10, color: 'rgba(212,175,55,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</label>}
      {Tag === 'input'
        ? <input type={type} style={s} onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.07)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,0.15)'; e.target.style.boxShadow = 'none'; }} {...p} />
        : <Tag style={{ ...s, resize: 'none' }} onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.07)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,0.15)'; e.target.style.boxShadow = 'none'; }} {...p}>{children}</Tag>
      }
    </div>
  );
}

/* ── Amulet Modal — luxury full-panel ── */
function AmuletModal({ item, onClose, onSaved, t }) {
  const [form, setForm]         = useState(item ? { ...EMPTY_FORM, ...item, year: item.year || '', price: item.price || '', stock: item.stock ?? '' } : { ...EMPTY_FORM });
  const [previews, setPreviews] = useState(item?.images?.length ? item.images : item?.image_url ? [item.image_url] : []);
  const [activeImg, setActiveImg] = useState(0);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [drag, setDrag]         = useState(false);
  const fileRef = useRef();

  const applyFiles = (files) => {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setNewFiles(imgs);
    setPreviews(imgs.map(f => URL.createObjectURL(f)));
    setActiveImg(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v ?? ''));
    newFiles.forEach(f => data.append('images', f));
    try {
      if (item) await axios.put(`/api/products/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else       await axios.post('/api/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const labelStyle = { display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', marginBottom: 7, fontWeight: 600 };
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.16)', borderRadius: 10, color: '#f5f0e8', fontSize: 13, padding: '11px 15px', outline: 'none', transition: 'border-color .2s, box-shadow .2s' };
  const onFocus = e => { e.target.style.borderColor = 'rgba(212,175,55,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)'; };
  const onBlur  = e => { e.target.style.borderColor = 'rgba(212,175,55,0.16)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(18px)', padding: '12px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{
        width: '100%', maxWidth: 960,
        maxHeight: '96vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 22,
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#130f06 0%,#0b0803 100%)',
        border: '1px solid rgba(212,175,55,0.28)',
        boxShadow: '0 0 80px rgba(212,175,55,0.07), 0 60px 180px rgba(0,0,0,0.97), inset 0 1px 0 rgba(212,175,55,0.12)',
      }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', flexShrink: 0, background: 'linear-gradient(90deg,rgba(212,175,55,0.1) 0%,rgba(212,175,55,0.02) 60%,transparent)', borderBottom: '1px solid rgba(212,175,55,0.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 3, height: 32, borderRadius: 2, background: 'linear-gradient(180deg,#D4AF37,#8a6010)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginBottom: 4 }}>☸ อชิโต · {item ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</p>
              <h2 className="font-serif" style={{ fontSize: 24, color: '#f5f0e8', lineHeight: 1 }}>{item ? item.name || 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>✕</button>
        </div>

        {/* ── BODY ── */}
        <form id="amulet-form" onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* LEFT PANEL — image area */}
          <div className="hidden md:flex flex-col" style={{ width: 340, flexShrink: 0, borderRight: '1px solid rgba(212,175,55,0.12)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', padding: 20, gap: 14 }}>

            {/* main preview */}
            <div
              onDrop={e => { e.preventDefault(); setDrag(false); applyFiles(Array.from(e.dataTransfer.files)); }}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onClick={() => fileRef.current.click()}
              style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s', border: drag ? '2px solid rgba(212,175,55,0.7)' : '1px solid rgba(212,175,55,0.2)', boxShadow: drag ? '0 0 30px rgba(212,175,55,0.2)' : '0 8px 32px rgba(0,0,0,0.6)', aspectRatio: '3/4', background: '#0a0702', flexShrink: 0 }}>
              {previews.length > 0 ? (
                <>
                  <img src={previews[activeImg] || previews[0]} alt="preview" onError={e => { e.target.src = PLACEHOLDER; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {/* overlay on hover */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>คลิกเพื่อเปลี่ยนรูป</span>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'radial-gradient(ellipse at center,rgba(212,175,55,0.05),transparent)' }}>
                  <div style={{ width: 52, height: 52, color: 'rgba(212,175,55,0.25)' }}><IcUpload /></div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>ลากรูปมาวางที่นี่</p>
                    <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>หรือคลิกเพื่อเลือก</p>
                    <p style={{ color: 'rgba(212,175,55,0.3)', fontSize: 10, marginTop: 8, letterSpacing: '0.1em' }}>JPG · PNG · WEBP</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => applyFiles(Array.from(e.target.files))} style={{ display: 'none' }} />

            {/* thumbnails row */}
            {previews.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {previews.map((p, i) => (
                  <div key={i} onClick={() => setActiveImg(i)} style={{ position: 'relative', width: 56, height: 56, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeImg === i ? '#D4AF37' : 'rgba(212,175,55,0.18)'}`, boxShadow: activeImg === i ? '0 0 12px rgba(212,175,55,0.35)' : 'none', transition: 'all .2s', flexShrink: 0 }}>
                    <img src={p} onError={e => { e.target.src = PLACEHOLDER; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                  </div>
                ))}
                {/* add more */}
                <div onClick={() => fileRef.current.click()} style={{ width: 56, height: 56, borderRadius: 10, border: '1px dashed rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(212,175,55,0.4)', fontSize: 22, flexShrink: 0, transition: 'border-color .2s' }}>+</div>
              </div>
            )}

            {/* upload btn (always visible) */}
            <button type="button" onClick={() => fileRef.current.click()}
              style={{ width: '100%', padding: '11px', borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}>
              <span style={{ width: 15, height: 15 }}><IcUpload /></span>
              {previews.length > 0 ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
            </button>

            {/* price preview card */}
            {form.name && (
              <div style={{ borderRadius: 14, padding: '16px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', marginTop: 4 }}>
                <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', marginBottom: 8 }}>ตัวอย่างสินค้า</p>
                <p style={{ fontSize: 13, color: '#f5f0e8', fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{form.name}</p>
                {form.temple && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>วัด{form.temple}</p>}
                {form.price && <p style={{ fontSize: 20, color: '#D4AF37', fontWeight: 800 }}>฿{Number(form.price).toLocaleString()}</p>}
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  {form.category && <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{form.category}</span>}
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: form.status === 'available' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${form.status === 'available' ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`, color: form.status === 'available' ? '#34d399' : '#f87171' }}>
                    {form.status === 'available' ? 'มีสินค้า' : 'หมดแล้ว'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — form */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 13 }}>{error}</div>}

            {/* mobile upload (shows on small screens) */}
            <div className="md:hidden">
              <label style={labelStyle}>รูปภาพสินค้า</label>
              <div onClick={() => fileRef.current.click()} style={{ borderRadius: 12, border: `2px dashed rgba(212,175,55,0.22)`, background: 'rgba(212,175,55,0.02)', padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                {previews.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {previews.map((p, i) => <img key={i} src={p} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(212,175,55,0.25)' }} onError={e => { e.target.src = PLACEHOLDER; }} alt="" />)}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>แตะเพื่อเลือกรูป</p>
                )}
              </div>
            </div>

            {/* Section: ข้อมูลพระ */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.14)' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', fontWeight: 700, whiteSpace: 'nowrap' }}>ข้อมูลพระ</span>
                <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.14)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>ชื่อพระ *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} onFocus={onFocus} onBlur={onBlur} placeholder="เช่น พระผงพรายสมุทร รุ่นแรก" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>วัด / สำนัก</label>
                    <input value={form.temple} onChange={e => setForm(p => ({ ...p, temple: e.target.value }))} onFocus={onFocus} onBlur={onBlur} placeholder="เช่น วัดสุทธิวาส" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>รุ่น / พิมพ์</label>
                    <input value={form.batch_version} onChange={e => setForm(p => ({ ...p, batch_version: e.target.value }))} onFocus={onFocus} onBlur={onBlur} placeholder="เช่น รุ่นแรก" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>รายละเอียด / ประวัติ</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} onFocus={onFocus} onBlur={onBlur} rows={4} placeholder="คุณสมบัติ ประวัติ ความศักดิ์สิทธิ์ ที่มา..." style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} />
                </div>
              </div>
            </div>

            {/* Section: จัดหมวดหมู่ */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.14)' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', fontWeight: 700, whiteSpace: 'nowrap' }}>จัดหมวดหมู่</span>
                <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.14)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>หมวดหมู่</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} onFocus={onFocus} onBlur={onBlur} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#100d05' }}>{t(`categories.${c}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ปี พ.ศ.</label>
                  <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} onFocus={onFocus} onBlur={onBlur} placeholder="2563" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Section: ราคาและสต็อก */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.14)' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', fontWeight: 700, whiteSpace: 'nowrap' }}>ราคา & สต็อก</span>
                <div style={{ height: 1, flex: 1, background: 'rgba(212,175,55,0.14)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / span 1' }}>
                  <label style={labelStyle}>ราคา (บาท) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#D4AF37', fontWeight: 700, fontSize: 14, pointerEvents: 'none' }}>฿</span>
                    <input required type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} onFocus={onFocus} onBlur={onBlur} placeholder="0" style={{ ...inputStyle, paddingLeft: 28 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>คงเหลือ</label>
                  <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} onFocus={onFocus} onBlur={onBlur} placeholder="∞" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>สถานะ</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} onFocus={onFocus} onBlur={onBlur} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="available" style={{ background: '#100d05' }}>มีสินค้า</option>
                    <option value="sold_out"  style={{ background: '#100d05' }}>หมดแล้ว</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ── FOOTER ── */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 28px', borderTop: '1px solid rgba(212,175,55,0.12)', background: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ padding: '12px 24px', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>
            ยกเลิก
          </button>
          <button
            type="submit"
            form="amulet-form"
            disabled={saving}
            style={{ flex: 1, padding: '12px', borderRadius: 12, background: saving ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#D4AF37 0%,#c9a227 40%,#B8941F 100%)', color: '#06030c', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', boxShadow: saving ? 'none' : '0 6px 28px rgba(212,175,55,0.4), 0 0 0 1px rgba(212,175,55,0.3)', letterSpacing: '0.04em', transition: 'all .2s' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '0 8px 36px rgba(212,175,55,0.55), 0 0 0 1px rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = saving ? 'none' : '0 6px 28px rgba(212,175,55,0.4), 0 0 0 1px rgba(212,175,55,0.3)'; }}>
            {saving ? '⏳  กำลังบันทึก...' : item ? '✦  บันทึกการแก้ไข' : '✦  เพิ่มสินค้า'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Admin Modal ── */
function AddAdminModal({ onClose, onSaved, t }) {
  const [form, setForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try { await axios.post('/api/users', form); onSaved(); }
    catch (err) { setError(err.response?.data?.error || 'ไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl"
        style={{ background: 'linear-gradient(180deg,#100d05,#0a0802)', border: '1px solid rgba(212,175,55,0.22)', boxShadow: '0 48px 120px rgba(0,0,0,0.9)' }}>
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <h2 className="font-serif" style={{ fontSize: 19, color: '#f5f0e8' }}>{t('admin.new_admin_title')}</h2>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {error && <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <DarkInput label={t('auth.first_name')} value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
            <DarkInput label={t('auth.last_name')}  value={form.last_name}  onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
          </div>
          <DarkInput label={`${t('auth.username')} *`} required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          <DarkInput label={t('auth.email')} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <DarkInput label={`${t('auth.password')} *`} type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="อย่างน้อย 6 ตัวอักษร" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#06030c', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              {saving ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Order Modal ── */

/* ── Delete Confirm ── */
function DeleteConfirm({ target, onClose, onConfirm, deleting, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-7"
        style={{ background: 'linear-gradient(180deg,#100d05,#0a0802)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 60px rgba(239,68,68,0.08), 0 48px 100px rgba(0,0,0,0.9)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: '#f87171' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 26, height: 26 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        </div>
        <h2 className="font-serif" style={{ fontSize: 20, color: '#f5f0e8', marginBottom: 8 }}>{t('common.confirm')}</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 22 }}>
          {t('admin.delete_msg')} <span style={{ color: '#f5f0e8', fontWeight: 600 }}>"{target.name}"</span>?{' '}
          <br /><span style={{ color: 'rgba(248,113,113,0.65)', fontSize: 12 }}>{t('admin.delete_warn')}</span>
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>{t('common.cancel')}</button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            {deleting ? '...' : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── small helpers ── */
const TH = ({ children }) => (
  <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.55)', fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</th>
);

function IconBtn({ onClick, title, icon, color = '#D4AF37', hoverBg = 'rgba(212,175,55,0.18)' }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hov ? hoverBg : 'rgba(255,255,255,0.04)', border: `1px solid ${hov ? color + '55' : 'rgba(255,255,255,0.08)'}`, color: hov ? color : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all .18s' }}>
      <span style={{ width: 15, height: 15 }}>{icon}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { t } = useLang();
  const { user, token } = useAuth();
  const [tab, setTab]         = useState('products');
  const [amulets, setAmulets]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sales, setSales] = useState({ sold_count: 0, total_value: 0 });
  const [modal, setModal]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  const fetchAll = async (currentUser = user, currentToken = token) => {
    if (!currentUser || !currentToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${currentToken}` };
      const seller  = encodeURIComponent(currentUser.username);
      const [p, u, s] = await Promise.all([
        axios.get(`/api/products?seller=${seller}`, { headers }),
        axios.get('/api/users', { headers }),
        axios.get(`/api/products/sales-summary?seller=${seller}`, { headers }),
      ]);
      setAmulets(p.data); setUsers(u.data); setSales(s.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user && token) fetchAll(user, token);
  }, [user, token]);

  const handleDeleteAmulet = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await axios.delete(`/api/products/${deleteTarget.id}`); setDeleteTarget(null); fetchAll(); showToast('ลบสินค้าแล้ว'); }
    catch { showToast('ลบไม่สำเร็จ'); }
    finally { setDeleting(false); }
  };

  const handleDeleteUser = async (id) => {
    try { await axios.delete(`/api/users/${id}`); fetchAll(); showToast('ลบผู้ใช้แล้ว'); }
    catch (err) { showToast(err.response?.data?.error || 'ไม่สำเร็จ'); }
  };

  const toggleStatus = async (a) => {
    try { await axios.put(`/api/products/${a.id}`, { ...a, status: a.status === 'available' ? 'sold_out' : 'available' }); fetchAll(); }
    catch { showToast('อัปเดตไม่สำเร็จ'); }
  };

  const s = search.toLowerCase();
  const filteredAmulets = amulets.filter(a => a.name.toLowerCase().includes(s) || (a.temple || '').toLowerCase().includes(s));
  const filteredUsers   = users.filter(u => u.username.toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));

  const NAV_ITEMS = [
    { key: 'products', label: 'สินค้า', icon: <IcBox />,   count: amulets.length },
    { key: 'users',    label: 'ผู้ใช้',  icon: <IcUsers />, count: users.length },
  ];

  const STATS = [
    { label: 'สินค้าของฉัน', value: amulets.length,                                       icon: <IcBox />,   color: '#D4AF37', glow: 'rgba(212,175,55,0.25)', grad: 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.04))', line: 'linear-gradient(90deg,#D4AF37,#a07818)' },
    { label: 'พร้อมขาย',       value: amulets.filter(a => a.status === 'available').length, icon: <IcCheck />, color: '#34d399', glow: 'rgba(52,211,153,0.2)',   grad: 'linear-gradient(135deg,rgba(52,211,153,0.14),rgba(52,211,153,0.03))', line: 'linear-gradient(90deg,#34d399,#059669)' },
    { label: 'สมาชิกทั้งหมด', value: users.length,                                          icon: <IcUsers />, color: '#a78bfa', glow: 'rgba(167,139,250,0.2)',  grad: 'linear-gradient(135deg,rgba(167,139,250,0.14),rgba(167,139,250,0.03))', line: 'linear-gradient(90deg,#a78bfa,#7c3aed)' },
  ];

  const pageLabel = NAV_ITEMS.find(n => n.key === tab)?.label || '';

  return (
    <>
      <style>{`
        @keyframes spin2 { to { transform: rotate(360deg); } }
        .adm-row:hover { background: rgba(212,175,55,0.05) !important; }
        .adm-row:hover td:first-child { border-left: 2px solid rgba(212,175,55,0.6) !important; }
        .adm-sidebar-item:hover { background: rgba(255,255,255,0.04) !important; color: rgba(255,255,255,0.7) !important; }
      `}</style>

      <div style={{ display: 'flex', background: '#080603', minHeight: 'calc(100vh - 64px)' }}>

        {/* ══ SIDEBAR ══════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col" style={{
          width: 230, flexShrink: 0,
          background: 'linear-gradient(180deg,#0d0a04 0%,#080602 100%)',
          borderRight: '1px solid rgba(212,175,55,0.12)',
          position: 'sticky', top: 64, height: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}>
          {/* logo */}
          <div style={{ padding: '26px 22px 20px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#D4AF37' }}>☸</div>
              <div>
                <p className="font-serif" style={{ fontSize: 16, color: '#D4AF37', lineHeight: 1.1 }}>อชิโต</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</p>
              </div>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(212,175,55,0.35),transparent)' }} />
          </div>

          {/* nav */}
          <nav style={{ padding: '14px 12px', flex: 1 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.3)', padding: '0 10px 10px', fontWeight: 700 }}>เมนูหลัก</p>
            {NAV_ITEMS.map(n => {
              const active = tab === n.key;
              return (
                <button key={n.key} className={active ? '' : 'adm-sidebar-item'} onClick={() => { setTab(n.key); setSearch(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                    padding: '11px 14px', borderRadius: 11, marginBottom: 4,
                    background: active ? 'linear-gradient(90deg,rgba(212,175,55,0.18),rgba(212,175,55,0.06))' : 'transparent',
                    borderLeft: active ? '3px solid #D4AF37' : '3px solid transparent',
                    color: active ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    cursor: 'pointer', border: 'none',
                    boxShadow: active ? 'inset 0 1px 0 rgba(212,175,55,0.12)' : 'none',
                    borderLeft: active ? '3px solid #D4AF37' : '3px solid transparent',
                    transition: 'all .2s',
                    textAlign: 'left',
                  }}>
                  <span style={{ width: 18, height: 18, flexShrink: 0, filter: active ? `drop-shadow(0 0 4px rgba(212,175,55,0.5))` : 'none' }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    minWidth: 22, padding: '2px 7px', borderRadius: 999, textAlign: 'center',
                    background: active ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)',
                    color: active ? '#D4AF37' : 'rgba(255,255,255,0.25)',
                  }}>{n.count}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(212,175,55,0.08)', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Luxury Amulet Dashboard</p>
          </div>
        </aside>

        {/* ══ MAIN CONTENT ═════════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* top header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            padding: '18px 28px',
            position: 'sticky', top: 64, zIndex: 20,
            background: 'rgba(8,6,3,0.94)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(212,175,55,0.12)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', marginBottom: 3 }}>Achito Admin · จัดการ{pageLabel}</p>
              <h1 className="font-serif" style={{ fontSize: 24, color: '#f5f0e8', lineHeight: 1 }}>{pageLabel}</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.22)', pointerEvents: 'none' }}><IcSearch /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..."
                  style={{ paddingLeft: 33, paddingRight: 12, height: 38, width: 190, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.18)', color: '#f5f0e8', fontSize: 13, outline: 'none' }} />
              </div>

              {tab === 'products' && (
                <button onClick={() => setModal('add')}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, paddingLeft: 16, paddingRight: 18, borderRadius: 10, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#06030c', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 20px rgba(212,175,55,0.35), 0 0 0 1px rgba(212,175,55,0.3)', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 14, height: 14 }}><IcPlus /></span> เพิ่มสินค้า
                </button>
              )}
              {tab === 'users' && (
                <button onClick={() => setModal('add-admin')}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, paddingLeft: 16, paddingRight: 18, borderRadius: 10, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#06030c', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
                  <span style={{ width: 14, height: 14 }}><IcPlus /></span> {t('admin.add_admin')}
                </button>
              )}
            </div>
          </div>

          {/* mobile tab bar */}
          <div className="md:hidden flex" style={{ background: '#0c0902', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
            {NAV_ITEMS.map(n => (
              <button key={n.key} onClick={() => { setTab(n.key); setSearch(''); }}
                style={{ flex: 1, padding: '11px 6px', fontSize: 12, fontWeight: tab === n.key ? 700 : 400, color: tab === n.key ? '#D4AF37' : 'rgba(255,255,255,0.3)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === n.key ? '#D4AF37' : 'transparent'}`, cursor: 'pointer', transition: 'all .2s' }}>
                {n.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px 28px 48px' }}>

            {/* ── STATS ── */}
            <div style={{ display: 'grid', gap: 16, marginBottom: 28, gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))' }}>
              {STATS.map(s => (
                <div key={s.label} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '20px 20px 18px', background: 'linear-gradient(145deg,rgba(18,13,4,0.98),rgba(10,7,2,0.99))', border: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.line, borderRadius: '16px 16px 0 0' }} />
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: s.color, opacity: 0.06, filter: 'blur(30px)', pointerEvents: 'none' }} />
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: s.grad, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, padding: 10 }}>{s.icon}</div>
                  </div>
                  <p style={{ fontSize: 42, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 6, textShadow: `0 0 40px ${s.glow}` }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>{s.label}</p>
                </div>
              ))}

              {/* ── Sales Summary card ── */}
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: '20px 20px 18px', background: 'linear-gradient(145deg,rgba(18,13,4,0.98),rgba(10,7,2,0.99))', border: '1px solid rgba(212,175,55,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: '16px 16px 0 0' }} />
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: '#f59e0b', opacity: 0.06, filter: 'blur(30px)', pointerEvents: 'none' }} />
                <div style={{ marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,rgba(245,158,11,0.16),rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', padding: 10 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: '100%', height: '100%' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <p style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b', lineHeight: 1, textShadow: '0 0 40px rgba(245,158,11,0.3)' }}>{sales.sold_count}</p>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>ชิ้น</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 4 }}>฿{Number(sales.total_value).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>ยอดขายของฉัน</p>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <div style={{ width: 40, height: 40, border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin2 .9s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* ────────── Products ────────── */}
                {tab === 'products' && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(12,9,3,0.7)', backdropFilter: 'blur(10px)' }}>
                    {/* desktop table */}
                    <div className="hidden lg:block" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(212,175,55,0.06)', borderBottom: '1px solid rgba(212,175,55,0.14)' }}>
                            <TH>สินค้า</TH><TH>หมวดหมู่</TH><TH>วัด</TH><TH>ราคา</TH><TH>คงเหลือ</TH><TH>สถานะ</TH><TH></TH>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAmulets.map((a, i) => (
                            <tr key={a.id} className="adm-row" style={{ borderBottom: '1px solid rgba(212,175,55,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)', transition: 'background .15s' }}>
                              <td style={{ padding: '13px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                                  <img src={a.image_url || PLACEHOLDER} alt={a.name} onError={e => { e.target.src = PLACEHOLDER; }}
                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(212,175,55,0.22)', flexShrink: 0, background: '#0e0b03' }} />
                                  <div>
                                    <p style={{ color: '#f5f0e8', fontWeight: 500, fontSize: 13, lineHeight: 1.35, maxWidth: 200, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.name}</p>
                                    {a.batch_version && <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginTop: 1 }}>{a.batch_version}</p>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '13px 18px' }}>
                                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '4px 11px', borderRadius: 999, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', whiteSpace: 'nowrap' }}>
                                  {t(`categories.${a.category}`) || a.category}
                                </span>
                              </td>
                              <td style={{ padding: '13px 18px', color: 'rgba(255,255,255,0.35)', fontSize: 12, maxWidth: 130 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.temple || '—'}</span></td>
                              <td style={{ padding: '13px 18px', color: '#D4AF37', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>฿{Number(a.price).toLocaleString()}</td>
                              <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                                {a.stock == null
                                  ? <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, lineHeight: 1 }}>∞</span>
                                  : <span style={{ color: a.stock <= 5 ? '#f87171' : '#e2d9c8', fontWeight: a.stock <= 5 ? 700 : 400, fontSize: 13 }}>{a.stock}</span>}
                              </td>
                              <td style={{ padding: '13px 18px' }}>
                                <button onClick={() => toggleStatus(a)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '5px 13px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: a.status === 'available' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                                    border: `1px solid ${a.status === 'available' ? 'rgba(52,211,153,0.45)' : 'rgba(248,113,113,0.4)'}`,
                                    color: a.status === 'available' ? '#34d399' : '#f87171',
                                    boxShadow: `0 0 10px ${a.status === 'available' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)'}`,
                                    transition: 'all .2s',
                                  }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'available' ? '#34d399' : '#f87171', flexShrink: 0 }} />
                                  {t(`status.${a.status}`)}
                                </button>
                              </td>
                              <td style={{ padding: '13px 18px' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <IconBtn onClick={() => setModal({ type: 'edit', data: a })} title="แก้ไข" icon={<IcEdit />} color="#D4AF37" hoverBg="rgba(212,175,55,0.14)" />
                                  <IconBtn onClick={() => setDeleteTarget(a)} title="ลบ" icon={<IcTrash />} color="#f87171" hoverBg="rgba(248,113,113,0.14)" />
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredAmulets.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* mobile cards */}
                    <div className="lg:hidden">
                      {filteredAmulets.map(a => (
                        <div key={a.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                            <img src={a.image_url || PLACEHOLDER} alt={a.name} onError={e => { e.target.src = PLACEHOLDER; }}
                              style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(212,175,55,0.22)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: '#f5f0e8', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                              <p style={{ color: '#D4AF37', fontSize: 15, fontWeight: 700, marginTop: 2 }}>฿{Number(a.price).toLocaleString()}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            <button onClick={() => toggleStatus(a)} style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: a.status === 'available' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${a.status === 'available' ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.35)'}`, color: a.status === 'available' ? '#34d399' : '#f87171' }}>
                              {t(`status.${a.status}`)}
                            </button>
                            <button onClick={() => setModal({ type: 'edit', data: a })} style={{ padding: '8px 14px', borderRadius: 9, fontSize: 11, cursor: 'pointer', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)', color: '#D4AF37' }}>แก้ไข</button>
                            <button onClick={() => setDeleteTarget(a)} style={{ padding: '8px 14px', borderRadius: 9, fontSize: 11, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>ลบ</button>
                          </div>
                        </div>
                      ))}
                      {filteredAmulets.length === 0 && <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</p>}
                    </div>
                  </div>
                )}

                {/* ────────── Users ────────── */}
                {tab === 'users' && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(12,9,3,0.7)' }}>
                    <div className="hidden md:block" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(212,175,55,0.06)', borderBottom: '1px solid rgba(212,175,55,0.14)' }}>
                            <TH>ผู้ใช้</TH><TH>Email</TH><TH>ชื่อ</TH><TH>Role</TH><TH>วันที่สมัคร</TH><TH></TH>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u, i) => (
                            <tr key={u.id} className="adm-row" style={{ borderBottom: '1px solid rgba(212,175,55,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)', transition: 'background .15s' }}>
                              <td style={{ padding: '13px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                    {u.username[0].toUpperCase()}
                                  </div>
                                  <span style={{ color: '#f5f0e8', fontWeight: 500, fontSize: 13 }}>{u.username}</span>
                                </div>
                              </td>
                              <td style={{ padding: '13px 18px', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{u.email || '—'}</td>
                              <td style={{ padding: '13px 18px', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                              <td style={{ padding: '13px 18px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: u.role === 'admin' ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.06)', border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'}`, color: u.role === 'admin' ? '#D4AF37' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {u.role}
                                </span>
                              </td>
                              <td style={{ padding: '13px 18px', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                              <td style={{ padding: '13px 18px' }}>
                                <IconBtn onClick={() => handleDeleteUser(u.id)} title="ลบ" icon={<IcTrash />} color="#f87171" hoverBg="rgba(248,113,113,0.14)" />
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden">
                      {filteredUsers.map(u => (
                        <div key={u.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(212,175,55,0.08)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontSize: 14, fontWeight: 700 }}>{u.username[0].toUpperCase()}</div>
                            <div>
                              <p style={{ color: '#f5f0e8', fontWeight: 500, fontSize: 13 }}>{u.username}</p>
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{u.email || '—'}</p>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: u.role === 'admin' ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.06)', border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`, color: u.role === 'admin' ? '#D4AF37' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', display: 'inline-block', marginTop: 4 }}>{u.role}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '7px 14px', borderRadius: 9, fontSize: 11, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', whiteSpace: 'nowrap' }}>ลบ</button>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</p>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ MODALS ═══════════════════════════════════════════ */}
        {modal === 'add'         && <AmuletModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('เพิ่มสินค้าแล้ว!'); }} t={t} />}
        {modal?.type === 'edit'  && <AmuletModal item={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('อัปเดตสินค้าแล้ว!'); }} t={t} />}
        {modal === 'add-admin'   && <AddAdminModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('สร้าง Admin แล้ว!'); }} t={t} />}
        {deleteTarget && <DeleteConfirm target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteAmulet} deleting={deleting} t={t} />}

        {/* ══ TOAST ════════════════════════════════════════════ */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 22px', borderRadius: 14, background: 'rgba(12,9,3,0.97)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', fontSize: 13, fontWeight: 600, boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(212,175,55,0.08)', backdropFilter: 'blur(16px)' }}>
            <span style={{ fontSize: 16 }}>✦</span> {toast}
          </div>
        )}
      </div>
    </>
  );
}
