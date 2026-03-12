import { useState, useEffect } from 'react';
import { getOptionTemplates, createOptionTemplate, updateOptionTemplate, deleteOptionTemplate } from '../../services/optionTemplateService';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useTranslation } from 'react-i18next';

export default function OptionTemplates() {
  const { t, i18n } = useTranslation();
  const { showConfirm, addToast } = useUIStore();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    optionGroups: []
  });

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getOptionTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingId(template.id);
      setFormData({
        name: template.name,
        optionGroups: JSON.parse(JSON.stringify(template.optionGroups)) // deep copy
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        optionGroups: [{ name: '', values: [] }]
      });
    }
    setShowModal(true);
  };

  const addGroup = () => {
    setFormData(prev => ({
      ...prev,
      optionGroups: [...prev.optionGroups, { name: '', values: [] }]
    }));
  };

  const removeGroup = (index) => {
    setFormData(prev => {
      const newGroups = [...prev.optionGroups];
      newGroups.splice(index, 1);
      return { ...prev, optionGroups: newGroups };
    });
  };

  const updateGroupName = (index, val) => {
    setFormData(prev => {
      const newGroups = [...prev.optionGroups];
      newGroups[index].name = val;
      return { ...prev, optionGroups: newGroups };
    });
  };

  const addValue = (groupIndex, valObj) => {
    if (!valObj.val.trim()) return;
    setFormData(prev => {
      const newGroups = [...prev.optionGroups];
      if (!newGroups[groupIndex].values.includes(valObj.val.trim())) {
        newGroups[groupIndex].values.push(valObj.val.trim());
      }
      return { ...prev, optionGroups: newGroups };
    });
    valObj.setter('');
  };

  const removeValue = (groupIndex, valIndex) => {
    setFormData(prev => {
      const newGroups = [...prev.optionGroups];
      newGroups[groupIndex].values.splice(valIndex, 1);
      return { ...prev, optionGroups: newGroups };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Cleanup empty groups
      const cleanedGroups = formData.optionGroups.filter(g => g.name.trim() !== '' && g.values.length > 0);
      const payload = {
        name: formData.name,
        optionGroups: cleanedGroups
      };

      if (editingId) {
        await updateOptionTemplate(editingId, payload);
        addToast("Template updated", "success");
      } else {
        await createOptionTemplate(payload);
        addToast("Template created", "success");
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this option template?',
      isDestructive: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteOptionTemplate(id);
          addToast("Template deleted", "success");
          fetchTemplates();
        } catch (err) {
          addToast(err.message, "error");
        }
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.optionTemplates') || 'Option Templates'}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          {t('admin.createTemplate') || 'Create Template'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading templates...</div>
        ) : (
          <table className={`w-full text-left border-collapse ${i18n.dir() === 'rtl' ? 'rtl:text-right' : ''}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.templateName') || 'Template Name'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.preview') || 'Preview'}</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {templates.map(tpl => (
                <tr key={tpl.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{tpl.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {tpl.optionGroups?.map(g => `${g.name} (${g.values.length})`).join(' | ') || 'No options'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3 rtl:space-x-reverse">
                    <button
                      onClick={() => handleOpenModal(tpl)}
                      className="text-brand-600 hover:text-brand-900 font-medium"
                    >
                      {t('admin.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      {t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No templates found. Create one to easily apply standard options (like Size/Color) to products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <OptionTemplateModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          editingId={editingId}
          addValue={addValue}
          removeValue={removeValue}
          addGroup={addGroup}
          removeGroup={removeGroup}
          updateGroupName={updateGroupName}
        />
      )}
    </div>
  );
}

function OptionTemplateModal({
  formData, setFormData, onClose, onSubmit, editingId,
  addValue, removeValue, addGroup, removeGroup, updateGroupName
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Template' : 'Create Template'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g. T-Shirts"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">Option Groups</h3>
            {formData.optionGroups.map((group, gIndex) => (
              <div key={gIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Group Name</label>
                    <input
                      type="text"
                      required
                      value={group.name}
                      onChange={(e) => updateGroupName(gIndex, e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      placeholder="e.g. Size, Color, Material"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(gIndex)}
                    className="mt-6 text-red-500 hover:bg-red-50 p-2 rounded-md h-fit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Options</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {group.values.map((val, vIndex) => (
                      <span key={vIndex} className="bg-white border shadow-sm px-3 py-1 text-sm rounded-full flex items-center gap-2">
                        {val}
                        <button type="button" onClick={() => removeValue(gIndex, vIndex)} className="text-gray-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <ValueAdder onAdd={(val) => addValue(gIndex, { val, setter: () => { } })} />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addGroup}
              className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-800"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Option Group
            </button>
          </div>

        </form>
        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white border border-transparent rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
          >
            {editingId ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ValueAdder({ onAdd }) {
  const [val, setVal] = useState('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd(val);
      setVal('');
    }
  };
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-48"
        placeholder="Type option and hit Enter"
      />
      <button
        type="button"
        onClick={() => { onAdd(val); setVal(''); }}
        className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      >
        Add
      </button>
    </div>
  )
}
