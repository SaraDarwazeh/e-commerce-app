import { useState, useEffect, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { uploadImage, deleteImage } from '../../services/uploadService';
import { Trash2, Edit2, Plus, Upload, X } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import BackButton from '../../components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function Categories() {
  const { t, i18n } = useTranslation();
  const { showConfirm, addToast } = useUIStore();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    slug: '',
    description: '',
    imageUrl: '',
    imagePath: '',
    isActive: true,
    sortOrder: 0
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name || '',
        nameAr: category.nameAr || '',
        slug: category.slug || '',
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        imagePath: category.imagePath || '',
        isActive: category.isActive ?? true,
        sortOrder: category.sortOrder || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        nameAr: '',
        slug: '',
        description: '',
        imageUrl: '',
        imagePath: '',
        isActive: true,
        sortOrder: 0
      });
    }
    setShowModal(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === prev.slug ?
        val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        addToast(t('admin.categoryUpdated'), "success");
      } else {
        await createCategory(formData);
        addToast(t('admin.categoryCreated'), "success");
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  const handleDelete = (category) => {
    showConfirm({
      title: t('admin.deleteCategory'),
      message: t('admin.deleteCategoryConfirm'),
      isDestructive: true,
      confirmText: t('admin.delete'),
      onConfirm: async () => {
        try {
          if (category.imagePath) {
            await deleteImage(category.imagePath);
          }
          await deleteCategory(category.id);
          addToast(t('admin.categoryDeleted'), "success");
          fetchCategories();
        } catch (err) {
          addToast(err.message, "error");
        }
      }
    });
  };

  const toggleActive = async (cat) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
      addToast(`${t('admin.categories')}: ${!cat.isActive ? t('admin.active') : t('admin.hidden')}`, "success");
      fetchCategories();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="page-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.categories')}</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t('admin.createCategory')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('admin.loading')}</div>
        ) : (
          <table className={`w-full text-left border-collapse ${i18n.dir() === 'rtl' ? 'rtl:text-right' : ''}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="px-6 py-4 font-semibold text-gray-900 w-16 text-center">{t('admin.order')}</th>
                <th className="px-6 py-4 font-semibold text-gray-900 leading-tight">{t('admin.nameAndSlug')}</th>
                <th className="px-6 py-4 font-semibold text-gray-900 hidden md:table-cell">{t('admin.description')}</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-center">{t('admin.status')}</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center text-gray-500 font-mono">{cat.sortOrder}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{i18n.language === 'ar' && cat.nameAr ? cat.nameAr : cat.name}</div>
                        <div className="text-xs text-brand-600">/{cat.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[250px] hidden md:table-cell" title={cat.description}>
                    {cat.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`px-3 py-1 text-xs rounded-full font-medium ${cat.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {cat.isActive !== false ? t('admin.active') : t('admin.hidden')}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 justify-end items-center">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="text-brand-600 hover:text-brand-900 font-medium p-2 rounded-lg hover:bg-brand-50 transition-colors"
                        title={t('admin.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="text-red-500 hover:text-red-700 font-medium p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title={t('admin.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No categories found. Create your first category to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CategoryModal
          formData={formData}
          onChange={handleChange}
          onNameChange={handleNameChange}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          editingId={editingId}
          t={t}
        />
      )}
    </div>
  );
}

function CategoryModal({ formData, onChange, onNameChange, onClose, onSubmit, editingId, t }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useUIStore();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast(t('admin.uploadImageFailed'), 'error');
      return;
    }
    setIsUploading(true);
    try {
      const { url, path } = await uploadImage(file, 'categories');
      onChange({ target: { name: 'imageUrl', value: url, type: 'text' } });
      onChange({ target: { name: 'imagePath', value: path, type: 'text' } });
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    onChange({ target: { name: 'imageUrl', value: '', type: 'text' } });
    onChange({ target: { name: 'imagePath', value: '', type: 'text' } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{editingId ? t('admin.editCategory') : t('admin.createCategory')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.categoryName')}</label>
              <input type="text" required value={formData.name} onChange={onNameChange} className="w-full border border-gray-300 rounded-md p-2" placeholder="e.g. Tote Bags" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.categoryNameAr')}</label>
              <input type="text" name="nameAr" value={formData.nameAr} onChange={onChange} dir="rtl" className="w-full border border-gray-300 rounded-md p-2" placeholder="مثل: حقائب" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.slug')}</label>
            <input type="text" required name="slug" value={formData.slug} onChange={onChange} className="w-full border border-gray-300 rounded-md p-2 font-mono text-sm bg-gray-50" placeholder="e.g. tote-bags" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.description')}</label>
            <textarea name="description" value={formData.description} onChange={onChange} rows="2" className="w-full border border-gray-300 rounded-md p-2 text-sm"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.categoryImage')}</label>
            {formData.imageUrl ? (
              <div className="relative inline-block border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img src={formData.imageUrl} alt="Preview" className="h-32 w-auto object-cover" />
                <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 rtl:right-auto rtl:left-2 bg-white/90 text-red-600 p-1.5 rounded-full shadow hover:bg-red-50 transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => fileInputRef.current?.click()}>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-3">
                  {isUploading ? (<div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>) : (<Upload className="w-4 h-4 text-brand-600" />)}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{isUploading ? t('admin.saving') : t('admin.uploadImage')}</div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.sortOrder')}</label>
              <input type="number" name="sortOrder" value={formData.sortOrder} onChange={onChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={onChange} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                <span className="text-sm font-medium text-gray-700">{t('admin.categoryActive')}</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">{t('admin.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition shadow-sm">
              {editingId ? t('admin.save') : t('admin.createCategory')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
