import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour la journalisation système
 * - Logging asynchrone non-bloquant
 * - Ne doit JAMAIS interrompre le flux d'authentification
 */
export const useSystemLogs = () => {
  /**
   * Log an action to system_logs table
   * This is fire-and-forget - errors are caught and logged but never thrown
   */
  const logAction = useCallback(async (
    action: string,
    details?: Record<string, any>
  ) => {
    try {
      // Get current session without triggering refresh
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from("system_logs").insert({
        user_id: session?.user?.id || null,
        action,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
        ip_address: null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
    } catch (error) {
      // Silent fail - logging should never break the app
      console.error("[SystemLogs] Error logging action:", error);
    }
  }, []);

  /**
   * Fetch system logs with pagination
   */
  const getSystemLogs = useCallback(async (limit = 100, offset = 0) => {
    try {
      const { data, error } = await supabase
        .from("system_logs")
        .select(`
          id,
          user_id,
          action,
          details,
          created_at,
          user_agent,
          ip_address,
          profiles:user_id (email, full_name)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[SystemLogs] Fetch error:", error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("[SystemLogs] Error fetching logs:", error);
      return [];
    }
  }, []);

  return { logAction, getSystemLogs };
};
