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
      const rawUser = session.user || session;
      const metadata = session?.providerAccessTokenMetadata || session?.meta || rawUser.user_metadata || rawUser.prefs || {};
      const email = rawUser.email || metadata.email || "";
      
      // Name resolution: Prioritize Appwrite's native name (populated by Google OAuth)
      const name = rawUser.name || metadata.full_name || email.split('@')[0];

      // Aggressively search for Google Avatar across all possible Appwrite/Google metadata paths
      const avatarUrl =
        rawUser.identities?.[0]?.identity_data?.picture ||
        rawUser.identities?.[0]?.identity_data?.avatar_url ||
        metadata.picture ||
        metadata.avatar_url ||
        rawUser.prefs?.picture ||
        rawUser.prefs?.avatar_url ||
        db.getUserAvatar(name);

      const normalizedEmail = (email || '').toLowerCase().trim();
      let role: Role = (rawUser.role || metadata.role || metadata.role_name) as Role || 'User';
      
      if (normalizedEmail.endsWith('@aariasblueelephant.org')) {
        role = normalizedEmail === 'admin@aariasblueelephant.org' ? 'BoardMember.Owner' : 'BoardMember';
      }

      console.info(`%c [IDENTITY] Resolved: ${email} | Role: ${role} | Image: ${avatarUrl ? 'YES' : 'NO'} `, 'background: #0ea5e9; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;');

      setUser({
        id: rawUser.$id || rawUser.id,
        email,
        name,
        role,
        isBoard: role === 'BoardMember' || role === 'BoardMember.Owner',
        avatar: avatarUrl
      });
    } else {
      console.info("%c [IDENTITY] Guest Session Active (No User Detected) ", 'background: #64748b; color: white; padding: 2px 5px; border-radius: 3px;');
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
  const [showManualOverride, setShowManualOverride] = useState(false);

  useEffect(() => {
    // [BEHIND THE SCENES] FINAL SENTRY HANDOVER
    const arrivalFlag = sessionStorage.getItem('abe_auth_arrival') === 'true';
    const payloadJson = sessionStorage.getItem('abe_auth_payload');
    
    const checkSession = async (retryCount = 0) => {
      console.info("[SENTRY] Handshake Starting...");

      // 1. NATURAL CHECK: Provider handles cookies AND token→session conversion
      //    IMPORTANT: Do NOT inject JWT before this — expired JWTs poison the client
      let session = null;
      try {
        session = await db.getSession();
        if (session) console.info("[SENTRY] Session Check: Complete.");
      } catch (e) {
        console.error("%c [SENTRY] Handshake Buffer Error: ", 'background: #ef4444; color: white;', e);
      }

      // 2. JWT FALLBACK: If native session failed, try stored passport as last resort
      if (!session) {
        const storedJwt = localStorage.getItem('abe_jwt');
        if (storedJwt) {
          console.info("%c [PASSPORT] No native session. Attempting JWT recovery... ", 'background: #f59e0b; color: white; border-radius: 3px;');
          db.setJWT(storedJwt);
          try {
            session = await db.getSession();
            if (session) {
              console.info("%c [PASSPORT] Session recovered via JWT! ", 'background: #10b981; color: white; font-weight: bold; border-radius: 3px;');
            }
          } catch (e) {
            // JWT also failed
          }
          if (!session) {
            // JWT was expired/invalid — clear it to prevent poisoning future requests
            console.warn("[PASSPORT] JWT expired or invalid. Clearing passport vault.");
            localStorage.removeItem('abe_jwt');
            db.setJWT(null);
          }
        }
      }

      // 3. PASSPORT SEAL: If session exists but no JWT stored, create one for future resilience
      if (session && !localStorage.getItem('abe_jwt')) {
        try {
          const newJwt = await db.createJWT();
          if (newJwt) {
            localStorage.setItem('abe_jwt', newJwt);
            console.info("%c [PASSPORT] Passport Secured. ", 'background: #10b981; color: white; font-weight: bold; border-radius: 3px;');
          }
        } catch (e) {
          // Non-critical — session works without JWT
        }
      }

      // 4. CRYSTALLIZATION RETRY: If we just arrived from OAuth but session isn't ready
      const arrivalFlag = sessionStorage.getItem('abe_auth_arrival') === 'true';

      if (!session && arrivalFlag) {
        setIsHandshaking(true);
        console.warn(`%c [SENTRY] Handshake Delayed. Crystallizing (Attempt ${retryCount + 1})... `, 'color: #f59e0b; font-weight: bold;');

        if (retryCount > 2) {
          setShowManualOverride(true);
        }

        if (retryCount < 5) {
          await new Promise(r => setTimeout(r, 1500));
          checkSession(retryCount + 1);
          return;
        } else {
          console.error("[SENTRY] Handshake Terminal Failure.");
          setHandshakeError("Session could not be established. Please try refreshing or check cookie settings.");
          setIsHandshaking(false);
          setIsLoading(false);
          sessionStorage.removeItem('abe_auth_arrival');
          return;
        }
      }

      // Cleanup arrival flags
      sessionStorage.removeItem('abe_auth_arrival');
      sessionStorage.removeItem('abe_auth_payload');
      setShowManualOverride(false);

      handleSession(session);
      setIsHandshaking(false);
    };

    checkSession();
    fetchTotalMembersCount();

    const { unsubscribe } = db.onAuthStateChange((session) => {
      console.info("%c [IDENTITY] Auth State Changed (Event Received) ", 'background: #8b5cf6; color: white; padding: 2px 5px; border-radius: 3px;');
      handleSession(session);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    await db.signInWithGoogle();
  };

  const logout = async () => {
    console.info("[PASSPORT] Revoking Passport & Signing Out...");
    
    // Hard Nuke: Clear every single bit of local storage to prevent session survival
    localStorage.clear();
    sessionStorage.clear();
    
    db.setJWT(null);
    try {
      await db.signOut();
    } catch (e) {
      console.warn("[PASSPORT] Database signout failed, forcing local clear.");
    }
    // Hard reset to clear all React state and memory
    window.location.href = '/';
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

  // DIAGNOSTICS: Global Debug Hook (for Browser Console)
  if (typeof window !== 'undefined') {
    (window as any).ABE_DEBUG = {
      user,
      isBoard,
      isDonor,
      hasPassport: !!localStorage.getItem('abe_jwt'),
      isIncognito: !navigator.cookieEnabled, // Simple check
      forceRefresh: () => window.location.reload(),
      clearAuth: () => {
         localStorage.removeItem('abe_jwt');
         sessionStorage.clear();
         window.location.href = '/';
      }
    };
  }

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

            {showManualOverride && !handshakeError && (
              <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Handshake taking longer than expected...</p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    color: '#0ea5e9',
                    border: '1px solid #0ea5e9',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  Force Crystallize Session
                </button>
              </div>
            )}

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