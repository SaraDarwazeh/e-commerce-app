import { useState, useRef, useEffect } from 'react';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../../services/bannerService';
import { uploadImage, deleteImage } from '../../services/uploadService';
import { Plus, Edit2, Trash2, GripVertical, Check, X, Image as ImageIcon, Upload } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useTranslation } from 'react-i18next';

export default function AdminBanners() {
  const { t, i18n } = useTranslation();
  const { showConfirm, addToast } = useUIStore();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    image: '',
    imagePath: '',
    isActive: true,
    order: 0
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openForm = (banner = null) => {
    if (banner) {
      if (banner.id.startsWith('fallback')) {
        setFormData({
          title: banner.title,
          subtitle: banner.subtitle,
          ctaText: banner.ctaText,
          ctaLink: banner.ctaLink,
          image: banner.image,
          imagePath: banner.imagePath || '',
          isActive: true,
          order: banner.order
        });
        setEditingBanner(null);
      } else {
        setEditingBanner(banner);
        setFormData({
          title: banner.title || '',
          subtitle: banner.subtitle || '',
          ctaText: banner.ctaText || 'Shop Now',
          ctaLink: banner.ctaLink || '/products',
          image: banner.image || '',
          imagePath: banner.imagePath || '',
          isActive: banner.isActive !== false,
          order: banner.order || 0
        });
      }
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        ctaText: 'Shop Now',
        ctaLink: '/products',
        image: '',
        imagePath: '',
        isActive: true,
        order: banners.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast(t('admin.invalidImageType', 'Please upload a valid image file.'), 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast(t('admin.imageTooLarge', 'Image must be less than 5MB.'), 'error');
      return;
    }

    setIsUploading(true);
    try {
      const { url, path } = await uploadImage(file, 'banners');

      // If updating an existing banner, delete the old image if it's stored in Firebase (has imagePath)
      if (formData.imagePath && formData.imagePath !== path) {
        await deleteImage(formData.imagePath).catch(() => { });
      }

      setFormData(prev => ({
        ...prev,
        image: url,
        imagePath: path
      }));
      addToast(t('admin.uploadSuccess', 'Image uploaded successfully'), 'success');
    } catch (error) {
      addToast(error.message || t('admin.uploadFailed', 'Failed to upload image'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    // We only actively delete from Firebase if it's already saved an imagePath in this session
    // AND it's not the original imagePath from the DB (to prevent accidental loss before Save is clicked)
    // For simplicity and safety, just clear the form state and let the Submit or next Upload handle cleanup.
    setFormData(prev => ({ ...prev, image: '', imagePath: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
        addToast(t('admin.bannerUpdated'), "success");
      } else {
        await createBanner(formData);
        addToast(t('admin.bannerCreated'), "success");
      }
      closeForm();
      fetchBanners();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (banner) => {
    if (banner.id.startsWith('fallback')) {
      addToast(t('admin.systemFallback'), "info");
      return;
    }
    showConfirm({
      title: t('admin.deleteBanner'),
      message: t('admin.deleteBannerConfirm'),
      isDestructive: true,
      confirmText: t('admin.delete'),
      onConfirm: async () => {
        try {
          if (banner.imagePath) {
            await deleteImage(banner.imagePath);
          }
          await deleteBanner(banner.id);
          addToast(t('admin.bannerDeleted'), "success");
          fetchBanners();
        } catch (err) {
          addToast(err.message, "error");
        }
      }
    });
  };

  const toggleActive = async (banner) => {
    if (banner.id.startsWith('fallback')) return;
    try {
      await updateBanner(banner.id, { isActive: !banner.isActive });
      addToast(`${t('admin.bannerActive')}: ${!banner.isActive ? t('admin.active') : t('admin.hidden')}`, "success");
      fetchBanners();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.bannerManagement')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.bannerManagementDesc')}</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
        >
          <Plus size={16} /> {t('admin.addBanner')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('admin.loading')}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {banners.map(banner => (
              <div key={banner.id} className={`p-4 flex items-center gap-6 hover:bg-gray-50 transition-colors ${!banner.isActive ? 'opacity-60' : ''}`}>
                <div className="text-gray-400 cursor-move opacity-50 hover:opacity-100">
                  <GripVertical size={20} />
                </div>

                <div className="w-48 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  {banner.id.startsWith('fallback') && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white/90 text-xs font-bold px-2 py-1 rounded text-gray-800">{t('admin.systemFallback')}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{banner.title || 'Untitled'}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {banner.isActive ? t('admin.active') : t('admin.hidden')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-2">{banner.subtitle}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-brand-600 bg-brand-50 px-2 py-1 rounded font-medium">{t('admin.buttonText')}: {banner.ctaText}</span>
                    <span className="text-gray-500">{t('admin.buttonLink')}: {banner.ctaLink}</span>
                    <span className="text-gray-500">{t('admin.sortOrder')}: {banner.order}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 ml-auto">
                  <button
                    onClick={() => toggleActive(banner)}
                    disabled={banner.id.startsWith('fallback')}
                    className={`p-2 rounded-lg transition-colors ${banner.id.startsWith('fallback') ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    {banner.isActive ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-gray-400" />}
                  </button>
                  <button
                    onClick={() => openForm(banner)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    disabled={banner.id.startsWith('fallback')}
                    className={`p-2 rounded-lg transition-colors ${banner.id.startsWith('fallback') ? 'opacity-30 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {banners.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                {t('admin.noBanners')}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? t('admin.editBanner') : t('admin.createBanner')}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.bannerImage')} <span className="text-red-500">*</span></label>

                  {formData.image ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-[21/9] bg-gray-50 flex items-center justify-center max-h-64">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-gray-900 rounded-lg p-2 hover:bg-gray-100 font-medium text-sm flex items-center gap-2"
                        >
                          <Upload size={16} /> {t('admin.changeImage', 'Change')}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-500 text-white rounded-lg p-2 hover:bg-red-600 font-medium text-sm flex items-center gap-2"
                        >
                          <Trash2 size={16} /> {t('admin.remove', 'Remove')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isUploading ? 'border-brand-300 bg-brand-50' : 'border-gray-300 hover:border-brand-500 hover:bg-gray-50'}`}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center text-brand-600">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2"></div>
                          <p className="text-sm font-medium">{t('admin.uploading', 'Uploading...')}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm font-medium mb-1">{t('admin.clickToUpload', 'Click to upload High-Res Banner')}</p>
                          <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB (1600x600 recommended)</p>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!formData.image && <input type="hidden" required value={formData.image} />}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.displayTitle')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.subtitle')}</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.buttonText')}</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.buttonLink')}</label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={e => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="/products?category=tote-bags"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-900">{t('admin.bannerActive')}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">{t('admin.sortOrder')}</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-1 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  disabled={submitting}
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-brand-600 rounded-lg text-white font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {submitting ? t('admin.saving') : t('admin.saveBanner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
