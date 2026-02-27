import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ExternalLink, Phone, Mail, Sun, Moon, HeartPulse, UserCircle, LogOut, LayoutDashboard, Stars, Mountain } from 'lucide-react';
import Button from './Button';
import Logo from './Logo';
import DonationQR from './DonationQR';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  // Handle theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Our Story', path: '/about' },
    { name: 'Playgroups', path: '/events' },
    { name: 'Get Involved', path: '/volunteer' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 w-full z-50 transition-all duration-300">

      <nav className="w-full border-b border-sky-800/10 dark:border-sky-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-h-[80px] lg:h-32 items-center justify-between py-4 lg:py-0">
            {/* Zone 1: Identity (Logo & QR) */}
            <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-start relative">
              <Link to="/" className="flex flex-col items-center gap-2 shrink-0 group relative z-10">
                <div className="relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 sm:w-48 sm:w-56 h-24 pointer-events-none z-30 overflow-visible transition-transform duration-500 group-hover:scale-105">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" fill="none">
                      <defs>
                        <linearGradient id="iridescent-flow" x1="0%" y1="0%" x2="200%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="25%" stopColor="#14b8a6" />
                          <stop offset="50%" stopColor="#8b5cf6" />
                          <stop offset="75%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#10b981" />
                          <animate attributeName="x1" values="0%;-100%" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="x2" values="200%;100%" dur="3s" repeatCount="indefinite" />
                        </linearGradient>
                        <filter id="subtle-glow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="1" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <path d="M 25 20 C 10 20, 10 35, 25 35 C 40 35, 50 20, 50 20 C 50 20, 60 5, 75 5 C 90 5, 90 20, 75 20 C 60 20, 50 35, 50 35 C 50 35, 40 20, 25 20 Z" stroke="url(#iridescent-flow)" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round" filter="url(#subtle-glow)" className="transition-all duration-700 group-hover:strokeOpacity-45" />
                      <path d="M 25 35 C 40 35, 50 20, 50 20 C 50 20, 60 20, 75 20" stroke="url(#iridescent-flow)" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" filter="url(#subtle-glow)" className="group-hover:strokeOpacity-85 transition-opacity duration-700" />
                      <path d="M 75 20 C 130 20, 160 20, 260 20" stroke="url(#iridescent-flow)" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" className="opacity-45 xl:opacity-65 group-hover:opacity-100 transition-opacity duration-700 delay-100 stroke-dasharray-[160] stroke-dashoffset-0 group-hover:animate-[dash_2s_linear]" filter="url(#subtle-glow)" />
                    </svg>
                  </div>
                  <div className="relative z-10 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-slate-200 dark:border-none group-hover:scale-105 transition-transform duration-300 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Logo src="./logo.png" className="h-full w-full relative z-10" alt="Organization Logo" />
                  </div>
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm lg:text-base tracking-tight whitespace-nowrap z-10 relative mt-1.5 text-center sm:text-left hidden xs:block">Aaria's Blue Elephant</span>
              </Link>

              {/* Navbar QR Code CTA */}
              <div className="flex flex-col items-center gap-1.5 pl-4 sm:pl-6 border-l border-slate-200 dark:border-slate-800 shrink-0">
                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="group relative shrink-0" title="Make a Donation">
                  <div className="absolute -inset-2 bg-sky-500/40 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative z-10 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 bg-white rounded-2xl border-2 border-sky-500/40 shadow-[0_0_20px_rgba(14,165,233,0.2)] group-hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all duration-300 ring-4 ring-sky-500/10 group-hover:ring-sky-500 overflow-hidden flex items-center justify-center">
                    {/* The Actual QR Code */}
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.zeffy.com/en-US/donation-form/aariasblueelephant&margin=2"
                      alt="Signify Impact QR"
                      className="w-full h-full object-contain relative z-20"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Scanning Animation */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-400 shadow-[0_0_12px_#0ea5e9,0_0_20px_#0ea5e9] animate-[scan_2.5s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"></div>

                    {/* Restored Frosted Glass Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-500 group-hover:opacity-0 group-hover:backdrop-blur-none z-30 ring-inset ring-1 ring-white/10">
                      <div className="bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-lg shadow-xl border border-slate-200/40 dark:border-slate-700/40 transform transition-transform group-hover:scale-90 flex flex-col items-center">
                        <span className="font-sans font-black uppercase text-slate-900 dark:text-sky-400 tracking-tighter text-[10px] sm:text-xs italic leading-none mb-0.5">
                          Click
                        </span>
                        <span className="font-sans font-black uppercase text-sky-600 dark:text-white tracking-widest text-[10px] sm:text-xs leading-none">
                          Or Scan
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center select-none cursor-pointer mt-1">
                  <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base tracking-tight whitespace-nowrap hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Signify Impact</span>
                </a>
              </div>
            </div>

            {/* Vertical Divider 1 */}
            <div className="hidden xl:block w-px h-8 bg-slate-200 dark:bg-white/10 mx-10"></div>

            {/* Zone 2: Navigation Links */}
            <div className="hidden lg:flex flex-none justify-center shrink-0 min-w-0 mx-auto">
              <div className="flex items-center space-x-4 xl:space-x-8 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`rounded-md px-3 py-2 text-base font-bold whitespace-nowrap transition-colors ${isActive(link.path)
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Vertical Divider 2 */}
            <div className="hidden xl:block w-px h-8 bg-slate-200 dark:bg-white/10 mx-10"></div>

            {/* Zone 3: Utilities & Donate Tagline */}
            <div className="hidden lg:flex flex-1 justify-end items-center gap-4 xl:gap-8">
              {/* Auth Section - Only visible when signed in */}
              <div className="flex items-center gap-4 mr-4">
                {user && (
                  <div className="flex flex-col items-center gap-1.5 min-w-0">
                    <div className="relative">
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-sky-500/20 hover:ring-sky-500/50 transition-all overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <UserCircle className="h-6 w-6 text-slate-400" />
                        )}
                      </button>

                      {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                            <p className="font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
                          >
                            <LogOut className="h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Always Visible Dashboard Link */}
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors uppercase tracking-tight"
                    >
                      <LayoutDashboard className="h-3 w-3" /> Dashboard
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="shrink-0 group">
                  <span className="px-5 lg:px-6 py-2.5 lg:py-3 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs lg:text-sm tracking-wide transition-all group-hover:scale-105 shadow-md flex items-center gap-2 whitespace-nowrap">
                    Donate <span className="hidden xl:inline">for the Cause</span> <HeartPulse className="h-4 w-4 shrink-0" />
                  </span>
                </a>
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[9px] xl:text-[11px] tracking-tight whitespace-nowrap uppercase">
                    100% Free. Fully Inclusive.
                  </span>
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[9px] xl:text-[11px] tracking-tight whitespace-nowrap uppercase">
                    All Welcome
                  </span>
                </div>
              </div>

              {/* Theme Toggle Slider - Desktop */}
              <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 ml-2">
                <button
                  onClick={toggleTheme}
                  className="group relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer items-center justify-center rounded-full p-1 transition-all duration-500 ease-in-out bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden shrink-0"
                  aria-label="Toggle theme"
                  title="Toggle Theme"
                >
                  <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none opacity-40 transition-opacity group-hover:opacity-100">
                    <Mountain className={`h-3 w-3 text-slate-400 transition-all duration-500 transform ${isDarkMode ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} />
                    <Stars className={`h-3.5 w-3.5 text-sky-400 transition-all duration-500 transform ${!isDarkMode ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} />
                  </div>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-lg transform transition-all duration-500 ease-in-out z-10 ${isDarkMode ? 'translate-x-3.5' : '-translate-x-3.5'}`}>
                    {isDarkMode ? (
                      <Sun className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Moon className="h-4 w-4 text-sky-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Actions Container */}
            <div className="flex lg:hidden items-center gap-3">
              {/* Theme Toggle Slider - Mobile */}
              <button
                onClick={toggleTheme}
                className="group relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center justify-center rounded-full p-1 transition-all duration-500 ease-in-out bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden shrink-0"
                aria-label="Toggle theme"
              >
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none opacity-40">
                  <Mountain className={`h-2.5 w-2.5 text-slate-400 transition-all duration-500 transform ${isDarkMode ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} />
                  <Stars className={`h-3 w-3 text-sky-400 transition-all duration-500 transform ${!isDarkMode ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} />
                </div>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-lg transform transition-all duration-500 ease-in-out z-10 ${isDarkMode ? 'translate-x-[11px]' : '-translate-x-[11px]'}`}>
                  {isDarkMode ? (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-sky-600" />
                  )}
                </div>
              </button>

              {/* Mobile menu button */}
              <div className="-mr-2 flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-3 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500 transition-colors"
                  aria-expanded={isOpen}
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isOpen && (
          <div className="lg:hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2 scale-90 origin-left">
              <a href="tel:4242548402" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <Phone className="h-4 w-4" /> 424-254-8402
              </a>
              <a href="mailto:info@aariasblueelephant.org" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <Mail className="h-4 w-4" /> info@aariasblueelephant.org
              </a>
            </div>
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${isActive(link.path)
                    ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-bold text-sky-600 dark:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Donate for the Cause
              </a>

              {/* Mobile Auth Links */}
              {user && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                  <div className="space-y-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <LayoutDashboard className="h-5 w-5" /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-5 w-5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
