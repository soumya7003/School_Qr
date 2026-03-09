<<<<<<< HEAD
// src/features/profile/useProfile.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "./profile.api";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
    // While offline → serves cached data automatically
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateProfile,

    // Optimistic update — UI changes instantly, no spinner
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: ["profile"] });
      const previous = qc.getQueryData(["profile"]);
      qc.setQueryData(["profile"], (old) => ({ ...old, ...newData }));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      // Server rejected → roll back
      qc.setQueryData(["profile"], ctx.previous);
    },
    onSettled: () => {
      // Always sync with server after mutation
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
=======
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
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
