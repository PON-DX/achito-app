import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';

const CATEGORIES = ['Powder', 'Metal', 'Statues', 'Monk', 'Talisman', 'Frame', 'Case', 'Necklace', 'Accessory'];
const EMPTY_FORM = { name: '', category: 'Powder', temple: '', batch_version: '', year: '', price: '', status: 'available', description: '', stock: '', image: null };
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%232D2D2D'/%3E%3Ctext x='100' y='108' font-family='serif' font-size='48' fill='%23D4AF37' text-anchor='middle'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";
const STATUS_COLOR = { pending:'bg-yellow-900/60 text-yellow-300 border-yellow-700', confirmed:'bg-blue-900/60 text-blue-300 border-blue-700', shipped:'bg-purple-900/60 text-purple-300 border-purple-700', delivered:'bg-emerald-900/60 text-emerald-300 border-emerald-700', cancelled:'bg-red-900/60 text-red-300 border-red-700' };

// ─── Amulet Modal ─────────────────────────────────────────────────────────────
function AmuletModal({ item, onClose, onSaved, t }) {
  const [form, setForm] = useState(item ? { ...EMPTY_FORM, ...item, image: null, year: item.year || '', price: item.price || '', stock: item.stock ?? '' } : { ...EMPTY_FORM });
  const [previews, setPreviews] = useState(item?.image_url ? [item.image_url] : []);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setNewFiles(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (k !== 'image') data.append(k, v ?? ''); });
    newFiles.forEach(f => data.append('images', f));
    try {
      if (item) await axios.put(`/api/products/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await axios.post('/api/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-dark/80 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-charcoal border border-charcoal-light rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-light sticky top-0 bg-charcoal z-10">
          <h2 className="font-serif text-xl text-cream">{item ? t('common.edit') : t('admin.add_amulet')}</h2>
          <button onClick={onClose} className="text-cream-muted hover:text-cream text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}
          <div>
            <label className="label">{t('admin.modal_image')}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {previews.map((p, i) => (
                <img key={i} src={p} className="w-16 h-16 object-cover rounded border border-charcoal-light" onError={e => { e.target.src = PLACEHOLDER; }} alt="" />
              ))}
              <div
                onClick={() => fileRef.current.click()}
                className="w-16 h-16 border-2 border-dashed border-charcoal-light hover:border-gold rounded cursor-pointer flex items-center justify-center transition-colors"
                title="เลือกรูปภาพ (เลือกได้หลายรูป)"
              >
                <span className="text-gold text-2xl leading-none">+</span>
              </div>
            </div>
            <p className="text-charcoal-light text-xs">{t('admin.modal_image_hint')} — เลือกได้หลายรูป</p>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">{t('admin.modal_name')}</label><input name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="input-field" /></div>
            <div><label className="label">{t('admin.modal_category')}</label><select name="category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">{CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}</select></div>
            <div><label className="label">{t('admin.modal_status')}</label><select name="status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field"><option value="available">{t('status.available')}</option><option value="sold_out">{t('status.sold_out')}</option></select></div>
            <div><label className="label">{t('admin.modal_temple')}</label><input value={form.temple} onChange={e => setForm(p => ({ ...p, temple: e.target.value }))} className="input-field" /></div>
            <div><label className="label">{t('admin.modal_batch')}</label><input value={form.batch_version} onChange={e => setForm(p => ({ ...p, batch_version: e.target.value }))} className="input-field" /></div>
            <div><label className="label">{t('admin.modal_year')}</label><input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className="input-field" /></div>
            <div><label className="label">{t('admin.modal_price')}</label><input type="number" min="0" required value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input-field" /></div>
            <div><label className="label">{t('admin.modal_stock')}</label><input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className="input-field" placeholder="∞" /></div>
            <div className="sm:col-span-2"><label className="label">{t('admin.modal_desc')}</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-charcoal-light">
            <button type="button" onClick={onClose} className="btn-outline-gold px-5">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-gold px-8">{saving ? '...' : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Admin Modal ───────────────────────────────────────────────────────────
function AddAdminModal({ onClose, onSaved, t }) {
  const [form, setForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await axios.post('/api/users', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create admin.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-dark/80 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-charcoal border border-charcoal-light rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-light">
          <h2 className="font-serif text-xl text-cream">{t('admin.new_admin_title')}</h2>
          <button onClick={onClose} className="text-cream-muted hover:text-cream text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('auth.first_name')}</label><input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="input-field" /></div>
            <div><label className="label">{t('auth.last_name')}</label><input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="input-field" /></div>
          </div>
          <div><label className="label">{t('auth.username')} *</label><input required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="input-field" /></div>
          <div><label className="label">{t('auth.email')}</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" /></div>
          <div><label className="label">{t('auth.password')} *</label><input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" placeholder="อย่างน้อย 6 ตัวอักษร" /></div>
          <div className="flex gap-3 justify-end pt-2 border-t border-charcoal-light">
            <button type="button" onClick={onClose} className="btn-outline-gold px-5">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-gold px-8">{saving ? '...' : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Order Update Modal ────────────────────────────────────────────────────────
function OrderModal({ order, onClose, onSaved, t }) {
  const [form, setForm] = useState({ status: order.status, tracking_number: order.tracking_number || '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await axios.put(`/api/orders/${order.id}`, form); onSaved(); }
    catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  return (
    <div className="fixed inset-0 z-50 bg-charcoal-dark/80 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-charcoal border border-charcoal-light rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-light">
          <h2 className="font-serif text-lg text-cream">{t('admin.update_status')} #{order.id}</h2>
          <button onClick={onClose} className="text-cream-muted hover:text-cream text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">{t('common.status')}</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
              {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('admin.tracking_label')}</label>
            <input value={form.tracking_number} onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))} className="input-field" placeholder="EF123456789TH" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-outline-gold px-4">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-gold px-6">{saving ? '...' : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState('products');
  const [amulets, setAmulets] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

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
    try { await axios.delete(`/api/products/${deleteTarget.id}`); setDeleteTarget(null); fetchAll(); showToast('Deleted.'); }
    catch { showToast('Delete failed.'); }
    finally { setDeleting(false); }
  };

  const handleDeleteUser = async (userId) => {
    try { await axios.delete(`/api/users/${userId}`); fetchAll(); showToast('User deleted.'); }
    catch (err) { showToast(err.response?.data?.error || 'Failed.'); }
  };

  const toggleStatus = async (a) => {
    const newStatus = a.status === 'available' ? 'sold_out' : 'available';
    try { await axios.put(`/api/products/${a.id}`, { ...a, status: newStatus }); fetchAll(); }
    catch { showToast('Update failed.'); }
  };

  const filteredAmulets = amulets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || (a.temple || '').toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter(o => String(o.id).includes(search) || (o.username || '').toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { key: 'products', label: t('admin.products_tab') },
    { key: 'orders', label: t('admin.orders_tab') },
    { key: 'users', label: t('admin.users_tab') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-charcoal border border-gold rounded-lg px-5 py-3 text-cream text-sm shadow-gold-lg">{toast}</div>}

      {/* Modals */}
      {modal === 'add' && <AmuletModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('Saved!'); }} t={t} />}
      {modal?.type === 'edit' && <AmuletModal item={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('Updated!'); }} t={t} />}
      {modal === 'add-admin' && <AddAdminModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('Admin created!'); }} t={t} />}
      {modal?.type === 'order' && <OrderModal order={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast('Order updated!'); }} t={t} />}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-charcoal-dark/80 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-red-900 rounded-xl w-full max-w-md p-6">
            <h2 className="font-serif text-xl text-cream mb-2">{t('common.confirm')}</h2>
            <p className="text-cream-muted text-sm mb-6">{t('admin.delete_msg')} <span className="text-cream">"{deleteTarget.name}"</span>? {t('admin.delete_warn')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-outline-gold px-5">{t('common.cancel')}</button>
              <button onClick={handleDeleteAmulet} disabled={deleting} className="btn-danger">{deleting ? '...' : t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-cream">{t('admin.title')}</h1>
          <p className="text-cream-muted text-sm mt-1">{t('admin.subtitle')}</p>
        </div>
        {tab === 'products' && <button onClick={() => setModal('add')} className="btn-gold flex items-center gap-2"><span>+</span>{t('admin.add_amulet')}</button>}
        {tab === 'users' && <button onClick={() => setModal('add-admin')} className="btn-gold flex items-center gap-2">{t('admin.add_admin')}</button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('admin.total_listings'), value: amulets.length },
          { label: t('status.available'), value: amulets.filter(a => a.status === 'available').length },
          { label: t('admin.orders_tab'), value: orders.length },
          { label: t('admin.users_tab'), value: users.length },
        ].map(s => (
          <div key={s.label} className="bg-charcoal border border-charcoal-light rounded-lg px-4 py-3">
            <p className="font-serif text-2xl text-gold">{s.value}</p>
            <p className="text-cream-muted text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-charcoal-dark/50 p-1 rounded-lg w-fit">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setSearch(''); }}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${tab === tb.key ? 'bg-gold text-charcoal-dark shadow' : 'text-cream-muted hover:text-cream'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder={t('admin.filter_placeholder')} value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gold font-serif animate-pulse">{t('common.loading')}</div>
      ) : (
        <>
          {/* ─── Products Tab ─── */}
          {tab === 'products' && (
            <div className="overflow-hidden rounded-xl border border-charcoal-light">
              <table className="w-full text-sm hidden lg:table">
                <thead><tr className="bg-charcoal border-b border-charcoal-light">
                  {[t('admin.col_amulet'), t('admin.col_category'), t('admin.col_temple'), t('admin.col_year'), t('admin.col_price'), t('admin.col_stock'), t('admin.col_status'), t('admin.col_actions')].map(h => <th key={h} className="text-left px-4 py-3 text-cream-muted font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredAmulets.map((a, idx) => (
                    <tr key={a.id} className={`border-b border-charcoal-light hover:bg-charcoal-light/20 transition-colors ${idx % 2 === 0 ? 'bg-charcoal-dark/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={a.image_url || PLACEHOLDER} alt={a.name} className="w-10 h-10 object-cover rounded border border-charcoal-light flex-shrink-0" onError={e => { e.target.src = PLACEHOLDER; }} />
                          <span className="text-cream font-medium line-clamp-1 max-w-[180px]">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="border border-gold/40 text-gold text-xs px-2 py-0.5 rounded-full">{a.category}</span></td>
                      <td className="px-4 py-3 text-cream-muted max-w-[140px] truncate">{a.temple || '—'}</td>
                      <td className="px-4 py-3 text-cream-muted">{a.year || '—'}</td>
                      <td className="px-4 py-3 text-right text-gold font-medium">฿{Number(a.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        {a.stock === null || a.stock === undefined
                          ? <span className="text-cream-muted">∞</span>
                          : <span className={a.stock <= 5 ? 'text-red-400 font-semibold' : 'text-cream'}>{a.stock}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleStatus(a)} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all hover:scale-105 ${a.status === 'available' ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700' : 'bg-red-900/60 text-red-300 border-red-700'}`} title="Click to toggle">
                          {t(`status.${a.status}`)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setModal({ type: 'edit', data: a })} className="text-cream-muted hover:text-gold p-1.5 rounded hover:bg-charcoal-light transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => setDeleteTarget(a)} className="text-cream-muted hover:text-red-400 p-1.5 rounded hover:bg-charcoal-light transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mobile */}
              <div className="lg:hidden divide-y divide-charcoal-light">
                {filteredAmulets.map(a => (
                  <div key={a.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={a.image_url || PLACEHOLDER} alt={a.name} className="w-12 h-12 object-cover rounded flex-shrink-0" onError={e => { e.target.src = PLACEHOLDER; }} />
                      <div className="flex-1 min-w-0"><p className="text-cream font-medium text-sm truncate">{a.name}</p><p className="text-gold text-sm">฿{Number(a.price).toLocaleString()}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(a)} className="btn-outline-gold text-xs py-1 flex-1">{t('common.toggle_status')}</button>
                      <button onClick={() => setModal({ type: 'edit', data: a })} className="btn-outline-gold text-xs py-1 px-3">{t('common.edit')}</button>
                      <button onClick={() => setDeleteTarget(a)} className="btn-danger text-xs py-1 px-3">{t('common.delete')}</button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredAmulets.length === 0 && <p className="text-center py-12 text-cream-muted">{t('common.no_data')}</p>}
            </div>
          )}

          {/* ─── Orders Tab ─── */}
          {tab === 'orders' && (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? <p className="text-center py-12 text-cream-muted">{t('common.no_data')}</p> :
                filteredOrders.map(o => (
                  <div key={o.id} className="bg-charcoal border border-charcoal-light rounded-xl p-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div><p className="text-cream-muted text-xs">{t('orders.order_id')}</p><p className="font-serif text-gold text-xl">#{o.id}</p></div>
                      <div><p className="text-cream-muted text-xs">{t('admin.col_customer')}</p><p className="text-cream text-sm">{o.full_name} <span className="text-cream-muted">({o.username})</span></p></div>
                      <div><p className="text-cream-muted text-xs">{t('admin.col_date')}</p><p className="text-cream text-sm">{new Date(o.created_at).toLocaleDateString('th-TH')}</p></div>
                      <div><p className="text-cream-muted text-xs">{t('admin.col_total')}</p><p className="text-gold font-semibold">฿{Number(o.total_price).toLocaleString()}</p></div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[o.status] || ''}`}>{t(`status.${o.status}`)}</span>
                        {o.tracking_number && <span className="text-cream-muted text-xs">{o.tracking_number}</span>}
                        <button onClick={() => setModal({ type: 'order', data: o })} className="btn-outline-gold text-xs py-1.5 px-3">{t('admin.update_status')}</button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ─── Users Tab ─── */}
          {tab === 'users' && (
            <div className="overflow-hidden rounded-xl border border-charcoal-light">
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="bg-charcoal border-b border-charcoal-light">
                  {[t('admin.username'), t('auth.email'), 'Name', t('admin.role'), t('admin.joined'), t('common.action')].map(h => <th key={h} className="text-left px-4 py-3 text-cream-muted font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredUsers.map((u, idx) => (
                    <tr key={u.id} className={`border-b border-charcoal-light hover:bg-charcoal-light/20 ${idx % 2 === 0 ? 'bg-charcoal-dark/20' : ''}`}>
                      <td className="px-4 py-3 text-cream font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-cream-muted">{u.email || '—'}</td>
                      <td className="px-4 py-3 text-cream-muted">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${u.role === 'admin' ? 'bg-gold/20 text-gold border-gold/40' : 'bg-charcoal-light text-cream-muted border-charcoal-light'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-cream-muted">{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-cream-muted hover:text-red-400 p-1.5 rounded hover:bg-charcoal-light transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mobile users */}
              <div className="md:hidden divide-y divide-charcoal-light">
                {filteredUsers.map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-cream font-medium">{u.username}</p>
                      <p className="text-cream-muted text-xs">{u.email || '—'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium mt-1 inline-block ${u.role === 'admin' ? 'bg-gold/20 text-gold border-gold/40' : 'bg-charcoal-light text-cream-muted border-charcoal-light'}`}>{u.role}</span>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} className="btn-danger text-xs py-1 px-3">{t('common.delete')}</button>
                  </div>
                ))}
              </div>
              {filteredUsers.length === 0 && <p className="text-center py-12 text-cream-muted">{t('common.no_data')}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
