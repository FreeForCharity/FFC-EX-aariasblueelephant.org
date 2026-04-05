import { Metadata } from 'next';
import React from 'react';
import { Microscope, Activity, Star, ClipboardCheck } from 'lucide-react';
import Image from 'next/image';
import StagedFadeIn from '@/components/StagedFadeIn';

export const metadata: Metadata = {
  title: "Screening & Diagnosis | Aaria's Blue Elephant",
  description: "Understand the autism screening and diagnostic process. Learn about CDC recommendations, developmental screening tools, and comprehensive evaluations.",
  openGraph: {
    title: "Screening & Diagnosis | Aaria's Blue Elephant",
    description: "A timely diagnosis is power. Learn how specialists identify autism and what a comprehensive developmental evaluation entails for your child.",
  },
};

export default function ScreeningPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 pt-32">
      {/* Hero Section */}
      <section className="relative pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-violet-500/20 rounded-full mb-6 relative text-violet-500">
              <Microscope className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              Screening & <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-sky-500">Diagnosis</span>
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
            <Image 
              src="/images/autism_screening.png" 
              alt="Medical professional smiling safely" 
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8">
              <p className="text-white text-lg lg:text-xl font-bold max-w-2xl leading-tight">
                The American Academy of Pediatrics recommends routine ASD screening at 18 and 24 months during well-child visits.
              </p>
            </div>
          </div>
        </StagedFadeIn>

        <div className="space-y-12">
          
          {/* Step 1: Developmental Screening */}
          <StagedFadeIn delay={200}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/3 h-64 relative rounded-2xl overflow-hidden shrink-0 hidden md:block border border-slate-200 dark:border-slate-700">
                <Image 
                  src="/images/understanding_autism.png" 
                  alt="Child's hands playing" 
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm">1</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Developmental Screening</h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-base font-medium text-slate-600 dark:text-slate-400">
                  <p className="mb-4">
                    Developmental screening is a crucial first step, performed by doctors or nurses. This often involves research-backed questionnaires comparing a child's development to peers, covering language, movement, thinking, and emotion.
                  </p>
                  <p className="font-bold bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border-l-4 border-amber-400 dark:text-slate-300">
                    A very common tool is the Modified Checklist for Autism in Toddlers (M-CHAT-R/F). If your pediatrician hasn't brought this up by 18 months, you have the right to request it.
                  </p>
                </div>
              </div>
            </div>
          </StagedFadeIn>

          {/* Step 2: Comprehensive Diagnostic Evaluation */}
          <StagedFadeIn delay={300}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row-reverse gap-8 items-center">
              <div className="w-full md:w-1/3 h-64 relative rounded-2xl overflow-hidden shrink-0 hidden md:block border border-slate-200 dark:border-slate-700">
                <Image 
                  src="/images/autism_screening.png" 
                  alt="Medical team taking notes" 
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 text-sky-500 font-bold text-sm">2</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Comprehensive Diagnostic Evaluation</h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-base font-medium text-slate-600 dark:text-slate-400">
                  <p className="mb-4">
                    If screening indicates potential signs, a comprehensive evaluation is the next step. This involves a multidisciplinary team to observe interactions, play, communication, and perform parental interviews.
                  </p>
                  <p className="mb-6">
                    This evaluation utilizes standardized (non-medical) tools like the Autism Diagnostic Observation Schedule (ADOS-2) and the Autism Diagnostic Interview-Revised (ADI-R).
                  </p>
                  <div className="flex items-start gap-4 mt-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Activity className="h-6 w-6 text-sky-500 mt-1 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Who performs this evaluation?</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-bold">
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
            <div className="bg-gradient-to-r from-violet-500/10 to-sky-500/10 dark:from-violet-900/20 dark:to-sky-900/20 rounded-3xl p-8 md:p-10 shadow-sm border border-violet-500/20 dark:border-sky-500/20">
              <div className="flex gap-4 items-center mb-6 text-violet-500">
                <ClipboardCheck className="h-8 w-8" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Ruling Out Other Conditions</h3>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                Many behaviors associated with autism can overlap with other disorders. Because of this, certain medical tests (like hearing/vision tests or genetic screening) might be ordered to identify or rule out physiological causes for exhibited symptoms.
              </p>
              <div className="flex items-center p-5 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white dark:border-slate-700 shadow-sm">
                <Star className="h-6 w-6 text-amber-500 mr-4 shrink-0 fill-amber-500" />
                <span className="font-bold text-slate-800 dark:text-white text-base">A timely diagnosis is power. It opens doors for critical early interventions and support systems for families.</span>
              </div>
            </div>
          </StagedFadeIn>

        </div>
      </div>
    </div>
  );
}

