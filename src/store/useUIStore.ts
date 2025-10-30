/**
 * UI Store - Global UI State Management
 * Handles modals, sidebars, notifications, and other UI-related state
 */

import { create } from 'zustand';

interface UIStore {
  // Modal state
  isModalOpen: boolean;
  modalContent: string | null;
  openModal: (content: string) => void;
  closeModal: () => void;

  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Modal state
  isModalOpen: false,
  modalContent: null,
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  // Sidebar state
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // Loading state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

/**
 * Usage Examples:
 *
 * // Component-level usage
 * const { isModalOpen, openModal, closeModal } = useUIStore();
 *
 * // Optimized - only subscribes to specific state
 * const isModalOpen = useUIStore((state) => state.isModalOpen);
 * const openModal = useUIStore((state) => state.openModal);
 *
 * // Use in effects
 * useEffect(() => {
 *   useUIStore.getState().setLoading(true);
 *   // ... async work
 *   useUIStore.getState().setLoading(false);
 * }, []);
 */
