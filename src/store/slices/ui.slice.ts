import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Define the UI slice state
interface UIState {
  currentView: 'mission' | 'artifacts';
  isLoadingData: boolean;
  activeTabs: Record<string, string>;
  modals: {
    settingsOpen: boolean;
    artifactDetailsOpen: boolean;
    confirmationOpen: boolean;
  };
  confirmation: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: (() => void) | null;
  };
  selectedArtifactId: string | null;
}

// Define the initial state
const initialState: UIState = {
  currentView: 'mission',
  isLoadingData: false,
  activeTabs: {},
  modals: {
    settingsOpen: false,
    artifactDetailsOpen: false,
    confirmationOpen: false,
  },
  confirmation: {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
  },
  selectedArtifactId: null,
};

// Create the UI slice
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Set current view
    setCurrentView: (state, action: PayloadAction<UIState['currentView']>) => {
      state.currentView = action.payload;
    },

    // Set loading state
    setLoadingData: (state, action: PayloadAction<boolean>) => {
      state.isLoadingData = action.payload;
    },

    // Set active tab for a specific section
    setActiveTab: (state, action: PayloadAction<{ section: string; tab: string }>) => {
      const { section, tab } = action.payload;
      state.activeTabs[section] = tab;
    },

    // Toggle a modal state
    toggleModal: (
      state,
      action: PayloadAction<{
        modal: keyof UIState['modals'];
        isOpen?: boolean;
      }>
    ) => {
      const { modal, isOpen } = action.payload;
      const currentValue = state.modals[modal];
      state.modals[modal] = isOpen !== undefined ? isOpen : !currentValue;
    },

    // Show confirmation modal
    showConfirmation: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
      }>
    ) => {
      const { title, message, confirmText, cancelText } = action.payload;
      state.confirmation.title = title;
      state.confirmation.message = message;

      if (confirmText) {
        state.confirmation.confirmText = confirmText;
      }

      if (cancelText) {
        state.confirmation.cancelText = cancelText;
      }

      state.modals.confirmationOpen = true;
      // onConfirm is handled separately since it's a function
    },

    // Hide confirmation modal
    hideConfirmation: (state) => {
      state.modals.confirmationOpen = false;
    },

    // Set selected artifact ID
    setSelectedArtifactId: (state, action: PayloadAction<string | null>) => {
      state.selectedArtifactId = action.payload;
    },
  },
});

// Export actions
export const {
  setCurrentView,
  setLoadingData,
  setActiveTab,
  toggleModal,
  showConfirmation,
  hideConfirmation,
  setSelectedArtifactId,
} = uiSlice.actions;

// Export selectors
export const selectCurrentView = (state: RootState) => state.ui?.currentView;
export const selectIsLoadingData = (state: RootState) => state.ui?.isLoadingData;
export const selectActiveTab = (section: string) => (state: RootState) =>
  state.ui?.activeTabs[section];
export const selectModalState = (modal: keyof UIState['modals']) => (state: RootState) =>
  state.ui?.modals[modal];
export const selectConfirmation = (state: RootState) => state.ui?.confirmation;
export const selectSelectedArtifactId = (state: RootState) => state.ui?.selectedArtifactId;

// Export the reducer
export default uiSlice.reducer;