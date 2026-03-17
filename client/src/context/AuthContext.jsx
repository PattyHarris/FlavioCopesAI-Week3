import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

async function ensureInvitationsClaimed() {
  const { error } = await supabase.rpc("claim_email_invitations");
  if (error && error.code !== "PGRST202") {
    throw error;
  }
}

async function loadProfileRecord(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function hydrateProfile(nextSession) {
      if (!nextSession?.user) {
        if (isMounted) {
          setProfile(null);
          setAuthError("");
        }
        return;
      }

      setSession(nextSession);

      try {
        const profileData = await loadProfileRecord(nextSession.user.id);

        if (isMounted) {
          setProfile(profileData);
          setAuthError("");
        }
      } catch (error) {
        if (isMounted) {
          setProfile(null);
          setAuthError(error.message || "Unable to load your account.");
        }
      }
    }

    async function initialize() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setSession(initialSession);
        setIsLoading(false);

        if (initialSession?.user) {
          void hydrateProfile(initialSession);
          void ensureInvitationsClaimed()
            .then(() => hydrateProfile(initialSession))
            .catch((error) => {
              if (isMounted) {
                setAuthError(error.message || "Unable to sync invitations.");
              }
            });
        } else {
          setProfile(null);
          setAuthError("");
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(error.message || "Unable to start authentication.");
          setIsLoading(false);
        }
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setIsLoading(false);

      if (nextSession?.user) {
        void hydrateProfile(nextSession);
        void ensureInvitationsClaimed()
          .then(() => hydrateProfile(nextSession))
          .catch((error) => {
            if (isMounted) {
              setAuthError(error.message || "Unable to sync invitations.");
            }
          });
      } else {
        setProfile(null);
        setAuthError("");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void ensureInvitationsClaimed().catch((error) => {
        setAuthError(error.message || "Unable to sync invitations.");
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [session]);

  async function signUp({ displayName, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        authError,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
