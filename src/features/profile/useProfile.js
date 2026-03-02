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
