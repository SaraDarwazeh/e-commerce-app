import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import { signOut } from '../services/authService';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

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
      <div className="bg-brand-900 text-brand-50 text-xs py-2 text-center font-medium tracking-wide">
        {t('common.freeShipping')}
      </div>

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
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">{t('common.allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
