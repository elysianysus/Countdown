import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useHolidays(enabled: boolean = true) {
  return useQuery({
    queryKey: [api.holidays.list.path],
    queryFn: async () => {
      const res = await fetch(api.holidays.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 500) {
          const error = api.holidays.list.responses[500].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to fetch holidays");
      }
      return api.holidays.list.responses[200].parse(await res.json());
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours to prevent spamming
  });
}
