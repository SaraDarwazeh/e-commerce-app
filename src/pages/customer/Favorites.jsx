import { Link, useNavigate } from 'react-router-dom';
import useFavoritesStore from '../../store/favoritesStore';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';

export default function Favorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, isLoading, removeFavoriteOptimistic } = useFavoritesStore();
  const addItem = useCartStore(state => state.addItem);
  const { addToast } = useUIStore();
  const { currentUser, isAuthenticated } = useAuthStore();

  const handleRemoveFavorite = async (productId) => {
    if (!currentUser?.uid) return;
    try {
      await removeFavoriteOptimistic(currentUser.uid, productId);
      addToast(t('favorites.removed'), "info");
    } catch (err) {
      addToast(t('favorites.removeFailed'), "error");
    }
  };

  const handleMoveToCart = async (product) => {
    if (product.options && product.options.length > 0) {
      // Must direct to product page to select variants
      navigate(`/product/${product.id}`);
      addToast(t('favorites.selectOptions'), "info");
      return;
    }
    await addItem(product, 1, {});
    handleRemoveFavorite(product.id);
    addToast(t('favorites.movedToCart'), "success");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <svg className="w-8 h-8 text-red-500 fill-current" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {t('favorites.myFavorites')}
      </h1>

      {!isAuthenticated ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">{t('favorites.signInToSave')}</h2>
          <p className="text-gray-500 max-w-sm mb-6">{t('favorites.signInDesc')}</p>
          <Link to="/login" className="px-8 py-3 bg-brand-600 text-white font-medium rounded-full hover:bg-brand-700 transition-colors shadow-sm">
            {t('favorites.signInRegister')}
          </Link>
        </div>
      ) : isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm h-96">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mb-4"></div>
          {t('favorites.loading')}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all">
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">{t('favorites.noImage')}</div>
                )}
                <button
                  onClick={() => handleRemoveFavorite(item.id)}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2.5 text-red-500 hover:text-red-700 hover:bg-white shadow-sm transition-all hover:scale-110"
                  title={t('favorites.removeFromFav')}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <Link to={`/product/${item.id}`} className="font-bold text-gray-900 mb-1 hover:text-brand-600 line-clamp-1 text-lg">{item.title}</Link>
                <p className="font-medium text-brand-600 mb-6">${item.price.toFixed(2)}</p>

                <button
                  onClick={() => handleMoveToCart(item)}
                  className="mt-auto w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
                >
                  {t('favorites.moveToCart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">{t('favorites.noFavorites')}</h2>
          <p className="text-gray-500 max-w-sm mb-8">{t('favorites.noFavoritesDesc')}</p>
          <Link to="/products" className="px-8 py-3 bg-brand-600 text-white font-medium rounded-full hover:bg-brand-700 transition-colors shadow-sm">
            {t('favorites.browseProducts')}
          </Link>
        </div>
      )}
    </div>
  );
}
