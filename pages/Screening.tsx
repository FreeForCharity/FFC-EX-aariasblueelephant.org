import React, { useEffect } from 'react';
import { Microscope, Activity, Star, ClipboardCheck, ArrowRight } from 'lucide-react';
import StagedFadeIn from '../components/StagedFadeIn';

const Screening: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#8b5cf6]/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-[#8b5cf6]/20 rounded-full mb-6 relative">
              <Microscope className="h-8 w-8 text-[#8b5cf6]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              Screening & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#0ea5e9]">Diagnosis</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Diagnosing autism can be challenging because there isn't a specific medical test, like a blood test, to identify it. Instead, specialists rely on a child's developmental milestones and behavioral history.
            </p>
          </StagedFadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <StagedFadeIn delay={100}>
          <div className="w-full h-[350px] mb-12 rounded-3xl overflow-hidden shadow-lg relative group">
            <img 
              src="/images/autism_screening.webp" 
              alt="Medical professional smiling safely" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8">
              <p className="text-white text-lg lg:text-xl font-bold max-w-2xl">
                The American Academy of Pediatrics recommends routine ASD screening at 18 and 24 months during well-child visits.
              </p>
            </div>
          </div>
        </StagedFadeIn>

        <div className="space-y-12">
          
          {/* Step 1: Developmental Screening */}
          <StagedFadeIn delay={200}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shrink-0 hidden md:block border border-slate-200 dark:border-slate-700">
                 <img src="/images/understanding_autism.webp" alt="Child's hands playing" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold text-sm">1</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Developmental Screening</h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-base">
                  <p>
                    Developmental screening is a crucial first step, performed by doctors or nurses. This often involves research-backed questionnaires comparing a child's development to peers, covering language, movement, thinking, and emotion.
                  </p>
                  <p className="font-medium bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border-l-4 border-amber-400">
                    A very common tool is the Modified Checklist for Autism in Toddlers (M-CHAT-R/F). If your pediatrician hasn't brought this up by 18 months, you have the right to request it.
                  </p>
                </div>
              </div>
            </div>
          </StagedFadeIn>

          {/* Step 2: Comprehensive Diagnostic Evaluation */}
          <StagedFadeIn delay={300}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row-reverse gap-8 items-center">
              <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shrink-0 hidden md:block border border-slate-200 dark:border-slate-700">
                 <img src="/images/autism_screening.webp" alt="Medical team taking notes" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] font-bold text-sm">2</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Comprehensive Diagnostic Evaluation</h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-base">
                  <p>
                    If screening indicates potential signs, a comprehensive evaluation is the next step. This involves a multidisciplinary team to observe interactions, play, communication, and perform parental interviews.
                  </p>
                  <p>
                    This evaluation utilizes standardized (non-medical) tools like the Autism Diagnostic Observation Schedule (ADOS-2) and the Autism Diagnostic Interview-Revised (ADI-R).
                  </p>
                  <div className="flex items-start gap-4 mt-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
                    <Activity className="h-6 w-6 text-[#00AEEF] mt-1 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Who performs this evaluation?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Usually specialists such as Developmental Pediatricians, Neurologists, Child Psychologists/Psychiatrists, Speech-Language Pathologists, and Occupational Therapists.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StagedFadeIn>

           {/* Ruling Out Other Conditions */}
           <StagedFadeIn delay={400}>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 md:p-10 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
              <div className="flex gap-4 items-center mb-6">
                <ClipboardCheck className="h-8 w-8 text-indigo-500" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Ruling Out Other Conditions</h3>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Many behaviors associated with autism can overlap with other disorders. Because of this, certain medical tests (like hearing/vision tests or genetic screening) might be ordered to identify or rule out physiological causes for exhibited symptoms.
              </p>
              <div className="flex items-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                <Star className="h-5 w-5 text-amber-500 mr-3" />
                <span className="font-bold text-slate-800 dark:text-white text-sm">A timely diagnosis is power. It opens doors for critical early interventions and support systems for families.</span>
              </div>
            </div>
          </StagedFadeIn>

        </div>
      </div>
    </div>
  );
};

export default Screening;
