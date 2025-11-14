import { supabase } from "@/integrations/supabase/client";

export const useSystemLogs = () => {
  const logAction = async (
    action: string,
    details?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any).from("system_logs").insert({
        user_id: user?.id,
        action,
        details,
        ip_address: null,
        user_agent: navigator.userAgent,
      });
      
      if (error) console.error("Error logging action:", error);
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  const getSystemLogs = async (limit = 100) => {
    try {
      const { data, error } = await (supabase as any)
        .from("system_logs")
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching system logs:", error);
      return [];
    }
  };

  return { logAction, getSystemLogs };
};
