import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useSupabase } from "../provider";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface ImpersonatedUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isOwner: boolean;
  isLoading: boolean;
  impersonatedUser: ImpersonatedUser | null;
  isImpersonating: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  startImpersonating: (user: ImpersonatedUser) => void;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  const startImpersonating = (targetUser: ImpersonatedUser) => {
    setImpersonatedUser(targetUser);
  };

  const stopImpersonating = () => {
    setImpersonatedUser(null);
  };

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[fetchProfile] START for user:', userId);
    try {
      console.log('[fetchProfile] Calling supabase.from(profiles)...');

      // Add abort controller with 8-second timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[fetchProfile] TIMEOUT - aborting query');
        abortController.abort();
      }, 8000);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .abortSignal(abortController.signal)
        .single();

      clearTimeout(timeoutId);

      console.log('[fetchProfile] Query returned, error:', !!error, 'data:', !!data);
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("[fetchProfile] EXCEPTION:", error);
      // Don't throw - allow auth to complete even if profile fetch fails
    }
    console.log('[fetchProfile] DONE');
  }, [supabase]);

  const checkUserRoles = useCallback(async (userId: string) => {
    console.log('[checkUserRoles] START for user:', userId);
    try {
      console.log('[checkUserRoles] Calling supabase.from(user_roles)...');

      // Add abort controller with 8-second timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[checkUserRoles] TIMEOUT - aborting query');
        abortController.abort();
      }, 8000);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "owner"])
        .abortSignal(abortController.signal);

      clearTimeout(timeoutId);

      console.log('[checkUserRoles] Query returned, error:', !!error, 'data:', !!data);

      if (!error && data) {
        const roles = data.map((r) => r.role);
        setIsOwner(roles.includes("owner"));
        setIsAdmin(roles.includes("admin") || roles.includes("owner"));
      } else {
        setIsOwner(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("[checkUserRoles] EXCEPTION:", error);
      // Don't throw - set to false and allow auth to complete
      setIsOwner(false);
      setIsAdmin(false);
    }
    console.log('[checkUserRoles] DONE');
  }, [supabase]);

  const trackLogin = useCallback(async (sessionId: string) => {
    const trackingKey = `login_tracked_${sessionId}`;
    if (sessionStorage.getItem(trackingKey)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("track-login", {
        body: { event_type: "login" },
      });

      if (!error) {
        sessionStorage.setItem(trackingKey, "true");
      }
    } catch (err) {
      console.error("Failed to track login:", err);
    }
  }, [supabase]);

  useEffect(() => {
    console.log('[useAuth] Effect running');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] onAuthStateChange:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[useAuth] Fetching profile/roles in background');
          // Fetch profile/roles in background - don't block auth loading state
          // Use Promise.race with timeout to ensure these don't hang forever
          const dataPromise = Promise.all([
            fetchProfile(session.user.id),
            checkUserRoles(session.user.id),
          ]);
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));

          Promise.race([dataPromise, timeoutPromise]).then(() => {
            console.log('[useAuth] Profile/roles fetched or timed out');
          });

          if (event === "SIGNED_IN" && session.access_token) {
            // Track login in background (don't await)
            trackLogin(session.access_token.slice(-16));
          }
        } else {
          console.log('[useAuth] No session, clearing state');
          setProfile(null);
          setIsAdmin(false);
          setIsOwner(false);
        }

        console.log('[useAuth] Setting isLoading=false');
        setIsLoading(false);
      }
    );

    // Initial session check with timeout only for data fetching
    const initializeAuth = async () => {
      console.log('[useAuth] initializeAuth START');
      try {
        // Get session without timeout (reads from localStorage - should be fast)
        console.log('[useAuth] Calling getSession...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[useAuth] getSession returned, has session:', !!session);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[useAuth] Fetching initial profile/roles with timeout');
          // Use Promise.race with timeout for profile/roles fetching
          // These make network requests which could hang
          const dataPromise = Promise.all([
            fetchProfile(session.user.id),
            checkUserRoles(session.user.id),
          ]);
          const dataTimeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));

          await Promise.race([dataPromise, dataTimeoutPromise]);
          console.log('[useAuth] Initial fetch completed/timed out');
        }
      } catch (error) {
        console.error("[useAuth] Init error:", error);
      } finally {
        console.log('[useAuth] Setting isLoading=false (finally)');
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('[useAuth] Cleanup');
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchProfile, checkUserRoles, trackLogin]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: displayName,
        },
      },
    });

    return { error };
  }, [supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  }, [supabase.auth]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    return { error };
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsOwner(false);
  }, [supabase.auth]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    return { error };
  }, [supabase.auth]);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }, [supabase.auth]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error };
  }, [user, supabase, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isOwner,
        isLoading,
        impersonatedUser,
        isImpersonating: impersonatedUser !== null,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
        startImpersonating,
        stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
