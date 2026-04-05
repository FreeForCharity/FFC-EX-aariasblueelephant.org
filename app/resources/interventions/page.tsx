import { Metadata } from 'next';
import React from 'react';
import { ShieldCheck, Activity, Users, Sparkles, HandHeart, CalendarHeart, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import StagedFadeIn from '@/components/StagedFadeIn';

export const metadata: Metadata = {
  title: "Interventions & Therapies | Aaria's Blue Elephant",
  description: "Explore evidence-based autism interventions and therapies including ABA, DIR/Floor Time, SCERTS, OT, and Speech Therapy.",
  openGraph: {
    title: "Interventions & Therapies | Aaria's Blue Elephant",
    description: "Discover effective, evidence-based practices for autism. Personalize your child's developmental path with our guide to therapies.",
  },
};

export default function InterventionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 pt-32">
      {/* Hero Section */}
      <section className="relative pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 rounded-full mb-6 relative text-emerald-500">
              <Activity className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              Interventions & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-violet-500">Therapies</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              The dramatic increase in autism awareness has led to highly effective, evidence-based practices (EBPs). Early intervention is crucial—it can significantly improve communication, social skills, and cognitive development.
            </p>
          </StagedFadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro */}
        <StagedFadeIn delay={100}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-12 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">No Single Intervention Fits All</h2>
              <div className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                Keep in mind that no single intervention is effective for everyone. Families should collaborate with medical professionals to find the right fit. When evaluating options, always ask questions about staff training, predictable schedules, individual attention, and how progress is continuously measured.
              </div>
            </div>
            <div className="w-full md:w-1/3 h-64 relative rounded-2xl overflow-hidden shadow-md shrink-0 border border-slate-200 dark:border-slate-700">
              <Image 
                src="/images/autism_intervention.png" 
                alt="Special educator teaching" 
                fill
                className="object-cover" 
              />
            </div>
          </div>
        </StagedFadeIn>

        {/* Therapy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <StagedFadeIn delay={200}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                Applied Behavior Analysis (ABA)
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                Often considered a gold standard, ABA systematically applies behavioral principles to improve socially significant behaviors, including reading, communication, and adaptive living skills. Therapists define goals, break them down, and measure progress continuously.
              </p>
            </div>
          </StagedFadeIn>

          <StagedFadeIn delay={300}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                DIR / Floor Time
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                A relationship-based model designed to help children work around processing difficulties. By getting on the floor to play, parents and therapists reestablish effective contact and guide children to master developmentally appropriate skills through engagement rather than directives.
              </p>
            </div>
          </StagedFadeIn>

          <StagedFadeIn delay={400}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-sky-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                SCERTS® Model
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                A comprehensive approach prioritizing Social Communication, Emotional Regulation, and Transactional Support. It heavily involves parents and educators to build a support network that adapts to the child's evolving daily needs.
              </p>
            </div>
          </StagedFadeIn>

          <StagedFadeIn delay={500}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                <CalendarHeart className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                Early Start Denver Model (ESDM)
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                A behavioral early intervention approach specifically engineered for children ages 12 to 48 months. It integrates a play-based, developmental curriculum with teaching procedures focused on relationships and positive affect.
              </p>
            </div>
          </StagedFadeIn>

        </div>

        {/* Supplemental Therapies */}
        <StagedFadeIn delay={600}>
          <div className="mt-12 bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 shadow-inner border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">Core Supportive Therapies</h3>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center">
                    <HandHeart className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Occupational Therapy (OT)</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    OT helps children develop necessary skills for daily living (eating, dressing, writing). It often includes sensory integration therapy—a specialized framework addressing sensory processing differences, helping children better handle light, sound, and textures.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-sky-500" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Speech-Language Therapy</h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Vital for both verbal and non-verbal communication. Therapists teach everything from forming words to reading facial expressions. For non-speaking individuals, they introduce AAC (Augmentative and Alternative Communication) tools to give them a voice.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </StagedFadeIn>
      </div>
    </div>
  );
}
