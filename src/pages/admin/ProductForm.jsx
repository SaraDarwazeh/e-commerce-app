import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, createProduct, updateProduct, uploadProductImage } from '../../services/productService';
import { getOptionTemplates } from '../../services/optionTemplateService';
import { getCategories } from '../../services/categoryService';
import { Trash2, Plus, Upload, X, Loader } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import BackButton from '../../components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function ProductForm() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showConfirm, addToast } = useUIStore();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef(null);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    comparePrice: '',
    category: '',
    brand: '',
    stock: '',
    isFeatured: false,
    isActive: true,
    images: [],
    colors: [],
    options: [],
    defaultSelections: {},
    ribbonEnabled: false,
    ribbonType: 'sale',
    ribbonText: '',
    ribbonColor: '#ef4444',
    showInSaleSection: false,
    salePercent: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [tpls, cats] = await Promise.all([
          getOptionTemplates(),
          getCategories(true)
        ]);
        setTemplates(tpls);
        setCategories(cats);

        if (isEditing) {
          const prod = await getProductById(id);
          if (prod) {
            setFormData({
              ...prod,
              title: prod.title || '',
              titleAr: prod.titleAr || '',
              description: prod.description || '',
              descriptionAr: prod.descriptionAr || '',
              price: prod.price || '',
              comparePrice: prod.comparePrice || '',
              stock: prod.stock || '',
              images: prod.images || [],
              colors: prod.colors || [],
              options: prod.options || [],
              defaultSelections: prod.defaultSelections || {},
              ribbonEnabled: prod.ribbonEnabled || false,
              ribbonType: prod.ribbonType || 'sale',
              ribbonText: prod.ribbonText || '',
              ribbonColor: prod.ribbonColor || '#ef4444',
              showInSaleSection: prod.showInSaleSection || false,
              salePercent: prod.salePercent || '',
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast(t('admin.invalidImageType', 'Please upload a valid image file.'), 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast(t('admin.imageTooLarge', 'Image must be less than 5MB.'), 'error');
      return;
    }
    try {
      setIsUploadingImage(true);
      const url = await uploadProductImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      addToast(t('admin.uploadSuccess', 'Image uploaded!'), 'success');
    } catch (err) {
      addToast(t('admin.uploadImageFailed'), 'error');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => {
      const newImgs = [...prev.images];
      newImgs.splice(index, 1);
      return { ...prev, images: newImgs };
    });
  };

  const handleApplyTemplate = (e) => {
    const tplId = e.target.value;
    setSelectedTemplate(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      showConfirm({
        title: t('admin.applyTemplate'),
        message: t('admin.applyTemplate'),
        confirmText: t('admin.applyTemplate'),
        onConfirm: () => {
          setFormData(prev => ({
            ...prev,
            options: JSON.parse(JSON.stringify(tpl.optionGroups)),
            defaultSelections: {}
          }));
          addToast(t('admin.applyTemplate'), "success");
        }
      });
    }
  };

  const addOptionGroup = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { name: '', values: [] }]
    }));
  };

  const removeOptionGroup = (index) => {
    setFormData(prev => {
      const newOpts = [...prev.options];
      const removedName = newOpts[index].name;
      newOpts.splice(index, 1);
      const newDefaults = { ...prev.defaultSelections };
      if (removedName) delete newDefaults[removedName];
      return { ...prev, options: newOpts, defaultSelections: newDefaults };
    });
  };

  const updateOptionGroupName = (index, val) => {
    setFormData(prev => {
      const newOpts = [...prev.options];
      const oldName = newOpts[index].name;
      newOpts[index].name = val;
      const newDefaults = { ...prev.defaultSelections };
      if (oldName && newDefaults[oldName]) {
        newDefaults[val] = newDefaults[oldName];
        delete newDefaults[oldName];
      }
      return { ...prev, options: newOpts, defaultSelections: newDefaults };
    });
  };

  const addOptionValue = (index, val) => {
    if (!val.trim()) return;
    setFormData(prev => {
      const newOpts = [...prev.options];
      if (!newOpts[index].values.includes(val.trim())) {
        newOpts[index].values.push(val.trim());
      }
      return { ...prev, options: newOpts };
    });
  };

  const removeOptionValue = (groupIndex, valIndex) => {
    setFormData(prev => {
      const newOpts = [...prev.options];
      const groupName = newOpts[groupIndex].name;
      const removedVal = newOpts[groupIndex].values[valIndex];
      newOpts[groupIndex].values.splice(valIndex, 1);
      const newDefaults = { ...prev.defaultSelections };
      if (newDefaults[groupName] === removedVal) {
        delete newDefaults[groupName];
      }
      return { ...prev, options: newOpts, defaultSelections: newDefaults };
    });
  };

  const setDefaultSelection = (groupName, val) => {
    setFormData(prev => ({
      ...prev,
      defaultSelections: {
        ...prev.defaultSelections,
        [groupName]: val
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        comparePrice: formData.comparePrice ? Number(formData.comparePrice) : null,
        stock: Number(formData.stock),
        salePercent: formData.salePercent ? Number(formData.salePercent) : null,
        options: formData.options.filter(o => o.name.trim() !== '' && o.values.length > 0)
      };

      if (isEditing) {
        await updateProduct(id, payload);
        addToast(t('admin.updateProduct'), "success");
      } else {
        await createProduct(payload);
        addToast(t('admin.createProduct'), "success");
      }
      navigate('/admin/products');
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">{t('admin.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 page-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? t('admin.editProduct') : t('admin.createProduct')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">{t('admin.productNameEn').split('(')[0].trim()}</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.productNameEn')}</label>
              <input required name="title" value={formData.title} onChange={handleChange} type="text" className="w-full border-gray-300 rounded-md p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.productNameAr')}</label>
              <input name="titleAr" value={formData.titleAr} onChange={handleChange} type="text" dir="rtl" className="w-full border-gray-300 rounded-md p-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.descriptionEn')}</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full border-gray-300 rounded-md p-2 border"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.descriptionAr')}</label>
              <textarea name="descriptionAr" value={formData.descriptionAr} onChange={handleChange} rows="3" dir="rtl" className="w-full border-gray-300 rounded-md p-2 border"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.price')} (₪)</label>
              <input required name="price" value={formData.price} onChange={handleChange} type="number" step="0.01" min="0" className="w-full border-gray-300 rounded-md p-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.comparePrice')} (₪)</label>
              <input name="comparePrice" value={formData.comparePrice} onChange={handleChange} type="number" step="0.01" min="0" className="w-full border-gray-300 rounded-md p-2 border" placeholder={t('admin.optional')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.category')}</label>
              <select required name="category" value={formData.category} onChange={handleChange} className="w-full border-gray-300 rounded-md p-2 border bg-white">
                <option value="">{t('admin.selectCategory')}</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{i18n.language === 'ar' && c.nameAr ? c.nameAr : c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.brand')}</label>
              <input name="brand" value={formData.brand} onChange={handleChange} type="text" className="w-full border-gray-300 rounded-md p-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.stock')}</label>
              <input required name="stock" value={formData.stock} onChange={handleChange} type="number" min="0" className="w-full border-gray-300 rounded-md p-2 border" />
            </div>
          </div>

          <div className="flex gap-6 pt-4 border-t border-gray-100 mt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
              <span className="text-sm font-medium text-gray-700">{t('admin.productActive')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
              <span className="text-sm font-medium text-gray-700">{t('admin.featured')}</span>
            </label>
          </div>
        </div>

        {/* Sale Section Controls */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">{t('admin.saleSection')}</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="showInSaleSection" checked={formData.showInSaleSection} onChange={handleChange} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">{t('admin.showInSaleSection')}</span>
          </label>
          {formData.showInSaleSection && (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.salePercent')} (%)</label>
              <input name="salePercent" value={formData.salePercent} onChange={handleChange} type="number" min="1" max="100" className="w-full border-gray-300 rounded-md p-2 border" placeholder="e.g. 20" />
            </div>
          )}
        </div>

        {/* Product Ribbons */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">{t('admin.ribbonSettings')}</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-gray-500">{t('admin.enableRibbon')}</span>
              <input type="checkbox" name="ribbonEnabled" checked={formData.ribbonEnabled} onChange={handleChange} className="relative w-10 h-5 bg-gray-200 rounded-full appearance-none cursor-pointer border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 checked:bg-brand-600 before:inline-block before:w-4 before:h-4 before:bg-white before:rounded-full before:shadow before:transform before:transition before:ease-in-out checked:before:translate-x-5" />
            </label>
          </div>

          {formData.ribbonEnabled && (
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ribbonType')}</label>
                <select name="ribbonType" value={formData.ribbonType} onChange={handleChange} className="w-full border-gray-300 rounded-md p-2 border bg-white">
                  <option value="custom">{t('admin.custom')}</option>
                  <option value="sale">{t('admin.sale')}</option>
                  <option value="new">{t('admin.new')}</option>
                  <option value="bestseller">{t('admin.bestseller')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ribbonText')}</label>
                <input type="text" name="ribbonText" value={formData.ribbonText} onChange={handleChange} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.ribbonColor')}</label>
                <div className="flex items-center gap-3">
                  <input type="color" name="ribbonColor" value={formData.ribbonColor} onChange={handleChange} className="w-10 h-10 border border-gray-300 rounded cursor-pointer p-0 bg-white" />
                  <span className="text-sm text-gray-500 font-mono">{formData.ribbonColor}</span>
                </div>
              </div>

              <div className="flex items-end">
                <div className="w-full p-4 border border-gray-200 rounded-lg bg-white flex items-center justify-center relative overflow-hidden h-20">
                  <div className="text-sm text-gray-400 font-medium z-0">{t('admin.preview')}</div>
                  <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10" style={{ backgroundColor: formData.ribbonColor }}>
                    {formData.ribbonText || (formData.ribbonType === 'custom' ? 'Custom' : formData.ribbonType.toUpperCase())}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">{t('admin.images')}</h2>
          <div className="flex flex-wrap gap-4">
            {formData.images.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden group">
                <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 rtl:right-auto rtl:left-1 bg-white rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className={`w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploadingImage ? 'border-brand-300 bg-brand-50 cursor-wait' : 'border-gray-300 hover:bg-gray-50 hover:border-brand-500'}`}>
              {isUploadingImage ? (
                <>
                  <Loader className="w-6 h-6 text-brand-500 mb-1 animate-spin" />
                  <span className="text-xs text-brand-600 font-medium">{t('admin.uploading', 'Uploading...')}</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 font-medium text-center px-2">{t('admin.uploadImage')}</span>
                </>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
            </label>
          </div>
        </div>

        {/* Colors */}
        <ColorsSection
          colors={formData.colors}
          onChange={(colors) => setFormData(prev => ({ ...prev, colors }))}
          t={t}
        />

        {/* Dynamic Options */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">{t('admin.productOptions')}</h2>
            {templates.length > 0 && (
              <select value={selectedTemplate} onChange={handleApplyTemplate} className="text-sm border border-gray-300 bg-white rounded-md p-1.5 focus:ring-brand-500 focus:border-brand-500">
                <option value="">{t('admin.selectTemplate')}</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-4">
            {formData.options.map((opt, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('admin.optionName')}</label>
                    <input type="text" required value={opt.name} onChange={(e) => updateOptionGroupName(i, e.target.value)} placeholder={t('admin.optionName')} className="w-full border-gray-300 rounded-md p-2 text-sm border" />
                  </div>
                  <button type="button" onClick={() => removeOptionGroup(i)} className="mt-6 text-red-500 hover:bg-red-50 p-2 rounded-md h-fit transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('admin.optionValues')}</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {opt.values.map((val, vIdx) => {
                      const isDefault = formData.defaultSelections[opt.name] === val;
                      const isColor = opt.name.toLowerCase().includes('color');
                      const [colorName, colorHex] = val.includes('|') ? val.split('|') : [val, val];

                      return (
                        <div key={vIdx} className={`border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${isDefault ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-500' : 'bg-white shadow-sm border-gray-200'}`}>
                          <button type="button" onClick={() => setDefaultSelection(opt.name, isDefault ? null : val)} className={`w-3 h-3 rounded-full border border-gray-400 shrink-0 ${isDefault ? 'bg-brand-600 border-brand-600' : 'hover:border-brand-500'}`} title={t('admin.isDefault')}></button>
                          {isColor && (
                            <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm shrink-0" style={{ backgroundColor: colorHex }} title={colorName} />
                          )}
                          <span>{colorName}</span>
                          <button type="button" onClick={() => removeOptionValue(i, vIdx)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      )
                    })}
                  </div>
                  <ValueAdder isColor={opt.name.toLowerCase().includes('color')} onAdd={(val) => addOptionValue(i, val)} />
                </div>
              </div>
            ))}

            <button type="button" onClick={addOptionGroup} className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-800">
              <Plus className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" /> {t('admin.addOptionGroup')}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={() => navigate('/admin/products')} className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            {t('admin.cancel')}
          </button>
          <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 flex items-center">
            {isSaving ? t('admin.saving') : t('admin.save')}
          </button>
        </div>

      </form>
    </div>
  );
}

function ValueAdder({ onAdd, isColor }) {
  const { t } = useTranslation();
  const [val, setVal] = useState('');
  const [hex, setHex] = useState('#000000');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitVal();
    }
  };

  const submitVal = () => {
    if (!val.trim()) return;
    const finalVal = isColor ? `${val.trim()}|${hex}` : val.trim();
    onAdd(finalVal);
    setVal('');
  };

  return (
    <div className="flex gap-2 items-center">
      {isColor && (
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0 bg-white" />
      )}
      <input type="text" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={handleKeyDown} className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-48 bg-white" placeholder={isColor ? t('admin.colorName') : t('admin.typeValueEnter')} />
      <button type="button" onClick={submitVal} className="bg-gray-100 border border-gray-200 hover:bg-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-700">
        +
      </button>
    </div>
  )
}

// --- Reusable multi-color palette picker ---
const COLOR_PALETTE = [
  { name: 'Black',       hex: '#111111' },
  { name: 'White',       hex: '#FFFFFF' },
  { name: 'Gray',        hex: '#6B7280' },
  { name: 'Silver',      hex: '#C0C0C0' },
  { name: 'Red',         hex: '#EF4444' },
  { name: 'Pink',        hex: '#EC4899' },
  { name: 'Rose',        hex: '#F43F5E' },
  { name: 'Orange',      hex: '#F97316' },
  { name: 'Yellow',      hex: '#EAB308' },
  { name: 'Gold',        hex: '#D4AF37' },
  { name: 'Lime',        hex: '#84CC16' },
  { name: 'Green',       hex: '#22C55E' },
  { name: 'Teal',        hex: '#14B8A6' },
  { name: 'Cyan',        hex: '#06B6D4' },
  { name: 'Sky',         hex: '#38BDF8' },
  { name: 'Blue',        hex: '#3B82F6' },
  { name: 'Indigo',      hex: '#6366F1' },
  { name: 'Violet',      hex: '#8B5CF6' },
  { name: 'Purple',      hex: '#A855F7' },
  { name: 'Brown',       hex: '#92400E' },
  { name: 'Beige',       hex: '#D2B48C' },
  { name: 'Cream',       hex: '#FFFDD0' },
  { name: 'Navy',        hex: '#1E3A5F' },
  { name: 'Olive',       hex: '#708238' },
];

function ColorsSection({ colors, onChange, t }) {
  const [customHex, setCustomHex] = useState('#888888');

  const toggleColor = (hex) => {
    if (colors.includes(hex)) {
      onChange(colors.filter(c => c !== hex));
    } else {
      onChange([...colors, hex]);
    }
  };

  const addCustom = () => {
    if (!colors.includes(customHex)) {
      onChange([...colors, customHex]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
      <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
        {t('admin.productColors', 'Product Colors')}
      </h2>

      {/* Selected swatches */}
      {colors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('admin.selectedColors', 'Selected Colors')} ({colors.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {colors.map(hex => (
              <div
                key={hex}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm"
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs font-mono text-gray-600">{hex}</span>
                <button
                  type="button"
                  onClick={() => onChange(colors.filter(c => c !== hex))}
                  className="text-gray-400 hover:text-red-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated palette */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t('admin.colorPalette', 'Color Palette — click to select')}
        </p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(({ name, hex }) => {
            const selected = colors.includes(hex);
            return (
              <button
                key={hex}
                type="button"
                title={name}
                onClick={() => toggleColor(hex)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${
                  selected
                    ? 'border-brand-600 ring-2 ring-brand-400 ring-offset-1 scale-110'
                    : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      </div>

      {/* Custom hex */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t('admin.customColor', 'Custom Color')}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={customHex}
            onChange={e => setCustomHex(e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0 bg-white"
          />
          <span className="text-sm font-mono text-gray-600">{customHex}</span>
          <button
            type="button"
            onClick={addCustom}
            disabled={colors.includes(customHex)}
            className="px-4 py-2 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {colors.includes(customHex)
              ? t('admin.colorAdded', 'Added ✓')
              : `+ ${t('admin.addColor', 'Add Color')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

