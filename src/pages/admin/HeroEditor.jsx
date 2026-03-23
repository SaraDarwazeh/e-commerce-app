import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { uploadImage } from '../../services/uploadService';
import { useTranslation } from 'react-i18next';
import useUIStore from '../../store/uiStore';
import { Save, Image as ImageIcon, LayoutTemplate } from 'lucide-react';

export default function HeroEditor() {
  const { t } = useTranslation();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ar'); // 'ar' or 'en'
  const [uploadingImage, setUploadingImage] = useState(false);

  const [heroData, setHeroData] = useState({
    heroLayout: 'split',
    heroImage: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&q=80',
    heroBadgeEn: '',
    heroBadgeAr: '',
    heroTitle1En: '',
    heroTitle1Ar: '',
    heroTitle2En: '',
    heroTitle2Ar: '',
    heroTitle3En: '',
    heroTitle3Ar: '',
    heroDescEn: '',
    heroDescAr: '',
    heroBtnEn: '',
    heroBtnAr: '',
    heroBtnLink: '/products',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'hero');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeroData(prev => ({ ...prev, ...data }));
        } else {
          const oldRef = doc(db, 'settings', 'storefront');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().heroLayout) {
            setHeroData(prev => ({ ...prev, ...oldSnap.data() }));
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        addToast(t('admin.errorSave') || 'Error loading settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [addToast, t]);

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const { url } = await uploadImage(file, 'hero');
      setHeroData(prev => ({ ...prev, heroImage: url }));
      addToast(t('admin.imageUploaded') || 'Image uploaded', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      addToast(error.message || t('admin.errorSave'), 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'hero');
      await setDoc(docRef, heroData, { merge: true });
      addToast(t('admin.settingsSaved') || 'Settings saved successfully', 'success');
    } catch (error) {
      console.error('Save error:', error);
      addToast(error.message || t('admin.errorSave'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setHeroData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutTemplate className="text-brand-600" />
          {t('admin.heroSection') || 'Hero Section'}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving || uploadingImage}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? 'Saving...' : t('common.save')}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Layout Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.layoutStyle') || 'Layout Style'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => handleChange('heroLayout', 'split')}
              className={`cursor-pointer rounded-xl border-2 p-1 transition-all ${heroData.heroLayout === 'split' ? 'border-brand-600 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-300'}`}
            >
              <div className="bg-gray-50 h-32 rounded-lg flex overflow-hidden">
                <div className="w-1/2 p-4 flex flex-col justify-center space-y-2">
                  <div className="h-2 w-1/3 bg-gray-300 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-400 rounded"></div>
                  <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                  <div className="mt-2 h-6 w-1/2 bg-brand-600 rounded-full"></div>
                </div>
                <div className="w-1/2 bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="text-gray-400" />
                </div>
              </div>
              <div className="text-center mt-3 font-medium text-gray-700">Split (Image + Text)</div>
            </div>

            <div 
              onClick={() => handleChange('heroLayout', 'full')}
              className={`cursor-pointer rounded-xl border-2 p-1 transition-all ${heroData.heroLayout === 'full' ? 'border-brand-600 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-300'}`}
            >
              <div className="bg-gray-800 h-32 rounded-lg flex items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-transparent"></div>
                <div className="relative z-10 w-full p-4 flex flex-col justify-center space-y-2">
                  <div className="h-2 w-1/4 bg-gray-300 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                  <div className="h-2 w-1/3 bg-gray-400 rounded"></div>
                  <div className="mt-2 h-6 w-1/3 bg-white rounded-full"></div>
                </div>
                <ImageIcon className="absolute right-4 text-gray-500 opacity-50" size={32} />
              </div>
              <div className="text-center mt-3 font-medium text-gray-700">Full Width Image</div>
            </div>
          </div>
        </div>

        {/* Global Settings (Image and Link) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.mediaAndLinks') || 'Media & Links'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image</label>
              <div className="mt-1 flex items-center gap-4">
                {heroData.heroImage && (
                  <img src={heroData.heroImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <ImageIcon size={20} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} disabled={uploadingImage} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Final Link URL</label>
              <input 
                type="text" 
                value={heroData.heroBtnLink} 
                onChange={(e) => handleChange('heroBtnLink', e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-brand-500 focus:border-brand-500" 
                placeholder="/products" 
                dir="ltr" 
              />
              <p className="text-xs text-gray-500 mt-1">Example: "/products" or "/products?category=bags"</p>
            </div>
          </div>
        </div>

        {/* Bilingual Tabs Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab('ar')}
              className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-2 ${activeTab === 'ar' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
            >
              العربية 🇵🇸
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-2 ${activeTab === 'en' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
            >
              English 🇬🇧
            </button>
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'ar' && (
              <div className="space-y-5 animate-fade-in" dir="rtl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النص الصغير (الشارة)</label>
                  <input type="text" value={heroData.heroBadgeAr} onChange={(e) => handleChange('heroBadgeAr', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="المهارة والحرفية" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الاول</label>
                    <input type="text" value={heroData.heroTitle1Ar} onChange={(e) => handleChange('heroTitle1Ar', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="أناقة" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الثاني</label>
                    <input type="text" value={heroData.heroTitle2Ar} onChange={(e) => handleChange('heroTitle2Ar', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="خالدة،" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الثالث (بارز)</label>
                    <input type="text" value={heroData.heroTitle3Ar} onChange={(e) => handleChange('heroTitle3Ar', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="صُنعت بعناية." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوصف التفصيلي</label>
                  <textarea value={heroData.heroDescAr} onChange={(e) => handleChange('heroDescAr', e.target.value)} rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none" placeholder="اكتشفي تشكيلتنا الفاخرة..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نص الزر الأساسي</label>
                  <input type="text" value={heroData.heroBtnAr} onChange={(e) => handleChange('heroBtnAr', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="تصفح التشكيلة" />
                </div>
              </div>
            )}

            {activeTab === 'en' && (
              <div className="space-y-5 animate-fade-in" dir="ltr">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Small Badge Text</label>
                  <input type="text" value={heroData.heroBadgeEn} onChange={(e) => handleChange('heroBadgeEn', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="SAVOIR FAIRE" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title Line 1</label>
                    <input type="text" value={heroData.heroTitle1En} onChange={(e) => handleChange('heroTitle1En', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Timeless" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title Line 2</label>
                    <input type="text" value={heroData.heroTitle2En} onChange={(e) => handleChange('heroTitle2En', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Elegance" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title Line 3 (Highlighted)</label>
                    <input type="text" value={heroData.heroTitle3En} onChange={(e) => handleChange('heroTitle3En', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Crafted with Care." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description Paragraph</label>
                  <textarea value={heroData.heroDescEn} onChange={(e) => handleChange('heroDescEn', e.target.value)} rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none" placeholder="Discover our luxury collection..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action Button Text</label>
                  <input type="text" value={heroData.heroBtnEn} onChange={(e) => handleChange('heroBtnEn', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Explore Collection" />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
