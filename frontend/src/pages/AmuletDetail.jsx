import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%232D2D2D'/%3E%3Ccircle cx='300' cy='260' r='90' fill='none' stroke='%23D4AF37' stroke-width='2'/%3E%3Ctext x='300' y='278' font-family='serif' font-size='72' fill='%23D4AF37' text-anchor='middle'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
      <span className="text-cream-muted text-sm w-32 shrink-0">{label}</span>
      <span className="text-cream text-sm font-medium">{value}</span>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let cur = '';
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function AmuletDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [amulet, setAmulet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
    axios.get(`/api/products/${id}`)
      .then(res => setAmulet(res.data))
      .catch(() => setError('Amulet not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const generateProductCard = async () => {
    const W = 900, H = 520;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0e0b04');
    bg.addColorStop(1, '#1a1408');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Gold border
    ctx.strokeStyle = 'rgba(212,175,55,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.strokeStyle = 'rgba(212,175,55,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // Header
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦  อชิโต — ACHITO AMULET SHOP  ✦', W / 2, 54);
    ctx.strokeStyle = 'rgba(212,175,55,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 68); ctx.lineTo(W - 40, 68); ctx.stroke();

    // Product image
    const imgSrc = (amulet.images && amulet.images.length > 0) ? amulet.images[0] : amulet.image_url;
    if (imgSrc) {
      try {
        const img = await loadImage(imgSrc);
        const imgSize = 380;
        ctx.save();
        roundRect(ctx, 38, 84, imgSize, imgSize, 10);
        ctx.clip();
        ctx.drawImage(img, 38, 84, imgSize, imgSize);
        ctx.restore();
        ctx.strokeStyle = 'rgba(212,175,55,0.3)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 38, 84, imgSize, imgSize, 10);
        ctx.stroke();
      } catch {}
    }

    // Right side content
    const rx = 450;
    let curY = 108;

    // Category badge
    ctx.fillStyle = 'rgba(212,175,55,0.1)';
    ctx.strokeStyle = 'rgba(212,175,55,0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, rx, 88, 200, 30, 15);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#D4AF37';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('  ' + (amulet.category || ''), rx + 14, 108);

    // Product name
    curY = 152;
    ctx.fillStyle = '#f5e6c0';
    ctx.font = 'bold 30px Georgia, serif';
    const nameLines = wrapText(ctx, amulet.name, W - rx - 45);
    nameLines.forEach(line => { ctx.fillText(line, rx, curY); curY += 38; });

    // Temple
    if (amulet.temple) {
      ctx.fillStyle = 'rgba(212,175,55,0.7)';
      ctx.font = '16px sans-serif';
      ctx.fillText('☸  ' + amulet.temple, rx, curY + 8);
      curY += 34;
    }

    // Price
    curY += 18;
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('฿' + Number(amulet.price).toLocaleString(), rx, curY);
    curY += 46;

    // Detail line
    const detail = [amulet.batch_version, amulet.year ? `พ.ศ. ${amulet.year}` : ''].filter(Boolean).join(' · ');
    if (detail) {
      ctx.fillStyle = 'rgba(245,230,192,0.45)';
      ctx.font = '14px sans-serif';
      ctx.fillText(detail, rx, curY);
      curY += 30;
    }

    // Divider
    curY += 8;
    ctx.strokeStyle = 'rgba(212,175,55,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx, curY); ctx.lineTo(W - 45, curY); ctx.stroke();
    curY += 26;

    // Contact prompt
    ctx.fillStyle = 'rgba(212,175,55,0.75)';
    ctx.font = '14px sans-serif';
    ctx.fillText('📲  ติดต่อสอบถาม / สั่งซื้อผ่าน Facebook ด้านล่าง', rx, curY);

    // Footer
    ctx.fillStyle = 'rgba(212,175,55,0.28)';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦  พระผงพรายสมุทร อชิโต  ✦', W / 2, H - 24);

    return canvas;
  };

  const handleContactSeller = () => {
    const fbUrl = amulet.seller_facebook_url || 'https://www.facebook.com';
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gold font-serif text-xl animate-pulse">{t('common.loading')}</div></div>;
  if (error || !amulet) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="font-serif text-cream text-2xl">Item not found</p>
      <Link to="/" className="btn-outline-gold">{t('product.back')}</Link>
    </div>
  );

  const images = amulet.images?.length > 0 ? amulet.images : (amulet.image_url ? [amulet.image_url] : []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-sm text-cream-muted mb-8">
        <Link to="/" className="hover:text-gold transition-colors flex items-center gap-1.5">
          <span className="text-gold/30 text-xs">☸</span>
          {t('nav.collection')}
        </Link>
        <span className="text-gold/25 text-xs">›</span>
        <span className="text-cream line-clamp-1">{amulet.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image carousel */}
        <div className="relative group">
          <div
            className="aspect-square rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.012]"
            style={{
              border: '1px solid rgba(212,175,55,0.2)',
              background: 'rgba(10,8,3,0.85)',
              boxShadow: '0 8px 50px rgba(0,0,0,0.65), 0 0 30px rgba(212,175,55,0.06)',
            }}
          >
            <img src={images[activeIdx] || PLACEHOLDER} alt={amulet.name} className="w-full h-full object-cover"
                 onError={e => { e.target.src = PLACEHOLDER; }} />
          </div>
          {amulet.status === 'sold_out' && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal-dark/60 rounded-xl">
              <span className="font-serif text-red-400 text-2xl border-2 border-red-400 px-6 py-2 rotate-[-12deg]">{t('status.sold_out')}</span>
            </div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx(i => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gold text-lg font-bold transition-all hover:scale-110 opacity-80 hover:opacity-100"
                style={{ background: 'rgba(10,8,3,0.75)', border: '1px solid rgba(212,175,55,0.3)' }}
              >‹</button>
              <button
                onClick={() => setActiveIdx(i => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gold text-lg font-bold transition-all hover:scale-110 opacity-80 hover:opacity-100"
                style={{ background: 'rgba(10,8,3,0.75)', border: '1px solid rgba(212,175,55,0.3)' }}
              >›</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setActiveIdx(i)}
                    className={`rounded-full transition-all ${i === activeIdx ? 'w-3 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-gold/30 hover:bg-gold/60'}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-gold/30 rounded-tl transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
          <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-gold/30 rounded-tr transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-gold/30 rounded-bl transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-gold/30 rounded-br transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-14 h-14 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${i === activeIdx ? 'border-gold' : 'border-charcoal-light opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="border border-gold/50 text-gold text-xs px-3 py-1 rounded-full">{t(`categories.${amulet.category}`) || amulet.category}</span>
            <span className={amulet.status === 'available' ? 'status-available' : 'status-sold-out'}>
              {t(`status.${amulet.status}`)}
            </span>
          </div>

          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-cream leading-tight mb-2">{amulet.name}</h1>
            {amulet.temple && <p className="text-gold text-sm font-medium">{amulet.temple}</p>}
          </div>

          <div className="flex items-baseline gap-2 py-5" style={{ borderTop: '1px solid rgba(212,175,55,0.15)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
            <span className="font-serif text-4xl text-gold font-semibold" style={{ textShadow: '0 0 30px rgba(212,175,55,0.35)' }}>฿{Number(amulet.price).toLocaleString()}</span>
            <span className="text-cream-muted text-sm">THB</span>
          </div>

          <div className="glass rounded-xl px-5 py-1" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
            <DetailRow label={t('product.temple')} value={amulet.temple} />
            <DetailRow label={t('product.category')} value={t(`categories.${amulet.category}`) || amulet.category} />
            <DetailRow label={t('product.batch')} value={amulet.batch_version} />
            <DetailRow label={t('product.year')} value={amulet.year?.toString()} />
          </div>

          {amulet.description && (
            <div>
              <h2 className="font-serif text-lg text-cream mb-2">{t('product.about')}</h2>
              <p className="text-cream-muted text-sm leading-relaxed">{amulet.description}</p>
            </div>
          )}

          {/* Contact seller */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleContactSeller}
              disabled={amulet.status === 'sold_out'}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)', color: '#0a0803', boxShadow: '0 4px 24px rgba(212,175,55,0.28)' }}
            >
              {amulet.status === 'sold_out' ? t('product.unavailable') : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  ติดต่อผู้ขาย
                </>
              )}
            </button>
            <button onClick={() => navigate(-1)} className="btn-outline-gold px-5">{t('product.back')}</button>
          </div>


          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            <span className="trust-chip">🔒 ของแท้รับประกัน</span>
            <span className="trust-chip">✈️ จัดส่งทั่วไทย</span>
            <span className="trust-chip">📦 แพ็คอย่างดี</span>
          </div>
        </div>
      </div>
    </div>
  );
}
