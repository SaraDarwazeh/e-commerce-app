import { create } from 'zustand';
import { getUserCart, syncCartItem, removeCartItem, clearUserCart } from '../services/cartService';
import { validateCoupon } from '../services/couponService';
import useAuthStore from './authStore';

export const generateCartItemId = (productId, selectedOptions = {}) => {
  if (!selectedOptions) return productId.toString();
  const optionKeys = Object.keys(selectedOptions).sort();
  if (optionKeys.length === 0) return productId.toString();

  const optionsString = optionKeys.map(key => `${key}:${selectedOptions[key]}`).join('|');
  return `${productId}_${encodeURIComponent(optionsString)}`;
};

const GUEST_CART_KEY = 'luxestore_guest_cart';

const getInitialGuestCart = () => {
  try {
    const local = localStorage.getItem(GUEST_CART_KEY);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
};

const persistGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const calculateTotals = (items, coupon, deliverySettings, deliveryRegion) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;

  if (coupon) {
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      // ignore coupon discounting this recalculation
    } else {
      if (coupon.type === 'percentage') {
        discountAmount = subtotal * (coupon.value / 100);
      } else if (coupon.type === 'fixed') {
        discountAmount = Math.min(coupon.value, subtotal);
      }
    }
  }

  let deliveryCost = 0;
  if (deliverySettings) {
    if (deliverySettings.freeDeliveryEnabled) {
      deliveryCost = 0;
    } else if (deliverySettings.freeDeliveryThresholdEnabled && subtotal >= deliverySettings.freeDeliveryThresholdAmount) {
      deliveryCost = 0;
    } else {
      deliveryCost = deliveryRegion === 'Inside' ? (deliverySettings.insideCost ?? 30) : (deliverySettings.westBankCost ?? 15);
    }
  } else {
    // default fallback
    deliveryCost = deliveryRegion === 'Inside' ? 30 : 15;
  }
  const finalTotal = Math.max(0, (subtotal - discountAmount) + deliveryCost);

  return { subtotal, discountAmount, deliveryCost, total: finalTotal };
};

const useCartStore = create((set, get) => ({
  items: getInitialGuestCart(),
  coupon: null,
  isLoading: false,
  error: null,

  // Delivery dynamically fetched
  deliverySettings: null,
  deliveryRegion: 'West Bank',

  // Totals Cache
  totals: {
    subtotal: 0,
    discountAmount: 0,
    deliveryCost: 0,
    total: 0
  },

  _recalculate: () => {
    const { items, coupon, deliverySettings, deliveryRegion } = get();
    set({ totals: calculateTotals(items, coupon, deliverySettings, deliveryRegion) });
  },

  setDeliveryRegion: (region) => {
    set({ deliveryRegion: region });
    get()._recalculate();
  },

  setDeliverySettings: (settings) => {
    set({ deliverySettings: settings });
    get()._recalculate();
  },

  initCart: async () => {
    const uid = useAuthStore.getState().currentUser?.uid;
    set({ isLoading: true, error: null });

    try {
      if (uid) {
        let remoteItems = await getUserCart(uid);
        // Ensure legacy items have cartItemId
        remoteItems = remoteItems.map(i => ({ ...i, cartItemId: i.cartItemId || i.productId.toString() }));
        set({ items: remoteItems });
      } else {
        const localItems = getInitialGuestCart().map(i => ({ ...i, cartItemId: i.cartItemId || i.productId.toString() }));
        set({ items: localItems });
      }
    } catch (err) {
      console.error(err);
      set({ error: err.message });
    } finally {
      get()._recalculate();
      set({ isLoading: false });
    }
  },

  mergeGuestCart: async (uid) => {
    if (!uid) return;
    const localItems = getInitialGuestCart();

    if (localItems.length === 0) {
      get().initCart();
      return;
    }

    set({ isLoading: true });
    try {
      const remoteItems = await getUserCart(uid);
      const mergedMap = new Map();

      remoteItems.forEach(item => {
        const id = item.cartItemId || item.productId.toString();
        mergedMap.set(id, { ...item, cartItemId: id });
      });

      localItems.forEach(item => {
        const id = item.cartItemId || item.productId.toString();
        if (mergedMap.has(id)) {
          const existing = mergedMap.get(id);
          mergedMap.set(id, { ...existing, quantity: existing.quantity + item.quantity });
        } else {
          mergedMap.set(id, { ...item, cartItemId: id });
        }
      });

      const mergedArray = Array.from(mergedMap.values());
      const syncPromises = mergedArray.map(item => syncCartItem(uid, item));
      await Promise.all(syncPromises);

      localStorage.removeItem(GUEST_CART_KEY);
      set({ items: mergedArray });
      get()._recalculate();

    } catch (err) {
      console.error('Merge error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product, quantity = 1, selectedOptions = null) => {
    const uid = useAuthStore.getState().currentUser?.uid;
    const { items } = get();

    const options = selectedOptions || {};
    const cartItemId = generateCartItemId(product.id, options);

    // Match exact cartItemId, or fallback for legacy exact product ID
    const existingIndex = items.findIndex(i => i.cartItemId === cartItemId || (!i.cartItemId && i.productId === product.id));
    let updatedItems = [...items];
    let cartItemData;

    if (existingIndex >= 0) {
      const newQty = updatedItems[existingIndex].quantity + quantity;
      updatedItems[existingIndex] = { ...updatedItems[existingIndex], quantity: newQty };
      cartItemData = updatedItems[existingIndex];
    } else {
      cartItemData = {
        cartItemId,
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        category: product.category,
        quantity: quantity,
        selectedOptions: options
      };
      updatedItems.push(cartItemData);
    }

    set({ items: updatedItems });
    get()._recalculate();

    if (uid) {
      await syncCartItem(uid, cartItemData);
    } else {
      persistGuestCart(updatedItems);
    }
  },

  updateQuantity: async (cartItemId, delta) => {
    const uid = useAuthStore.getState().currentUser?.uid;
    const { items } = get();

    const index = items.findIndex(i => i.cartItemId === cartItemId || i.productId === cartItemId);
    if (index === -1) return;

    let updatedItems = [...items];
    const newQty = updatedItems[index].quantity + delta;

    if (newQty <= 0) {
      return get().removeItem(cartItemId);
    }

    updatedItems[index] = { ...updatedItems[index], quantity: newQty };
    set({ items: updatedItems });
    get()._recalculate();

    if (uid) {
      await syncCartItem(uid, updatedItems[index]);
    } else {
      persistGuestCart(updatedItems);
    }
  },

  removeItem: async (cartItemId) => {
    const uid = useAuthStore.getState().currentUser?.uid;
    const { items } = get();

    const updatedItems = items.filter(i => i.cartItemId !== cartItemId && (!i.cartItemId || i.productId !== cartItemId));
    set({ items: updatedItems });
    get()._recalculate();

    if (uid) {
      await removeCartItem(uid, cartItemId);
    } else {
      persistGuestCart(updatedItems);
    }
  },

  clearCart: async () => {
    const uid = useAuthStore.getState().currentUser?.uid;
    set({ items: [], coupon: null });
    get()._recalculate();

    if (uid) {
      await clearUserCart(uid);
    } else {
      persistGuestCart([]);
    }
  },

  applyCoupon: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const coupon = await validateCoupon(code);
      const { subtotal } = get().totals;
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        throw new Error(`Minimum order of ₪${coupon.minOrderAmount} required for this coupon.`);
      }

      set({ coupon });
      get()._recalculate();
      return true;
    } catch (err) {
      set({ error: err.message, coupon: null });
      get()._recalculate();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  removeCoupon: () => {
    set({ coupon: null, error: null });
    get()._recalculate();
  }

}));

export default useCartStore;
