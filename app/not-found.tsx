'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/Button';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-brand-dark transition-colors duration-300">
      <div className="mb-8 animate-bounce">
        <div className="mx-auto h-32 w-32 rounded-full bg-white dark:bg-slate-800 p-4 flex items-center justify-center shadow-2xl ring-4 ring-sky-500/20">
          <Logo className="h-full w-full" alt="Organization Logo" />
        </div>
      </div>
      
      <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tighter">
        404
      </h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-tight">
        Page Not Found
      </h2>
      
      <p className="max-w-md text-lg text-slate-600 dark:text-slate-400 mb-10 font-medium">
        Oops! It looks like this page has wandered off into another event. Let's get you back to safety.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button size="lg" className="shadow-xl shadow-brand-cyan/20">
            <Home className="mr-2 h-5 w-5" /> Return Home
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => window.history.back()}
          className="bg-white dark:bg-slate-800"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
        </Button>
      </div>
      
      <div className="mt-16 text-slate-400 dark:text-slate-600 text-sm font-bold uppercase tracking-widest">
        Aaria's Blue Elephant
      </div>
    </div>
  );
}
