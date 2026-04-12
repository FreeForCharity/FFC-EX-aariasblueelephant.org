'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser, Role } from '../types';
import { db } from '../lib/database';

interface AuthContextType {
  user: AppUser | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => void;
  updateAvatar: (avatarUrl: string) => void;
  isLoading: boolean;
  isBoard: boolean;
  isDonor: boolean;
  totalMembers: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [totalMembers, setTotalMembers] = useState<number>(42); // Default fallback

  const isBoard = user?.role?.startsWith('BoardMember') || false;
  const isDonor = user?.role === 'Donor' || false;

  // Derive User and RBAC state directly from Database session
  const handleSession = async (session: any) => {
    if (session) {
      // Normalize user data from either Supabase (session.user) or Appwrite (session directly or separate user object)
      const rawUser = session.user || session; 
      const email = rawUser.email || '';
      
      // User metadata mapping
      const metadata = rawUser.user_metadata || rawUser.prefs || {};
      
      // Prioritize Appwrite's native name (populated by Google OAuth)
      const name = rawUser.name || metadata.full_name || email.split('@')[0];

      // Appwrite 1.5+ Identity Discovery (Deep hunt for Google Photo)
      const googleIdentity = (rawUser.identities || []).find((id: any) => id.provider === 'google' || id.provider === 'oidc');
      const googlePhoto = googleIdentity?.identityData?.picture || googleIdentity?.identityData?.avatar_url;

      // Aggressively search for Google Avatar, now with direct Appwrite identity support
      const avatarUrl =
        googlePhoto ||
        metadata.avatar_url ||
        metadata.picture ||
        rawUser.identities?.[0]?.identityData?.avatar_url ||
        rawUser.identities?.[0]?.identityData?.picture ||
        metadata.custom_claims?.picture || 
        db.getUserAvatar(name);

      const normalizedEmail = (email || '').toLowerCase().trim();
      let role: Role = 'User';
      
      // Email-based auto-promotion
      if (normalizedEmail.endsWith('@aariasblueelephant.org')) {
        role = normalizedEmail === 'admin@aariasblueelephant.org' ? 'BoardMember.Owner' : 'BoardMember';
      }
      
      // Metadata/Prefs-based override (Appwrite standard)
      const explicitRole = rawUser.role || metadata.role || metadata.role_name;
      if (explicitRole) role = explicitRole as Role;

      setUser({
        id: rawUser.$id || rawUser.id,
        email,
        name,
        role,
        avatar: avatarUrl
      });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  const fetchTotalMembersCount = async () => {
    try {
      const count = await db.getUserCount();
      setTotalMembers(count);
    } catch (e: any) {
      // Network unavailable — silently use default fallback count
    }
  };

  useEffect(() => {
    // Check active sessions with a 'Patient Handshake' for OAuth reliability
    const checkSession = async () => {
      let session = await db.getSession();
      
      // If we land back from Google but no session is detected yet, 
      // be patient (up to 1s) to allow cookies to settle.
      const isLandingFromAuth = window.location.search.includes('userId') || window.location.search.includes('secret');
      
      if (!session && isLandingFromAuth) {
        await new Promise(r => setTimeout(r, 1500)); // Wait for cookie crystallization
        session = await db.getSession();
      }
      
      handleSession(session);
    };

    checkSession();

    // Fetch initial platform stats on load
    fetchTotalMembersCount();

    // Listen for changes on auth state via callback
    const { unsubscribe } = db.onAuthStateChange((session) => {
      handleSession(session);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    await db.signInWithGoogle();
  };

  const logout = async () => {
    await db.signOut();
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;

    if (updates.name) {
      await db.updateUser({ full_name: updates.name });
    }

    setUser({ ...user, ...updates });
  };

  const updateAvatar = (avatarUrl: string) => {
    updateProfile({ avatar: avatarUrl });
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, updateProfile, updateAvatar, isLoading, isBoard, isDonor, totalMembers }}>
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