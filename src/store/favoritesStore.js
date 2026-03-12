import { create } from 'zustand';
import { getUserFavorites, addFavorite, removeFavorite } from '../services/favoritesService';
import { getProductById } from '../services/productService';

const useFavoritesStore = create((set, get) => ({
  items: [],
  isLoading: false,

  fetchFavorites: async (uid) => {
    if (!uid) {
      set({ items: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const favsRaw = await getUserFavorites(uid);
      const resolved = await Promise.all(
        favsRaw.map(async f => {
          const prod = await getProductById(f.productId);
          return prod ? { ...prod, addedAt: f.addedAt } : null;
        })
      );
      // Sort by newly added roughly
      const sorted = resolved.filter(Boolean).sort((a,b) => {
        const timeA = a.addedAt?.toDate?.() || new Date(0);
        const timeB = b.addedAt?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
      set({ items: sorted, isLoading: false });
    } catch (error) {
      console.error("Failed to load favorites", error);
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (uid, product) => {
    if (!uid || !product) return false;
    
    const items = get().items;
    const isFav = items.some(i => i.id === product.id);

    if (isFav) {
      // Optimistic remove
      set({ items: items.filter(i => i.id !== product.id) });
      try {
        await removeFavorite(uid, product.id);
        return false;
      } catch (e) {
        set({ items }); // revert
        throw e;
      }
    } else {
      // Optimistic add
      const newItem = { ...product, addedAt: new Date() };
      set({ items: [newItem, ...items] });
      try {
        await addFavorite(uid, product.id);
        return true;
      } catch (e) {
        set({ items }); // revert
        throw e;
      }
    }
  },
  
  removeFavoriteOptimistic: async (uid, productId) => {
    if (!uid || !productId) return;
    const items = get().items;
    set({ items: items.filter(i => i.id !== productId) });
    try {
      await removeFavorite(uid, productId);
    } catch (e) {
       set({ items }); // revert
       throw e;
    }
  },

  clearFavorites: () => set({ items: [] })
}));

export default useFavoritesStore;
