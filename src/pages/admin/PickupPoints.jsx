import { useState, useEffect } from 'react';
import { getPickupPoints, createPickupPoint, updatePickupPoint, deletePickupPoint } from '../../services/pickupPointService';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

export default function PickupPoints() {
  const { t } = useTranslation();
  const { addToast } = useUIStore();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', location: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const { currentUser, userProfile } = useAuthStore();

  useEffect(() => {
    console.log("UID:", currentUser?.uid);
    console.log("Role:", userProfile?.role);
  }, [currentUser, userProfile]);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    setLoading(true);
    const data = await getPickupPoints();
    setPoints(data);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePickupPoint(editingId, formData);
        addToast(t("pickup.pointUpdated"), 'success');
      } else {
        await createPickupPoint(formData);
        addToast(t("pickup.pointCreated"), 'success');
      }
      setFormData({ name: '', location: '', isActive: true });
      setIsAdding(false);
      setEditingId(null);
      fetchPoints();
    } catch (err) {
      console.error("Pickup Point Save Error:", err);
      addToast(err.code === 'permission-denied' ? t('common.permissionDenied', 'Permission Denied: Admin access required') : err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('pickup.deleteConfirm'))) return;
    try {
      await deletePickupPoint(id);
      addToast(t('pickup.deletedSuccessfully'), 'success');
      fetchPoints();
    } catch (err) {
      console.error("Pickup Point Delete Error:", err);
      addToast(err.code === 'permission-denied' ? t('common.permissionDenied', 'Permission Denied: Admin access required') : err.message, 'error');
    }
  };

  const toggleActive = async (point) => {
    try {
      await updatePickupPoint(point.id, { isActive: !point.isActive });
      fetchPoints();
    } catch (err) {
      console.error("Pickup Point Toggle Error:", err);
      addToast(err.code === 'permission-denied' ? t('common.permissionDenied', 'Permission Denied: Admin access required') : err.message, 'error');
    }
  };

  const handleEdit = (point) => {
    setFormData({ name: point.name, location: point.location, isActive: point.isActive });
    setEditingId(point.id);
    setIsAdding(true);
  };

  if (loading) return <div className="p-8 text-gray-500">{t('admin.loading')}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('pickup.pickupPoints')}</h1>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
          >
            <Plus size={18} /> {t('pickup.addPoint')}
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">{editingId ? t('pickup.editPickupPoint') : t('pickup.newPickupPoint')}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pickup.name')}</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-gray-300 rounded-lg p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pickup.location')}</label>
            <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border-gray-300 rounded-lg p-2.5 border text-left rtl:text-right" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
            <label htmlFor="isActive" className="text-sm font-medium">{t('pickup.activeLabel')}</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ name: '', location: '', isActive: true }); }} className="px-4 py-2 border rounded-lg text-gray-600">{t('pickup.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium">{editingId ? t('pickup.update') : t('pickup.save')}</button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left rtl:text-right">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-900">{t('admin.name')}</th>
              <th className="p-4 font-semibold text-gray-900">{t('pickup.location')}</th>
              <th className="p-4 font-semibold text-gray-900 text-center">{t('pickup.statusInfo')}</th>
              <th className="p-4 font-semibold text-gray-900 rtl:text-left text-right">{t('pickup.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {points.map(point => (
              <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium flex gap-2 items-center"><MapPin size={16} className="text-brand-500" /> {point.name}</td>
                <td className="p-4 text-gray-500">{point.location}</td>
                <td className="p-4 text-center">
                  <button onClick={() => toggleActive(point)} className={`px-2 py-1 text-xs rounded-full ${point.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {point.isActive ? t('pickup.active') : t('pickup.inactive')}
                  </button>
                </td>
                <td className="p-4 rtl:text-left text-right">
                  <div className="flex items-center justify-end rtl:justify-start gap-2">
                    <button onClick={() => handleEdit(point)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded bg-white border border-gray-200"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(point.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-white border border-gray-200"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {points.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">{t('pickup.noPoints')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
