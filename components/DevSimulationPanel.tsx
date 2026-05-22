import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';

export const DevSimulationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [currentRole, setCurrentRole] = useState('guest');
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    // Check if simulation is enabled
    const simEnabled = localStorage.getItem('abe_use_simulation') === 'true';
    setUseSimulation(simEnabled);

    // Get current simulated user
    const checkUser = () => {
      const sessionStr = localStorage.getItem('abe_sim_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          const email = session?.user?.email || '';
          setCurrentEmail(email);
          if (email === 'headcoach@aariasblueelephant.org') {
            setCurrentRole('head_coach');
          } else if (email === 'sub1@gmail.com') {
            setCurrentRole('sub_coach_1');
          } else if (email === 'sub2@gmail.com') {
            setCurrentRole('sub_coach_2');
          } else if (email === 'admin@aariasblueelephant.org') {
            setCurrentRole('admin');
          } else {
            setCurrentRole('custom');
          }
        } catch {
          setCurrentRole('guest');
          setCurrentEmail('');
        }
      } else {
        setCurrentRole('guest');
        setCurrentEmail('');
      }
    };

    checkUser();

    // Listen for mock auth changes to keep UI in sync
    window.addEventListener('abe_sim_auth_change', checkUser);
    return () => {
      window.removeEventListener('abe_sim_auth_change', checkUser);
    };
  }, []);

  const toggleSimulation = () => {
    const nextVal = !useSimulation;
    setUseSimulation(nextVal);
    localStorage.setItem('abe_use_simulation', nextVal ? 'true' : 'false');
    // If turning on simulation, set a default session (Head Coach) if none exists
    if (nextVal && !localStorage.getItem('abe_sim_session')) {
      switchSession('head_coach');
    }
    // Reload page to reinitialize the DB provider
    window.location.reload();
  };

  const switchSession = (role: string) => {
    if (role === 'guest') {
      localStorage.removeItem('abe_sim_session');
      setCurrentRole('guest');
      setCurrentEmail('');
      window.dispatchEvent(new CustomEvent('abe_sim_auth_change', { detail: null }));
    } else {
      let email = '';
      let name = '';
      let id = '';

      if (role === 'head_coach') {
        email = 'headcoach@aariasblueelephant.org';
        name = 'Jane Headcoach';
        id = 'hc-user-id';
      } else if (role === 'sub_coach_1') {
        email = 'sub1@gmail.com';
        name = 'Sarah Co-parent';
        id = 'sub1-user-id';
      } else if (role === 'sub_coach_2') {
        email = 'sub2@gmail.com';
        name = 'David Partner';
        id = 'sub2-user-id';
      } else if (role === 'admin') {
        email = 'admin@aariasblueelephant.org';
        name = 'Board Administrator';
        id = 'admin-user-id';
      }

      const mockSession = {
        user: {
          id,
          email,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            full_name: name,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00AEEF&color=fff`
          }
        }
      };
      
      localStorage.setItem('abe_sim_session', JSON.stringify(mockSession));
      setCurrentRole(role);
      setCurrentEmail(email);
      window.dispatchEvent(new CustomEvent('abe_sim_auth_change', { detail: mockSession }));
    }
  };

  const resetSimData = () => {
    if (window.confirm('Reset all mock database tables (teams, sub-coaches, students, check-ins)?')) {
      localStorage.removeItem('abe_sim_teams');
      localStorage.removeItem('abe_sim_sub_coaches');
      localStorage.removeItem('abe_sim_students');
      localStorage.removeItem('abe_sim_check_ins');
      window.location.reload();
    }
  };

  // Only render on localhost/local network or if explicitly allowed for testing
  const isLocal = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    localStorage.getItem('abe_show_dev_panel') === 'true';

  if (!isLocal) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans antialiased">
      {isOpen ? (
        <div className="w-80 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md bg-opacity-95 transition-all duration-300">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></span>
              <h3 className="font-semibold text-sm tracking-wide text-yellow-300">Developer Simulation Panel</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-100 text-xs px-2 py-1 rounded hover:bg-slate-700 transition"
            >
              Hide
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Database Switcher */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database Mode</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={toggleSimulation}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition ${
                    useSimulation 
                      ? 'bg-amber-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Local Sim
                </button>
                <button
                  onClick={toggleSimulation}
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition ${
                    !useSimulation 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Supabase Real
                </button>
              </div>
            </div>

            {/* Simulated Roles */}
            {useSimulation ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Role</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'guest', label: 'Guest (Signed Out)' },
                    { id: 'head_coach', label: 'Head Coach' },
                    { id: 'sub_coach_1', label: 'Sub-Coach 1' },
                    { id: 'sub_coach_2', label: 'Sub-Coach 2' },
                    { id: 'admin', label: 'Admin User' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => switchSession(role.id)}
                      className={`text-left text-xs p-2 rounded-lg border transition ${
                        currentRole === role.id 
                          ? 'bg-indigo-650 border-indigo-500 text-white font-semibold' 
                          : 'bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-800'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
                
                {/* Active user details */}
                <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Simulated User:</span>
                    <span className="font-mono text-emerald-400">{currentRole.toUpperCase()}</span>
                  </div>
                  {currentEmail && (
                    <div className="flex justify-between mt-1">
                      <span>Email:</span>
                      <span className="font-mono text-indigo-300">{currentEmail}</span>
                    </div>
                  )}
                </div>

                {/* Reset button */}
                <button
                  onClick={resetSimData}
                  className="w-full mt-2 text-[11px] text-red-400 bg-red-950 hover:bg-red-900 border border-red-900 font-semibold py-1.5 px-3 rounded-lg transition"
                >
                  Reset Local Storage Tables
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-450 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                Real database mode is active. Auth states are controlled by Google OAuth.
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-yellow-300 font-medium text-xs px-3 py-2 rounded-full shadow-lg transition-transform active:scale-95"
        >
          <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></span>
          <span>Open Dev Simulator</span>
        </button>
      )}
    </div>
  );
};
