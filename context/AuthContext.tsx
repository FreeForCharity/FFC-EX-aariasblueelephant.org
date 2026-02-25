import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  isLoading: boolean;
  totalMembers: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [totalMembers, setTotalMembers] = useState<number>(42); // Default fallback

  // Derive User and RBAC state directly from Supabase session
  const handleSession = async (session: any) => {
    if (session?.user) {
      const email = session.user.email || '';
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];

      // Aggressively search for Google Avatar across standard Google Provider locations
      const avatarUrl =
        session.user.user_metadata?.avatar_url ||
        session.user.user_metadata?.picture ||
        session.user.identities?.[0]?.identity_data?.avatar_url ||
        session.user.identities?.[0]?.identity_data?.picture ||
        session.user.user_metadata?.custom_claims?.picture;

      let role: Role = 'User';
      if (email === 'admin@aariasblueelephant.org') {
        role = 'BoardMember.Owner';
      } else if (email.endsWith('@aariasblueelephant.org')) {
        role = 'BoardMember';
      }

      setUser({
        email,
        name,
        role,
        avatar: avatarUrl
      });

      const returnTo = localStorage.getItem('authReturnTo');
      if (returnTo) {
        localStorage.removeItem('authReturnTo');
        setTimeout(() => {
          window.location.hash = returnTo;
        }, 100);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  const fetchTotalMembersCount = async () => {
    try {
      // Attempt to count users from a public profiles table (standard pattern for tracking signups)
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (error) {
        console.error('Supabase fetch error for total network:', error.message, error.details);
      } else if (count !== null) {
        setTotalMembers(count);
      }
    } catch (e: any) {
      // Network unavailable — silently use default fallback count
    }
  };

  useEffect(() => {
    // Check active sessions immediately on init
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Fetch initial platform stats on load
    fetchTotalMembersCount();

    // Listen for changes on auth state via callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    let redirectUrl = window.location.origin;
    if (window.location.hostname.includes('github.io')) {
      redirectUrl += '/FFC-EX-aariasblueelephant.org/';
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    // Attempt real database metadata update (if extended to Postgres). For now, local merge overlay.
    // In Supabase, you would theoretically update `auth.users` metadata:
    if (updates.name) {
      await supabase.auth.updateUser({ data: { full_name: updates.name } });
    }

    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, updateProfile, isLoading, totalMembers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};