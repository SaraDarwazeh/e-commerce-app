import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Toast State
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    // Auto remove after 3s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Confirm Modal State
  confirmConfig: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    isDestructive: false
  },
  showConfirm: (config) => set({
    confirmConfig: {
      isOpen: true,
      title: config.title || 'Confirm Action',
      message: config.message || 'Are you sure you want to proceed?',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      onConfirm: config.onConfirm || null,
      isDestructive: config.isDestructive || false
    }
  }),
  closeConfirm: () => set((state) => ({
    confirmConfig: { ...state.confirmConfig, isOpen: false, onConfirm: null }
  }))
}));

export default useUIStore;
