import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useFavoritesStore from '../../store/favoritesStore';
import useUIStore from '../../store/uiStore';

export default function QuickViewModal({ product, onClose }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, currentUser } = useAuthStore();
    const addItem = useCartStore(state => state.addItem);
    const { items: favItems, toggleFavorite } = useFavoritesStore();
    const { addToast } = useUIStore();

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [visible, setVisible] = useState(false);

    // Trigger entrance animation after mount
    useEffect(() => {
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        // Small delay so the browser paints the initial state first
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = '';
        };
    }, []);

    if (!product) return null;

    const isFav = favItems.some(i => i.id === product.id);
    const displayTitle = i18n.language === 'ar' && product.titleAr ? product.titleAr : product.title;
    const displayDesc = i18n.language === 'ar' && product.descriptionAr ? product.descriptionAr : product.description;
    const images = product.images?.length > 0 ? product.images : [];
    const isRtl = i18n.dir() === 'rtl';

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250); // Wait for exit animation
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated || !currentUser?.uid) {
            addToast(t('products.signInToAdd') || 'Sign in to add', 'info');
            navigate('/login');
            handleClose();
            return;
        }

        if (product.options?.length > 0) {
            const missing = product.options.filter(opt => !selectedOptions[opt.name]);
            if (missing.length > 0) {
                addToast(t('productDetails.pleaseSelect', { options: missing.map(m => m.name).join(', ') }) || 'Select options', 'info');
                return;
            }
        }

        const addedOptions = { ...selectedOptions };
        let finalColor = null;

        const colorKey = Object.keys(addedOptions).find(k => k.toLowerCase().includes('color'));
        if (colorKey) {
            const val = addedOptions[colorKey];
            const [, hexColor] = val.includes('|') ? val.split('|') : [val, val];
            finalColor = hexColor;
            delete addedOptions[colorKey];
        }

        await addItem(product, 1, addedOptions, finalColor);
        addToast(t('home.addedToCart'), 'success');
        handleClose();
    };

    const handleFav = async () => {
        if (!isAuthenticated || !currentUser?.uid) {
            addToast(t('products.signInToFav') || 'Sign in', 'info');
            navigate('/login');
            handleClose();
            return;
        }
        try {
            const result = await toggleFavorite(currentUser.uid, product);
            addToast(result ? t('products.addedToFavorites') : t('products.removedFromFavorites'), 'success');
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const salePercent = product.salePercent || (product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0);

    const modal = (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                transition: 'opacity 0.25s ease',
                opacity: visible ? 1 : 0,
            }}
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                }}
            />

            {/* Modal Panel */}
            <div
                style={{
                    position: 'relative',
                    backgroundColor: '#fff',
                    borderRadius: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    width: '100%',
                    maxWidth: '52rem',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, opacity 0.3s ease',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
                    opacity: visible ? 1 : 0,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        [isRtl ? 'left' : 'right']: '1rem',
                        zIndex: 30,
                        padding: '0.5rem',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'background 0.2s',
                        color: '#374151',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#111827'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'; e.currentTarget.style.color = '#374151'; }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)' }} className="md:!grid-cols-2">
                    {/* Image Section */}
                    <div style={{ position: 'relative', backgroundColor: '#f9fafb', aspectRatio: '1/1' }} className="md:!aspect-auto">
                        {images.length > 0 ? (
                            <>
                                <img
                                    src={images[activeImageIdx]}
                                    alt={displayTitle}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setActiveImageIdx(i => (i - 1 + images.length) % images.length)}
                                            className="absolute top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
                                            style={{ [isRtl ? 'right' : 'left']: '0.75rem' }}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            onClick={() => setActiveImageIdx(i => (i + 1) % images.length)}
                                            className="absolute top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
                                            style={{ [isRtl ? 'left' : 'right']: '0.75rem' }}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            {images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIdx(idx)}
                                                    className={`h-2 rounded-full transition-all ${idx === activeImageIdx ? 'bg-gray-900 w-6' : 'bg-gray-400 w-2'}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">No Image</div>
                        )}

                        {/* Sale Badge */}
                        {salePercent > 0 && (
                            <div
                                className="absolute top-4 bg-gradient-to-r from-rose-500 to-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full"
                                style={{ [isRtl ? 'right' : 'left']: '1rem' }}
                            >
                                -{salePercent}%
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto" style={{ maxHeight: '90vh' }}>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                                {product.category?.replace('-', ' ')}
                            </p>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{displayTitle}</h2>

                            {displayDesc && (
                                <p className="text-sm text-gray-500 mb-6 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayDesc}</p>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-3xl font-black text-gray-900">₪{Number(product.price).toFixed(2)}</span>
                                {product.comparePrice > product.price && (
                                    <span className="text-lg text-gray-400 line-through">₪{Number(product.comparePrice).toFixed(2)}</span>
                                )}
                            </div>

                            {/* Options */}
                            {product.options?.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    {product.options.map(opt => (
                                        <div key={opt.name}>
                                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{opt.name}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {opt.values?.map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                                                        className={`px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all ${selectedOptions[opt.name] === val
                                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                                : 'border-gray-200 text-gray-700 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className="flex-1 bg-gray-900 text-white rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                >
                                    <ShoppingBag size={18} />
                                    {product.stock === 0 ? t('products.outOfStock') : t('home.addToCart')}
                                </button>

                                <button
                                    onClick={handleFav}
                                    className={`p-3.5 rounded-xl border-2 transition-all ${isFav ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
                                        }`}
                                >
                                    <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            <Link
                                to={`/product/${product.id}`}
                                onClick={handleClose}
                                className="block text-center text-sm font-medium text-gray-500 hover:text-gray-900 py-2 transition-colors"
                            >
                                {t('home.viewProduct')} →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use React Portal to render at document.body level — avoids stacking context issues
    return createPortal(modal, document.body);
}
