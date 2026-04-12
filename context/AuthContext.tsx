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
        id: session.user?.$id,
        email: session.user?.email || '',
        name: session.user?.name || '',
        role: (session.user?.labels?.[0] as Role) || 'Member',
        avatar: session.user?.prefs?.avatar || null
      });
    } else {
      log("Session: NULL (User not authenticated)");
      setUser(null);
    }
    setIsLoading(false);
  };

  const checkSession = async () => {
    log("Starting Session Handshake...");
    setIsLoading(true);
    
    // Check if we are landing from Auth
    const params = new URLSearchParams(window.location.search);
    if (params.has('userId') || params.has('secret')) {
      log(`Landed from OAuth: userId=${params.get('userId')?.substring(0, 5)}...`);
    }

    // Attempt 1: Immediate check
    log("Check 1/3: Requesting session from Appwrite...");
    let session = await db.getSession();
    
    // Attempt 2: Quick retry (1s) if first one fails
    if (!session) {
      log("Check 1/3: No session. Checking LS returnTo...");
      await new Promise(r => setTimeout(r, 1000));
      log("Check 2/3: Retrying after 1s delay...");
      session = await db.getSession();
    }
    
    // Attempt 3: Hardened handshake retry (2.5s) for slow cookie settlement
    if (!session) {
      log("Check 2/3: Still no session. Final attempt coming...");
      await new Promise(r => setTimeout(r, 1500));
      log("Check 3/3: Running final 2.5s fallback check...");
      session = await db.getSession();
    }

    if (session) {
      log("SUCCESS: Session Crystallized.");
    } else {
      log("FAILED: No session found after 3 attempts.");
    }
    
    handleSession(session);
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
    // Force debug mode for troubleshooting
    localStorage.setItem('auth_debug', 'true');
    log("App Initialized. Environment: " + window.location.hostname);
    
    checkSession();
    fetchTotalMembersCount();

    // Listen for real-time auth changes (login/logout from other tabs, etc.)
    const { unsubscribe } = db.onAuthStateChange((session) => {
      log("Real-time Auth Event detected.");
      handleSession(session);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    log("Login Triggered: Preparing flight path...");
    // Always save the current page so we can return after OAuth
    const currentPath = window.location.pathname + window.location.search;
    if (!localStorage.getItem('authReturnTo')) {
      // Strip the GitHub Pages base path for the router
      const cleanPath = currentPath.replace('/FFC-EX-aariasblueelephant.org', '') || '/';
      localStorage.setItem('authReturnTo', cleanPath);
      log(`Saved returnTo: ${cleanPath}`);
    }
    setIsLoading(true);
    log("Redirecting to Google OAuth...");
    await db.signInWithGoogle();
  };

  const logout = async () => {
    log("Logout Triggered.");
    await db.signOut();
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;
    log(`Profile Update: ${Object.keys(updates).join(', ')}`);

    if (updates.name) {
      await db.updateName(updates.name); // Corrected to use account.updateName
    }
    setUser({ ...user, ...updates });
  };

  const updateAvatar = (avatarUrl: string) => {
    updateProfile({ avatar: avatarUrl });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      loginWithGoogle, 
      logout, 
      updateProfile, 
      updateAvatar,
      isBoard, 
      isDonor, 
      totalMembers,
      authLogs,
      checkSession
    }}>
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