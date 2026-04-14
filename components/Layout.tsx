import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NetworkAlert from './NetworkAlert';
import { useData } from '../context/DataContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isNetworkBlocked } = useData();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors selection:bg-brand-cyan selection:text-white">
      <Navbar />
      <main id="main-content" className="flex-grow outline-none pt-24" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isNetworkBlocked && <NetworkAlert />}
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;