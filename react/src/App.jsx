import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import Header from './components/Header';
import HomeView from './components/HomeView';
import CategoriesView from './components/CategoriesView';
import OffersView from './components/OffersView';
import CartView from './components/CartView';
import AccountView from './components/AccountView';
import ProductDetailView from './components/ProductDetailView';
import CheckoutView from './components/CheckoutView';
import TrackView from './components/TrackView';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import Footer from './components/Footer';

function AppContent() {
  const [view, setView] = useState('home');
  const [viewHistory, setViewHistory] = useState(['home']);
  const [toast, setToast] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const { cartCount } = useCart();

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);

  const navigateTo = useCallback((v) => {
    setView(v);
    setViewHistory(prev => [...prev, v]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    setViewHistory(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.slice(0, -1);
      setView(updated[updated.length - 1]);
      return updated;
    });
  }, []);

  const goHome = useCallback(() => { setView('home'); setViewHistory(['home']); setSelectedProduct(null); }, []);

  const openProduct = useCallback((id) => { setSelectedProduct(id); navigateTo('product'); }, [navigateTo]);
  const openAuth = useCallback((tab = 'login') => { setAuthTab(tab); setShowAuth(true); }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <Header
        showBack={viewHistory.length > 1}
        onBack={goBack}
        onHome={goHome}
        onCart={() => navigateTo('cart')}
        cartCount={cartCount}
        currentView={view}
        onNavigate={navigateTo}
      />
      {toast && <Toast message={toast} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} initialTab={authTab} />}

      <main id="main-content" className="main-content">
        {view === 'home' && <HomeView searchQuery={searchQuery} setSearchQuery={setSearchQuery} navigateTo={navigateTo} onOpenProduct={openProduct} />}
        {view === 'categories' && <CategoriesView activeCategory={activeCategory} setActiveCategory={setActiveCategory} onOpenProduct={openProduct} />}
        {view === 'offers' && <OffersView onOpenProduct={openProduct} />}
        {view === 'cart' && <CartView onExplore={goHome} onCheckout={() => navigateTo('checkout')} />}
        {view === 'checkout' && <CheckoutView onComplete={goHome} showToast={showToast} />}
        {view === 'product' && selectedProduct && <ProductDetailView productId={selectedProduct} onBack={goBack} />}
        {view === 'track' && <TrackView />}
        {view === 'account' && <AccountView onLogin={() => openAuth('login')} onRegister={() => openAuth('register')} />}
      </main>

      <Footer onTrack={() => navigateTo('track')} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </CartProvider>
    </AuthProvider>
  );
}
