// src/features/profile/hooks/useContactManagement.js
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

export function useContactManagement(initialContacts = []) {
  const [contacts, setContacts] = useState(initialContacts);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // ✅ Track whether we've seeded from real data yet.
  // useState(initialContacts) only runs on first mount — if the store was still
  // hydrating at that point, initialContacts was [] and the real contacts never
  // appeared. This ref lets us re-seed exactly once when the real data arrives.
  const seededRef = useRef(initialContacts.length > 0);

  useEffect(() => {
    if (!seededRef.current && initialContacts.length > 0) {
      setContacts(initialContacts);
      seededRef.current = true;
    }
  }, [initialContacts]);

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
