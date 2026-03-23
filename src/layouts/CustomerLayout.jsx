import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import { signOut } from '../services/authService';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import WhatsAppWidget from '../components/ui/WhatsAppWidget';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userProfile, isAdmin, currentUser } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { items: favItems, fetchFavorites, clearFavorites } = useFavoritesStore();
  const { t, i18n } = useTranslation();

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const favCount = favItems.length;

  const [storefrontConfig, setStorefrontConfig] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'storefront'), (sfDoc) => {
      if (sfDoc.exists()) {
        setStorefrontConfig(sfDoc.data());
      }
    }, (error) => {
      console.error("Failed to fetch storefront config dynamically", error);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.uid) {
      fetchFavorites(currentUser.uid);
    } else {
      clearFavorites();
    }
  }, [isAuthenticated, currentUser, fetchFavorites, clearFavorites]);

  // Apply Cairo font to body when Arabic is active
  useEffect(() => {
    if (i18n.language === 'ar') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [i18n.language]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync search query with URL exactly
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col" dir={i18n.dir()}>
      {/* Top Banner */}
      {storefrontConfig?.announcementActive !== false && (
        <div
          className="text-xs py-2 text-center font-medium tracking-wide transition-colors"
          style={{
            backgroundColor: storefrontConfig?.announcementBgColor || '#ef4444',
            color: '#ffffff'
          }}
        >
          {i18n.language === 'ar'
            ? (storefrontConfig?.announcementTextAr || 'توصيل مجاني على جميع الطلبات فوق ₪50')
            : (storefrontConfig?.announcementTextEn || 'Free delivery on all orders over ₪50')}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center text-white text-xl font-serif">G</div>
                <span>Gold<span className="text-brand-600">Bag</span></span>
              </Link>
            </div>

            {/* Main Navigation */}
            <nav className={`hidden md:flex ${i18n.dir() === 'rtl' ? 'gap-12' : 'gap-8'}`}>
              <Link to="/" className={`text-sm font-semibold transition-colors ${pathname === '/' ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}>{t('common.home')}</Link>
              <Link to="/products" className={`text-sm font-semibold transition-colors ${pathname.includes('/products') || pathname.includes('/product/') ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}>{t('common.categories')}</Link>
              <a href="#contact" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">{t('common.contactUs')}</a>
            </nav>

            {/* Icons & Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />

              {/* Search Icon & Dropdown */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <span className="sr-only">Search</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {isSearchOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 origin-top-right">
                    <form onSubmit={handleSearchSubmit} className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('common.searchPlaceholder')}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block pl-3 pr-10 rtl:pr-3 rtl:pl-10 py-2.5"
                        autoFocus
                      />
                      <button type="submit" className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center pr-3 rtl:pr-0 rtl:pl-3">
                        <svg className="w-5 h-5 text-gray-400 hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* User Account Area */}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                      {(userProfile?.fullName?.[0] || 'U').toUpperCase()}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 origin-top-right rtl:origin-top-left z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.fullName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
                      </div>

                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-brand-600 font-medium hover:bg-gray-50">
                          {t('common.adminDashboard')}
                        </Link>
                      )}

                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        {t('common.myProfile')}
                      </Link>
                      <Link to="/my-orders" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        {t('common.myOrders')}
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left rtl:text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t border-gray-100"
                      >
                        {t('common.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-5">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">{t('common.signIn')}</Link>
                  <Link to="/register" className="text-sm font-medium bg-brand-600 text-white px-5 py-2 rounded-full hover:bg-brand-700 transition-colors">{t('common.signUp')}</Link>
                </div>
              )}

              {/* Cart Icon */}
              <Link to="/cart" className={`relative transition-colors group ${pathname === '/cart' ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}>
                <span className="sr-only">Cart</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 rtl:-right-auto rtl:-left-1.5 bg-brand-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Favorites Icon */}
              <Link to="/favorites" className={`relative transition-colors group ${pathname === '/favorites' ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}>
                <span className="sr-only">Favorites</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {favCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 rtl:-right-auto rtl:-left-1.5 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
              </Link>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 page-fade-in">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">{t('common.shop')}</h3>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-sm text-gray-500 hover:text-brand-600">{t('common.categories')}</Link></li>
                <li><Link to="/products" className="text-sm text-gray-500 hover:text-brand-600">{t('common.featuredBags')}</Link></li>
              </ul>
            </div>
            <div id="contact">
              <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">{t('common.support')}</h3>
              <ul className="space-y-2">
                <li><a className="text-sm text-gray-500 hover:text-brand-600 cursor-pointer">{t('common.contactUs')}</a></li>
                <li><a className="text-sm text-gray-500 hover:text-brand-600 cursor-pointer">{t('common.faqs')}</a></li>
                <li><a className="text-sm text-gray-500 hover:text-brand-600 cursor-pointer">{t('common.shippingReturns')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">{t('common.allRightsReserved')}</p>
            
            {/* Social Links */}
            <div className="flex gap-5">
              {storefrontConfig?.socialLinks?.instagram && (
                <a href={storefrontConfig.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                </a>
              )}
              {storefrontConfig?.socialLinks?.facebook && (
                <a href={storefrontConfig.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                </a>
              )}
              {storefrontConfig?.socialLinks?.tiktok && (
                <a href={storefrontConfig.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <span className="sr-only">TikTok</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v4.45c-.01 2.92-1.35 5.75-3.64 7.54-2.5 1.95-6.07 2.38-8.99 1.12-3.32-1.43-5.35-5.06-4.66-8.62.58-3.05 3.04-5.5 6.13-6.14.49-.1.99-.14 1.49-.16v4.06c-1.32.22-2.5 1.14-3.04 2.37-.53 1.23-.41 2.7.3 3.82.72 1.11 2.06 1.83 3.39 1.81 1.76-.03 3.23-1.36 3.47-3.11V.02h-1.5z" clipRule="evenodd" /></svg>
                </a>
              )}
              {storefrontConfig?.socialLinks?.twitter && (
                <a href={storefrontConfig.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                  <span className="sr-only">X (Twitter)</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
                </a>
              )}
              {storefrontConfig?.socialLinks?.youtube && (
                <a href={storefrontConfig.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" /></svg>
                </a>
              )}
            </div>

            <div className="flex gap-4 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-brand-600 transition-colors">
                {i18n.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <WhatsAppWidget />
    </div>
  );
}
