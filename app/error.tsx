'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-brand-dark transition-colors duration-300">
      <div className="mb-8 rounded-full bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <AlertCircle className="h-16 w-16 text-red-500" />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
        Something went wrong!
      </h1>
      
      <p className="max-w-md text-lg text-slate-600 dark:text-slate-400 mb-10 font-medium">
        We've encountered an unexpected error. Don't worry, our team has been notified.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()} 
          size="lg" 
          className="shadow-xl shadow-brand-cyan/20"
        >
          <RefreshCw className="mr-2 h-5 w-5" /> Try Again
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => window.location.href = '/'}
          className="bg-white dark:bg-slate-800"
        >
          <Home className="mr-2 h-5 w-5" /> Return Home
        </Button>
      </div>
      
      <div className="mt-16 text-slate-400 dark:text-slate-600 text-sm font-bold uppercase tracking-widest">
        Aaria's Blue Elephant
      </div>
    </div>
  );
}
