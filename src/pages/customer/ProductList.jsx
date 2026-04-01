import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useFavoritesStore from '../../store/favoritesStore';
import useUIStore from '../../store/uiStore';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { Search, SlidersHorizontal, X, Heart, ShoppingBag, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QuickViewModal from '../../components/ui/QuickViewModal';

export default function ProductList() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);
  const { isAuthenticated, currentUser } = useAuthStore();
  const { items: favItems, toggleFavorite } = useFavoritesStore();
  const { addToast } = useUIStore();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodsData, catsData] = await Promise.all([
          getProducts(true),
          getCategories(true)
        ]);
        setProducts(prodsData);
        setCategories(catsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync URL params to local state when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  // Update URL function
  const updateUrlParams = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const handleSearchCommit = (e) => {
    e.preventDefault();
    updateUrlParams('q', searchQuery);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  };

  // Advanced Frontend Filter Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search Query (Title, Brand, Category Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Category
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Stock
    if (inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    // Price
    result = result.filter(p => {
      const price = Number(p.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'featured':
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
          const bTime = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
          return bTime - aTime;
        });
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, priceRange, inStockOnly, sortBy]);

  const activeCategoryName = selectedCategory && selectedCategory !== 'all'
    ? (i18n.language === 'ar' ? categories.find(c => c.slug === selectedCategory)?.nameAr || categories.find(c => c.slug === selectedCategory)?.name : categories.find(c => c.slug === selectedCategory)?.name) || selectedCategory
    : t('products.allCollection');

  const handleQuickAdd = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast(t('products.signInToAdd'), "info");
      navigate('/login');
      return;
    }

    // If product has required options without defaults, redirect to details page
    if (product.options?.length > 0) {
      navigate(`/product/${product.id}`);
      return;
    }

    await addItem(product, 1);
  };

  const handleToggleFavorite = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !currentUser?.uid) {
      addToast(t('products.signInToFav') || 'Sign in to save favorites', 'info');
      navigate('/login');
      return;
    }
    try {
      const added = await toggleFavorite(currentUser.uid, product);
      addToast(added ? (t('products.addedToFavorites') || 'Added to favorites') : (t('products.removedFromFavorites') || 'Removed from favorites'), 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const isFavorited = (productId) => favItems.some(i => i.id === productId);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Search Header */}
      <div className="bg-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 capitalize tracking-tight">
            {searchParams.get('q') ? t('products.searchResult', { query: searchParams.get('q') }) : activeCategoryName}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">{t('products.showingItems', { count: filteredProducts.length })}</p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchCommit} className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className="w-full pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 transition-colors"
            />
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); updateUrlParams('q', ''); }} className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </form>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium"
          >
            <SlidersHorizontal size={18} /> {t('products.filters')}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-brand-500 bg-gray-50 font-medium text-gray-700"
          >
            <option value="newest">{t('products.sortBy')}: {t('products.newest')}</option>
            <option value="featured">{t('products.featuredFirst')}</option>
            <option value="price-asc">{t('products.priceLowHigh')}</option>
            <option value="price-desc">{t('products.priceHighLow')}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar Filters */}
        <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block w-full md:w-64 space-y-8 flex-shrink-0 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit self-start sticky top-24`}>
          <div className="flex items-center justify-between md:hidden mb-6">
            <h2 className="font-bold text-lg text-gray-900">{t('products.filters')}</h2>
            <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">{t('common.categories')}</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => { setSelectedCategory('all'); updateUrlParams('category', 'all'); }}
                  className={`text-sm flex items-center gap-2 transition-colors ${selectedCategory === 'all' || !selectedCategory ? 'text-brand-600 font-bold' : 'text-gray-600 hover:text-brand-600'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'all' || !selectedCategory ? 'bg-brand-600' : 'bg-transparent'}`}></div>
                  {t('products.allCategories')}
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => { setSelectedCategory(cat.slug); updateUrlParams('category', cat.slug); }}
                    className={`text-sm flex items-center gap-2 transition-colors capitalize ${selectedCategory === cat.slug ? 'text-brand-600 font-bold' : 'text-gray-600 hover:text-brand-600'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat.slug ? 'bg-brand-600' : 'bg-transparent'}`}></div>
                    {i18n.language === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">{t('products.priceRange')}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                  className="w-full text-sm border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Min"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  min="0"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 1000])}
                  className="w-full text-sm border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Max"
                />
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-brand-600"
              />
              <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                <span>₪0</span>
                <span>₪1000+</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">{t('products.availability')}</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{t('products.inStockOnly')}</span>
            </label>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button
              onClick={clearFilters}
              className="w-full py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {t('products.clearAllFilters')}
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm h-96">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
              {t('products.loading')}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const displayTitle = i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title;
                const salePercent = product.salePercent || (product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0);
                const isNew = product.ribbonType === 'new' || (product.createdAt?.toDate ? (Date.now() - product.createdAt.toDate().getTime() < 7 * 86400000) : false);
                const isTrending = product.isFeatured;
                const isHot = product.ribbonType === 'bestseller';

                return (
                  <div key={product.id} className="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col relative">
                    {/* Smart Badge */}
                    {salePercent > 0 ? (
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg badge-pulse">
                        -{salePercent}% {t('home.badgeSale')}
                      </div>
                    ) : product.ribbonEnabled && product.ribbonText ? (
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider" style={{ backgroundColor: product.ribbonColor || '#ef4444' }}>
                        {product.ribbonText}
                      </div>
                    ) : isNew ? (
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                        ⭐ {t('home.badgeNew')}
                      </div>
                    ) : isTrending ? (
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                        🔥 {t('home.badgeTrending')}
                      </div>
                    ) : isHot ? (
                      <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-20 bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                        {t('home.badgeHot')}
                      </div>
                    ) : null}

                    {/* Image with zoom */}
                    <Link to={`/product/${product.id}`} className="aspect-[4/5] bg-gray-50 relative overflow-hidden block">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={displayTitle} className="card-image w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                      )}

                      {/* Hover Action Overlay */}
                      <div className="card-actions absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-end justify-center pb-5">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product); }}
                            className="p-3 bg-white/95 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white hover:text-gray-900 shadow-lg transition-all btn-interact"
                            title={t('home.quickView')}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => handleToggleFavorite(e, product)}
                            className={`p-3 rounded-full shadow-lg transition-all btn-interact ${isFavorited(product.id) ? 'bg-red-50 text-red-500' : 'bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-red-500'}`}
                          >
                            <Heart size={18} fill={isFavorited(product.id) ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={(e) => handleQuickAdd(e, product)}
                            disabled={product.stock === 0}
                            className="p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-interact"
                            title={product.stock === 0 ? t('products.outOfStock') : t('home.addToCart')}
                          >
                            <ShoppingBag size={18} />
                          </button>
                        </div>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <Link to={`/product/${product.id}`} className="p-4 flex flex-col flex-1">
                      <h3 className="font-medium text-gray-900 mb-1 truncate" title={displayTitle}>{displayTitle}</h3>
                      <p className="text-sm text-gray-500 mb-2 capitalize">{product.category ? product.category.replace('-', ' ') : t('products.uncategorized')}</p>
                      
                      {product.variants?.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {product.variants.slice(0, 5).map((v, i) => (
                            <div key={i} className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: v.color }} title={v.label} />
                          ))}
                          {product.variants.length > 5 && <span className="text-[10px] text-gray-400 self-center">+{product.variants.length - 5}</span>}
                        </div>
                      )}

                      <div className="mt-auto flex justify-between items-end pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-bold text-lg ${salePercent > 0 ? 'text-rose-600' : 'text-gray-900'}`}>₪{Number(product.price).toFixed(2)}</span>
                          {product.comparePrice > product.price && (
                            <span className="text-xs text-gray-400 line-through">₪{Number(product.comparePrice).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center h-96">
              <Search className="text-gray-300 w-16 h-16 mb-4" strokeWidth={1} />
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">{t('products.noProductsTitle')}</h2>
              <p className="text-gray-500 max-w-sm">{t('products.noProductsDesc')}</p>
              <button onClick={clearFilters} className="mt-6 px-6 py-2.5 bg-gray-900 text-white font-medium rounded-full hover:bg-brand-600 transition-colors btn-interact">
                {t('products.clearAllFilters')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
