import { useState, useEffect } from 'react';
import { getUsers } from '../../services/authService';
import { Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Users() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      // Sort so admins are at the top, then by newest
      data.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        const aTime = a.createdAt?.toDate?.() ?? new Date(0);
        const bTime = b.createdAt?.toDate?.() ?? new Date(0);
        return bTime - aTime;
      });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    }
    return 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.users')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.manageCustomers')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse min-w-[800px] ${i18n.dir() === 'rtl' ? 'rtl:text-right' : ''}`}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                  <th className="px-6 py-4 font-semibold text-gray-900 w-16">{t('admin.no')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.customer')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.contactDelivery')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">{t('admin.role')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 text-right">{t('admin.joined')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map((user, idx) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{idx + 1}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0">
                          {(user.fullName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-base">{user.fullName || 'No Name'}</div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5 text-xs text-gray-600">
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            {user.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No phone</span>
                        )}

                        {(user.region || user.address) ? (
                          <div className="flex items-start gap-2">
                            <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                            <span className="max-w-[180px] break-words line-clamp-2">
                              {user.address ? `${user.address}, ` : ''}{user.region || ''}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }
                      `}>
                        {user.role === 'admin' && <Shield size={10} />}
                        <span className="capitalize">{user.role || 'Customer'}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-gray-500 text-xs">
                        <Calendar size={12} />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
