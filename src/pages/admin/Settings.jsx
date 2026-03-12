import { useState, useEffect } from 'react';
import { getShippingSettings, updateShippingSettings } from '../../services/shippingService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Save, AlertCircle, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useTranslation } from 'react-i18next';

export default function ShippingSettings() {
  const { t, i18n } = useTranslation();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    freeShippingThreshold: 50,
    rates: {
      'West Bank': 15,
      'Inside': 30
    }
  });
  const [saleSectionEnabled, setSaleSectionEnabled] = useState(false);

  const defaultSections = [
    { id: 'hero', visible: true },
    { id: 'categories', visible: true },
    { id: 'sale', visible: true },
    { id: 'trending', visible: true },
    { id: 'editorsPicks', visible: true },
  ];
  const [homepageSections, setHomepageSections] = useState(defaultSections);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const settings = await getShippingSettings();
        if (settings) {
          setFormData({
            freeShippingThreshold: settings.freeShippingThreshold || 0,
            rates: {
              'West Bank': settings.rates?.['West Bank'] ?? 15,
              'Inside': settings.rates?.['Inside'] ?? 30
            }
          });
        }
        // Fetch storefront settings (sale toggle + sections)
        const saleDoc = await getDoc(doc(db, 'settings', 'storefront'));
        if (saleDoc.exists()) {
          const data = saleDoc.data();
          setSaleSectionEnabled(data.saleSectionEnabled || false);
          if (data.homepageSections && Array.isArray(data.homepageSections)) {
            setHomepageSections(data.homepageSections);
          }
        }
      } catch (error) {
        addToast(t('admin.loading'), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [addToast]);

  const handleRateChange = (region, value) => {
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [region]: Number(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateShippingSettings(formData);
      // Save storefront settings (sale toggle + section ordering)
      await setDoc(doc(db, 'settings', 'storefront'), {
        saleSectionEnabled,
        homepageSections,
      }, { merge: true });
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

  return (
    <div className={`max-w-2xl ${i18n.dir() === 'rtl' ? 'rtl' : ''}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.shippingSettings') || 'Shipping Settings'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('admin.shippingSettingsDesc') || 'Configure delivery costs based on regions and free shipping thresholds.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">

          <div className={`bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800 ${i18n.dir() === 'rtl' ? 'rtl:text-right' : ''}`}>
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p>{t('admin.shippingCostsAutoDesc') || 'Customer shipping costs are calculated automatically at checkout according to their selected region.'}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('admin.flatRateCosts') || 'Flat Rate Costs'} (₪)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.westBankRate') || 'West Bank Rate'}</label>
                <div className="relative">
                  <span className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.rates['West Bank']}
                    onChange={e => handleRateChange('West Bank', e.target.value)}
                    className={`w-full border border-gray-300 rounded-lg ${i18n.dir() === 'rtl' ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3'} py-2 text-gray-900`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.insideRate') || 'Inside (48) Rate'}</label>
                <div className="relative">
                  <span className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.rates['Inside']}
                    onChange={e => handleRateChange('Inside', e.target.value)}
                    className={`w-full border border-gray-300 rounded-lg ${i18n.dir() === 'rtl' ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3'} py-2 text-gray-900`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">{t('admin.freeShippingCondition') || 'Free Shipping Condition'}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.minCartSubtotal') || 'Minimum Cart Subtotal'} (₪)</label>
              <p className="text-xs text-gray-500 mb-2">{t('admin.freeShippingDesc') || 'Orders exceeding this amount will receive free shipping automatically. Set to a very high number (e.g., 99999) to disable free shipping.'}</p>
              <div className="relative max-w-xs">
                <span className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500`}>₪</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.freeShippingThreshold}
                  onChange={e => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                  className={`w-full border border-gray-300 rounded-lg ${i18n.dir() === 'rtl' ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3'} py-2 text-gray-900`}
                />
              </div>
            </div>
          </div>

          {/* Sale Section Toggle */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">{t('admin.saleSection')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('admin.saleSectionDesc')}</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={saleSectionEnabled} onChange={e => setSaleSectionEnabled(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer" />
              <span className="text-sm font-medium text-gray-700">{t('admin.saleSectionEnabled')}</span>
            </label>
          </div>

          {/* Homepage Sections Ordering */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">{t('admin.homepageSections')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('admin.homepageSectionsDesc')}</p>
            <div className="space-y-2">
              {homepageSections.map((section, idx) => {
                const sectionLabelMap = {
                  hero: t('admin.sectionHero'),
                  categories: t('admin.sectionCategories'),
                  sale: t('admin.sectionSale'),
                  trending: t('admin.sectionTrending'),
                  editorsPicks: t('admin.sectionEditorsPicks'),
                };
                return (
                  <div key={section.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${section.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <GripVertical size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-gray-800">{sectionLabelMap[section.id] || section.id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const arr = [...homepageSections];
                        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        setHomepageSections(arr);
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
                        if (idx === homepageSections.length - 1) return;
                        const arr = [...homepageSections];
                        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                        setHomepageSections(arr);
                      }}
                      disabled={idx === homepageSections.length - 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={t('admin.moveDown')}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHomepageSections(prev => prev.map(s => s.id === section.id ? { ...s, visible: !s.visible } : s));
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
