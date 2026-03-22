// useProfile.js — fixed
import {
  useActiveStudent,
  useCardVisibility,
  useEmergencyProfile,
  useProfileStore,
  useSchool,
  useToken,
} from "./profile.store";

export const useProfile = () => {
  const student = useActiveStudent();
  const school = useSchool();
  const token = useToken();
  const emergency = useEmergencyProfile();
  const cardVisibility = useCardVisibility();
  const isHydrated = useProfileStore((s) => s.isHydrated);
  const isFetching = useProfileStore((s) => s.isFetching);
  const students = useProfileStore((s) => s.students);
  const parent = useProfileStore((s) => s.parent);

  return {
    student,
    school,
    token,
    emergency,
    cardVisibility,
    students,
    parent,
    isHydrated,
    isFetching,
  };
};
