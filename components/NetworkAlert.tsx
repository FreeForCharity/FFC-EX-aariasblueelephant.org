import React, { useState } from 'react';
import { ShieldAlert, X, Radio, ArrowRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkAlertProps {
  onDismiss?: () => void;
}

const NetworkAlert: React.FC<NetworkAlertProps> = ({ onDismiss }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-sky-400/10 blur-xl rounded-3xl" />
          
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={handleDismiss}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                <ShieldAlert className="h-8 w-8 text-sky-500" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    System Configuration Alert — Database Service Disruption
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    We are currently experiencing a temporary database service disruption. <span className="text-sky-500 font-semibold">Resilience Mode</span> has been automatically enabled, allowing you to browse our core mission and content while real-time features and account access may be briefly limited. For assistance, reach us at <a href="mailto:info@aariasblueelephant.org" className="text-sky-500 font-bold hover:underline">info@aariasblueelephant.org</a>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <Radio className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Resilient Browsing</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Our local fallback system ensures you can still access events and mission details despite backend outages.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                    <Info className="h-5 w-5 text-indigo-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Offline Services</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">New signups and real-time likes are temporarily suspended to protect your data integrity.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleDismiss}
                    className="group inline-flex items-center gap-2 text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors"
                  >
                    I understand, keep browsing
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 opacity-20" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkAlert;
