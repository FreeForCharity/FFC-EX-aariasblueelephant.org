import { Metadata } from 'next';
import React from 'react';
import { Heart } from 'lucide-react';
import DonationQR from '@/components/DonationQR';

export const metadata: Metadata = {
  title: "Support Our Mission | Aaria's Blue Elephant",
  description: "Donate to Aaria's Blue Elephant to support inclusive events and resources for neurodiverse families in California.",
  openGraph: {
    title: "Support Our Mission | Aaria's Blue Elephant",
    description: "Your contribution directly funds inclusive events and resources for neurodiverse families. 100% of your donation goes to our mission.",
  },
};

export default function DonatePage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-pink-500/20 mb-6">
          <Heart className="h-8 w-8 text-brand-pink" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-tighter italic">Support Our Mission</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 font-bold">
          Your contribution directly funds inclusive events and resources for neurodiverse families in California.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto font-bold text-lg">
          We use Zeffy, a 100% free fundraising platform for nonprofits, so that 100% of your donation goes directly to our mission.
        </p>

        <div className="flex flex-col items-center justify-center gap-8">
          <DonationQR />
          <a
            href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-black py-5 px-10 rounded-2xl text-xl transition-all hover:-translate-y-1 shadow-xl hover:shadow-sky-500/25 uppercase italic tracking-tighter"
          >
            Click Here to Donate
          </a>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-bold max-w-lg mx-auto">
            Aaria's Blue Elephant is a registered 501(c)(3) nonprofit organization. Contributions are tax-deductible to the extent allowed by law.
            </p>
        </div>
      </div>
    </div>
  );
}
