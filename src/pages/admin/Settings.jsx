import { useState, useEffect } from 'react';
import { getDeliverySettings, updateDeliverySettings } from '../../services/deliveryService';
import { uploadImage } from '../../services/uploadService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Save, AlertCircle, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useTranslation } from 'react-i18next';

export default function StoreSettings() {
  const { t, i18n } = useTranslation();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Delivery config
  const [deliveryData, setDeliveryData] = useState({
    westBankCost: 15,
    insideCost: 30,
    freeDeliveryEnabled: false,
    freeDeliveryThresholdEnabled: true,
    freeDeliveryThresholdAmount: 50
  });

  // Storefront config
  const defaultSections = [
    { id: 'hero', visible: true },
    { id: 'banners', visible: true },
    { id: 'categories', visible: true },
    { id: 'sale', visible: true },
    { id: 'trending', visible: true },
    { id: 'editorsPicks', visible: true }
  ];

  const [storefrontData, setStorefrontData] = useState({
    saleSectionEnabled: false,
    homepageSections: defaultSections,
    announcementActive: true,
    announcementTextEn: 'Free delivery on all orders over ₪50',
    announcementTextAr: 'توصيل مجاني على جميع الطلبات فوق ₪50',
    announcementBgColor: '#ef4444',
    specialOffersGradientStart: '#fdfbfb',
    specialOffersGradientEnd: '#ebedee',
    whatsappEnabled: true,
    whatsappNumber: '972501234567',
    socialLinks: {
      instagram: '',
      facebook: '',
      tiktok: '',
      twitter: '',
      youtube: ''
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const dSettings = await getDeliverySettings();
        if (dSettings) {
          setDeliveryData({
            westBankCost: dSettings.westBankCost ?? 15,
            insideCost: dSettings.insideCost ?? 30,
            freeDeliveryEnabled: dSettings.freeDeliveryEnabled ?? false,
            freeDeliveryThresholdEnabled: dSettings.freeDeliveryThresholdEnabled ?? true,
            freeDeliveryThresholdAmount: dSettings.freeDeliveryThresholdAmount ?? 50
          });
        }

        const sfDoc = await getDoc(doc(db, 'settings', 'storefront'));
        if (sfDoc.exists()) {
          const data = sfDoc.data();
          
          let sections = Array.isArray(data.homepageSections) ? [...data.homepageSections] : defaultSections;
          if (!sections.some(s => s.id === 'banners')) {
            const heroIndex = sections.findIndex(s => s.id === 'hero');
            const insertIndex = heroIndex !== -1 ? heroIndex + 1 : 1;
            sections.splice(insertIndex, 0, { id: 'banners', visible: true });
          }

          setStorefrontData({
            saleSectionEnabled: data.saleSectionEnabled ?? false,
            homepageSections: sections,
            announcementActive: data.announcementActive ?? true,
            announcementTextEn: data.announcementTextEn ?? 'Free delivery on all orders over ₪50',
            announcementTextAr: data.announcementTextAr ?? 'توصيل مجاني على جميع الطلبات فوق ₪50',
            announcementBgColor: data.announcementBgColor ?? '#ef4444',
            specialOffersGradientStart: data.specialOffersGradientStart ?? '#fdfbfb',
            specialOffersGradientEnd: data.specialOffersGradientEnd ?? '#ebedee',
            whatsappEnabled: data.whatsappEnabled ?? true,
            whatsappNumber: data.whatsappNumber ?? '972501234567',
            socialLinks: {
              instagram: data.socialLinks?.instagram || '',
              facebook: data.socialLinks?.facebook || '',
              tiktok: data.socialLinks?.tiktok || '',
              twitter: data.socialLinks?.twitter || '',
              youtube: data.socialLinks?.youtube || '',
            }
          });
        }
      } catch (error) {
        addToast(t('admin.loading'), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [addToast, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDeliverySettings(deliveryData);
      await setDoc(doc(db, 'settings', 'storefront'), storefrontData, { merge: true });
      addToast(t('admin.saveSettings'), "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t('admin.loading')}</div>;
  }

  const rtl = i18n.dir() === 'rtl';

  return (
    <div className={`max-w-3xl ${rtl ? 'rtl' : ''}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.storeSettings') || 'Store Settings'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('admin.storeSettingsDesc') || 'Configure delivery costs, announcements, and storefront features.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        {/* DELIVERY SETTINGS */}
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">{t('admin.deliverySettings') || 'Delivery Settings'}</h2>

          <div className={`bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800 ${rtl ? 'rtl:text-right' : ''}`}>
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p>{t('admin.deliveryCostsAutoDesc') || 'Customer delivery costs are calculated automatically at checkout according to their selected region.'}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('admin.flatRateCosts') || 'Flat Rate Costs'} (₪)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.westBankRate') || 'West Bank Rate'}</label>
                <div className="relative">
                  <span className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
                  <input type="number" min="0" step="0.01" required value={deliveryData.westBankCost} onChange={e => setDeliveryData({ ...deliveryData, westBankCost: Number(e.target.value) })} className={`w-full border border-gray-300 rounded-lg ${rtl ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3'} py-2`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.insideRate') || 'Inside (48) Rate'}</label>
                <div className="relative">
                  <span className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
                  <input type="number" min="0" step="0.01" required value={deliveryData.insideCost} onChange={e => setDeliveryData({ ...deliveryData, insideCost: Number(e.target.value) })} className={`w-full border border-gray-300 rounded-lg ${rtl ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3'} py-2`} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">{t('admin.freeDeliveryConfiguration') || 'Free Delivery Configuration'}</h3>

            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={deliveryData.freeDeliveryEnabled} onChange={e => setDeliveryData({ ...deliveryData, freeDeliveryEnabled: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer" />
              <span className="text-sm font-medium text-gray-900">{t('admin.freeDeliveryGlobal') || 'Enable Free Delivery Globally (All Orders)'}</span>
            </label>

            <div className={`pl-8 ${deliveryData.freeDeliveryEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input type="checkbox" checked={deliveryData.freeDeliveryThresholdEnabled} onChange={e => setDeliveryData({ ...deliveryData, freeDeliveryThresholdEnabled: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                <span className="text-sm font-medium text-gray-700">{t('admin.freeDeliveryThresholdEnable') || 'Enable Free Delivery above a certain amount'}</span>
              </label>

              {deliveryData.freeDeliveryThresholdEnabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.minCartSubtotal') || 'Minimum Cart Subtotal'} (₪)</label>
                  <div className="relative max-w-xs">
                    <span className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
                    <input type="number" min="0" step="0.01" value={deliveryData.freeDeliveryThresholdAmount} onChange={e => setDeliveryData({ ...deliveryData, freeDeliveryThresholdAmount: Number(e.target.value) })} className={`w-full border border-gray-300 rounded-lg ${rtl ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3'} py-2 text-gray-900`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT BAR SETTINGS */}
        <div className="p-6 space-y-6 border-t-[8px] border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">{t('admin.announcementBar') || 'Announcement Bar Config'}</h2>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={storefrontData.announcementActive} onChange={e => setStorefrontData({ ...storefrontData, announcementActive: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">{t('admin.announcementEnabled') || 'Enable Announcement Bar'}</span>
          </label>

          {storefrontData.announcementActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.announcementTextEn') || 'Announcement Text (English)'}</label>
                <input type="text" value={storefrontData.announcementTextEn} onChange={e => setStorefrontData({ ...storefrontData, announcementTextEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex: Free delivery on orders over ₪50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.announcementTextAr') || 'Announcement Text (Arabic)'}</label>
                <input type="text" value={storefrontData.announcementTextAr} onChange={e => setStorefrontData({ ...storefrontData, announcementTextAr: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right dir-rtl" placeholder="مثال: توصيل مجاني على الطلبات..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.announcementBgColor') || 'Background Color (Hex)'}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={storefrontData.announcementBgColor} onChange={e => setStorefrontData({ ...storefrontData, announcementBgColor: e.target.value })} className="w-10 h-10 p-1 rounded cursor-pointer border-gray-300" />
                  <input type="text" value={storefrontData.announcementBgColor} onChange={e => setStorefrontData({ ...storefrontData, announcementBgColor: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2" placeholder="#ef4444" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STOREFRONT & HOME SECTIONS */}
        <div className="p-6 space-y-6 border-t-[8px] border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">{t('admin.homepageSettings') || 'Storefront Layout'}</h2>

          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-2">{t('admin.saleSection')}</h3>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={storefrontData.saleSectionEnabled} onChange={e => setStorefrontData({ ...storefrontData, saleSectionEnabled: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer" />
              <span className="text-sm font-medium text-gray-700">{t('admin.saleSectionEnabled')}</span>
            </label>

            {storefrontData.saleSectionEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.specialOffersGradientStart') || 'Gradient Start Color'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={storefrontData.specialOffersGradientStart} onChange={e => setStorefrontData({ ...storefrontData, specialOffersGradientStart: e.target.value })} className="w-10 h-10 p-1 rounded cursor-pointer" />
                    <input type="text" value={storefrontData.specialOffersGradientStart} onChange={e => setStorefrontData({ ...storefrontData, specialOffersGradientStart: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.specialOffersGradientEnd') || 'Gradient End Color'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={storefrontData.specialOffersGradientEnd} onChange={e => setStorefrontData({ ...storefrontData, specialOffersGradientEnd: e.target.value })} className="w-10 h-10 p-1 rounded cursor-pointer" />
                    <input type="text" value={storefrontData.specialOffersGradientEnd} onChange={e => setStorefrontData({ ...storefrontData, specialOffersGradientEnd: e.target.value })} className="flex-1 border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">{t('admin.homepageSections')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('admin.homepageSectionsDesc')}</p>
            <div className="space-y-2">
              {storefrontData.homepageSections.map((section, idx) => {
                const sectionLabelMap = {
                  hero: t('admin.sectionHero') || 'Hero',
                  banners: t('admin.sectionBanners') || 'Banners',
                  categories: t('admin.sectionCategories') || 'Categories',
                  sale: t('admin.sectionSale') || 'Sale',
                  trending: t('admin.sectionTrending') || 'Trending',
                  editorsPicks: t('admin.sectionEditorsPicks') || 'Editors Picks',
                };
                return (
                  <div key={section.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${section.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <GripVertical size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-800">{sectionLabelMap[section.id] || section.id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const arr = [...storefrontData.homepageSections];
                        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        setStorefrontData({ ...storefrontData, homepageSections: arr });
                      }}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={t('admin.moveUp')}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === storefrontData.homepageSections.length - 1) return;
                        const arr = [...storefrontData.homepageSections];
                        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                        setStorefrontData({ ...storefrontData, homepageSections: arr });
                      }}
                      disabled={idx === storefrontData.homepageSections.length - 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={t('admin.moveDown')}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const arr = storefrontData.homepageSections.map(s => s.id === section.id ? { ...s, visible: !s.visible } : s);
                        setStorefrontData({ ...storefrontData, homepageSections: arr });
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${section.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WHATSAPP CONFIG */}
        <div className="p-6 space-y-6 border-t-[8px] border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">{t('admin.whatsappSettings') || 'WhatsApp Widget Settings'}</h2>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={storefrontData.whatsappEnabled} onChange={e => setStorefrontData({ ...storefrontData, whatsappEnabled: e.target.checked })} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">{t('admin.whatsappEnabled') || 'Enable Global WhatsApp Widget'}</span>
          </label>

          {storefrontData.whatsappEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.whatsappNumber') || 'WhatsApp Phone Number'}</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm">+</span>
                <input type="text" value={storefrontData.whatsappNumber} onChange={e => setStorefrontData({ ...storefrontData, whatsappNumber: e.target.value })} className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 972501234567" dir="ltr" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('admin.whatsappNumberHint') || 'Input the country code and number without spaces or plus signs (ex: 972...).'}</p>
            </div>
          )}
        </div>

        {/* SOCIAL MEDIA CONFIG */}
        <div className="p-6 space-y-6 border-t-[8px] border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">{t('admin.socialMediaSettings') || 'Social Media Footprint'}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('admin.socialMediaHint') || 'Link your primary social accounts. Empty fields will automatically hide from the Customer Frontend footer.'}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <input type="url" value={storefrontData.socialLinks.instagram} onChange={e => setStorefrontData({ ...storefrontData, socialLinks: { ...storefrontData.socialLinks, instagram: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://instagram.com/goldbag" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <input type="url" value={storefrontData.socialLinks.facebook} onChange={e => setStorefrontData({ ...storefrontData, socialLinks: { ...storefrontData.socialLinks, facebook: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://facebook.com/goldbag" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
              <input type="url" value={storefrontData.socialLinks.tiktok} onChange={e => setStorefrontData({ ...storefrontData, socialLinks: { ...storefrontData.socialLinks, tiktok: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://tiktok.com/@goldbag" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X URL</label>
              <input type="url" value={storefrontData.socialLinks.twitter} onChange={e => setStorefrontData({ ...storefrontData, socialLinks: { ...storefrontData.socialLinks, twitter: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://twitter.com/goldbag" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
              <input type="url" value={storefrontData.socialLinks.youtube} onChange={e => setStorefrontData({ ...storefrontData, socialLinks: { ...storefrontData.socialLinks, youtube: e.target.value } })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://youtube.com/@goldbag" dir="ltr" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? (t('admin.saving') || 'Saving...') : (t('admin.saveSettings') || 'Save Settings')}
          </button>
        </div>
      </form>
    </div>
  );
}
