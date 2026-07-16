import React from 'react';
import { Heart } from 'lucide-react';
import DonationQR from '../components/DonationQR';
import { tr } from '../lib/lang';

const Donate: React.FC = () => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-pink-500/20 mb-6">
          <Heart className="h-8 w-8 text-brand-pink" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{tr('Support Our Mission', 'Apoya Nuestra Misión')}</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          {tr(
            'Your contribution directly funds inclusive events and resources for neurodiverse families in California.',
            'Tu contribución financia directamente eventos y recursos inclusivos para familias neurodiversas en California.'
          )}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-12 shadow-xl text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto">
          {tr(
            'We use Zeffy, a 100% free fundraising platform for nonprofits, so that 100% of your donation goes directly to our mission.',
            'Usamos Zeffy, una plataforma de recaudación de fondos 100% gratuita para organizaciones sin fines de lucro, para que el 100% de tu donación vaya directamente a nuestra misión.'
          )}
        </p>

        <div className="flex flex-col items-center justify-center gap-6">
          <DonationQR />
          <a
            href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full sm:w-auto bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:-translate-y-1 shadow-lg"
          >
            {tr('Or Click Here to Donate', 'O Haz Clic Aquí para Donar')}
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600 dark:text-slate-400">
          {tr(
            "Aaria's Blue Elephant is a registered 501(c)(3) nonprofit organization. Contributions are tax-deductible to the extent allowed by law.",
            'Aaria\'s Blue Elephant es una organización sin fines de lucro registrada bajo la sección 501(c)(3). Las contribuciones son deducibles de impuestos en la medida permitida por la ley.'
          )}
        </p>
      </div>
    </div>
  );
};

export default Donate;