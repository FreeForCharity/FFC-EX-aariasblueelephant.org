import React from 'react';
import Button from '../components/Button';
import { Heart } from 'lucide-react';

const Donate: React.FC = () => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-pink-500/20 mb-6">
           <Heart className="h-8 w-8 text-brand-pink" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Support Our Mission</h1>
        <p className="text-xl text-slate-300">
          Your contribution directly funds inclusive playgroups and resources for neurodiverse families in California.
        </p>
      </div>

      <div className="bg-brand-card border border-slate-700 rounded-2xl p-8 md:p-12 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {['$25', '$50', '$100'].map((amt) => (
                <button key={amt} className="py-4 px-6 rounded-xl border border-slate-600 bg-slate-800 text-white text-xl font-bold hover:border-brand-cyan hover:text-brand-cyan transition-all focus:ring-2 focus:ring-brand-cyan focus:outline-none">
                    {amt}
                </button>
            ))}
        </div>
        
        <div className="mb-8">
             <label className="block text-sm font-medium text-slate-300 mb-2">Custom Amount</label>
             <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-slate-500">$</span>
                 </div>
                 <input 
                    type="number" 
                    className="block w-full pl-7 pr-12 py-3 bg-slate-900 border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-brand-cyan focus:border-brand-cyan" 
                    placeholder="0.00"
                 />
             </div>
        </div>

        <Button fullWidth size="lg" className="text-lg">Donate via Credit Card</Button>
        
        <p className="mt-6 text-center text-xs text-slate-500">
            Aaria's Blue Elephant is a 501(c)(3) nonprofit organization. Contributions are tax-deductible to the extent allowed by law.
        </p>
      </div>
    </div>
  );
};

export default Donate;