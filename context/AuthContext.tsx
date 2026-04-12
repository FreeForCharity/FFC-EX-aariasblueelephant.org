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
  authLogs: string[];
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to push logs safely with timestamping
  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const fullMsg = `[${time}] ${msg}`;
    console.log(`[AUTH] ${fullMsg}`);
    setAuthLogs(prev => [...prev.slice(-19), fullMsg]); // Keep last 20 logs
  };

  const [totalMembers, setTotalMembers] = useState<number>(42); // Default fallback

  const isBoard = user?.role?.startsWith('BoardMember') || false;
  const isDonor = user?.role === 'Donor' || false;

  const handleSession = async (session: any) => {
    if (session) {
      log(`STATUS: Active Session for ${session.user?.email || 'Authenticated User'}`);
      
      setUser({
        id: session.user?.$id,
        email: session.user?.email || '',
        name: session.user?.name || '',
        role: (session.user?.labels?.[0] as Role) || 'Member',
        avatar: session.user?.prefs?.avatar || null
      });
    } else {
      log("STATUS: Guest Mode (No session found)");
      setUser(null);
    }
    setIsLoading(false);
  };

  const checkSession = async () => {
    log(`INITIALIZING: Handshake starting...`);
    log(`PROJECT ID: ABE-Website-2024`);
    log(`BRAWSER URL: ${window.location.href}`);
    setIsLoading(true);
    
    // Check Search Params
    const params = new URLSearchParams(window.location.search);
    if (params.size > 0) {
      log(`DETECTED SEARCH: ${window.location.search}`);
    } else {
      log("DETECTED SEARCH: NONE");
    }

    // Check Hash Params (Implicit Flow or SPA redirection)
    if (window.location.hash) {
      log(`DETECTED HASH: ${window.location.hash}`);
    } else {
      log("DETECTED HASH: NONE");
    }

    // Attempt 1: Immediate check
    log("CHECK 1/3: Requesting current session...");
    let session = await db.getSession();
    
    // Attempt 2: Quick retry (1s) if first one fails
    if (!session) {
      log("CHECK 1/3: No session. Waiting 1s to allow cookie settlement...");
      await new Promise(r => setTimeout(r, 1000));
      log("CHECK 2/3: Retrying session handshake...");
      session = await db.getSession();
    }
    
    // Attempt 3: Hardened handshake retry (2.5s) for slow cookie settlement
    if (!session) {
      log("CHECK 2/3: Still no session. Waiting another 1.5s...");
      await new Promise(r => setTimeout(r, 1500));
      log("CHECK 3/3: Running final session fallback check...");
      session = await db.getSession();
    }

    if (session) {
      log("RESULT: Session Crystallized successfully.");
    } else {
      log("RESULT: All attempts failed tracking. Redirect URI or Domain mismatch likely.");
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
    localStorage.setItem('auth_debug', 'true');
    log("App Initialized. Environment: " + window.location.hostname);
    
    // Quick Storage Health Check
    try {
      const testKey = 'auth_test_' + Date.now();
      localStorage.setItem(testKey, 'working');
      if (localStorage.getItem(testKey) === 'working') {
        log("STORAGE: LocalStorage Access OK.");
        localStorage.removeItem(testKey);
      } else {
        log("STORAGE: LocalStorage write failed (unrecognized error).");
      }
    } catch (e) {
      log("STORAGE: LocalStorage BLOCKED (likely Private Mode or full).");
    }
    
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
    const currentPath = window.location.pathname + window.location.search;
    if (!localStorage.getItem('authReturnTo')) {
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
      await db.updateUser({ full_name: updates.name });
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