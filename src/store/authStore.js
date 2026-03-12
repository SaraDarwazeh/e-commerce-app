import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile } from '../services/authService';
import useCartStore from './cartStore';

const useAuthStore = create((set, get) => ({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  
  // Actions
  setUser: (user, profile) => {
    set({ 
      currentUser: user, 
      userProfile: profile,
      isAuthenticated: !!user,
      isAdmin: profile?.role === 'admin'
    });
    // Trigger cart merge when a user manually logs in or signs up
    if (user) {
      useCartStore.getState().mergeGuestCart(user.uid);
    }
  },
  
  updateProfileData: (newData) => set((state) => ({
    userProfile: state.userProfile ? { ...state.userProfile, ...newData } : null
  })),
  
  setLoading: (loading) => set({ loading }),
  
  // Initialize listener
  initAuthListener: () => {
    return onAuthStateChanged(auth, async (user) => {
      set({ loading: true });
      
      if (user) {
        try {
          // Fetch the user's profile from Firestore
          const profile = await getUserProfile(user.uid);
          set({ 
            currentUser: user, 
            userProfile: profile,
            isAuthenticated: true,
            isAdmin: profile?.role === 'admin',
            loading: false
          });
          // Initialize cart for logged in user (fetches from Firestore)
          useCartStore.getState().initCart();
        } catch (error) {
          console.error("Failed to load user profile:", error);
          set({ 
            currentUser: user, 
            userProfile: null,
            isAuthenticated: true,
            isAdmin: false,
            loading: false
          });
          // Initialize cart for logged in user (fetches from Firestore)
          useCartStore.getState().initCart();
        }
      } else {
        // User is signed out
        set({ 
          currentUser: null, 
          userProfile: null,
          isAuthenticated: false,
          isAdmin: false,
          loading: false
        });
        // Initialize cart for guest (fetches from local storage)
        useCartStore.getState().initCart();
      }
    });
  }
}));

export default useAuthStore;
