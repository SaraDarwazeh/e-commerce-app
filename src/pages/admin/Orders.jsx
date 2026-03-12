import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, updatePaymentStatus } from '../../services/orderService';
import useUIStore from '../../store/uiStore';
import { ChevronLeft, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTranslatedStatus, getTranslatedPaymentStatus } from '../../utils/statusHelpers';

export default function AdminOrders() {
  const { t } = useTranslation();
  const { showConfirm, addToast } = useUIStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Statuses');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId, currentStatus) => {
    const targetStatus = currentStatus === 'Processing' ? 'Shipped' :
      currentStatus === 'Shipped' ? 'Delivered' : 'Processing';

    showConfirm({
      title: 'Update Order Status',
      message: `Change order status to ${targetStatus}?`,
      confirmText: 'Update Status',
      onConfirm: async () => {
        try {
          await updateOrderStatus(orderId, targetStatus);
          addToast(`Order marked as ${targetStatus}`, 'success');

          // Update local state without refetching all
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: targetStatus } : o));
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: targetStatus }));
          }
        } catch (err) {
          addToast(err.message, 'error');
        }
      }
    });
  };

  const handleStatusChangeDirect = async (orderId, targetStatus) => {
    try {
      await updateOrderStatus(orderId, targetStatus);
      addToast(`Order conditionally marked as ${targetStatus}`, 'success');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: targetStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: targetStatus }));
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePaymentStatusChange = async (orderId, targetStatus) => {
    try {
      await updatePaymentStatus(orderId, targetStatus);
      addToast(`Payment marked as ${targetStatus.replace('_', ' ')}`, 'success');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: targetStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, paymentStatus: targetStatus }));
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedOrder(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.id}</h1>
          <span className={`ml-4 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)} uppercase tracking-wider`}>
            {getTranslatedStatus(selectedOrder.status, t)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">{t('admin.itemsOrdered')}</h2>
                <span className="text-sm font-medium text-gray-500">{new Date(selectedOrder.date).toLocaleString()}</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="p-6 flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <div className="text-sm text-gray-500 mt-1 flex gap-3">
                        {item.selectedOptions && Object.entries(item.selectedOptions).map(([k, v]) => (
                          <span key={k}>{k}: {v}</span>
                        ))}
                      </div>
                      <div className="text-sm font-medium text-brand-600 mt-2">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">₪{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">₪{Number(item.price || 0).toFixed(2)} each</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">{t('admin.subtotal')}</span>
                  <span className="font-medium text-gray-900">₪{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.couponCode && selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-3 text-green-600">
                    <span>{t('admin.discountCoupon') || 'Discount'} ({selectedOrder.couponCode})</span>
                    <span className="font-medium">-₪{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 border-dashed">
                  <span className="text-gray-600">{t('admin.shippingCost')}</span>
                  <span className="font-medium text-gray-900">₪{selectedOrder.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">{t('admin.total')}</span>
                  <span className="text-2xl font-black text-brand-600">₪{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">{t('admin.updateStatus')}</h3>
              <div className="space-y-3">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChangeDirect(selectedOrder.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-brand-500 font-medium"
                >
                  <option value="Processing">Processing</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <h3 className="font-bold text-gray-900 mb-4 mt-6 uppercase tracking-wider text-xs border-t border-gray-100 pt-4">{t('admin.paymentTracking')}</h3>
              <div className="space-y-3">
                <select
                  value={selectedOrder.paymentStatus || (selectedOrder.paymentMethod === 'cod' ? 'unpaid' : 'pending_verification')}
                  onChange={(e) => handlePaymentStatusChange(selectedOrder.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-brand-500 font-medium"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="paid">Paid (Collected)</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs border-b border-gray-100 pb-2">{t('admin.customerInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('admin.name') || 'Name'}</div>
                  <div className="font-medium text-gray-900">{selectedOrder.customerName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('admin.email') || 'Email'}</div>
                  <div className="font-medium text-brand-600 break-all">{selectedOrder.customerEmail}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('admin.phone') || 'Phone'}</div>
                  <div className="font-medium text-gray-900">{selectedOrder.customerPhone}</div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs border-b border-gray-100 pb-2">{t('admin.deliveryDetails')}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('admin.region') || 'Region'}</div>
                  <div className="font-medium text-gray-900">{selectedOrder.shippingRegion}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('admin.addressLabel') || 'Address'}</div>
                  <div className="font-medium text-gray-900 leading-relaxed">{selectedOrder.address}</div>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('admin.notes') || 'Notes'}</div>
                    <div className="font-medium text-amber-700 bg-amber-50 p-3 rounded-lg text-sm">{selectedOrder.notes}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('admin.paymentMethod')}</div>
                  <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.ordersManagement')}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50 justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchOrders')}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          />
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option>All Statuses</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading orders...</div>
          ) : (
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-medium">{t('admin.orderId')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.date')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.customer')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.items')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.total')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.orderStatus')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.paymentStatus')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {orders
                  .filter(o =>
                    (filter === 'All Statuses' || o.status === filter) &&
                    (o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase()))
                  )
                  .map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-brand-600 truncate max-w-[120px]" title={order.id}>#{order.id}</td>
                      <td className="px-6 py-4 text-gray-600 truncate">{new Date(order.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 truncate max-w-[150px]">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{order.itemCount} {t('admin.items')}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₪{order.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusChange(order.id, order.status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(order.status)}`}
                          title="Click to advance status"
                        >
                          {getTranslatedStatus(order.status, t)}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium 
                        ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              order.paymentStatus === 'pending_verification' ? 'bg-amber-100 text-amber-700' :
                                order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {getTranslatedPaymentStatus(order.paymentStatus, t)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-brand-600 hover:text-brand-800 font-medium bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {t('admin.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {(() => {
          const displayed = orders.filter(o =>
            (filter === 'All Statuses' || o.status === filter) &&
            (o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase()))
          );
          const totalAmount = displayed.reduce((s, o) => s + o.total, 0);
          const totalItems = displayed.reduce((s, o) => s + (o.itemCount || 0), 0);
          const paidCount = displayed.filter(o => o.paymentStatus === 'paid').length;
          const unpaidCount = displayed.filter(o => o.paymentStatus !== 'paid').length;
          const deliveredCount = displayed.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
          const processingCount = displayed.filter(o => ['processing', 'confirmed'].includes((o.status || '').toLowerCase())).length;
          return (
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              <div className="flex flex-wrap gap-x-8 gap-y-2 items-center justify-between">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span><strong>{displayed.length}</strong> {t('admin.orders')}</span>
                  <span><strong>{totalItems}</strong> {t('admin.items')}</span>
                  <span className="font-bold text-gray-900">₪{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{getTranslatedPaymentStatus('paid', t)}: {paidCount}</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{getTranslatedPaymentStatus('unpaid', t)}: {unpaidCount}</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{getTranslatedStatus('delivered', t)}: {deliveredCount}</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{getTranslatedStatus('processing', t)}: {processingCount}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
