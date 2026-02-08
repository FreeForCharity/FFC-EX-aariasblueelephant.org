import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { AlertCircle } from 'lucide-react';
import GoogleAuthModal from '../components/GoogleAuthModal';
import Logo from '../components/Logo';
import { User } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  
  const { login, loginWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email not found in our mock database. Try "liji@blueelephant.org" or "donor1@example.com".');
    }
  };

  const handleGoogleUserSelect = async (selectedUser: User) => {
    setIsGoogleModalOpen(false);
    await loginWithGoogle(selectedUser);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <GoogleAuthModal 
        isOpen={isGoogleModalOpen} 
        onClose={() => setIsGoogleModalOpen(false)} 
        onSelectUser={handleGoogleUserSelect}
      />

      <div className="w-full max-w-md space-y-8 bg-brand-card p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-r from-brand-cyan to-brand-purple"></div>

        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-white p-2 flex items-center justify-center mb-6 shadow-2xl ring-4 ring-brand-cyan/20">
             <Logo className="h-full w-full" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage events, donations, and more.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
           <div className="flex flex-col gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={() => setIsGoogleModalOpen(true)}
              disabled={isLoading}
              className="relative flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 border-0"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-brand-card px-2 text-slate-400">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-0 bg-slate-900 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-brand-cyan sm:text-sm sm:leading-6"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
               <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-0 bg-slate-900 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-brand-cyan sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-400">Login Failed</h3>
                    <div className="mt-2 text-sm text-red-300">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="text-center text-sm">
          <p className="text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand-cyan hover:text-brand-cyan/80">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;