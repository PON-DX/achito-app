import React from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLang } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { ChatNotifProvider } from './contexts/ChatNotifContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AmuletDetail from './pages/AmuletDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import MyOrders from './pages/MyOrders';
import ProfilePon from './pages/ProfilePon';
import ProfileSor from './pages/ProfileSor';
import ProfileMew from './pages/ProfileMew';
import Chat from './pages/Chat';
import AdminChat from './pages/AdminChat';
import HistoryAchito from './pages/HistoryAchito';
import CheckAmulet from './pages/CheckAmulet';
import AmuletCatalog from './pages/AmuletCatalog';
import PosterPage from './pages/PosterPage';

function Footer() {
  const { t } = useLang();
  return (
    <footer className="glass border-t border-gold/15 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-serif text-xl mb-1 gold-shimmer">{t('appName')}</p>
        <p className="text-cream-muted text-sm">{t('footer.tagline')}</p>
        <div className="gold-divider-flow max-w-[120px] mx-auto my-4" />
        <p className="text-cream-muted/40 text-xs">&copy; {new Date().getFullYear()} {t('appName')}. {t('footer.rights')}.</p>
      </div>
    </footer>
  );
}

function TrackingPage() {
  const [params] = useSearchParams();
  return <OrderTracking initialQuery={params.get('q') || ''} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <ChatNotifProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-charcoal-dark">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/amulet/:id" element={<AmuletDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/track" element={<TrackingPage />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/profile/pon" element={<ProfilePon />} />
                  <Route path="/profile/sor" element={<ProfileSor />} />
                  <Route path="/profile/mew" element={<ProfileMew />} />
                  <Route path="/history/achito" element={<HistoryAchito />} />
                  <Route path="/check-amulet" element={<CheckAmulet />} />
                  <Route path="/catalog" element={<AmuletCatalog />} />
                  <Route path="/posters" element={<PosterPage />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/admin/chat" element={<ProtectedRoute adminOnly><AdminChat /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
          </ChatNotifProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
