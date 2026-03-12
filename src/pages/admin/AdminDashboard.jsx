import { TrendingUp, Users, ShoppingBag, DollarSign, Download, AlertCircle, Image as ImageIcon, Eye } from 'lucide-react';
import { seedBagsToFirestore } from '../../scripts/seedBags';
import { autoAssignCategoryImages } from '../../scripts/seedCategoryImages';
import { useState, useEffect } from 'react';
import useUIStore from '../../store/uiStore';
import { getOrders } from '../../services/orderService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { showConfirm, addToast } = useUIStore();

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    deliveredRevenue: 0,
    outstandingRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalUsers: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersData = await getOrders();
        setAllOrders(ordersData);
        setRecentOrders(ordersData.slice(0, 5));

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        let totalRevenue = 0;
        let deliveredRevenue = 0;
        let outstandingRevenue = 0;

        let deliveredCount = 0;
        let pendingCount = 0;
        let shippedCount = 0;

        ordersData.forEach(order => {
          const orderTotal = order.total; // Already normalized as Number
          const status = (order.status || '').toLowerCase();
          const paymentStatus = (order.paymentStatus || 'unpaid').toLowerCase();

          if (status !== 'cancelled') {
            totalRevenue += orderTotal;

            if (paymentStatus === 'paid') {
              deliveredRevenue += orderTotal;
            } else {
              outstandingRevenue += orderTotal;
            }
          }

          if (status === 'delivered') deliveredCount++;
          else if (status === 'shipped') shippedCount++;
          else if (status !== 'cancelled') pendingCount++;
        });

        setMetrics({
          totalRevenue,
          deliveredRevenue,
          outstandingRevenue,
          totalOrders: ordersData.length,
          deliveredOrders: deliveredCount,
          pendingOrders: pendingCount,
          shippedOrders: shippedCount,
          totalUsers
        });

      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadReport = () => {
    if (!allOrders.length) {
      addToast("No orders available to export.", "error");
      return;
    }

    // Prepare CSV Structure
    const headers = [
      "Order ID", "Date", "Customer Name", "Customer Email", "Customer Phone",
      "Delivery Region", "Delivery Address", "Payment Method", "Payment Status", "Order Status",
      "Subtotal", "Shipping Cost", "Total"
    ];

    const rows = allOrders.map(order => [
      order.id,
      new Date(order.date).toLocaleString(),
      `"${order.customerName || 'Guest'}"`,
      `"${order.customerEmail || 'N/A'}"`,
      `"${order.customerPhone}"`,
      `"${order.deliveryRegion}"`,
      `"${order.address}"`,
      order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Direct Payment',
      order.paymentStatus || (order.paymentMethod === 'cod' ? 'unpaid' : 'pending_verification'),
      order.status || 'Pending',
      Number(order.subtotal || 0).toFixed(2),
      Number(order.deliveryCost || 0).toFixed(2),
      Number(order.discountAmount || 0).toFixed(2),
      Number(order.total || 0).toFixed(2)
    ]);

    const summaryHeaders = ["", "", "", ""];
    const summaryData = [
      ["", "", "", ""],
      ["--- BUSINESS SUMMARY ---", "", "", ""],
      ["Total Orders", metrics.totalOrders, "", ""],
      ["Delivered Orders", metrics.deliveredOrders, "", ""],
      ["Total Registered Users", metrics.totalUsers, "", ""],
      ["Overall Revenue", `₪${metrics.totalRevenue.toFixed(2)}`, "", ""],
      ["Delivered Revenue (Collected)", `₪${metrics.deliveredRevenue.toFixed(2)}`, "", ""],
      ["Outstanding Collection (Pending)", `₪${metrics.outstandingRevenue.toFixed(2)}`, "", ""]
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(",")),
      ...summaryData.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `luxestore_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSeed = () => {
    showConfirm({
      title: 'Seed Database',
      message: 'WARNING: This will inject bag categories and products into your database. Continue?',
      isDestructive: true,
      confirmText: 'Seed Database',
      onConfirm: async () => {
        setIsSeeding(true);
        try {
          await seedBagsToFirestore();
          addToast("Seed complete! Database populated with bags.", "success");
        } catch (e) {
          addToast("Error seeding: " + e.message, "error");
        } finally {
          setIsSeeding(false);
        }
      }
    });
  };

  const handleAssignImages = async () => {
    setIsAssigning(true);
    try {
      const count = await autoAssignCategoryImages();
      addToast(`Successfully assigned images to ${count} categories.`, 'success');
    } catch (e) {
      addToast("Failed to assign images: " + e.message, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
        <div className="space-x-3 rtl:space-x-reverse flex items-center">
          {/* Action buttons removed per requirements for a cleaner dashboard */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.totalRevenue')}</h3>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{t('admin.currencySign')}{metrics.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.collectedRevenue')}</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{t('admin.currencySign')}{metrics.deliveredRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.outstanding')}</h3>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{t('admin.currencySign')}{metrics.outstandingRevenue.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.networkGrowth')}</h3>
            <Users className="w-5 h-5 text-brand-500" />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalUsers} <span className="text-sm text-gray-500 font-medium">{t('admin.users')}</span></div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{metrics.totalOrders} <span className="text-gray-500 font-normal">{t('admin.orders')}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">{t('admin.pendingProcessing')}</span>
          <span className="text-lg font-bold text-gray-900">{metrics.pendingOrders}</span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">{t('admin.shipped')}</span>
          <span className="text-lg font-bold text-gray-900">{metrics.shippedOrders}</span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">{t('admin.delivered')}</span>
          <span className="text-lg font-bold text-gray-900">{metrics.deliveredOrders}</span>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{t('admin.recentOrders')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">{t('admin.orderId')}</th>
                <th className="px-6 py-4 font-medium">{t('admin.customer')}</th>
                <th className="px-6 py-4 font-medium">{t('admin.date')}</th>
                <th className="px-6 py-4 font-medium">{t('admin.total')}</th>
                <th className="px-6 py-4 font-medium">{t('admin.status')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('admin.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 border-t border-gray-100">#{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 border-t border-gray-100">{order.customerName || 'Guest'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 border-t border-gray-100">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 border-t border-gray-100">{t('admin.currencySign')}{Number(order.total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm border-t border-gray-100">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          ((order.status || '').toLowerCase() === 'cancelled' || (order.status || '').toLowerCase() === 'ملغي' || (order.status || '').toLowerCase() === 'canceled') ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right border-t border-gray-100">
                    <Link
                      to="/admin/orders"
                      state={{ openOrderId: order.id }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-sm font-medium"
                    >
                      <Eye size={16} /> <span className="hidden sm:inline">{t('admin.viewDetails')}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
