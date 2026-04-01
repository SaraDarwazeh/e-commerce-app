import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { cancelOrder } from '../../services/orderService';
import { useTranslation } from 'react-i18next';
import { getTranslatedStatus, getTranslatedPaymentStatus } from '../../utils/statusHelpers';

export default function MyOrders() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuthStore();
  const { showConfirm, addToast } = useUIStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Simulate loading orders specific to this user from Firestore
    // For now, we mock it by filtering the global mockOrders.
    // In a real app, this would be: getDocs(query(collection(db, 'orders'), where('userId', '==', currentUser.uid)))
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('customerId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const userOrders = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
          };
        });

        // Manual sort since we might lack composite indexes initially
        userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

        setOrders(userOrders);
      } catch (err) {
        console.error("Failed to fetch customer orders", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const canCancelOrder = (status) => {
    const s = (status || '').toLowerCase();
    return s === 'processing' || s === 'confirmed';
  };

  const handleCancelOrder = (order) => {
    if (!canCancelOrder(order.status)) {
      addToast(t('admin.cannotCancel'), "error");
      return;
    }
    showConfirm({
      title: t('admin.cancelOrder'),
      message: t('admin.cancelOrderConfirm'),
      isDestructive: true,
      confirmText: t('admin.cancelOrder'),
      onConfirm: async () => {
        try {
          await cancelOrder(order.id);
          addToast(t('admin.orderCancelled'), "success");
          // Update local state
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
          if (selectedOrder?.id === order.id) {
            setSelectedOrder(prev => ({ ...prev, status: 'Cancelled' }));
          }
        } catch (err) {
          addToast(err.message, "error");
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'processing': return 'bg-brand-100 text-brand-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled':
      case 'canceled':
      case 'ملغي': return 'bg-red-100 text-red-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-gray-500 hover:text-gray-900 transition flex items-center gap-2 text-sm font-medium"
          >
            <span className="rtl:hidden">←</span><span className="hidden rtl:inline">→</span> {t('orders.backToOrders')}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-wrap gap-4 justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('orders.orderNumber', { id: selectedOrder.id })}</h2>
              <p className="text-gray-500 text-sm mt-1">{t('orders.placedOn', { date: new Date(selectedOrder.date).toLocaleDateString() })}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>
                {getTranslatedStatus(selectedOrder.status, t)}
              </span>
              {canCancelOrder(selectedOrder.status) && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder)}
                  className="px-4 py-1.5 rounded-full text-sm font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t('admin.cancelOrder')}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">{t('orders.deliveryDetails')}</h3>
              <div>
                <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                {selectedOrder.deliveryType === 'pickup' ? (
                  <div className="bg-brand-50 text-brand-700 p-3 rounded-lg mt-2 inline-block border border-brand-100 w-full">
                    <p className="font-bold text-xs uppercase tracking-wider mb-0.5">{t('checkout.pickupPointTitle')}</p>
                    <p className="text-sm font-medium">{selectedOrder.address}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.address || t('orders.noAddress')}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.deliveryRegion || 'West Bank'}</p>
                  </>
                )}
                {selectedOrder.notes && <p className="text-sm text-amber-700 bg-amber-50 p-2 mt-2 rounded">{t('orders.note', { note: selectedOrder.notes })}</p>}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">{t('orders.paymentInfo')}</h3>
              <div>
                <p className="text-sm text-gray-900 mb-2">{t('orders.method')}: <span className="font-medium">{selectedOrder.paymentMethod === 'cod' ? t('orders.cod') : t('orders.creditCard')}</span></p>
                <div className="space-y-1 text-sm bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('orders.subtotal')}</span>
                    <span>₪{Number(selectedOrder.subtotal || selectedOrder.totals?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.couponCode && Number(selectedOrder.discountAmount || selectedOrder.totals?.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('orders.discount') || 'Discount'} ({selectedOrder.couponCode})</span>
                      <span>-₪{Number(selectedOrder.discountAmount || selectedOrder.totals?.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>{t('orders.shipping')}</span>
                    <span>₪{Number(selectedOrder.deliveryCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                    <span>{t('orders.total')}</span>
                    <span>₪{Number(selectedOrder.total || selectedOrder.totals?.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs mb-4">{t('orders.itemsOrdered')}</h3>
            <div className="space-y-4">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="w-16 h-16 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                    {item.images?.[0] || item.image ? (
                      <img src={item.images?.[0] || item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs text-center p-1">{t('orders.noImage')}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      <Link to={`/product/${item.productId}`} className="hover:text-brand-600 hover:underline">
                        {i18n.language === 'ar' && item.titleAr ? item.titleAr : item.title}
                      </Link>
                    </h4>
                    <div className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                      {item.selectedColor && (
                        <span 
                          className="w-4 h-4 rounded-full border border-gray-200 shadow-sm block flex-shrink-0" 
                          style={{ backgroundColor: item.selectedColor }} 
                          title={item.selectedColor}
                        />
                      )}
                      {item.selectedOptions && Object.entries(item.selectedOptions).map(([k, v]) => <span className="bg-white px-2 py-0.5 rounded border border-gray-200" key={k}>{v.split('|')[0]}</span>)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">{t('orders.qty')}: {item.quantity} × ₪{Number(item.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-right font-bold text-gray-900">
                    ₪{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('orders.myOrders')}</h1>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 border-b border-gray-100 p-4 md:p-6 flex flex-wrap gap-4 justify-between items-center text-sm">
                <div className="flex gap-8">
                  <div>
                    <p className="text-gray-500 font-medium mb-1">{t('orders.orderPlaced')}</p>
                    <p className="text-gray-900">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">{t('orders.total')}</p>
                    <p className="text-gray-900 font-bold">₪{Number(order.total || order.totals?.total || 0).toFixed(2)}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-gray-500 font-medium mb-1">{t('orders.shipTo')}</p>
                    <p className="text-gray-900 font-medium">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-gray-500 font-medium mb-1">{t('orders.orderNumber', { id: order.id })}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white border border-gray-200 text-brand-600 font-medium text-sm px-4 py-2 rounded-lg hover:border-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    {t('orders.viewDetails')}
                  </button>
                </div>
              </div>

              {/* Quick Preview */}
              <div className="p-4 md:p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getTranslatedStatus(order.status, t)}
                  </span>
                  <span className="text-sm text-gray-500">{t('orders.itemsPurchased', { count: order.items?.length || 0 })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('orders.noOrders')}</h2>
          <p className="text-gray-500 mb-6">{t('orders.noOrdersDesc')}</p>
          <Link to="/products" className="inline-block bg-brand-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-brand-700 transition">
            {t('orders.startShopping')}
          </Link>
        </div>
      )}
    </div>
  );
}
