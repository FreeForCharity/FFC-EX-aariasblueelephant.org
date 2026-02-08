import React from 'react';
import { Heart, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-card border-t border-slate-800 pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Aaria's Blue Elephant</h3>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">
              Fostering inclusive playgroups for neurodivergent and neurotypical kids. 
              Through weekly classes and events, we promote equality, compassion, and community in California and beyond.
            </p>
            <div className="flex items-center space-x-4 text-slate-400 text-sm">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-cyan" /> Tracy, CA 95391
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Organization</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-slate-400 hover:text-brand-cyan text-sm transition-colors">About Us</a></li>
              <li><a href="/events" className="text-slate-400 hover:text-brand-cyan text-sm transition-colors">Events</a></li>
              <li><a href="/volunteer" className="text-slate-400 hover:text-brand-cyan text-sm transition-colors">Volunteer</a></li>
              <li><a href="/donate" className="text-slate-400 hover:text-brand-cyan text-sm transition-colors">Donate</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><span className="text-slate-400 text-sm">Nonprofit Corp #B20250299015</span></li>
              <li><span className="text-slate-400 text-sm">501(c)(3) Status</span></li>
              <li><a href="#" className="text-slate-400 hover:text-brand-cyan text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-brand-cyan text-sm transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Aaria's Blue Elephant. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
             <p className="text-slate-500 text-xs flex items-center gap-1">
                Designed with <Heart className="h-3 w-3 text-brand-pink" /> in California
             </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;