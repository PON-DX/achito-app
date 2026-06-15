import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../contexts/LanguageContext';

const STATUS_COLOR = {
  pending: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
  confirmed: 'bg-blue-900/60 text-blue-300 border-blue-700',
  shipped: 'bg-purple-900/60 text-purple-300 border-purple-700',
  delivered: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  cancelled: 'bg-red-900/60 text-red-300 border-red-700',
};

export default function MyOrders() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchOrders = () => axios.get('/api/orders').then(res => setOrders(res.data));

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!details[orderId]) {
      const res = await axios.get(`/api/orders/${orderId}`);
      setDetails(prev => ({ ...prev, [orderId]: res.data }));
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setCancelling(true);
    try {
      await axios.post(`/api/orders/${confirmCancel}/cancel`);
      setConfirmCancel(null);
      setDetails(prev => { const n = { ...prev }; delete n[confirmCancel]; return n; });
      await fetchOrders();
      showToast(t('orders.cancel_success'));
    } catch (err) {
      showToast(err.response?.data?.error || t('orders.cancel_failed'));
      setConfirmCancel(null);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gold font-serif animate-pulse">{t('common.loading')}</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-charcoal border border-gold rounded-lg px-5 py-3 text-cream text-sm shadow-lg">
          {toast}
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 bg-charcoal-dark/80 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-red-900 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="font-serif text-xl text-cream mb-2">{t('orders.cancel_confirm_title')}</h2>
            <p className="text-cream-muted text-sm mb-6">
              {t('orders.cancel_confirm_desc')} <span className="text-gold font-semibold">#{confirmCancel}</span>?
              <br /><span className="text-xs mt-1 block">{t('orders.cancel_stock_note')}</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmCancel(null)} disabled={cancelling} className="btn-outline-gold px-5">{t('orders.cancel_no')}</button>
              <button onClick={handleCancel} disabled={cancelling} className="px-5 py-2 rounded bg-red-800 hover:bg-red-700 text-red-200 text-sm font-medium transition-colors border border-red-700">
                {cancelling ? '...' : t('orders.cancel_yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="font-serif text-3xl text-cream mb-8">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">📋</span>
          <p className="font-serif text-cream text-xl mt-4">{t('orders.empty')}</p>
          <Link to="/" className="btn-gold mt-4 inline-block">{t('cart.continue')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-charcoal border border-charcoal-light rounded-xl overflow-hidden">
              {/* Row */}
              <div
                className="flex flex-wrap gap-4 items-center justify-between px-5 py-4 cursor-pointer hover:bg-charcoal-light/20 transition-colors"
                onClick={() => toggleExpand(order.id)}
              >
                <div>
                  <p className="text-cream-muted text-xs">{t('orders.order_id')}</p>
                  <p className="font-serif text-gold text-lg">#{order.id}</p>
                </div>
                <div>
                  <p className="text-cream-muted text-xs">{t('orders.date')}</p>
                  <p className="text-cream text-sm">{new Date(order.created_at).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <p className="text-cream-muted text-xs">{t('orders.total')}</p>
                  <p className="text-gold font-semibold">฿{Number(order.total_price).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[order.status] || ''}`}>
                    {t(`status.${order.status}`)}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmCancel(order.id); }}
                      className="text-xs px-2.5 py-1 rounded-full border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      {t('orders.cancel_btn')}
                    </button>
                  )}
                  <span className="text-cream-muted text-xs">{expanded === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === order.id && (
                <div className="border-t border-charcoal-light px-5 py-4 space-y-4">
                  {details[order.id]?.items ? (
                    <div>
                      <p className="text-cream-muted text-xs uppercase tracking-widest mb-2">{t('tracking.items')}</p>
                      <div className="space-y-2">
                        {details[order.id].items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-cream">{item.amulet_name} <span className="text-cream-muted">×{item.quantity}</span></span>
                            <span className="text-gold">฿{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-cream-muted text-sm animate-pulse">{t('common.loading')}</p>
                  )}
                  {order.shipping_address && (
                    <div>
                      <p className="text-cream-muted text-xs uppercase tracking-widest mb-1">ที่อยู่จัดส่ง</p>
                      <p className="text-cream text-sm">{order.full_name} — {order.shipping_address}</p>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div>
                      <p className="text-cream-muted text-xs uppercase tracking-widest mb-1">{t('tracking.tracking_number')}</p>
                      <p className="text-cream font-medium">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
