import { useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

/**
 * Hook d'authentification robuste avec protection contre les déconnexions intempestives.
 * - Gestion sécurisée du refresh token
 * - Protection contre les race conditions
 * - Logging asynchrone différé pour éviter les deadlocks
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const sessionCheckInProgressRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Set up auth state listener FIRST - critical order
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mountedRef.current) return;
        
        // Only update if session actually changed to avoid unnecessary re-renders
        setSession((prev) => {
          if (prev?.access_token === currentSession?.access_token) return prev;
          return currentSession;
        });
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Defer logging to avoid Supabase deadlock - use setTimeout(0)
        if (event === "SIGNED_IN" && currentSession?.user) {
          setTimeout(() => {
            logAuthEvent("user_signed_in", currentSession.user.id);
          }, 0);
        } else if (event === "SIGNED_OUT") {
          setTimeout(() => {
            logAuthEvent("user_signed_out");
          }, 0);
        } else if (event === "TOKEN_REFRESHED") {
          console.log("[Auth] Token refreshed successfully");
        }
      }
    );

    // THEN check for existing session - don't cause race condition
    const initSession = async () => {
      if (sessionCheckInProgressRef.current) return;
      sessionCheckInProgressRef.current = true;

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] Session retrieval error:", error);
        }
        
        if (mountedRef.current) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("[Auth] Unexpected session error:", error);
        if (mountedRef.current) {
          setLoading(false);
        }
      } finally {
        sessionCheckInProgressRef.current = false;
      }
    };

    initSession();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Async logging function - separate from auth flow to prevent deadlocks
  const logAuthEvent = async (action: string, userId?: string) => {
    try {
      await supabase.from("system_logs").insert({
        user_id: userId || null,
        action,
        details: { timestamp: new Date().toISOString() },
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      // Silent fail - logging should never break auth
      console.error("[Auth] Log error (non-critical):", error);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error: any) {
      console.error("[Auth] Sign in error:", error);
      return { data: null, error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error: any) {
      console.error("[Auth] Sign up error:", error);
      return { data: null, error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear local state first for immediate UI feedback
      setUser(null);
      setSession(null);
      
      // Then perform actual sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[Auth] Sign out error:", error);
      }
      
      navigate("/auth");
    } catch (error) {
      console.error("[Auth] Sign out error:", error);
      navigate("/auth");
    }
  }, [navigate]);

  // Utility: check if session is valid without triggering refresh
  const isSessionValid = useCallback(() => {
    if (!session) return false;
    const expiresAt = session.expires_at;
    if (!expiresAt) return true;
    // Add 60 second buffer
    return Date.now() < (expiresAt * 1000) - 60000;
  }, [session]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isSessionValid,
  };
};
