import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "user";

export const useUserRole = (userId?: string) => {
  const [role, setRole] = useState<UserRole>("user");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (error || !data) {
          setRole("user");
          setIsAdmin(false);
        } else {
          const userRole = data.role as UserRole;
          setRole(userRole);
          setIsAdmin(userRole === "admin");
        }
      } catch (error) {
        setRole("user");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  return { role, isAdmin, loading };
};
