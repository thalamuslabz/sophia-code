import { describe, it, expect } from 'vitest';
import {
  uiSlice,
  setCurrentView,
  setLoadingData,
  setActiveTab,
  toggleModal,
  showConfirmation,
  hideConfirmation,
  setSelectedArtifactId
} from './ui.slice';

describe('UI Slice', () => {
  const initialState = {
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

  it('should handle initial state', () => {
    expect(uiSlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCurrentView', () => {
    const actual = uiSlice.reducer(initialState, setCurrentView('artifacts'));
    expect(actual.currentView).toEqual('artifacts');
  });

  it('should handle setLoadingData', () => {
    const actual = uiSlice.reducer(initialState, setLoadingData(true));
    expect(actual.isLoadingData).toEqual(true);
  });

  it('should handle setActiveTab', () => {
    // Set initial tab
    let state = uiSlice.reducer(
      initialState,
      setActiveTab({ section: 'settings', tab: 'general' })
    );
    expect(state.activeTabs).toEqual({ settings: 'general' });

    // Add another tab
    state = uiSlice.reducer(
      state,
      setActiveTab({ section: 'artifacts', tab: 'recent' })
    );
    expect(state.activeTabs).toEqual({ settings: 'general', artifacts: 'recent' });

    // Change existing tab
    state = uiSlice.reducer(
      state,
      setActiveTab({ section: 'settings', tab: 'advanced' })
    );
    expect(state.activeTabs).toEqual({ settings: 'advanced', artifacts: 'recent' });
  });

  it('should handle toggleModal with default behavior', () => {
    // Toggle settings modal on (defaults to inverting current state)
    let state = uiSlice.reducer(
      initialState,
      toggleModal({ modal: 'settingsOpen' })
    );
    expect(state.modals.settingsOpen).toEqual(true);

    // Toggle again to turn off
    state = uiSlice.reducer(
      state,
      toggleModal({ modal: 'settingsOpen' })
    );
    expect(state.modals.settingsOpen).toEqual(false);
  });

  it('should handle toggleModal with explicit value', () => {
    // Set to true explicitly
    let state = uiSlice.reducer(
      initialState,
      toggleModal({ modal: 'artifactDetailsOpen', isOpen: true })
    );
    expect(state.modals.artifactDetailsOpen).toEqual(true);

    // Set to true again (no change)
    state = uiSlice.reducer(
      state,
      toggleModal({ modal: 'artifactDetailsOpen', isOpen: true })
    );
    expect(state.modals.artifactDetailsOpen).toEqual(true);

    // Set to false explicitly
    state = uiSlice.reducer(
      state,
      toggleModal({ modal: 'artifactDetailsOpen', isOpen: false })
    );
    expect(state.modals.artifactDetailsOpen).toEqual(false);
  });

  it('should handle showConfirmation', () => {
    const confirmationData = {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const state = uiSlice.reducer(initialState, showConfirmation(confirmationData));

    expect(state.confirmation).toEqual({
      ...confirmationData,
      onConfirm: null
    });
    expect(state.modals.confirmationOpen).toEqual(true);
  });

  it('should handle hideConfirmation', () => {
    // Setup state with open confirmation
    const state = {
      ...initialState,
      modals: {
        ...initialState.modals,
        confirmationOpen: true
      }
    };

    const actual = uiSlice.reducer(state, hideConfirmation());
    expect(actual.modals.confirmationOpen).toEqual(false);
  });

  it('should handle setSelectedArtifactId', () => {
    let state = uiSlice.reducer(initialState, setSelectedArtifactId('artifact-123'));
    expect(state.selectedArtifactId).toEqual('artifact-123');

    state = uiSlice.reducer(state, setSelectedArtifactId(null));
    expect(state.selectedArtifactId).toBeNull();
  });
});