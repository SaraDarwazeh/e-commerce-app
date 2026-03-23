import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import { useTranslation } from 'react-i18next';
import { getDeliverySettings } from '../../services/deliveryService';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');

  const {
    items,
    totals,
    coupon,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    setDeliverySettings
  } = useCartStore();

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getDeliverySettings();
      setDeliverySettings(settings);
    };
    fetchSettings();
  }, [setDeliverySettings]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const success = await applyCoupon(couponCode);
    if (success) setCouponCode('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('cart.shoppingCart')}</h1>

      {items.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            {items.map(item => (
              <div key={item.cartItemId || item.productId} className="flex gap-4 border-b border-gray-200 pb-6">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900">
                      <Link to={`/product/${item.productId}`} className="hover:text-brand-600 hover:underline">
                        {i18n.language === 'ar' && item.titleAr ? item.titleAr : item.title}
                      </Link>
                    </h3>
                    <p className="font-bold text-gray-900">₪{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-gray-500 capitalize mb-2">{i18n.language === 'ar' && item.categoryAr ? item.categoryAr : item.category?.replace('-', ' ')}</p>

                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(item.selectedOptions).map(([key, value]) => {
                        const displayVal = value.includes('|') ? value.split('|')[0] : value;
                        return (
                          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {key}: {displayVal}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                      <button
                        disabled={isLoading}
                        onClick={() => updateQuantity(item.cartItemId || item.productId, -1)}
                        className="px-3 py-1 text-gray-500 hover:bg-gray-50 border-r border-gray-300 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-sm font-medium min-w-[3rem] text-center">{item.quantity}</span>
                      <button
                        disabled={isLoading}
                        onClick={() => updateQuantity(item.cartItemId || item.productId, 1)}
                        className="px-3 py-1 text-gray-500 hover:bg-gray-50 border-l border-gray-300 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.cartItemId || item.productId)}
                      disabled={isLoading}
                      className="text-sm text-red-500 hover:underline disabled:opacity-50"
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl flex flex-col h-fit border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('cart.orderSummary')}</h2>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>₪{totals.subtotal.toFixed(2)}</span>
                </div>

                {coupon && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      {t('cart.discount', { code: coupon.code })}
                      <button onClick={removeCoupon} className="text-xs hover:underline text-gray-500 ml-1 rtl:mr-1 rtl:ml-0" title={t('cart.removeCoupon')}>✕</button>
                    </span>
                    <span>-₪{totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.shipping')}</span>
                  <span className="font-medium">{totals.deliveryCost === 0 ? t('cart.free') : `₪${totals.deliveryCost.toFixed(2)}`}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg text-gray-900">
                  <span>{t('cart.total')}</span>
                  <span>₪{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {t('cart.checkout')}
              </button>

              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">{t('cart.or')} </span>
                <Link to="/products" className="text-sm text-brand-600 font-medium hover:underline">
                  {t('cart.continueShopping')}
                </Link>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t('cart.applyPromo')}</h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t('cart.enterCode')}
                  disabled={isLoading || coupon}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !couponCode.trim() || coupon}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {t('cart.apply')}
                </button>
              </form>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('cart.emptyCart')}</h2>
          <p className="text-gray-500 mb-8">{t('cart.emptyCartDesc')}</p>
          <Link to="/products" className="inline-block bg-brand-600 text-white py-3 px-8 rounded-full font-bold hover:bg-brand-700 transition-colors">
            {t('cart.startShopping')}
          </Link>
        </div>
      )}
    </div>
  );
}
