import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';
import { ScamDisclaimer, ScamReportCard, formatBaht } from '../components/ScamReport';

export default function ScamCheck() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(q);
    if (!q) { setResult(null); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    axios.get('/api/scam-reports/search', { params: { q } })
      .then(res => { if (!cancelled) setResult(res.data); })
      .catch(err => { if (!cancelled) { setResult(null); setError(err.response?.data?.error || t('scam.err_generic')); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (value) setParams({ q: value });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-gold/50 text-xs tracking-[0.5em] uppercase mb-3">✦ {t('scam.badge')} ✦</p>
        <h1 className="font-serif text-4xl text-cream mb-2">{t('scam.check_title')}</h1>
        <p className="text-cream-muted text-sm max-w-md mx-auto">{t('scam.check_subtitle')}</p>
        <div className="gold-divider-flow w-20 mx-auto mt-4" />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('scam.search_placeholder')}
          className="input-field flex-1" maxLength={150} />
        <button type="submit" disabled={loading} className="btn-gold whitespace-nowrap disabled:opacity-40">
          {loading ? t('scam.searching') : t('scam.search_btn')}
        </button>
      </form>
      <p className="text-cream-muted text-xs mb-6">{t('scam.search_hint')}</p>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-6 text-sm text-red-300" style={{ background: 'rgba(180,30,30,0.2)', border: '1px solid rgba(200,50,50,0.3)' }}>
          {error}
        </div>
      )}

      {result && !loading && (
        result.count > 0 ? (
          <>
            <div className="glass-card rounded-2xl p-5 mb-6 border border-red-700/40 flex flex-wrap items-center justify-between gap-4"
              style={{ background: 'rgba(127,29,29,0.18)' }}>
              <p className="text-red-300 font-serif text-2xl">⚠️ {t('scam.found_reports').replace('{n}', result.count)}</p>
              <div className="text-right">
                <p className="text-cream-muted text-xs uppercase tracking-widest">{t('scam.total_damage')}</p>
                <p className="text-red-300 text-2xl font-semibold">{formatBaht(result.total_amount)}</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              {result.reports.map(r => <ScamReportCard key={r.id} report={r} />)}
            </div>
          </>
        ) : (
          <div className="glass-card rounded-2xl p-8 mb-8 text-center border border-gold/15">
            <p className="text-4xl mb-3">🔎</p>
            <p className="text-cream font-serif text-xl mb-2">{t('scam.not_found_title')}</p>
            <p className="text-cream-muted text-sm">{t('scam.not_found_desc')}</p>
          </div>
        )
      )}

      <div className="space-y-4">
        <ScamDisclaimer />
        <div className="text-center">
          <Link to="/scam-reports/new" className="btn-outline-gold inline-block">{t('scam.report_cta')}</Link>
        </div>
      </div>
    </div>
  );
}
