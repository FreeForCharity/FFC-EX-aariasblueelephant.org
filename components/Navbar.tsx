import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ExternalLink, Phone, Mail, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleJoinHerdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('join-herd')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('join-herd')?.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', '/#join-herd');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'Get Involved', path: '/volunteer' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isBoardMember = user?.role === 'BoardMember.Owner';

  return (
    <header className="sticky top-0 w-full z-50 transition-all duration-300">

      {/* Main Navbar */}
      {/* UI/UX Pro Max: Glassmorphism backdrops require sufficient opacity (e.g., 80) in light mode to meet contrast and look clean. */}
      {/* We apply a subtle bottom border as well as a backdrop blur. */}
      <nav className="w-full border-b border-sky-800/10 dark:border-sky-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="flex h-[200px] items-center justify-between">

            {/* Zone 1: Identity (Logo & QR) */}
            <div className="flex items-center gap-6 flex-1 justify-start relative">
              <Link to="/" className="flex flex-col items-center gap-2 shrink-0 group relative z-10">

                <div className="relative">
                  {/* Subtle Visual Bridge: True Infinity Loop centered over Logo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-56 h-24 pointer-events-none z-30 overflow-visible transition-transform duration-500 group-hover:scale-105">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 100 40"
                      fill="none"
                    >
                      <defs>
                        <linearGradient id="iridescent-flow" x1="0%" y1="0%" x2="200%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />   {/* Emerald */}
                          <stop offset="25%" stopColor="#14b8a6" />  {/* Teal */}
                          <stop offset="50%" stopColor="#8b5cf6" />  {/* Amethyst */}
                          <stop offset="75%" stopColor="#f59e0b" />  {/* Gold */}
                          <stop offset="100%" stopColor="#10b981" /> {/* Emerald (loop) */}
                          <animate attributeName="x1" values="0%;-100%" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="x2" values="200%;100%" dur="3s" repeatCount="indefinite" />
                        </linearGradient>
                        <filter id="subtle-glow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="1" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Subtler Infinity Loop Base - Back loop */}
                      <path
                        d="M 25 20 C 10 20, 10 35, 25 35 C 40 35, 50 20, 50 20 C 50 20, 60 5, 75 5 C 90 5, 90 20, 75 20 C 60 20, 50 35, 50 35 C 50 35, 40 20, 25 20 Z"
                        stroke="url(#iridescent-flow)"
                        strokeOpacity="0.25"
                        strokeWidth="1"
                        strokeLinecap="round"
                        filter="url(#subtle-glow)"
                        className="transition-all duration-700 group-hover:strokeOpacity-45"
                      />

                      {/* Subtler Infinity Loop Base - Front woven section */}
                      <path
                        d="M 25 35 C 40 35, 50 20, 50 20 C 50 20, 60 20, 75 20"
                        stroke="url(#iridescent-flow)"
                        strokeOpacity="0.55"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        filter="url(#subtle-glow)"
                        className="group-hover:strokeOpacity-85 transition-opacity duration-700"
                      />

                      {/* The Flowing Bridge Line across the divider to the QR code */}
                      <path
                        d="M 75 20 C 130 20, 160 20, 260 20"
                        stroke="url(#iridescent-flow)"
                        strokeWidth="1"
                        strokeOpacity="0.55"
                        strokeLinecap="round"
                        className="opacity-45 xl:opacity-65 group-hover:opacity-100 transition-opacity duration-700 delay-100 stroke-dasharray-[160] stroke-dashoffset-0 group-hover:animate-[dash_2s_linear]"
                        filter="url(#subtle-glow)"
                      />
                    </svg>
                  </div>

                  <div className="relative z-10 h-28 w-28 sm:h-36 sm:w-36 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-slate-200 dark:border-none group-hover:scale-105 transition-transform duration-300 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Logo className="h-full w-full relative z-10" alt="Organization Logo" />
                  </div>
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base tracking-tight whitespace-nowrap z-10 relative mt-2">Aaria's Blue Elephant</span>
              </Link>

              {/* Navbar QR Code CTA */}
              <div className="flex flex-col items-center gap-1.5 pl-4 sm:pl-6 border-l border-slate-200 dark:border-slate-800 shrink-0">
                <a
                  href="/#join-herd"
                  onClick={handleJoinHerdClick}
                  className="group relative shrink-0"
                  title="Ready to Join Our Herd"
                >
                  <div className="absolute -inset-2 bg-sky-500/40 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative z-10 h-28 w-28 sm:h-36 sm:w-36 bg-white p-2 rounded-2xl border-2 border-sky-500/40 shadow-[0_0_20px_rgba(14,165,233,0.2)] group-hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all duration-300 ring-4 ring-sky-500/10 group-hover:ring-sky-500 overflow-hidden">
                    <img src="/qr-code-donate.png" alt="Signify Impact QR" className="w-full h-full object-contain relative z-20" />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-400 shadow-[0_0_12px_#0ea5e9,0_0_20px_#0ea5e9] animate-[scan_2.5s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>

                  {/* UX Tooltip */}
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                    Scan to Signify Impact
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45"></div>
                  </span>
                </a>
                <div className="flex flex-col items-center select-none cursor-pointer mt-1" onClick={handleJoinHerdClick}>
                  <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base tracking-tight whitespace-nowrap hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Signify Impact</span>
                </div>
              </div>
            </div>

            {/* Vertical Divider 1 */}
            <div className="hidden lg:block w-px h-32 bg-slate-200 dark:bg-white/10 mx-6"></div>

            {/* Zone 2: Navigation Links */}
            <div className="hidden lg:flex flex-1 justify-center shrink-0">
              <div className="flex items-center space-x-6 lg:space-x-10">
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
            <div className="hidden lg:block w-px h-32 bg-slate-200 dark:bg-white/10 mx-6"></div>

            {/* Zone 3: Utilities & Authentication */}
            <div className="hidden lg:flex flex-1 justify-end items-center gap-4 xl:gap-6">
              <div className="flex items-center gap-3 shrink-0">
                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center justify-center">
                  <Button variant="primary" size="sm" className="font-bold shadow-md hover:shadow-lg transition-shadow bg-sky-600 hover:bg-sky-700 text-white">
                    Donate
                  </Button>
                </a>

                {user ? (
                  <div className="relative group z-50 shrink-0">
                    <button className="flex items-center gap-2 rounded-full bg-slate-200 dark:bg-slate-800 py-1 px-3 text-sm text-slate-700 dark:text-slate-200 hover:ring-2 hover:ring-sky-500 transition-all">
                      <div className="h-8 w-8 rounded-full bg-sky-600 flex items-center justify-center text-xs overflow-hidden text-white shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} referrerPolicy="no-referrer" alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <span className="max-w-[100px] truncate hidden md:block">{user.name}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-slate-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link to="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> {isBoardMember ? 'Dashboard' : 'My Dashboard'}
                      </Link>
                      <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0 border-r border-slate-200 dark:border-slate-800 pr-3 mr-1">
                    <Link to="/login">
                      <Button variant="primary" size="sm" className="whitespace-nowrap shadow-md">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="absolute top-4 right-4 sm:right-6 lg:right-6">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-transform hover:scale-110 ring-1 ring-slate-200 dark:ring-slate-700/50 bg-white dark:bg-slate-800 shrink-0 shadow-sm"
                    aria-label="Toggle dark mode"
                    title="Toggle Theme"
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex lg:hidden items-center">
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
                Donate
              </a>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-md px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  {location.pathname !== '/login' && location.pathname !== '/signup' && (
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-md px-3 py-2 text-base font-medium text-white bg-sky-600 hover:bg-sky-500 text-center mx-3 mb-3"
                    >
                      Continue with Google
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
