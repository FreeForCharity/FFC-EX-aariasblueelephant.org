import { Metadata } from 'next';
import React from 'react';
import { BookOpen, Brain, Activity, Microscope, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StagedFadeIn from '@/components/StagedFadeIn';

export const metadata: Metadata = {
  title: "Resources & Guides | Aaria's Blue Elephant",
  description: "Evidence-based autism resources, parent coping strategies, and therapy guides for neurodiverse families in California.",
  openGraph: {
    title: "Resources & Guides | Aaria's Blue Elephant",
    description: "Navigate an autism diagnosis with confidence. Access our comprehensive guides on understanding autism, interventions, and screening.",
  },
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 pt-32">
      {/* Hero Section */}
      <section className="relative pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-sky-500/20 rounded-full mb-6 text-sky-500">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              Resources <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-violet-500">& Guides</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              We have compiled evidence-based information to help you navigate an autism diagnosis with confidence and compassion. Select a topic below to deep-dive into our guides.
            </p>
          </StagedFadeIn>
        </div>
      </section>

      {/* Main Content Hub */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Understanding Autism Card */}
          <StagedFadeIn delay={100}>
            <Link href="/resources/understanding" className="group block h-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-violet-500/30 transition-all duration-300">
              <div className="h-64 w-full overflow-hidden relative">
                <Image 
                  src="/images/understanding_autism.png" 
                  alt="Family connection" 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl inline-block">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-violet-500 transition-colors">Understanding & Coping</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
                  What autism means for your family, parent coping strategies, and how to safely de-escalate meltdowns.
                </p>
                <div className="flex items-center text-violet-500 font-bold">
                  Read Guide <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </StagedFadeIn>

          {/* Interventions Card */}
          <StagedFadeIn delay={200}>
            <Link href="/resources/interventions" className="group block h-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300">
              <div className="h-64 w-full overflow-hidden relative">
                <Image 
                  src="/images/autism_intervention.png" 
                  alt="Therapist with child" 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl inline-block">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">Interventions & Therapies</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
                  A breakdown of FDA-approved therapies including ABA, DIR/Floor Time, SCERTS, OT, and Speech Therapy.
                </p>
                <div className="flex items-center text-emerald-500 font-bold">
                  Read Guide <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </StagedFadeIn>

          {/* Screening Card */}
          <StagedFadeIn delay={300}>
            <Link href="/resources/screening" className="group block h-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-sky-500/30 transition-all duration-300">
              <div className="h-64 w-full overflow-hidden relative">
                <Image 
                  src="/images/autism_screening.png" 
                  alt="Medical professional" 
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl inline-block">
                    <Microscope className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-sky-500 transition-colors">Screening & Diagnosis</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
                  Understand the CDC's recommendations for developmental screening and what a comprehensive evaluation entails.
                </p>
                <div className="flex items-center text-sky-500 font-bold">
                  Read Guide <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </StagedFadeIn>

        </div>
      </div>
    </div>
  );
}

