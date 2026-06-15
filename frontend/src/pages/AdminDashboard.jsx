import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';

const CATEGORIES = ['Powder', 'Metal', 'Statues', 'Monk', 'Talisman', 'Frame', 'Case', 'Necklace', 'Accessory'];
const EMPTY_FORM = { name: '', category: 'Powder', temple: '', batch_version: '', year: '', price: '', status: 'available', description: '', stock: '' };
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%230e0b03'/%3E%3Ctext x='100' y='115' font-family='serif' font-size='60' fill='%23D4AF37' text-anchor='middle' opacity='0.25'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

const ORDER_STATUS_STYLE = {
  pending:   { bg: 'rgba(180,130,0,0.15)',   border: 'rgba(180,130,0,0.4)',   text: '#f5c842' },
  confirmed: { bg: 'rgba(30,80,200,0.15)',   border: 'rgba(80,120,240,0.4)',  text: '#7eaaff' },
  shipped:   { bg: 'rgba(120,40,200,0.15)',  border: 'rgba(160,80,240,0.4)', text: '#c084fc' },
  delivered: { bg: 'rgba(10,120,60,0.18)',   border: 'rgba(40,200,110,0.35)',text: '#4ade80' },
  cancelled: { bg: 'rgba(160,20,20,0.18)',   border: 'rgba(240,80,80,0.35)', text: '#f87171' },
};

/* ── Shared helpers ──────────────────────────────────────────────────────── */
const G = {
  pkg:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  list:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  edit:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  plus:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  search:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  upload:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  img:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

function DarkInput({ label, type = 'text', as: Tag = 'input', children, className = '', ...props }) {
  const base = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(212,175,55,0.14)',
    borderRadius: '10px',
    color: '#f5f0e8',
    fontSize: '13px',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
  };
  return (
    <div className={className}>
      {label && <label style={{ display: 'block', fontSize: '10px', color: 'rgba(212,175,55,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      {Tag === 'input'
        ? <input type={type} style={base} onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.06)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,0.14)'; e.target.style.boxShadow = 'none'; }} {...props} />
        : <Tag style={{ ...base, resize: 'none' }} onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.06)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(212,175,55,0.14)'; e.target.style.boxShadow = 'none'; }} {...props}>{children}</Tag>
      }
    </div>
  );
}

/* ── Amulet Modal ────────────────────────────────────────────────────────── */
function AmuletModal({ item, onClose, onSaved, t }) {
  const [form, setForm] = useState(item
    ? { ...EMPTY_FORM, ...item, year: item.year || '', price: item.price || '', stock: item.stock ?? '' }
    : { ...EMPTY_FORM });
  const [previews, setPreviews] = useState(item?.images?.length ? item.images : item?.image_url ? [item.image_url] : []);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const applyFiles = (files) => {
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setNewFiles(imgs);
    setPreviews(imgs.map(f => URL.createObjectURL(f)));
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); applyFiles(Array.from(e.dataTransfer.files)); };

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

  const modalBg = { background: '#0c0904', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.5)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl" style={modalBg}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 sticky top-0 z-10 rounded-t-2xl" style={{ background: '#0c0904', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <div>
            <h2 className="font-serif text-xl text-cream">{item ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
            <p style={{ fontSize: '11px', color: 'rgba(212,175,55,0.4)', marginTop: '2px' }}>กรอกข้อมูลให้ครบถ้วนแล้วกดบันทึก</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-7 py-6 space-y-5">
            {error && <div style={{ background: 'rgba(200,40,40,0.12)', border: '1px solid rgba(200,60,60,0.35)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13 }}>{error}</div>}

            {/* Image upload — drag & drop */}
            <div>
              <p style={{ fontSize: '10px', color: 'rgba(212,175,55,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>รูปภาพสินค้า</p>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current.click()}
                style={{
                  borderRadius: 12, border: `2px dashed ${dragging ? 'rgba(212,175,55,0.65)' : 'rgba(212,175,55,0.18)'}`,
                  background: dragging ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
                  padding: 20, textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color .2s, background .2s',
                }}
              >
                {previews.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {previews.map((p, i) => (
                      <img key={i} src={p} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(212,175,55,0.2)' }} onError={e => { e.target.src = PLACEHOLDER; }} alt="" />
                    ))}
                    <div style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(212,175,55,0.4)', fontSize: 22 }}>+</div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ width: 40, height: 40, margin: '0 auto 10px', color: 'rgba(212,175,55,0.2)' }}>{G.upload}</div>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>ลากรูปมาวางที่นี่ หรือคลิกเพื่อเลือก</p>
                    <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11, marginTop: 4 }}>JPG · PNG · WEBP — เลือกได้หลายรูป</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => applyFiles(Array.from(e.target.files))} className="hidden" />
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DarkInput className="sm:col-span-2" label="ชื่อพระ *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="เช่น พระผงพรายสมุทร รุ่นแรก" />
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(212,175,55,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>หมวดหมู่</p>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 10, color: '#f5f0e8', fontSize: 13, padding: '10px 14px', width: '100%', outline: 'none' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0c0904' }}>{t(`categories.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(212,175,55,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>สถานะ</p>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 10, color: '#f5f0e8', fontSize: 13, padding: '10px 14px', width: '100%', outline: 'none' }}>
                  <option value="available" style={{ background: '#0c0904' }}>{t('status.available')}</option>
                  <option value="sold_out"  style={{ background: '#0c0904' }}>{t('status.sold_out')}</option>
                </select>
              </div>
              <DarkInput label="วัด / สำนัก" value={form.temple}        onChange={e => setForm(p => ({ ...p, temple: e.target.value }))} placeholder="เช่น วัดสุทธิวาส" />
              <DarkInput label="รุ่น / พิมพ์"  value={form.batch_version} onChange={e => setForm(p => ({ ...p, batch_version: e.target.value }))} placeholder="เช่น รุ่นแรก" />
              <DarkInput label="ปี พ.ศ."    type="number" value={form.year}  onChange={e => setForm(p => ({ ...p, year: e.target.value }))} placeholder="เช่น 2563" />
              <DarkInput label="ราคา (บาท) *" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required placeholder="0" />
              <DarkInput label="จำนวนคงเหลือ" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="ว่างไว้ = ไม่จำกัด" />
              <DarkInput as="textarea" className="sm:col-span-2" label="รายละเอียด" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="คุณสมบัติ ประวัติ ความศักดิ์สิทธิ์..." />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-7 pb-7">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', background: 'none', fontSize: 13, cursor: 'pointer', transition: 'border-color .2s' }}>ยกเลิก</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: saving ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#0a0803', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', border: 'none' }}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Admin Modal ─────────────────────────────────────────────────────── */
function AddAdminModal({ onClose, onSaved, t }) {
  const [form, setForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try { await axios.post('/api/users', form); onSaved(); }
    catch (err) { setError(err.response?.data?.error || 'ไม่สามารถสร้าง Admin ได้'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: '#0c0904', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 40px 100px rgba(0,0,0,0.85)' }}>
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <h2 className="font-serif text-xl text-cream">{t('admin.new_admin_title')}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {error && <div style={{ background: 'rgba(200,40,40,0.12)', border: '1px solid rgba(200,60,60,0.35)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <DarkInput label={t('auth.first_name')} value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
            <DarkInput label={t('auth.last_name')}  value={form.last_name}  onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
          </div>
          <DarkInput label={`${t('auth.username')} *`} required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          <DarkInput label={t('auth.email')} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <DarkInput label={`${t('auth.password')} *`} type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="อย่างน้อย 6 ตัวอักษร" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', background: 'none', fontSize: 13, cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#0a0803', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              {saving ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Order Modal ─────────────────────────────────────────────────────────── */
function OrderModal({ order, onClose, onSaved, t }) {
  const [form, setForm] = useState({ status: order.status, tracking_number: order.tracking_number || '' });
  const [saving, setSaving] = useState(false);
  const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await axios.put(`/api/orders/${order.id}`, form); onSaved(); }
    catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl" style={{ background: '#0c0904', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 40px 100px rgba(0,0,0,0.85)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <div>
            <h2 className="font-serif text-lg text-cream">{t('admin.update_status')}</h2>
            <p style={{ fontSize: '11px', color: 'rgba(212,175,55,0.4)', marginTop: 2 }}>คำสั่งซื้อ #{order.id}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(212,175,55,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>สถานะ</p>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 10, color: '#f5f0e8', fontSize: 13, padding: '10px 14px', width: '100%', outline: 'none' }}>
              {STATUSES.map(s => <option key={s} value={s} style={{ background: '#0c0904' }}>{t(`status.${s}`)}</option>)}
            </select>
          </div>
          <DarkInput label={t('admin.tracking_label')} value={form.tracking_number} onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))} placeholder="EF123456789TH" />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', background: 'none', fontSize: 13, cursor: 'pointer' }}>ยกเลิก</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#0a0803', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              {saving ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirm ──────────────────────────────────────────────────────── */
function DeleteConfirm({ target, onClose, onConfirm, deleting, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-7" style={{ background: '#0c0904', border: '1px solid rgba(220,50,50,0.25)', boxShadow: '0 40px 100px rgba(0,0,0,0.85)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(220,50,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#f87171' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
        </div>
        <h2 className="font-serif text-xl text-cream mb-2">{t('common.confirm')}</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('admin.delete_msg')} <span style={{ color: '#f5f0e8', fontWeight: 600 }}>"{target.name}"</span>?<br />
          <span style={{ color: 'rgba(248,113,113,0.7)', fontSize: 12 }}>{t('admin.delete_warn')}</span>
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', background: 'none', fontSize: 13, cursor: 'pointer' }}>{t('common.cancel')}</button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(200,40,40,0.85)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            {deleting ? '...' : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState('products');
  const [amulets, setAmulets] = useState([]);
  const [users, setUsers]     = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, u, o] = await Promise.all([axios.get('/api/products'), axios.get('/api/users'), axios.get('/api/orders')]);
      setAmulets(p.data); setUsers(u.data); setOrders(o.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteAmulet = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await axios.delete(`/api/products/${deleteTarget.id}`); setDeleteTarget(null); fetchAll(); showToast('ลบเรียบร้อยแล้ว'); }
    catch { showToast('ลบไม่สำเร็จ'); }
    finally { setDeleting(false); }
  };

  const handleDeleteUser = async (userId) => {
    try { await axios.delete(`/api/users/${userId}`); fetchAll(); showToast('ลบผู้ใช้แล้ว'); }
    catch (err) { showToast(err.response?.data?.error || 'ไม่สำเร็จ'); }
  };

  const toggleStatus = async (a) => {
    const newStatus = a.status === 'available' ? 'sold_out' : 'available';
    try { await axios.put(`/api/products/${a.id}`, { ...a, status: newStatus }); fetchAll(); }
    catch { showToast('อัปเดตไม่สำเร็จ'); }
  };

  const filteredAmulets = amulets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || (a.temple || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(o =>
    String(o.id).includes(search) || (o.username || '').toLowerCase().includes(search.toLowerCase()) || (o.full_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()));

  const NAV = [
    { key: 'products', label: 'สินค้า',      icon: G.pkg,   count: amulets.length },
    { key: 'orders',   label: 'คำสั่งซื้อ',  icon: G.list,  count: orders.length },
    { key: 'users',    label: 'ผู้ใช้',       icon: G.users, count: users.length },
  ];

  const STATS = [
    { label: 'สินค้าทั้งหมด',  value: amulets.length,                                    color: '#D4AF37' },
    { label: 'พร้อมขาย',       value: amulets.filter(a => a.status === 'available').length, color: '#4ade80' },
    { label: 'คำสั่งซื้อ',     value: orders.length,                                       color: '#7eaaff' },
    { label: 'สมาชิกทั้งหมด', value: users.length,                                         color: '#c084fc' },
  ];

  const sidebarStyle = {
    background: 'linear-gradient(180deg, #0a0703 0%, #080502 100%)',
    borderRight: '1px solid rgba(212,175,55,0.1)',
    width: 220,
    flexShrink: 0,
    position: 'sticky',
    top: 64,
    height: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  };

  const pageLabel = NAV.find(n => n.key === tab)?.label || '';

  return (
    <div style={{ display: 'flex', background: '#0a0803', minHeight: 'calc(100vh - 64px)' }}>

      {/* ── SIDEBAR (desktop) ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col" style={sidebarStyle}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', marginBottom: 4 }}>Admin Panel</p>
          <p className="font-serif" style={{ fontSize: 18, color: '#D4AF37', lineHeight: 1.2 }}>อชิโต</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>Achito Amulet Shop</p>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map(n => {
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setTab(n.key); setSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '11px 14px', borderRadius: 10, marginBottom: 3,
                  background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                  borderLeft: `2px solid ${active ? '#D4AF37' : 'transparent'}`,
                  color: active ? '#D4AF37' : 'rgba(255,255,255,0.38)',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all .2s',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 18, height: 18, flexShrink: 0 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                <span style={{ fontSize: 10, background: active ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)', color: active ? '#D4AF37' : 'rgba(255,255,255,0.25)', padding: '1px 7px', borderRadius: 999 }}>
                  {n.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(212,175,55,0.07)' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>Luxury Amulet Dashboard</p>
        </div>
      </aside>

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          padding: '16px 24px', position: 'sticky', top: 64, zIndex: 20,
          background: 'rgba(10,8,3,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
        }}>
          <div>
            <h1 className="font-serif" style={{ fontSize: 22, color: '#f5f0e8' }}>{pageLabel}</h1>
            <p style={{ fontSize: 11, color: 'rgba(212,175,55,0.4)', marginTop: 2 }}>Achito Admin · จัดการ{pageLabel}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.2)' }}>{G.search}</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.14)', color: '#f5f0e8', fontSize: 12, outline: 'none', width: 180 }}
              />
            </div>

            {/* Action button */}
            {tab === 'products' && (
              <button onClick={() => setModal('add')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#0a0803', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
                <span style={{ width: 14, height: 14 }}>{G.plus}</span>
                เพิ่มสินค้า
              </button>
            )}
            {tab === 'users' && (
              <button onClick={() => setModal('add-admin')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#0a0803', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                <span style={{ width: 14, height: 14 }}>{G.plus}</span>
                {t('admin.add_admin')}
              </button>
            )}
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden flex" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: '#0a0703' }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => { setTab(n.key); setSearch(''); }}
              style={{ flex: 1, padding: '12px 8px', fontSize: 11, fontWeight: tab === n.key ? 700 : 400, color: tab === n.key ? '#D4AF37' : 'rgba(255,255,255,0.3)', borderBottom: `2px solid ${tab === n.key ? '#D4AF37' : 'transparent'}`, background: 'none', border: 'none', cursor: 'pointer' }}>
              {n.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px 40px' }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }} className="grid-cols-2 sm:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} style={{
                background: 'rgba(20,15,5,0.7)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(212,175,55,0.1)', borderRadius: 14, padding: '18px 20px',
                boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.06), 0 4px 20px rgba(0,0,0,0.35)',
              }}>
                <p className="font-serif" style={{ fontSize: 32, color: s.color, lineHeight: 1, fontWeight: 700, marginBottom: 6, textShadow: `0 0 24px ${s.color}44` }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ display: 'inline-block', width: 36, height: 36, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* ─── Products ─── */}
              {tab === 'products' && (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.1)', background: 'rgba(14,10,3,0.6)' }}>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.04)' }}>
                          {['สินค้า', 'หมวดหมู่', 'วัด', 'ปี', 'ราคา', 'คงเหลือ', 'สถานะ', ''].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAmulets.map((a, idx) => (
                          <tr key={a.id}
                            style={{ borderBottom: '1px solid rgba(212,175,55,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                          >
                            {/* Name + thumbnail */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={a.image_url || PLACEHOLDER} alt={a.name} onError={e => { e.target.src = PLACEHOLDER; }}
                                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(212,175,55,0.18)', flexShrink: 0 }} />
                                <span style={{ color: '#f5f0e8', fontWeight: 500, maxWidth: 180, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{a.name}</span>
                              </div>
                            </td>
                            {/* Category */}
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', whiteSpace: 'nowrap' }}>
                                {t(`categories.${a.category}`) || a.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)', maxWidth: 130 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.temple || '—'}</span></td>
                            <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{a.year || '—'}</td>
                            <td style={{ padding: '12px 16px', color: '#D4AF37', fontWeight: 600, whiteSpace: 'nowrap' }}>฿{Number(a.price).toLocaleString()}</td>
                            {/* Stock */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {a.stock === null || a.stock === undefined
                                ? <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>∞</span>
                                : <span style={{ color: a.stock <= 5 ? '#f87171' : '#f5f0e8', fontWeight: a.stock <= 5 ? 700 : 400 }}>{a.stock}</span>}
                            </td>
                            {/* Status toggle */}
                            <td style={{ padding: '12px 16px' }}>
                              <button onClick={() => toggleStatus(a)}
                                style={{
                                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                  background: a.status === 'available' ? 'rgba(10,120,60,0.2)' : 'rgba(160,20,20,0.2)',
                                  border: `1px solid ${a.status === 'available' ? 'rgba(40,200,110,0.4)' : 'rgba(240,80,80,0.35)'}`,
                                  color: a.status === 'available' ? '#4ade80' : '#f87171',
                                  transition: 'all .2s',
                                }}>
                                {t(`status.${a.status}`)}
                              </button>
                            </td>
                            {/* Actions */}
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button onClick={() => setModal({ type: 'edit', data: a })} title="แก้ไข"
                                  style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)', color: 'rgba(212,175,55,0.65)', cursor: 'pointer', transition: 'all .2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.16)'; e.currentTarget.style.color = '#D4AF37'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.07)'; e.currentTarget.style.color = 'rgba(212,175,55,0.65)'; }}>
                                  <span style={{ width: 14, height: 14 }}>{G.edit}</span>
                                </button>
                                <button onClick={() => setDeleteTarget(a)} title="ลบ"
                                  style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(200,40,40,0.07)', border: '1px solid rgba(200,60,60,0.18)', color: 'rgba(248,113,113,0.55)', cursor: 'pointer', transition: 'all .2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.18)'; e.currentTarget.style.color = '#f87171'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.07)'; e.currentTarget.style.color = 'rgba(248,113,113,0.55)'; }}>
                                  <span style={{ width: 14, height: 14 }}>{G.trash}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredAmulets.length === 0 && (
                          <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="lg:hidden divide-y" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                    {filteredAmulets.map(a => (
                      <div key={a.id} style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                          <img src={a.image_url || PLACEHOLDER} alt={a.name} onError={e => { e.target.src = PLACEHOLDER; }}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(212,175,55,0.18)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#f5f0e8', fontWeight: 500, fontSize: 13, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                            <p style={{ color: '#D4AF37', fontSize: 14, fontWeight: 600 }}>฿{Number(a.price).toLocaleString()}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => toggleStatus(a)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: a.status === 'available' ? 'rgba(10,120,60,0.2)' : 'rgba(160,20,20,0.2)', border: `1px solid ${a.status === 'available' ? 'rgba(40,200,110,0.4)' : 'rgba(240,80,80,0.35)'}`, color: a.status === 'available' ? '#4ade80' : '#f87171' }}>
                            {t('common.toggle_status')}
                          </button>
                          <button onClick={() => setModal({ type: 'edit', data: a })} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>{t('common.edit')}</button>
                          <button onClick={() => setDeleteTarget(a)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(200,40,40,0.1)', border: '1px solid rgba(200,60,60,0.25)', color: '#f87171' }}>{t('common.delete')}</button>
                        </div>
                      </div>
                    ))}
                    {filteredAmulets.length === 0 && <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</p>}
                  </div>
                </div>
              )}

              {/* ─── Orders ─── */}
              {tab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredOrders.length === 0
                    ? <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</p>
                    : filteredOrders.map(o => {
                        const st = ORDER_STATUS_STYLE[o.status] || {};
                        return (
                          <div key={o.id} style={{ borderRadius: 14, border: '1px solid rgba(212,175,55,0.1)', background: 'rgba(20,15,5,0.65)', backdropFilter: 'blur(12px)', padding: '16px 20px', boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.06)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <p style={{ fontSize: 10, color: 'rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>คำสั่งซื้อ</p>
                                <p className="font-serif" style={{ fontSize: 22, color: '#D4AF37', lineHeight: 1 }}>#{o.id}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>ลูกค้า</p>
                                <p style={{ color: '#f5f0e8', fontSize: 13, fontWeight: 500 }}>{o.full_name || '—'}</p>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{o.username}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>วันที่</p>
                                <p style={{ color: '#f5f0e8', fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString('th-TH')}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>ยอดรวม</p>
                                <p style={{ color: '#D4AF37', fontSize: 16, fontWeight: 700 }}>฿{Number(o.total_price).toLocaleString()}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: st.bg, border: `1px solid ${st.border}`, color: st.text, whiteSpace: 'nowrap' }}>
                                  {t(`status.${o.status}`)}
                                </span>
                                {o.tracking_number && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{o.tracking_number}</span>}
                                <button onClick={() => setModal({ type: 'order', data: o })}
                                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', whiteSpace: 'nowrap' }}>
                                  {t('admin.update_status')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* ─── Users ─── */}
              {tab === 'users' && (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.1)', background: 'rgba(14,10,3,0.6)' }}>
                  <div className="hidden md:block overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.04)' }}>
                          {['Username', 'Email', 'ชื่อ', 'Role', 'สมัครเมื่อ', ''].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(212,175,55,0.5)', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, idx) => (
                          <tr key={u.id}
                            style={{ borderBottom: '1px solid rgba(212,175,55,0.06)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                          >
                            <td style={{ padding: '12px 16px', color: '#f5f0e8', fontWeight: 500 }}>{u.username}</td>
                            <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)' }}>{u.email || '—'}</td>
                            <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.35)' }}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, background: u.role === 'admin' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`, color: u.role === 'admin' ? '#D4AF37' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <button onClick={() => handleDeleteUser(u.id)} title="ลบ"
                                style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(200,40,40,0.07)', border: '1px solid rgba(200,60,60,0.18)', color: 'rgba(248,113,113,0.55)', cursor: 'pointer', transition: 'all .2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.18)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,40,40,0.07)'; e.currentTarget.style.color = 'rgba(248,113,113,0.55)'; }}>
                                <span style={{ width: 14, height: 14 }}>{G.trash}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{t('common.no_data')}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden divide-y" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                    {filteredUsers.map(u => (
                      <div key={u.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <p style={{ color: '#f5f0e8', fontWeight: 500, fontSize: 13 }}>{u.username}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{u.email || '—'}</p>
                          <span style={{ marginTop: 5, display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 999, background: u.role === 'admin' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${u.role === 'admin' ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`, color: u.role === 'admin' ? '#D4AF37' : 'rgba(255,255,255,0.35)' }}>{u.role}</span>
                        </div>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: 'rgba(200,40,40,0.1)', border: '1px solid rgba(200,60,60,0.25)', color: '#f87171' }}>{t('common.delete')}</button>
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

      {/* ── MODALS ────────────────────────────────────────────── */}
      {modal === 'add'         && <AmuletModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('เพิ่มสินค้าแล้ว!'); }} t={t} />}
      {modal?.type === 'edit'  && <AmuletModal item={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('อัปเดตแล้ว!'); }} t={t} />}
      {modal === 'add-admin'   && <AddAdminModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('สร้าง Admin แล้ว!'); }} t={t} />}
      {modal?.type === 'order' && <OrderModal order={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('อัปเดตคำสั่งซื้อแล้ว!'); }} t={t} />}
      {deleteTarget && <DeleteConfirm target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteAmulet} deleting={deleting} t={t} />}

      {/* ── TOAST ─────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 12, background: 'rgba(16,12,4,0.96)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
          ✦ {toast}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
