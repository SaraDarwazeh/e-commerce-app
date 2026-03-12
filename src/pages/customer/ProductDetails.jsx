import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import useFavoritesStore from '../../store/favoritesStore';
import BackButton from '../../components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function ProductDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { currentUser } = useAuthStore();
  const addItem = useCartStore(state => state.addItem);
  const isAdding = useCartStore(state => state.isLoading);
  const { items: favItems, toggleFavorite } = useFavoritesStore();

  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState('');
  const [addedTemp, setAddedTemp] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const isFav = favItems.some(i => i.id === id);

  // Dynamic options state: { "Size": "M", "Color": "Red" }
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const [data, cats] = await Promise.all([
          getProductById(id),
          getCategories()
        ]);
        if (!data || !data.isActive) {
          setError(t('productDetails.productNotFound'));
          return;
        }
        setProduct(data);
        setActiveImage(data.images?.[0] || '');

        const cat = cats.find(c => c.slug === data.category);
        setCategoryName(cat ? cat.name : data.category?.replace('-', ' '));

        // Initialize default selections if provided
        if (data.defaultSelections) {
          setSelectedOptions(data.defaultSelections);
        }
      } catch (err) {
        setError(t('productDetails.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleOptionSelect = (groupName, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: value
    }));
  };

  const getMissingOptions = () => {
    if (!product?.options) return [];
    return product.options.filter(opt => !selectedOptions[opt.name]).map(opt => opt.name);
  };

  const handleAddToCart = async () => {
    if (!currentUser?.uid) {
      addToast(t('productDetails.pleaseSignIn'), "info");
      navigate('/login');
      return;
    }

    if (addedTemp) return;

    const missing = getMissingOptions();
    if (missing.length > 0) {
      addToast(t('productDetails.pleaseSelect', { options: missing.join(', ') }), 'info');
      return;
    }

    await addItem(product, 1, selectedOptions);
    setAddedTemp(true);
    setTimeout(() => setAddedTemp(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (!currentUser?.uid) {
      addToast(t('productDetails.pleaseSignIn'), "info");
      navigate('/login');
      return;
    }

    setIsFavLoading(true);
    try {
      const result = await toggleFavorite(currentUser.uid, product);
      addToast(result ? t('productDetails.addedToFav') : t('productDetails.removedFromFav'), "success");
    } catch (err) {
      addToast(t('productDetails.failedToUpdateFav'), "error");
    } finally {
      setIsFavLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500">{t('productDetails.loading')}</div>;
  if (error || !product) return <div className="py-20 text-center text-red-500">{error}</div>;

  const missingOptions = getMissingOptions();
  const canAddToCart = missingOptions.length === 0 && product.stock > 0 && !isAdding;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="detail-image-wrap aspect-square bg-white rounded-2xl w-full flex items-center justify-center border border-gray-200 overflow-hidden relative">
          {product.ribbonEnabled && (
            <div
              className="absolute top-4 left-4 rtl:left-auto rtl:right-4 text-white text-xs font-bold px-3 py-1 rounded shadow-sm z-10 uppercase tracking-wider"
              style={{ backgroundColor: product.ribbonColor || '#ef4444' }}
            >
              {product.ribbonText || (product.ribbonType === 'custom' ? 'Custom' : String(product.ribbonType).toUpperCase())}
            </div>
          )}
          {activeImage ? (
            <img src={activeImage} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </div>
        {product.images?.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImage(img)}
                className={`aspect-square bg-white rounded-lg cursor-pointer overflow-hidden border-2 flex-shrink-0 ${activeImage === img ? 'border-brand-500' : 'border-transparent hover:border-gray-300'}`}
              >
                <img src={img} alt={`${product.title} view ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col">
        <nav className="text-sm text-gray-500 mb-4 items-center flex flex-wrap gap-2">
          <BackButton />
          <span className="mx-1">|</span>
          <Link to="/" className="hover:text-brand-600 hover:underline">{t('common.home')}</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category}`} className="hover:text-brand-600 hover:underline capitalize">{i18n.language === 'ar' && product.categoryAr ? product.categoryAr : categoryName}</Link>
              <span>/</span>
            </>
          )}
          <span className="truncate max-w-[200px] text-gray-900">{i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title}</span>
        </nav>

        {product.brand && (
          <div className="mb-2">
            <span className="text-sm font-semibold text-brand-600 tracking-wider uppercase">{product.brand}</span>
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title}</h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="text-2xl font-bold text-gray-900">₪{product.price.toFixed(2)}</div>
          {product.comparePrice > product.price && (
            <div className="text-lg text-gray-400 line-through">₪{product.comparePrice.toFixed(2)}</div>
          )}
          <div className={`text-sm px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {product.stock > 0 ? t('productDetails.inStock', { count: product.stock }) : t('productDetails.outOfStock')}
          </div>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-line">
          {i18n.language === 'ar' && product.descriptionAr ? product.descriptionAr : product.description || t('productDetails.noDescription')}
        </p>

        {/* Dynamic Options */}
        {product.options && product.options.length > 0 && (
          <div className="space-y-6 mb-8">
            {product.options.map(optionGroup => (
              <div key={optionGroup.name}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    {optionGroup.name}
                    {!selectedOptions[optionGroup.name] && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {selectedOptions[optionGroup.name] && (
                    <span className="text-sm text-brand-600 font-medium">{selectedOptions[optionGroup.name]}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {optionGroup.values.map(val => {
                    const isSelected = selectedOptions[optionGroup.name] === val;
                    const isColor = optionGroup.name.toLowerCase().includes('color');
                    const [displayLabel, hexColor] = val.includes('|') ? val.split('|') : [val, val];

                    return (
                      <button
                        key={val}
                        onClick={() => handleOptionSelect(optionGroup.name, val)}
                        className={`border rounded-md flex items-center justify-center font-medium transition-colors ${isColor ? 'p-1' : 'px-4 py-2 text-sm'
                          } ${isSelected
                            ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                            : 'border-gray-300 hover:border-brand-500 hover:text-brand-600 text-gray-700 bg-white'
                          }`}
                        title={displayLabel}
                      >
                        {isColor ? (
                          <div
                            className="w-8 h-8 rounded shrink-0 border border-black/10"
                            style={{ backgroundColor: hexColor }}
                          />
                        ) : (
                          displayLabel
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`flex-1 py-4 rounded-xl font-bold transition-all shadow-lg btn-interact ${addedTemp
              ? 'bg-green-600 text-white shadow-green-200'
              : canAddToCart
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              }`}
          >
            {addedTemp ? t('productDetails.addedTemp') : isAdding ? t('productDetails.adding') : product.stock === 0 ? t('productDetails.outOfStock') : missingOptions.length > 0 ? t('productDetails.selectOption', { option: missingOptions[0] }) : t('productDetails.addToCart')}
          </button>
          <button
            onClick={handleToggleFavorite}
            disabled={isFavLoading}
            className={`w-14 h-14 border rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50 btn-interact ${isFav ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 hover:text-red-500'}`}
            title={isFav ? t('productDetails.removeFromFav') : t('productDetails.addToFav')}
          >
            <svg className={`w-6 h-6 ${isFav ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFav ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
