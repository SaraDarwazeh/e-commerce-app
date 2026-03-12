import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../../services/categoryService';
import { getFeaturedProducts, getSaleProducts } from '../../services/productService';
import { getBanners } from '../../services/bannerService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ChevronRight, ChevronLeft, Sparkles, Heart, ShoppingBag, Flame, Eye, Star } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useFavoritesStore from '../../store/favoritesStore';
import useUIStore from '../../store/uiStore';
import QuickViewModal from '../../components/ui/QuickViewModal';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthStore();
  const addItem = useCartStore(state => state.addItem);
  const { items: favItems, toggleFavorite } = useFavoritesStore();
  const { addToast } = useUIStore();
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [saleSectionEnabled, setSaleSectionEnabled] = useState(false);
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Dynamic section ordering from admin
  const defaultSections = [
    { id: 'hero', visible: true },
    { id: 'categories', visible: true },
    { id: 'sale', visible: true },
    { id: 'trending', visible: true },
    { id: 'editorsPicks', visible: true },
  ];
  const [homepageSections, setHomepageSections] = useState(defaultSections);

  // Auto-slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, cats, promoBanners, saleProds] = await Promise.all([
          getFeaturedProducts(),
          getCategories(true),
          getBanners(true),
          getSaleProducts()
        ]);
        setTrendingProducts(featured.slice(0, 4));
        setCategories(cats.slice(0, 8));
        setBanners(promoBanners);
        setSaleProducts(saleProds.slice(0, 6));

        // Fetch storefront settings (sale toggle + section ordering)
        try {
          const saleDoc = await getDoc(doc(db, 'settings', 'storefront'));
          if (saleDoc.exists()) {
            const data = saleDoc.data();
            setSaleSectionEnabled(data.saleSectionEnabled || false);
            if (data.homepageSections && Array.isArray(data.homepageSections)) {
              setHomepageSections(data.homepageSections);
            }
          }
        } catch (e) { /* ignore */ }
      } catch (error) {
        console.error("Error fetching home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---- Helpers ----
  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.options?.length > 0) { navigate(`/product/${product.id}`); return; }
    if (!isAuthenticated) { addToast(t('products.signInToAdd') || 'Sign in', 'info'); navigate('/login'); return; }
    addItem(product, 1);
    addToast(t('home.addedToCart'), 'success');
  };

  const handleToggleFav = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !currentUser?.uid) { addToast(t('products.signInToFav') || 'Sign in', 'info'); navigate('/login'); return; }
    toggleFavorite(currentUser.uid, product).then(added => addToast(added ? t('products.addedToFavorites') : t('products.removedFromFavorites'), 'success')).catch(err => addToast(err.message, 'error'));
  };

  // ---- Reusable product card ----
  const renderProductCard = (product, large = false) => {
    const displayTitle = i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title;
    const salePercent = product.salePercent || (product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0);

    return (
      <div key={product.id} className={`product-card bg-white ${large ? 'rounded-3xl' : 'rounded-2xl'} border border-gray-100 overflow-hidden flex flex-col relative`}>
        {/* Badge */}
        {salePercent > 0 && (
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg badge-pulse">
            -{salePercent}% {t('home.badgeSale')}
          </div>
        )}
        {!salePercent && product.ribbonEnabled && product.ribbonText && (
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider" style={{ backgroundColor: product.ribbonColor || '#ef4444' }}>
            {product.ribbonText}
          </div>
        )}

        <Link to={`/product/${product.id}`} className={`${large ? 'aspect-[3/4]' : 'aspect-[4/5]'} bg-gray-50 relative overflow-hidden block`}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={displayTitle} className="card-image w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
          )}

          {/* Hover Action Overlay */}
          <div className="card-actions absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-end justify-center pb-5">
            <div className="flex gap-2">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product); }} className="p-3 bg-white/95 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white hover:text-gray-900 shadow-lg transition-all btn-interact" title={t('home.quickView')}>
                <Eye size={18} />
              </button>
              <button onClick={(e) => handleToggleFav(e, product)} className={`p-3 rounded-full shadow-lg transition-all btn-interact ${favItems.some(i => i.id === product.id) ? 'bg-red-50 text-red-500' : 'bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-red-500'}`}>
                <Heart size={18} fill={favItems.some(i => i.id === product.id) ? 'currentColor' : 'none'} />
              </button>
              <button onClick={(e) => handleAddToCart(e, product)} className="p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all btn-interact">
                <ShoppingBag size={18} />
              </button>
            </div>
          </div>
        </Link>

        <Link to={`/product/${product.id}`} className={`${large ? 'p-5' : 'p-4'} flex flex-col flex-1`}>
          <h3 className={`font-medium text-gray-900 mb-1 truncate ${large ? 'text-lg font-semibold' : ''}`}>{displayTitle}</h3>
          <p className="text-sm text-gray-500 mb-2 capitalize">{product.category?.replace('-', ' ') || 'General'}</p>
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className={`font-bold ${large ? 'text-xl' : 'text-lg'} ${salePercent > 0 ? 'text-rose-600' : 'text-gray-900'}`}>₪{Number(product.price).toFixed(2)}</span>
            {product.comparePrice > product.price && (
              <span className="text-xs text-gray-400 line-through">₪{Number(product.comparePrice).toFixed(2)}</span>
            )}
          </div>
        </Link>
      </div>
    );
  };

  // ---- Section renderers ----
  const renderHero = () => (
    <>
      {/* Hero Section */}
      <section className="bg-[#fcfbf9] rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-sm border border-[#f3eee8]">
        <div className={`absolute top-0 w-1/2 h-full bg-[#faeff0] opacity-30 mix-blend-multiply ${i18n.dir() === 'rtl' ? 'left-0 rounded-r-[4rem]' : 'right-0 rounded-l-[4rem]'}`}></div>
        <div className={`md:w-1/2 space-y-8 relative z-10 ${i18n.dir() === 'rtl' ? 'pl-8' : 'pr-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm">
            <Sparkles size={16} className="text-[#a2845e]" />
            <span className="text-sm font-semibold tracking-widest text-[#a2845e] uppercase">{t('home.savoirFaire')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] font-serif">
            {t('home.heroTitle1')} <br className="hidden md:block" /> {t('home.heroTitle2')} <br />
            <span className="text-[#a2845e] font-serif italic font-light">{t('home.heroTitle3')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md leading-relaxed font-light">{t('home.heroDesc')}</p>
          <div className="pt-4">
            <Link to="/products" className="inline-flex items-center gap-3 bg-gray-900 hover:bg-[#a2845e] text-white font-medium px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-gray-900/10 hover:shadow-2xl hover:shadow-[#a2845e]/20 hover:-translate-y-1 btn-interact">
              {t('home.exploreCollection')} {i18n.dir() === 'rtl' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-16 md:mt-0 flex justify-center relative z-10 h-full">
          <div className="w-full max-w-[500px] aspect-[4/5] bg-gray-100 rounded-[3rem] shadow-2xl overflow-hidden relative group">
            <img src="https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&q=80" alt="Luxury Handbag Lifestyle" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </section>

      {/* Promotional Banners Slider */}
      {banners.length > 0 && (
        <section className="relative rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 group bg-gray-900 h-[60vh] min-h-[400px]">
          {banners.map((banner, idx) => (
            <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent"></div>
              <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tight leading-tight drop-shadow-lg">{banner.title}</h2>
                <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-lg font-light">{banner.subtitle}</p>
                <div>
                  <Link to={banner.ctaLink} className="inline-block bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 py-4 rounded-full transition-colors shadow-xl btn-interact">{banner.ctaText}</Link>
                </div>
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <>
              <button onClick={() => setCurrentBannerIdx((p) => p === 0 ? banners.length - 1 : p - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => setCurrentBannerIdx((p) => (p + 1) % banners.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {banners.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentBannerIdx(idx)} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentBannerIdx ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'}`} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );

  const renderCategories = () => (
    <section>
      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 tracking-tight">{t('home.shopByConcept')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map(category => (
          <Link key={category.id} to={`/products?category=${category.slug}`} className="relative p-6 rounded-[2rem] shadow-sm overflow-hidden aspect-[4/5] cursor-pointer group hover:-translate-y-1 transition-transform duration-500">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
            ) : (
              <div className="absolute inset-0 bg-gray-100 group-hover:scale-105 transition-transform duration-700"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="relative z-10 h-full flex flex-col justify-end text-white">
              <div className="mb-2">{getCategoryIcon(category.slug)}</div>
              <h3 className="text-lg md:text-xl font-bold mb-1">
                {i18n.language === 'ar' && category.nameAr ? category.nameAr : category.name}
              </h3>
              <p className="text-xs text-gray-300 capitalize tracking-wide">
                {(i18n.language === 'ar' && category.descriptionAr ? category.descriptionAr : category.description) || t('home.discoverCat')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );

  const renderSale = () => {
    if (!saleSectionEnabled || saleProducts.length === 0) return null;
    return (
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg shadow-rose-500/30">
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t('admin.specialOffers')}</h2>
              <p className="text-xs text-gray-400">{t('home.limitedTimeOffers') || 'Limited time deals'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {saleProducts.map(product => {
              const displayTitle = i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title;
              const salePercent = product.salePercent || (product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0);
              return (
                <Link key={product.id} to={`/product/${product.id}`} className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden group hover:bg-white/15 transition-all border border-white/5 flex flex-col">
                  {salePercent > 0 && (
                    <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-10 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full badge-pulse">
                      -{salePercent}%
                    </div>
                  )}
                  <div className="aspect-square relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">No Image</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-white mb-1 truncate">{displayTitle}</h3>
                    <div className="mt-auto flex items-baseline gap-2 pt-2">
                      <span className="font-bold text-lg text-rose-400">₪{Number(product.price).toFixed(2)}</span>
                      {product.comparePrice > product.price && (
                        <span className="text-xs text-gray-500 line-through">₪{Number(product.comparePrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderTrending = () => {
    if (loading) return <div className="py-12 text-center text-gray-500">{t('home.loadingTrending')}</div>;
    if (trendingProducts.length === 0) return <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">{t('home.noTrending')}</div>;
    return (
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('home.trendingNow')}</h2>
          <Link to="/products" className="text-brand-600 font-medium hover:underline">{t('home.viewAll')}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.map(product => renderProductCard(product))}
        </div>
      </section>
    );
  };

  const renderEditorsPicks = () => {
    if (loading || trendingProducts.length === 0) return null;
    return (
      <section className="relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-200">
            <Star size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('home.editorsPicks')}</h2>
            <p className="text-sm text-gray-500">{t('home.editorsPicksDesc')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trendingProducts.slice(0, 3).map((product) => renderProductCard(product, true))}
        </div>
      </section>
    );
  };

  // ---- Section map ----
  const sectionMap = {
    hero: renderHero,
    categories: renderCategories,
    sale: renderSale,
    trending: renderTrending,
    editorsPicks: renderEditorsPicks,
  };

  return (
    <div className="space-y-12 page-fade-in">
      {homepageSections
        .filter(s => s.visible)
        .map(s => {
          const renderer = sectionMap[s.id];
          if (!renderer) return null;
          return <div key={s.id}>{renderer()}</div>;
        })}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
