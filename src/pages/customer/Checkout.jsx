import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import { updateUserProfile } from '../../services/authService';
import { createOrder } from '../../services/orderService';
import { getShippingSettings } from '../../services/shippingService';
import BackButton from '../../components/ui/BackButton';
import { Banknote, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const { userProfile, currentUser, updateProfileData } = useAuthStore();
  const navigate = useNavigate();
  const { items, totals, coupon, clearCart, setShippingRegion, setShippingSettings } = useCartStore();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phone || '',
    region: userProfile?.region || 'West Bank',
    address: userProfile?.address || '',
    notes: userProfile?.notes || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If cart is empty, redirect back to cart
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  useEffect(() => {
    // Fetch shipping settings once on mount
    const fetchSettings = async () => {
      const settings = await getShippingSettings();
      setShippingSettings(settings);
    };
    fetchSettings();
  }, [setShippingSettings]);

  useEffect(() => {
    // Sync store region any time formData.region changes
    setShippingRegion(formData.region);
  }, [formData.region, setShippingRegion]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.address) {
      setError(t('checkout.fillShipping'));
      return;
    }
    if (!paymentMethod) {
      setError(t('checkout.selectPayment'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Save delivery info to user profile if altered
      if (currentUser?.uid) {
        await updateUserProfile(currentUser.uid, formData);
        updateProfileData(formData);
      }

      // Real order placement
      const orderData = {
        customerId: currentUser?.uid || 'guest',
        customerName: formData.fullName,
        customerEmail: userProfile?.email || currentUser?.email || 'Guest',
        customerPhone: formData.phone,
        shippingRegion: formData.region,
        address: formData.address,
        notes: formData.notes,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_verification',
        items: items.map(i => ({
          productId: i.id || i.productId,
          title: i.title,
          price: Number(i.price || 0),
          quantity: Number(i.quantity || 1),
          selectedOptions: i.selectedOptions || {},
          images: i.images || [i.image].filter(Boolean) || []
        })),
        totals: {
          subtotal: Number(totals.subtotal || 0),
          shipping: Number(totals.shipping || 0),
          discountAmount: Number(totals.discountAmount || 0),
          total: Number(totals.total || 0)
        },
        subtotal: Number(totals.subtotal || 0),
        shippingCost: Number(totals.shipping || 0),
        total: Number(totals.total || 0),
        couponCode: coupon?.code || null
      };

      await createOrder(orderData);

      addToast(t('checkout.orderPlaced'), 'success');

      // Clear cart after successful order placed simulation
      await clearCart();
      navigate('/my-orders');
    } catch (err) {
      addToast(err.message, 'error'); // Replaced setError with addToast
    } finally {
      setIsSubmitting(false); // Ensure submitting state is reset
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) return null; // Prevent flicker while redirecting

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900">{t('checkout.checkout')}</h1>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('checkout.shippingInfo')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.fullName')} <span className="text-red-500">*</span></label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder={t('checkout.firstLast')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.phoneNumber')} <span className="text-red-500">*</span></label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="059... / 052..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.deliveryRegion')} <span className="text-red-500">*</span></label>
                  <select value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none">
                    <option value="West Bank">{t('checkout.westBank')}</option>
                    <option value="Inside">{t('checkout.inside48')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.exactAddress')} <span className="text-red-500">*</span></label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder={t('checkout.addressPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.orderNotes')}</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder={t('checkout.notesPlaceholder')} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('checkout.paymentMethod')} <span className="text-red-500">*</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'} flex items-start gap-3`}>
                <div className="mt-1">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300" />
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100/50 flex items-center justify-center text-green-700 shrink-0 border border-green-200 shadow-sm">
                  <Banknote size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t('checkout.cod')}</div>
                  <div className="text-sm text-gray-500">{t('checkout.codDesc')}</div>
                </div>
              </label>

              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'direct' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'} flex items-start gap-3`}>
                <div className="mt-1">
                  <input type="radio" name="payment" value="direct" checked={paymentMethod === 'direct'} onChange={() => setPaymentMethod('direct')} className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300" />
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-700 shrink-0 border border-blue-200 shadow-sm">
                  <CreditCard size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{t('checkout.directPayment')}</div>
                  <div className="text-sm text-gray-500">{t('checkout.directPaymentDesc')}</div>
                  {paymentMethod === 'direct' && (
                    <div className="mt-4 p-3 bg-white border border-gray-200 rounded text-xs text-gray-400 font-mono text-center shadow-inner">
                      [ Stripe / Gateway Plugin UI Placeholder ]
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>

            {/* Quick Item Recap */}
            <div className="mb-6 space-y-3 max-h-48 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={`${item.id || item.productId}-${idx}`} className="flex gap-3 text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                  <img src={item.image || (item.images && item.images[0])} alt={item.title} className="w-12 h-12 object-cover rounded-md bg-white border border-gray-100" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{i18n.language === 'ar' && item.titleAr ? item.titleAr : item.title}</p>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {Object.entries(item.selectedOptions).map(([k, v]) => {
                          const displayVal = v.includes('|') ? v.split('|')[0] : v;
                          return `${k}: ${displayVal}`;
                        }).join(' | ')}
                      </p>
                    )}
                    <p className="text-gray-500 mt-0.5">{t('checkout.qty')}: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">₪{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm mb-6 pb-6 border-y border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('checkout.subtotalItems', { count: totalItems })}</span>
                <span className="font-medium">₪{totals.subtotal.toFixed(2)}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-green-600">
                  <span className="text-gray-600">{t('checkout.discount', { code: coupon.code })}</span>
                  <span className="font-medium">-₪{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">{t('checkout.shipping')}</span>
                <span className="font-medium">{totals.shipping === 0 ? t('checkout.free') : `₪${totals.shipping.toFixed(2)}`}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg mb-6">
              <span>{t('checkout.orderTotal')}</span>
              <span className="text-brand-600">₪{totals.total.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('checkout.processing') : t('checkout.placeOrder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
