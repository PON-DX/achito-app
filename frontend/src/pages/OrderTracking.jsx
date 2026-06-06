import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_ICONS = { pending: '⏳', confirmed: '✅', shipped: '🚚', delivered: '📦', cancelled: '❌' };

function StatusTimeline({ status }) {
  const { t } = useLang();
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <span className="text-2xl">❌</span>
        <span className="font-medium">{t('status.cancelled')}</span>
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-lg transition-all ${
              idx <= currentIdx ? 'border-gold bg-gold/20 text-gold' : 'border-charcoal-light text-charcoal-light'
            }`}>
              {STATUS_ICONS[step]}
            </div>
            <p className={`text-xs mt-1 text-center w-16 ${idx <= currentIdx ? 'text-gold' : 'text-charcoal-light'}`}>
              {t(`status.${step}`)}
            </p>
          </div>
          {idx < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-5 ${idx < currentIdx ? 'bg-gold' : 'bg-charcoal-light'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function OrderTracking({ initialQuery = '' }) {
  const { t } = useLang();
  const [query, setQuery] = useState(initialQuery);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setOrder(null);
    try {
      const res = await axios.get(`/api/orders/track/${query.trim()}`);
      setOrder(res.data);
    } catch {
      setError(t('tracking.not_found'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
          <span className="text-gold text-3xl">🚚</span>
        </div>
        <h1 className="font-serif text-3xl text-cream">{t('tracking.title')}</h1>
        <div className="w-16 h-0.5 bg-gold mx-auto my-3" />
        <p className="text-cream-muted">{t('tracking.subtitle')}</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('tracking.placeholder')}
          className="input-field flex-1 text-base"
        />
        <button type="submit" disabled={loading} className="btn-gold px-6 whitespace-nowrap">
          {loading ? '...' : t('tracking.search')}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <span className="text-4xl">🔍</span>
          <p className="font-serif text-cream text-lg mt-3">{error}</p>
          <p className="text-cream-muted text-sm mt-1">กรุณาตรวจสอบหมายเลขอีกครั้ง</p>
        </div>
      )}

      {/* Result */}
      {order && (
        <div className="bg-charcoal border border-charcoal-light rounded-xl overflow-hidden">
          {/* Order header */}
          <div className="bg-gradient-to-r from-charcoal-light to-charcoal px-6 py-4 border-b border-gold/20">
            <div className="flex flex-wrap gap-4 justify-between items-start">
              <div>
                <p className="text-cream-muted text-xs">{t('tracking.order_id')}</p>
                <p className="font-serif text-gold text-2xl">#{order.id}</p>
              </div>
              <div>
                <p className="text-cream-muted text-xs">{t('tracking.date')}</p>
                <p className="text-cream text-sm">{new Date(order.created_at).toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}</p>
              </div>
              {order.tracking_number && (
                <div>
                  <p className="text-cream-muted text-xs">{t('tracking.tracking_number')}</p>
                  <p className="text-cream font-medium">{order.tracking_number}</p>
                </div>
              )}
              <div>
                <p className="text-cream-muted text-xs">{t('tracking.total')}</p>
                <p className="text-gold font-semibold">฿{Number(order.total_price).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-6 py-6">
            <p className="text-cream-muted text-xs mb-4 uppercase tracking-widest">{t('tracking.status')}</p>
            <StatusTimeline status={order.status} />
          </div>

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="border-t border-charcoal-light px-6 py-4">
              <p className="text-cream-muted text-xs mb-3 uppercase tracking-widest">{t('tracking.items')}</p>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-cream">{item.amulet_name} <span className="text-cream-muted">×{item.quantity}</span></span>
                    <span className="text-gold">฿{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="border-t border-charcoal-light px-6 py-4">
              <p className="text-cream-muted text-xs mb-1 uppercase tracking-widest">ที่อยู่จัดส่ง</p>
              <p className="text-cream text-sm">{order.full_name}</p>
              <p className="text-cream-muted text-sm">{order.shipping_address}</p>
            </div>
          )}
        </div>
      )}

      {/* Login prompt for order history */}
      <div className="text-center mt-10">
        <p className="text-cream-muted text-sm">
          สมาชิกสามารถดูคำสั่งซื้อทั้งหมดได้ที่{' '}
          <Link to="/my-orders" className="text-gold hover:text-gold-light transition-colors">{t('orders.title')}</Link>
        </p>
      </div>
    </div>
  );
}
