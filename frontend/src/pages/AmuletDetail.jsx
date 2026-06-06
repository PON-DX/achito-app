import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
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

export default function AmuletDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t } = useLang();
  const [amulet, setAmulet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartMsg, setCartMsg] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(res => setAmulet(res.data))
      .catch(() => setError('Amulet not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAddingToCart(true);
    try {
      await addToCart(amulet.id, qty);
      setCartMsg(t('product.added_to_cart'));
      setTimeout(() => setCartMsg(''), 2500);
    } catch (err) {
      setCartMsg(err.response?.data?.error || 'Error adding to cart');
      setTimeout(() => setCartMsg(''), 2500);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gold font-serif text-xl animate-pulse">{t('common.loading')}</div></div>;
  if (error || !amulet) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="font-serif text-cream text-2xl">Item not found</p>
      <Link to="/" className="btn-outline-gold">{t('product.back')}</Link>
    </div>
  );

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
        {/* Image */}
        <div className="relative group">
          <div
            className="aspect-square rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.012]"
            style={{
              border: '1px solid rgba(212,175,55,0.2)',
              background: 'rgba(10,8,3,0.85)',
              boxShadow: '0 8px 50px rgba(0,0,0,0.65), 0 0 30px rgba(212,175,55,0.06)',
            }}
          >
            <img src={amulet.image_url || PLACEHOLDER} alt={amulet.name} className="w-full h-full object-cover"
                 onError={e => { e.target.src = PLACEHOLDER; }} />
          </div>
          {amulet.status === 'sold_out' && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal-dark/60 rounded-xl">
              <span className="font-serif text-red-400 text-2xl border-2 border-red-400 px-6 py-2 rotate-[-12deg]">{t('status.sold_out')}</span>
            </div>
          )}
          <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-gold/30 rounded-tl transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
          <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-gold/30 rounded-tr transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-gold/30 rounded-bl transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-gold/30 rounded-br transition-all duration-500 group-hover:border-gold/75 group-hover:w-9 group-hover:h-9" />
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
            {amulet.status === 'available' && amulet.stock !== null && amulet.stock !== undefined && (
              <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${amulet.stock <= 5 ? 'text-red-400 border-red-800 bg-red-900/20' : 'text-cream-muted border-charcoal-light'}`}>
                {t('product.stock_left')} {amulet.stock} {t('product.stock_unit')}
              </span>
            )}
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

          {/* Cart toast */}
          {cartMsg && (
            <div
              className="text-cream text-sm text-center py-3 px-4 rounded-xl"
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                boxShadow: '0 0 20px rgba(212,175,55,0.15)',
              }}
            >
              ✦ {cartMsg} ✦
            </div>
          )}

          {/* Quantity selector */}
          {amulet.status === 'available' && (
            <div className="flex items-center gap-4">
              <span className="text-cream-muted text-sm">{t('cart.quantity')}:</span>
              <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-gold/25">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors font-bold text-lg"
                >−</button>
                <span className="w-10 text-center text-cream font-semibold text-base" style={{ background: 'rgba(12,10,3,0.6)' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => amulet.stock !== null ? Math.min(amulet.stock, q + 1) : q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors font-bold text-lg"
                >+</button>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            {amulet.status === 'available' ? (
              <button onClick={handleAddToCart} disabled={addingToCart} className="flex-1 btn-gold py-3 flex items-center justify-center gap-2">
                {addingToCart ? '...' : <>🛒 {t('product.add_to_cart')}</>}
              </button>
            ) : (
              <div className="flex-1 py-3 rounded text-center bg-charcoal-light text-cream-muted cursor-not-allowed border border-charcoal-light">
                {t('product.unavailable')}
              </div>
            )}
            <button onClick={() => navigate(-1)} className="btn-outline-gold px-5">{t('product.back')}</button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            <span className="trust-chip">🔒 ของแท้รับประกัน</span>
            <span className="trust-chip">✈️ จัดส่งทั่วไทย</span>
            <span className="trust-chip">📦 แพ็คอย่างดี</span>
          </div>

          {!user && amulet.status === 'available' && (
            <p className="text-center text-cream-muted text-xs">
              {t('product.login_to_buy')}{' '}
              <Link to="/login" className="text-gold hover:underline">{t('nav.login')}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
