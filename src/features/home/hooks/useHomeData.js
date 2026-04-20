// src/features/home/hooks/useHomeData.js
import { useProfileStore } from "@/features/profile/profile.store";
import { useEffect, useState } from "react";

export function useHomeData() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    students,
    activeStudentId,
    setActiveStudent,
    fetchAndPersist,
    lastScan,
    scanCount,
  } = useProfileStore();

  const activeStudent =
    students?.find((s) => s.id === activeStudentId) || students?.[0] || null;
  const token = activeStudent?.token || null;
  const emergency = activeStudent?.emergency || null;
  const contacts = emergency?.contacts || [];

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchAndPersist();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAndPersist();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    loading,
    refreshing,
    students,
    activeStudent,
    activeStudentId,
    token,
    emergency,
    contacts,
    lastScan,
    scanCount,
    setActiveStudent,
    onRefresh,
  };
}
