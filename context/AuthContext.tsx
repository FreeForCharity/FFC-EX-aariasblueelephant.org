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
      // 1. Start with metadata/default (lowest priority)
      let role: Role = (rawUser.role || metadata.role || metadata.role_name) as Role || 'User';
      
      // 2. Domain-based auto-promotion (Highest priority - ALWAYS WINS for our domain)
      if (normalizedEmail.endsWith('@aariasblueelephant.org')) {
        role = normalizedEmail === 'admin@aariasblueelephant.org' ? 'BoardMember.Owner' : 'BoardMember';
      }

      console.info(`[SENTRY] Identity Resolved: ${email} | Role: ${role}`);

      setUser({
        id: rawUser.$id || rawUser.id,
        email,
        name,
        role,
        avatar: avatarUrl
      });
    } else {
      console.info("[SENTRY] Guest Session Active (No User)");
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

  const [isHandshaking, setIsHandshaking] = useState(false);
  const [handshakeError, setHandshakeError] = useState<string | null>(null);

  useEffect(() => {
    // [BEHIND THE SCENES] FINAL SENTRY HANDOVER
    const arrivalFlag = sessionStorage.getItem('abe_auth_arrival') === 'true';
    const payloadJson = sessionStorage.getItem('abe_auth_payload');
    
    const checkSession = async () => {
      console.info("[8:45:41 AM] SENTRY: Handshake Starting...");
      
      // 1. Natural Check
      let session = await db.getSession();

      // [SWAP REDUCED] We are removing the aggressive flush to restore basic login first
      if (session && (arrivalFlag || payloadJson)) {
        console.info("[8:45:41 AM] SENTRY: Fresh tokens detected. Keeping existing session for stability.");
      }
      
      if (!session && (arrivalFlag || payloadJson)) {
        setIsHandshaking(true);
        console.warn("[8:45:41 AM] SENTRY: Handshake Delayed. Crystallizing (3 Tries)...");
        
        // Attempt 1 (1.5s)
        await new Promise(r => setTimeout(r, 1500));
        session = await db.getSession();
        
        if (!session) {
          console.warn("[8:45:41 AM] SENTRY: Handshake Retry 1 Failed. (3s Delay)...");
          await new Promise(r => setTimeout(r, 3000));
          session = await db.getSession();
        }
        
        if (!session) {
          console.warn("[8:45:41 AM] SENTRY: Handshake Retry 2 Failed. (5s Delay)...");
          await new Promise(r => setTimeout(r, 5000));
          session = await db.getSession();
        }
        
        if (!session) {
          console.error("[8:45:41 AM] SENTRY: Handshake Terminal Failure.");
          setHandshakeError("Browser rejected the session cookie. Please check if 3rd party cookies are blocked.");
        } else {
          console.info("[8:45:41 AM] SENTRY: Handshake Secured. Session Crystallized.");
        }
        
        setIsHandshaking(false);
      }
      
      // Cleanup
      sessionStorage.removeItem('abe_auth_arrival');
      sessionStorage.removeItem('abe_auth_payload');
      
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
      {/* FINAL SENTRY: Premium Crystallization Overlay */}

      {(isHandshaking || handshakeError) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a', // Brand Dark
          zIndex: 99998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif",
          color: 'white'
        }}>
          <div style={{ maxWidth: '440px' }}>
            {/* Elegant Brand Loader */}
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 40px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid rgba(14, 165, 233, 0.1)',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid transparent',
                borderTopColor: handshakeError ? '#ef4444' : '#0ea5e9',
                borderRadius: '50%',
                animation: handshakeError ? 'none' : 'spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }} />
              <div style={{
                position: 'absolute',
                inset: '15%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} alt="ABE" />
              </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              {handshakeError ? 'Handshake Blocked' : 'Securing the Herd...'}
            </h2>
            
            <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '17px', fontWeight: '500', marginBottom: '40px' }}>
              {handshakeError ? handshakeError : "Google has verified your identity. We are carefully aligning your session for maximum security."}
            </p>

            {handshakeError && (
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '16px 32px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '15px',
                  boxShadow: '0 10px 20px rgba(14, 165, 233, 0.3)'
                }}
              >
                Return Home
              </button>
            )}
          </div>
        </div>
      )}
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