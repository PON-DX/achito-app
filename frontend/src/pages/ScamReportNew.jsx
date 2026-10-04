import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';
import { BANKS, PROMPTPAY, ScamDisclaimer } from '../components/ScamReport';

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const OTHER = '__other__';

const EMPTY_FORM = {
  bank: '', bank_other: '', account_number: '', account_name: '', amount: '',
  item_description: '', incident_date: '', details: '',
};

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

export default function ScamReportNew() {
  const { t } = useLang();
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]); // { file, url }
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  // Free preview URLs when the page unmounts
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach(i => URL.revokeObjectURL(i.url)), []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const addFiles = (fileList) => {
    setError('');
    const files = Array.from(fileList);
    if (images.length + files.length > MAX_IMAGES) { setError(t('scam.err_images_max')); return; }
    if (files.some(f => !ALLOWED_TYPES.includes(f.type))) { setError(t('scam.err_file_type')); return; }
    if (files.some(f => f.size > MAX_SIZE)) { setError(t('scam.err_file_size')); return; }
    setImages(prev => [...prev, ...files.map(file => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const removeImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const validate = () => {
    const bankName = form.bank === OTHER ? form.bank_other.trim() : form.bank;
    if (!bankName || !form.account_number || !form.account_name.trim() || !form.amount ||
        !form.item_description.trim() || !form.incident_date) return t('scam.err_required');
    if (!/^\d{10,15}$/.test(form.account_number.replace(/[\s-]/g, ''))) return t('scam.err_account_number');
    if (!(Number(form.amount) > 0)) return t('scam.err_amount');
    if (form.incident_date > today()) return t('scam.err_future_date');
    if (images.length === 0) return t('scam.err_images_min');
    if (!confirmed) return t('scam.err_confirm');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }

    setSending(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('bank_name', form.bank === OTHER ? form.bank_other.trim() : form.bank);
      ['account_number', 'account_name', 'amount', 'item_description', 'incident_date', 'details']
        .forEach(k => fd.append(k, form[k]));
      images.forEach(i => fd.append('images', i.file));
      await axios.post('/api/scam-reports', fd);
      images.forEach(i => URL.revokeObjectURL(i.url));
      setImages([]);
      setForm(EMPTY_FORM);
      setConfirmed(false);
      setDone(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setError(t('scam.err_daily_limit'));
      else if (status === 413) setError(t('scam.err_file_size'));
      else setError(err.response?.data?.error || t('scam.err_generic'));
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-serif text-3xl text-cream mb-3">{t('scam.success_title')}</h1>
        <p className="text-cream-muted text-sm mb-8">{t('scam.success_desc')}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/scam-reports/mine" className="btn-gold">{t('scam.view_mine')}</Link>
          <button onClick={() => setDone(false)} className="btn-outline-gold">{t('scam.report_another')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="text-gold/50 text-xs tracking-[0.5em] uppercase mb-3">✦ {t('scam.badge')} ✦</p>
        <h1 className="font-serif text-4xl text-cream mb-2">{t('scam.report_title')}</h1>
        <p className="text-cream-muted text-sm">{t('scam.report_subtitle')}</p>
        <div className="gold-divider-flow w-20 mx-auto mt-4" />
        <Link to="/scam-reports/mine" className="inline-block mt-4 text-gold text-sm hover:underline">{t('nav.scam_mine')} →</Link>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5 border border-gold/15" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('scam.bank')} *</label>
            <select value={form.bank} onChange={set('bank')} className="input-field">
              <option value="">{t('scam.bank_select')}</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              <option value={PROMPTPAY}>{t('scam.promptpay')}</option>
              <option value={OTHER}>{t('scam.bank_other')}</option>
            </select>
            {form.bank === OTHER && (
              <input value={form.bank_other} onChange={set('bank_other')} maxLength={100}
                placeholder={t('scam.bank_other_placeholder')} className="input-field mt-2" />
            )}
          </div>
          <div>
            <label className="label">{t('scam.account_number')} *</label>
            <input value={form.account_number} inputMode="numeric" maxLength={20}
              onChange={e => setForm(f => ({ ...f, account_number: e.target.value.replace(/[^\d\s-]/g, '') }))}
              placeholder={t('scam.account_number_hint')} className="input-field font-mono" />
          </div>
        </div>

        <div>
          <label className="label">{t('scam.account_name')} *</label>
          <input value={form.account_name} onChange={set('account_name')} maxLength={150}
            placeholder={t('scam.account_name_placeholder')} className="input-field" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('scam.amount')} *</label>
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} className="input-field" />
          </div>
          <div>
            <label className="label">{t('scam.incident_date')} *</label>
            <input type="date" max={today()} value={form.incident_date} onChange={set('incident_date')} className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">{t('scam.item_description')} *</label>
          <input value={form.item_description} onChange={set('item_description')} maxLength={500}
            placeholder={t('scam.item_placeholder')} className="input-field" />
        </div>

        <div>
          <label className="label">{t('scam.details')}</label>
          <textarea value={form.details} onChange={set('details')} maxLength={3000} rows={4}
            placeholder={t('scam.details_placeholder')} className="input-field resize-none" />
        </div>

        <div>
          <label className="label">{t('scam.images')} *</label>
          <p className="text-cream-muted text-xs mb-3">{t('scam.images_hint')}</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gold/30">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} title={t('scam.remove_image')}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-red-300 text-sm leading-none hover:bg-red-900/80">×</button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileRef.current.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gold/30 hover:border-gold/60 text-cream-muted hover:text-gold flex flex-col items-center justify-center gap-1 transition-colors">
                <span className="text-2xl">＋</span>
                <span className="text-[11px]">{t('scam.add_image')} ({images.length}/{MAX_IMAGES})</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 accent-[#D4AF37]" />
          <span className="text-cream-dark text-sm">{t('scam.confirm_truth')}</span>
        </label>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(180,30,30,0.2)', border: '1px solid rgba(200,50,50,0.3)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={sending} className="w-full btn-gold py-3.5 font-semibold disabled:opacity-40">
          {sending ? <span className="animate-pulse">{t('scam.submitting')}</span> : t('scam.submit')}
        </button>

        <ScamDisclaimer />
      </form>
    </div>
  );
}
