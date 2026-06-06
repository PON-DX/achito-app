import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', shipping_address: '', payment_method: 'bank_transfer', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/orders', form);
      clearCart();
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!success && items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-cream text-xl">{t('cart.empty')}</p>
        <Link to="/" className="btn-gold">{t('cart.continue')}</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center shadow-gold-lg">
          <span className="text-gold text-4xl">✓</span>
        </div>
        <div>
          <h1 className="font-serif text-3xl text-cream mb-2">{t('checkout.success_title')}</h1>
          <p className="text-cream-muted">{t('checkout.success_desc')}</p>
        </div>
        <div className="bg-charcoal border border-gold/30 rounded-lg px-8 py-4">
          <p className="text-cream-muted text-sm">{t('checkout.order_id')}</p>
          <p className="font-serif text-gold text-2xl">#{success.id}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/my-orders" className="btn-gold">{t('checkout.view_orders')}</Link>
          <Link to="/" className="btn-outline-gold">{t('cart.continue')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl text-cream mb-8">{t('checkout.title')}</h1>
      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded mb-6 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="bg-charcoal border border-charcoal-light rounded-xl p-6">
            <h2 className="font-serif text-lg text-cream mb-5 pb-3 border-b border-charcoal-light">
              {t('checkout.shipping_info')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">{t('checkout.full_name')} <span className="text-red-400">*</span></label>
                <input name="full_name" required value={form.full_name} onChange={handleChange}
                       className="input-field" placeholder="ชื่อ-นามสกุลผู้รับ" />
              </div>
              <div>
                <label className="label">{t('checkout.phone')} <span className="text-red-400">*</span></label>
                <input name="phone" required value={form.phone} onChange={handleChange}
                       className="input-field" placeholder="0812345678" />
              </div>
              <div>
                <label className="label">{t('checkout.address')} <span className="text-red-400">*</span></label>
                <textarea name="shipping_address" required rows={3} value={form.shipping_address} onChange={handleChange}
                          className="input-field resize-none" placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" />
              </div>
              <div>
                <label className="label">{t('checkout.notes')}</label>
                <input name="notes" value={form.notes} onChange={handleChange}
                       className="input-field" placeholder="หมายเหตุพิเศษ (ถ้ามี)" />
              </div>
            </div>
          </div>

          <div className="bg-charcoal border border-charcoal-light rounded-xl p-6">
            <h2 className="font-serif text-lg text-cream mb-4">{t('checkout.payment_method')}</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="payment_method" value="bank_transfer"
                     checked={form.payment_method === 'bank_transfer'} onChange={handleChange}
                     className="accent-gold w-4 h-4" />
              <span className="text-cream">{t('checkout.bank_transfer')}</span>
            </label>
            {form.payment_method === 'bank_transfer' && (
              <div className="mt-4 bg-charcoal-dark rounded-lg p-4 text-sm text-cream-muted border border-charcoal-light">
                <p className="text-gold font-medium mb-2">ข้อมูลบัญชีธนาคาร</p>
                <p>ธนาคาร: กสิกรไทย</p>
                <p>ชื่อบัญชี: {t('appName')}</p>
                <p>เลขบัญชี: 000-0-00000-0</p>
                <p className="mt-2 text-xs text-cream-muted">กรุณาโอนเงินและส่งสลิปมาทาง Line หลังยืนยันการสั่งซื้อ</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full py-4 text-base flex items-center justify-center gap-2">
            {loading ? t('checkout.processing') : t('checkout.place_order')}
          </button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-charcoal border border-charcoal-light rounded-xl p-5 sticky top-20">
            <h2 className="font-serif text-lg text-cream mb-4">{t('checkout.order_summary')}</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded bg-charcoal-dark flex-shrink-0 overflow-hidden">
                    <img src={item.image_url || ''} alt="" className="w-full h-full object-cover"
                         onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-xs truncate">{item.name}</p>
                    <p className="text-cream-muted text-xs">×{item.quantity}</p>
                  </div>
                  <p className="text-gold text-sm shrink-0">฿{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-charcoal-light mt-4 pt-4">
              <div className="flex justify-between font-semibold">
                <span className="text-cream">{t('cart.total')}</span>
                <span className="text-gold font-serif text-xl">฿{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
