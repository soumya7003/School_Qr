// src/features/profile/hooks/useContactManagement.js
import { useState } from "react";
import { Alert } from "react-native";

export function useContactManagement(initialContacts = []) {
  const [contacts, setContacts] = useState(initialContacts);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      setContacts((p) =>
        p.map((c) => (c.id === editingContact.id ? { ...c, ...data } : c)),
      );
    } else {
      setContacts((p) => [
        ...p,
        {
          id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ...data,
          priority: p.length + 1,
          is_active: true,
        },
      ]);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      "Remove Contact",
      `Remove ${contact.name} from emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            setContacts((p) =>
              p
                .filter((c) => c.id !== contact.id)
                .map((c, i) => ({ ...c, priority: i + 1 })),
            ),
        },
      ],
    );
  };

  const openAddModal = () => {
    setEditingContact(null);
    setModalVisible(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setModalVisible(true);
  };

  return {
    contacts,
    setContacts,
    modalVisible,
    setModalVisible,
    editingContact,
    handleSaveContact,
    handleDeleteContact,
    openAddModal,
    openEditModal,
  };
}
