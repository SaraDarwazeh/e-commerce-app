import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, Users, LogOut, Tag, Settings, Image, ExternalLink, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex" dir={i18n.dir()}>
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex min-h-screen fixed top-0 ${i18n.dir() === 'rtl' ? 'right-0 border-l border-r-0' : 'left-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold tracking-tight text-gray-900">{t('common.adminDashboard')}</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <LayoutDashboard className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.dashboard')}
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <ShoppingBag className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.products')}
          </NavLink>
          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FolderTree className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.categories')}
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <ShoppingBag className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.orders')}
          </NavLink>
          <NavLink
            to="/admin/coupons"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Tag className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.coupons')}
          </NavLink>
          <NavLink
            to="/admin/banners"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Image className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.homeBanners')}
          </NavLink>
          <NavLink
            to="/admin/option-templates"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Sliders className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.optionTemplates')}
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Users className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.users')}
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `flex items-center px-2 py-2.5 text-sm font-medium rounded-lg ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Settings className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('admin.settings')}
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center w-full px-2 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 rtl:ml-3 ltr:mr-3" />
            {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${i18n.dir() === 'rtl' ? 'md:mr-64' : 'md:ml-64'}`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="font-medium text-gray-800">{t('common.adminDashboard')}</div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 bg-gray-50 border border-gray-200 hover:border-brand-200 px-3 py-1.5 rounded-lg transition-colors btn-interact"
            >
              <ExternalLink size={16} />
              {t('admin.viewStorefront')}
            </Link>
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 page-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
