import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "user";

export const useUserRole = (userId?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userRole", userId],
    queryFn: async () => {
      if (!userId) {
        return { role: "user" as UserRole, isAdmin: false };
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return { role: "user" as UserRole, isAdmin: false };
      }

      const userRole = data.role as UserRole;
      return { role: userRole, isAdmin: userRole === "admin" };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 1,
  });

  const role = data?.role || "user";
  const isAdmin = data?.isAdmin || false;

  return { role, isAdmin, loading: isLoading };
};
