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

      // Aggressively search for Google Avatar, fallback to premium Appwrite Avatars Initials
      const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        rawUser.identities?.[0]?.identity_data?.avatar_url ||
        rawUser.identities?.[0]?.identity_data?.picture ||
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
    // [BEHIND THE SCENES] AUTH PERSISTENCE SHIELD
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const secret = urlParams.get('secret');

    // Only activate the shield if we arrived from Google in THIS instance
    const isArrivingFromAuth = userId && secret;

    if (isArrivingFromAuth) {
      console.info("[8:45:41 AM] SHIELD: Fresh OAuth Tokens detected. Activating Shield.");
      sessionStorage.setItem('abe_auth_arrival', 'true');
    }

    const checkSession = async () => {
      // 1. Check for 'Natural' Session (Cookies)
      let session = await db.getSession();
      
      const justArrived = sessionStorage.getItem('abe_auth_arrival') === 'true';
      
      if (!session && justArrived) {
        console.warn("[8:45:41 AM] SHIELD: Initial check failed. Forcing crystallization (2.5s)...");
        // Clear the flag so we don't keep retrying on every refresh
        sessionStorage.removeItem('abe_auth_arrival');
        
        await new Promise(r => setTimeout(r, 2500));
        session = await db.getSession();
        
        if (session) {
          console.info("[8:45:41 AM] SHIELD: Handshake Successful. Session Locked.");
        } else {
          console.error("[8:45:41 AM] SHIELD: Handshake Failed. Cookie block definitively suspected.");
        }
      } else {
        // Clean up the arrival flag if session was found normally or not needed
        sessionStorage.removeItem('abe_auth_arrival');
      }
      
      handleSession(session);
    };

    checkSession();
    fetchTotalMembersCount();

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