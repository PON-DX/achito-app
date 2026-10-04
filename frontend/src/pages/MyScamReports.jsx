import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';
import { ScamDisclaimer, ScamReportCard, StatusBadge } from '../components/ScamReport';

export default function MyScamReports() {
  const { t } = useLang();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/scam-reports/mine')
      .then(res => setReports(res.data))
      .catch(() => setError(t('scam.err_generic')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="section-title mb-0">{t('scam.mine_title')}</h1>
        <Link to="/scam-reports/new" className="btn-gold">{t('scam.mine_new')}</Link>
      </div>

      {loading && <p className="text-gold font-serif animate-pulse">{t('home.loading')}</p>}
      {error && <p className="text-red-300 text-sm">{error}</p>}
      {!loading && !error && reports.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center border border-gold/15">
          <p className="text-cream-muted">{t('scam.mine_empty')}</p>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {reports.map(r => (
          <ScamReportCard
            key={r.id}
            report={r}
            header={
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gold/10">
                <StatusBadge status={r.status} />
                <span className="text-cream-muted text-xs">
                  {t('scam.submitted_at')} {new Date(r.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
            }
            footer={r.admin_note && (
              <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <span className="text-gold font-semibold">{t('scam.admin_note')}: </span>
                <span className="text-cream-dark whitespace-pre-line">{r.admin_note}</span>
              </div>
            )}
          />
        ))}
      </div>

      <ScamDisclaimer />
    </div>
  );
}
