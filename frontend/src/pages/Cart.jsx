import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23161005'/%3E%3Ctext x='50' y='58' font-size='32' fill='%23D4AF37' text-anchor='middle'%3E%E2%98%B8%3C/text%3E%3C/svg%3E";

function downloadSummaryCanvas(items, total, orderId) {
  const lineH = 52;
  const pad = 32;
  const w = 580;
  const headerH = 110;
  const footerH = 70;
  const h = headerH + items.length * lineH + footerH + pad;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#100d04';
  ctx.fillRect(0, 0, w, h);

  // Gold border
  ctx.strokeStyle = 'rgba(212,175,55,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  // Title
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 22px serif';
  ctx.textAlign = 'center';
  ctx.fillText('☸  อชิโต | Achito  ☸', w / 2, 46);

  ctx.fillStyle = 'rgba(212,175,55,0.65)';
  ctx.font = '14px sans-serif';
  ctx.fillText('สรุปรายการสั่งซื้อ', w / 2, 70);

  if (orderId) {
    ctx.fillStyle = 'rgba(212,175,55,0.4)';
    ctx.font = '12px monospace';
    ctx.fillText(`Order #${orderId}`, w / 2, 92);
  }

  // Divider
  ctx.strokeStyle = 'rgba(212,175,55,0.25)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(30, 104); ctx.lineTo(w - 30, 104); ctx.stroke();

  // Items
  let y = headerH + 10;
  ctx.textAlign = 'left';
  for (const item of items) {
    const name = item.name.length > 38 ? item.name.slice(0, 38) + '…' : item.name;
    ctx.fillStyle = '#e8d5b0';
    ctx.font = '14px sans-serif';
    ctx.fillText(name, 32, y);
    ctx.fillStyle = 'rgba(212,175,55,0.55)';
    ctx.font = '12px sans-serif';
    ctx.fillText(`× ${item.quantity}`, 32, y + 19);
    ctx.fillStyle = '#D4AF37';
    ctx.font = '15px serif';
    ctx.textAlign = 'right';
    ctx.fillText(`฿${(item.price * item.quantity).toLocaleString('th-TH')}`, w - 32, y + 10);
    ctx.textAlign = 'left';
    y += lineH;
  }

  // Total line
  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(30, y + 6); ctx.lineTo(w - 30, y + 6); ctx.stroke();
  y += 28;

  ctx.fillStyle = '#e8d5b0';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('ยอดรวมทั้งหมด', 32, y);
  ctx.fillStyle = '#F5E17A';
  ctx.font = 'bold 20px serif';
  ctx.textAlign = 'right';
  ctx.fillText(`฿${total.toLocaleString('th-TH')}`, w - 32, y);

  // Footer
  ctx.fillStyle = 'rgba(212,175,55,0.3)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('กรุณาติดต่อผู้ขายเพื่อยืนยันและนัดชำระเงิน', w / 2, y + 36);

  const link = document.createElement('a');
  link.download = `achito-order${orderId ? '-' + orderId : ''}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export default function Cart() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, token } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { orderId, convId }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-gold/40 flex items-center justify-center sacred-icon-anim">
          <svg className="w-10 h-10 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-cream mb-2">{t('cart.title')}</h2>
          <p className="text-cream-muted">{t('product.login_to_buy')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-gold px-8">{t('nav.login')}</Link>
          <Link to="/register" className="btn-outline-gold px-8">{t('nav.register')}</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl text-charcoal-light">🛒</span>
        <h2 className="font-serif text-2xl text-cream">{t('cart.empty')}</h2>
        <p className="text-cream-muted">{t('cart.empty_desc')}</p>
        <Link to="/" className="btn-gold mt-2">{t('cart.continue')}</Link>
      </div>
    );
  }

  async function handleSubmitOrder() {
    setSubmitting(true);
    try {
      const res = await axios.post('/api/orders', { notes }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmitted({ orderId: res.data.id, convId: res.data.conversation_id });
      clearCart();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="glass-strong rounded-3xl p-10 max-w-md w-full">
          <div className="text-5xl mb-4 rotate-sacred-slow">☸</div>
          <h2 className="font-serif text-2xl text-gold mb-2">{t('cart.order_success')}</h2>
          <p className="text-cream-muted text-sm mb-1">{t('cart.order_number')}: <span className="text-gold">#{submitted.orderId}</span></p>
          <p className="text-cream-muted text-sm mb-6">{t('cart.seller_will_contact')}</p>
          <div className="gold-divider-flow mb-6" />
          <div className="flex flex-col gap-3">
            <button
              onClick={() => downloadSummaryCanvas([], total, submitted.orderId)}
              className="btn-outline-gold py-2.5 text-sm"
            >
              ⬇ {t('cart.download_summary')}
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="btn-gold py-2.5"
            >
              💬 {t('cart.go_to_chat')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl text-cream mb-8">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="glass rounded-xl p-4 flex gap-4 items-start">
              <img
                src={item.image_url || PLACEHOLDER}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg border border-gold/15 flex-shrink-0"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-cream text-sm leading-snug line-clamp-2">{item.name}</h3>
                <p className="text-gold font-semibold mt-1">฿{Number(item.price).toLocaleString()}</p>
                {item.status === 'sold_out' && <p className="text-red-400 text-xs mt-1">{t('status.sold_out')}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: 'rgba(12,10,3,0.7)' }}>
                    <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)} className="text-cream-muted hover:text-cream w-5 text-center font-bold">−</button>
                    <span className="text-cream text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-cream-muted hover:text-cream w-5 text-center font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-xs transition-colors">{t('cart.remove')}</button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-cream font-medium">฿{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-2xl p-5 sticky top-20">
            <h2 className="font-serif text-lg text-cream mb-4">{t('checkout.order_summary')}</h2>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-cream-muted truncate max-w-[150px]">{item.name} ×{item.quantity}</span>
                  <span className="text-cream ml-2">฿{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="gold-divider-flow mb-4" />
            <div className="flex justify-between font-semibold mb-5">
              <span className="text-cream">{t('cart.total')}</span>
              <span className="text-gold font-serif text-lg">฿{total.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-gold w-full py-3"
            >
              🛕 {t('cart.confirm_order_btn')}
            </button>
            <Link to="/" className="block text-center text-cream-muted text-sm mt-3 hover:text-gold transition-colors">
              {t('cart.continue')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ───────────────────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,4,1,0.85)', backdropFilter: 'blur(10px)' }}
        >
          <div className="glass-strong rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 relative animate-hero-entrance">
            {/* Close */}
            <button onClick={() => setShowConfirm(false)} className="absolute top-4 right-5 text-cream-muted hover:text-cream text-xl">✕</button>

            <h2 className="font-serif text-2xl text-gold mb-1">{t('checkout.order_summary')}</h2>
            <p className="text-cream-muted text-xs mb-5">{t('checkout.order_summary')}</p>

            {/* Items */}
            <div className="space-y-3 mb-5">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center glass rounded-xl p-3">
                  <img src={item.image_url || PLACEHOLDER} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-gold/15 flex-shrink-0" onError={e => { e.target.src = PLACEHOLDER; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm line-clamp-1">{item.name}</p>
                    <p className="text-cream-muted text-xs">×{item.quantity}</p>
                  </div>
                  <p className="text-gold text-sm font-semibold">฿{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-5">
              <span className="text-cream font-medium">{t('cart.total')}</span>
              <span className="font-serif text-gold text-2xl">฿{total.toLocaleString()}</span>
            </div>
            <div className="gold-divider-flow mb-5" />

            {/* Notes */}
            <div className="mb-5">
              <label className="label text-xs mb-1">{t('cart.notes_label')}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder={t('cart.notes_placeholder')}
                className="input-field text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => downloadSummaryCanvas(items, total, null)}
                className="btn-outline-gold py-2.5 text-sm"
              >
                ⬇ {t('cart.download_short')}
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="btn-gold py-3 text-base disabled:opacity-50"
              >
                {submitting ? t('cart.sending') : `💬 ${t('cart.send_order')}`}
              </button>
            </div>

            <p className="text-cream-muted text-xs text-center mt-4">
              {t('cart.order_chat_note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
