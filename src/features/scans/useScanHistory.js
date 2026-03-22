// src/features/scans/useScanHistory.js
import { useQuery } from "@tanstack/react-query";
import { scanApi } from "./scan.api";

export function useScanHistory(filters = {}) {
  return useQuery({
    queryKey: ["scans", filters], // separate cache per filter combo
    queryFn: () => scanApi.getScanHistory(filters),
    staleTime: 1000 * 30, // refresh scan data every 30s
  });
}
