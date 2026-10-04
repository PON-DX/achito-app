import React, { useEffect, useState } from 'react';
import { useLang } from '../contexts/LanguageContext';

// Stored as bank_name; PromptPay and "other" are handled separately in the form
export const BANKS = [
  'ธนาคารกสิกรไทย',
  'ธนาคารไทยพาณิชย์',
  'ธนาคารกรุงเทพ',
  'ธนาคารกรุงไทย',
  'ธนาคารกรุงศรีอยุธยา',
  'ธนาคารทหารไทยธนชาต (ttb)',
  'ธนาคารออมสิน',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)',
  'ธนาคารอาคารสงเคราะห์',
  'ธนาคารยูโอบี',
  'ธนาคารซีไอเอ็มบี ไทย',
  'ธนาคารเกียรตินาคินภัทร',
  'ธนาคารทิสโก้',
  'ธนาคารแลนด์ แอนด์ เฮ้าส์',
  'ธนาคารไอซีบีซี (ไทย)',
  'ธนาคารอิสลามแห่งประเทศไทย',
];
export const PROMPTPAY = 'พร้อมเพย์';

export const STATUS_COLOR = {
  pending: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  approved: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  rejected: 'bg-red-900/60 text-red-300 border-red-700',
};

export const formatBaht = (n) =>
  `฿${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function StatusBadge({ status }) {
  const { t } = useLang();
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[status] || ''}`}>
      {t(`scam.status_${status}`)}
    </span>
  );
}

export function ScamDisclaimer() {
  const { t } = useLang();
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs leading-relaxed text-cream-muted"
      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
    >
      <span className="text-gold font-semibold">ⓘ {t('scam.disclaimer_title')}: </span>
      {t('scam.disclaimer_text')}
    </div>
  );
}

export function ImageLightbox({ images, index, onClose, onChange }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onChange]);

  const navBtn = 'absolute top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-2xl transition-all hover:scale-110';
  const navStyle = { background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-2xl transition-all hover:scale-110" style={navStyle}>×</button>
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} className={`${navBtn} left-4`} style={navStyle}>‹</button>
          <button onClick={e => { e.stopPropagation(); onChange((index + 1) % images.length); }} className={`${navBtn} right-4`} style={navStyle}>›</button>
        </>
      )}
      <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        <img
          src={images[index]}
          alt=""
          className="max-w-[82vw] max-h-[80vh] rounded-2xl object-contain"
          style={{ boxShadow: '0 12px 80px rgba(212,175,55,0.18), 0 0 0 1px rgba(212,175,55,0.2)' }}
        />
        {images.length > 1 && <p className="text-cream-muted text-xs">{index + 1} / {images.length}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-cream-muted text-[11px] uppercase tracking-widest mb-0.5">{label}</p>
      <div className="text-cream text-sm break-words">{children}</div>
    </div>
  );
}

// One report: account info, amounts, details and clickable evidence thumbnails.
// `header` and `footer` let pages add status badges or admin actions.
export function ScamReportCard({ report, header, footer }) {
  const { t } = useLang();
  const [lightbox, setLightbox] = useState(null);
  const images = (report.images || []).map(i => i.image_url);

  return (
    <div className="glass-card rounded-2xl p-5 border border-gold/15">
      {header}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-serif text-xl text-cream">{report.account_name}</p>
          <p className="text-gold font-mono tracking-wider">{report.account_number}</p>
          <p className="text-cream-muted text-xs mt-0.5">{report.bank_name}</p>
        </div>
        <p className="text-red-300 font-semibold text-lg">{formatBaht(report.amount)}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Field label={t('scam.item_description')}>{report.item_description}</Field>
        <Field label={t('scam.incident_date')}>{report.incident_date}</Field>
      </div>
      {report.details && (
        <div className="mb-4">
          <Field label={t('scam.details_short')}>
            <p className="whitespace-pre-line text-cream-dark">{report.details}</p>
          </Field>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => setLightbox(i)} className="w-20 h-20 rounded-lg overflow-hidden border border-gold/20 hover:border-gold/60 transition-colors">
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {footer}

      {lightbox !== null && (
        <ImageLightbox images={images} index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />
      )}
    </div>
  );
}
