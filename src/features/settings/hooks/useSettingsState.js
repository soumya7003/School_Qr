import { useState } from 'react';

export function useSettingsState() {
  const [uiState, setUiState] = useState({
    removeModalVisible: false,
    childToRemove: null,
  });

  const openRemoveModal = (child) => setUiState({ removeModalVisible: true, childToRemove: child });
  const closeRemoveModal = () => setUiState({ removeModalVisible: false, childToRemove: null });

  return { uiState, openRemoveModal, closeRemoveModal };
}