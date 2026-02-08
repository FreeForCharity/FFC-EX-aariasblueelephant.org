import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-brand-dark/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-lg shadow-brand-cyan/20">
                 <Logo className="h-full w-full" />
              </div>
              <span className="hidden font-bold text-white sm:block text-lg tracking-tight">Aaria's Blue Elephant</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-brand-cyan/10 text-brand-cyan'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-4">
              <Link to="/donate">
                 <Button variant="outline" size="sm">Donate</Button>
              </Link>
              
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-full bg-slate-800 py-1 px-3 text-sm text-slate-200 hover:ring-2 hover:ring-brand-cyan transition-all">
                    <div className="h-6 w-6 rounded-full bg-brand-purple flex items-center justify-center text-xs overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                    </div>
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-brand-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    {isBoardMember && (
                      <Link to="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                      </Link>
                    )}
                    {!isBoardMember && (
                       <Link to="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="primary" size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-card border-b border-slate-700">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                   isActive(link.path)
                      ? 'bg-brand-cyan/10 text-brand-cyan'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
             <Link
                to="/donate"
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-brand-amber hover:bg-slate-700 hover:text-white"
              >
                Donate
              </Link>
            {user ? (
              <>
                 <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-brand-cyan hover:bg-slate-700 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-white bg-brand-purple hover:bg-brand-purple/80"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;