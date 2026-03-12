import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct, updateProduct } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import useUIStore from '../../store/uiStore';
import { useTranslation } from 'react-i18next';

export default function AdminProducts() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showConfirm, addToast } = useUIStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        getProducts(), // Get all products
        getCategories() // Get all categories
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      isDestructive: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteProduct(id);
          addToast('Product deleted successfully', 'success');
          fetchData();
        } catch (err) {
          addToast(err.message, 'error');
        }
      }
    });
  };

  const toggleActive = async (product) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      addToast(`Product is now ${!product.isActive ? 'active' : 'hidden'}`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Filter
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.products')}</h1>
        <Link to="/admin/products/new" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
          <span>+</span> {t('admin.addProduct')}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
          <input
            type="text"
            placeholder={t('admin.searchProducts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
            >
              <option value="All">{t('admin.allCategories')}</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading products...</div>
          ) : (
            <table className={`w-full text-left border-collapse min-w-[800px] ${i18n.dir() === 'rtl' ? 'rtl:text-right' : ''}`}>
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-medium w-1/3">{t('admin.products')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.categories')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.price')}</th>
                  <th className="px-6 py-4 font-medium">{t('admin.stock')}</th>
                  <th className="px-6 py-4 font-medium text-center">{t('admin.status')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                          )}
                        </div>
                        <div className="truncate flex-1 max-w-[200px]">
                          <div className="font-medium text-gray-900 truncate" title={product.title}>{product.title}</div>
                          {product.brand && <div className="text-gray-500 text-xs text-brand-600 uppercase">{product.brand}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize truncate max-w-[120px]">{product.category ? product.category.replace('-', ' ') : '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₪{Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 20 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`px-3 py-1 text-xs rounded-full font-medium ${product.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {product.isActive ? t('admin.active') : t('admin.hidden')}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3 items-center whitespace-nowrap">
                        <Link to={`/admin/products/edit/${product.id}`} className="text-brand-600 hover:text-brand-800 font-medium bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">{t('admin.edit')}</Link>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">{t('admin.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
          <span>Showing {filteredProducts.length} entries</span>
        </div>
      </div>
    </div>
  );
}
