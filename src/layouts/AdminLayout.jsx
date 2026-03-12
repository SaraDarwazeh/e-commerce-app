import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, Users, LogOut, Tag, Settings, Image, ExternalLink, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const { t, i18n } = useTranslation();

  // Initialize from localStorage or default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  // Persist state when toggled
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Dynamic width classes based on state
  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-64';
  const mainMarginLTR = isCollapsed ? 'md:ml-20' : 'md:ml-64';
  const mainMarginRTL = isCollapsed ? 'md:mr-20' : 'md:mr-64';
  return (
    <div className="min-h-screen bg-gray-50 flex" dir={i18n.dir()}>
      {/* Sidebar */}
      <aside className={`${sidebarWidthClass} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col hidden md:flex min-h-screen fixed top-0 ${i18n.dir() === 'rtl' ? 'right-0 border-l border-r-0' : 'left-0'} z-40`}>
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-200 relative`}>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-gray-900 whitespace-nowrap overflow-hidden">{t('common.adminDashboard')}</span>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
              A
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`absolute ${i18n.dir() === 'rtl' ? '-left-3' : '-right-3'} top-5 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-brand-600 hover:border-brand-300 shadow-sm z-50`}
            title={isCollapsed ? t('admin.expandSidebar', 'Expand') : t('admin.collapseSidebar', 'Collapse')}
          >
            {i18n.dir() === 'rtl' ? (
              isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
            ) : (
              isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          <NavLink
            to="/admin"
            end
            title={isCollapsed ? t('admin.dashboard') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.dashboard')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/products"
            title={isCollapsed ? t('admin.products') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <ShoppingBag className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.products')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/categories"
            title={isCollapsed ? t('admin.categories') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <FolderTree className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.categories')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/orders"
            title={isCollapsed ? t('admin.orders') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <ShoppingBag className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.orders')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/coupons"
            title={isCollapsed ? t('admin.coupons') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Tag className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.coupons')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/banners"
            title={isCollapsed ? t('admin.homeBanners') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Image className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.homeBanners')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/option-templates"
            title={isCollapsed ? t('admin.optionTemplates') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Sliders className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.optionTemplates')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/users"
            title={isCollapsed ? t('admin.users') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Users className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.users')}</span>}
              </>
            )}
          </NavLink>

          <NavLink
            to="/admin/settings"
            title={isCollapsed ? t('admin.settings') : ''}
            className={({ isActive }) => `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('admin.settings')}</span>}
              </>
            )}
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            title={isCollapsed ? t('common.signOut') : ''}
            className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'rtl:ml-3 ltr:mr-3'} text-red-500 group-hover:text-red-700`} />
            {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-200">{t('common.signOut')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${i18n.dir() === 'rtl' ? mainMarginRTL : mainMarginLTR}`}>
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
