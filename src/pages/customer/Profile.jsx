import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { updateUserProfile } from '../../services/authService';
import useUIStore from '../../store/uiStore';
import BackButton from '../../components/ui/BackButton';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { userProfile, currentUser, updateProfileData } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    region: 'West Bank',
    address: '',
    notes: ''
  });

  const handleEditClick = () => {
    setFormData({
      fullName: userProfile?.fullName || '',
      phone: userProfile?.phone || '',
      region: userProfile?.region || 'West Bank',
      address: userProfile?.address || '',
      notes: userProfile?.notes || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    setIsSaving(true);
    try {
      await updateUserProfile(currentUser.uid, formData);
      updateProfileData(formData);
      setIsEditing(false);
      addToast(t('profile.updateSuccess'), "success");
    } catch (err) {
      addToast(t('profile.updateFailed'), "error");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900">{t('profile.myProfile')}</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-brand-600 w-full relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-2xl">
                {getInitials(userProfile?.fullName || currentUser?.email)}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row gap-8 justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{userProfile?.fullName || t('profile.customer')}</h2>
            <p className="text-gray-500">{userProfile?.email}</p>
            <div className="mt-4 flex gap-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                {userProfile?.role || t('profile.customer')}
              </span>
              {userProfile?.createdAt && (
                <span className="text-sm text-gray-500">
                  {t('profile.memberSince', { date: new Date(userProfile.createdAt.toDate?.() || userProfile.createdAt).toLocaleDateString() })}
                </span>
              )}
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t('profile.editProfile')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('profile.accountDetails')}</h3>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.fullName')}</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.phoneNumber')}</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500" placeholder="e.g. 059..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.region')}</label>
                  <select value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500">
                    <option value="West Bank">{t('profile.westBank')}</option>
                    <option value="Inside">{t('profile.inside48')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.exactAddress')}</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500" placeholder={t('profile.addressPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.deliveryNotes')}</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500" placeholder={t('profile.notesPlaceholder')} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  disabled={isSaving}
                >
                  {t('profile.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-brand-600 border border-transparent rounded-lg text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? t('profile.saving') : t('profile.saveDetails')}
                </button>
              </div>
            </div>
          ) : (
            <dl className="space-y-4">
              <div className="flex border-b border-gray-100 pb-4">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('profile.fullName')}</dt>
                <dd className="w-2/3 text-sm text-gray-900">{userProfile?.fullName || '-'}</dd>
              </div>
              <div className="flex border-b border-gray-100 pb-4">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('profile.emailAddress')}</dt>
                <dd className="w-2/3 text-sm text-gray-900">{userProfile?.email || '-'}</dd>
              </div>
              <div className="flex border-b border-gray-100 pb-4">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('profile.targetRegion')}</dt>
                <dd className="w-2/3 text-sm text-gray-900">{userProfile?.region || '-'}</dd>
              </div>
              <div className="flex border-b border-gray-100 pb-4">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('profile.address')}</dt>
                <dd className="w-2/3 text-sm text-gray-900">{userProfile?.address ? `${userProfile.address} | ${userProfile.phone}` : '-'}</dd>
              </div>
              <div className="flex border-b border-gray-100 pb-4">
                <dt className="w-1/3 text-sm font-medium text-gray-500">{t('profile.uid')}</dt>
                <dd className="w-2/3 text-sm text-gray-900 break-all">{currentUser?.uid}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Settings/Preferences placeholders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('profile.preferences')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('profile.emailNotifications')}</p>
                <p className="text-xs text-gray-500">{t('profile.emailNotifDesc')}</p>
              </div>
              <button className="bg-brand-600 rtl:-scale-x-100 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('profile.smsAlerts')}</p>
                <p className="text-xs text-gray-500">{t('profile.smsAlertsDesc')}</p>
              </div>
              <button className="bg-gray-200 rtl:-scale-x-100 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
