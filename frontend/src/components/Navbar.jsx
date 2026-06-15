import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useChatNotif } from '../contexts/ChatNotifContext';

const LANG_LABEL = { th: '🇹🇭 ไทย', en: '🇬🇧 EN', zh: '🇨🇳 中文' };
const LANG_NEXT_TEXT = { th: 'Switch to English', en: '切换到中文', zh: 'เปลี่ยนเป็นไทย' };

export default function Navbar() {
  const { isAdmin, user, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const { unread } = useChatNotif();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const isActive = (path) => location.pathname === path ? 'text-gold' : 'text-cream-dark hover:text-gold';

  return (
    <nav className="glass-nav border-b border-gold/20 sticky top-0 z-50 animate-nav-aura">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center transition-all duration-500 sacred-icon-anim">
              <span className="text-gold text-lg rotate-sacred-slow inline-block">☸</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-serif text-gold text-xl leading-tight">{t('appName')}</p>
              <p className="text-cream-muted text-[10px] leading-tight tracking-widest uppercase">Thai Amulet Shop</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/" className={`text-sm font-medium transition-colors duration-200 ${isActive('/')}`}>{t('nav.collection')}</Link>
            <Link to="/history/achito" className={`text-sm font-medium transition-colors duration-200 ${isActive('/history/achito')}`}>{t('nav.history')}</Link>
            <Link to="/catalog" className={`text-sm font-medium transition-colors duration-200 ${isActive('/catalog')}`}>ทำเนียบพิมพ์พระ</Link>
            <Link to="/posters" className={`text-sm font-medium transition-colors duration-200 ${isActive('/posters')}`}>โปสเตอร์พระ</Link>
            {isAdmin && <Link to="/admin" className={`text-sm font-medium transition-colors duration-200 ${isActive('/admin')}`}>{t('nav.dashboard')}</Link>}

            {/* Language toggle — cycles th → en → zh */}
            <button
              onClick={toggleLang}
              className="text-xs border border-gold/40 text-gold px-2.5 py-1 rounded-full hover:bg-gold/10 transition-all duration-300 hover:border-gold/70 hover:shadow-[0_0_8px_rgba(212,175,55,0.25)]"
            >
              {LANG_LABEL[lang]}
            </button>


            {user && !isAdmin && (
              <Link to="/my-orders" className={`text-sm font-medium transition-colors ${isActive('/my-orders')}`}>{t('nav.myOrders')}</Link>
            )}
            {user && !isAdmin && (
              <Link to="/check-amulet" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/check-amulet')}`}>
                <span>🔍</span><span>{t('nav.check_amulet')}</span>
              </Link>
            )}
            {user && !isAdmin && (
              <Link to="/chat" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/chat')}`}>
                <span className="relative">
                  💬
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                <span>{t('nav.chat')}</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/chat" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/admin/chat')}`}>
                <span className="relative">
                  💬
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                <span>{t('nav.customer_chat')}</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-cream-muted text-xs border-l border-charcoal-light pl-3">{user.username}</span>
                <button onClick={handleLogout} className="btn-outline-gold text-xs py-1.5 px-3">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline-gold text-xs py-1.5 px-3">{t('nav.login')}</Link>
                <Link to="/register" className="btn-gold text-xs py-1.5 px-3">{t('nav.register')}</Link>
              </div>
            )}
          </div>

          {/* Mobile: menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button className="text-cream p-1" onClick={() => setMenuOpen(!menuOpen)}>
              <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`w-5 h-0.5 bg-current my-1 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-charcoal-light pt-4 space-y-3">
            <Link to="/" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>{t('nav.collection')}</Link>
            <Link to="/history/achito" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>{t('nav.history')}</Link>
            <Link to="/catalog" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>ทำเนียบพิมพ์พระ</Link>
            <Link to="/posters" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>โปสเตอร์พระ</Link>
            {isAdmin && <Link to="/admin" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>}
            {user && !isAdmin && <Link to="/my-orders" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>{t('nav.myOrders')}</Link>}
            {user && !isAdmin && <Link to="/check-amulet" className="block text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>🔍 {t('nav.check_amulet')}</Link>}
            {user && !isAdmin && (
              <Link to="/chat" className="flex items-center gap-2 text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>
                <span className="relative inline-block">
                  💬
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                {t('nav.chat_with_seller')}
                {unread > 0 && <span className="text-red-400 text-xs font-semibold">({unread})</span>}
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/chat" className="flex items-center gap-2 text-cream-dark hover:text-gold py-1" onClick={() => setMenuOpen(false)}>
                <span className="relative inline-block">
                  💬
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                {t('nav.customer_chat')}
                {unread > 0 && <span className="text-red-400 text-xs font-semibold">({unread})</span>}
              </Link>
            )}
            <button
              onClick={() => { toggleLang(); setMenuOpen(false); }}
              className="text-xs border border-gold/40 text-gold px-3 py-1 rounded-full hover:bg-gold/10 transition-colors"
            >
              {LANG_NEXT_TEXT[lang]}
            </button>
            {user ? (
              <button onClick={handleLogout} className="btn-outline-gold w-full text-sm py-2">{t('nav.logout')}</button>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-outline-gold flex-1 text-center text-sm py-2" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="btn-gold flex-1 text-center text-sm py-2" onClick={() => setMenuOpen(false)}>{t('nav.register')}</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
