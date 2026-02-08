import React from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import { BYLAWS_HIGHLIGHTS } from '../constants';

const About: React.FC = () => {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white sm:text-5xl mb-4">About Us</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            We are a California Nonprofit Public Benefit Corporation dedicated to fostering inclusive communities for children of all abilities.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
          <div className="bg-brand-card rounded-2xl p-8 border border-slate-800">
             <h2 className="text-2xl font-bold text-white mb-6">Our Purpose</h2>
             <div className="prose prose-invert">
                <p className="text-slate-300 mb-4 leading-relaxed">
                  The specific purpose of this corporation is to foster inclusive playgroups for neurodivergent and neurotypical kids. Through weekly classes and events, we promote equality, compassion, and community in California and beyond.
                </p>
                <p className="text-slate-300 mb-4 leading-relaxed">
                  We aim to raise public awareness about the importance of early intervention and therapy to support the developmental needs of these children, while creating inclusive spaces where specially-abled individuals are embraced and integrated into society.
                </p>
             </div>
             <div className="mt-8 flex items-center gap-4">
                 <div className="h-12 w-1 bg-brand-cyan rounded-full"></div>
                 <div>
                     <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Incorporated</p>
                     <p className="text-white font-medium">September 15, 2025</p>
                 </div>
                 <div className="ml-8">
                     <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Entity Type</p>
                     <p className="text-white font-medium">501(c)(3) Nonprofit</p>
                 </div>
             </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-white mb-4">Leadership Team</h2>
             
             <div className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-brand-cyan flex items-center justify-center text-white font-bold text-xl">
                    LC
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Liji Chalatil</h3>
                    <p className="text-brand-cyan text-sm">Founder, CEO & CFO</p>
                    <p className="text-slate-400 text-sm mt-1">Visionary leader advocating for neurodiversity.</p>
                </div>
             </div>

             <div className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-brand-purple flex items-center justify-center text-white font-bold text-xl">
                    AC
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Ajith Chandran</h3>
                    <p className="text-brand-purple text-sm">Secretary</p>
                    <p className="text-slate-400 text-sm mt-1">Dedicated to operational excellence and community outreach.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Bylaws Section */}
        <div className="bg-slate-800/30 rounded-3xl p-8 md:p-12 border border-slate-700">
           <div className="flex items-center gap-3 mb-8">
              <FileText className="h-8 w-8 text-brand-amber" />
              <h2 className="text-2xl font-bold text-white">Organization Bylaws & Standards</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BYLAWS_HIGHLIGHTS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-brand-cyan flex-shrink-0" />
                      <p className="text-slate-300">{item}</p>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;