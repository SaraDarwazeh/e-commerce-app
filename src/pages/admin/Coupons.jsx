import { useState, useEffect } from 'react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/couponService';
import { getOrders } from '../../services/orderService';
import useUIStore from '../../store/uiStore';
import { useTranslation } from 'react-i18next';

export default function AdminCoupons() {
  const { t, i18n } = useTranslation();
  const { showConfirm, addToast } = useUIStore();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponStats, setCouponStats] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    isActive: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [couponsData, ordersData] = await Promise.all([
        getAllCoupons(),
        getOrders()
      ]);
      setCoupons(couponsData);

      // Compute usage stats from real order data
      const stats = {};
      ordersData.forEach(order => {
        const code = order.couponCode;
        if (code) {
          if (!stats[code]) {
            stats[code] = { usageCount: 0, totalDiscount: 0 };
          }
          stats[code].usageCount += 1;
          stats[code].totalDiscount += Number(order.discountAmount || 0);
        }
      });
      setCouponStats(stats);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setFormData({ code: '', type: 'percentage', value: '', minOrderAmount: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || '',
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
        addToast(t('admin.couponUpdated') || "Coupon updated", "success");
      } else {
        await createCoupon(payload);
        addToast(t('admin.couponCreated') || "Coupon created", "success");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: t('admin.deleteCoupon') || 'Delete Coupon',
      message: t('admin.deleteCouponConfirm') || 'Are you sure you want to delete this coupon? This action cannot be undone.',
      isDestructive: true,
      confirmText: t('admin.delete') || 'Delete',
      onConfirm: async () => {
        try {
          await deleteCoupon(id);
          addToast(t('admin.couponDeleted') || "Coupon deleted", "success");
          fetchData();
        } catch (error) {
          addToast(error.message, "error");
        }
      }
    });
  };

  const toggleStatus = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      addToast(`${t('admin.couponNow') || 'Coupon is now'} ${!coupon.isActive ? (t('admin.active') || 'active') : (t('admin.inactive') || 'inactive')}`, "success");
      fetchData();
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  return (
    <div className="page-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.couponsManagement') || 'Coupons Management'}</h1>
        <button
          onClick={openAddModal}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          {t('admin.addNewCoupon') || 'Add New Coupon'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('admin.loadingCoupons') || 'Loading coupons...'}</div>
        ) : (
          <table className={`w-full border-collapse ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.code') || 'Code'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.type') || 'Type'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.value') || 'Value'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.minOrder') || 'Min Order'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.usageCount') || 'Usage'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.totalDiscountGiven') || 'Total Discount'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.status') || 'Status'}</th>
                <th className={`px-6 py-4 font-semibold text-gray-900 ${i18n.dir() === 'rtl' ? 'text-left' : 'text-right'}`}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {coupons.map(coupon => {
                const stats = couponStats[coupon.code] || { usageCount: 0, totalDiscount: 0 };
                return (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{coupon.code}</td>
                    <td className="px-6 py-4 capitalize">{coupon.type === 'percentage' ? (t('admin.percentage') || 'Percentage') : (t('admin.fixedAmount') || 'Fixed')}</td>
                    <td className="px-6 py-4">
                      {coupon.type === 'percentage' ? `${coupon.value}${t('admin.percentageSign')}` : `${t('admin.currencySign')}${coupon.value}`}
                    </td>
                    <td className="px-6 py-4">{coupon.minOrderAmount ? `${t('admin.currencySign')}${coupon.minOrderAmount}` : (t('admin.none') || 'None')}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-lg font-bold text-gray-900">{stats.usageCount}</span>
                        <span className="text-xs text-gray-500">{t('admin.times') || 'times'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {stats.totalDiscount > 0 ? `${t('admin.currencySign')}${stats.totalDiscount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(coupon)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {coupon.isActive ? (t('admin.active') || 'Active') : (t('admin.draft') || 'Draft')}
                      </button>
                    </td>
                    <td className={`px-6 py-4 ${i18n.dir() === 'rtl' ? 'text-left' : 'text-right'} space-x-3 rtl:space-x-reverse`}>
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="text-brand-600 hover:text-brand-900 font-medium"
                      >
                        {t('admin.edit') || 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        {t('admin.delete') || 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    {t('admin.noCoupons') || 'No coupons found. Create your first discount code above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingCoupon ? (t('admin.editCoupon') || 'Edit Coupon') : (t('admin.createNewCoupon') || 'Create New Coupon')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.couponCode') || 'Coupon Code'}</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCoupon}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-300 rounded-md p-2 uppercase disabled:bg-gray-100 placeholder:normal-case"
                  placeholder="e.g. SUMMER20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.discountType') || 'Discount Type'}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  >
                    <option value="percentage">{t('admin.percentage')} ({t('admin.percentageSign')})</option>
                    <option value="fixed">{t('admin.fixedAmount')} ({t('admin.currencySign')})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.discountValue') || 'Discount Value'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.type === 'percentage' ? "100" : undefined}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.minOrderAmount')} ({t('admin.currencySign')}) <span className="text-gray-400 font-normal">({t('admin.optional')})</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="e.g. 50"
                />
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">{t('admin.couponActiveLabel') || 'Coupon is active and usable'}</label>
              </div>

              <div className="pt-4 flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {t('admin.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
                >
                  {editingCoupon ? (t('admin.saveChanges') || 'Save Changes') : (t('admin.createCoupon') || 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
