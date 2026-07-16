import React, { useEffect } from 'react';
import { BookOpen, Brain, Activity, Microscope, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StagedFadeIn from '../components/StagedFadeIn';
import { tr } from '../lib/lang';

const Resources: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#00AEEF]/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-[#00AEEF]/20 rounded-full mb-6">
              <BookOpen className="h-8 w-8 text-[#00AEEF]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              {tr('Resources', 'Recursos')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] to-[#8b5cf6]">{tr('& Guides', 'y Guías')}</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {tr(
                'We have compiled evidence-based information to help you navigate an autism diagnosis with confidence and compassion. Select a topic below to deep-dive into our guides.',
                'Hemos recopilado información basada en evidencia para ayudarte a navegar un diagnóstico de autismo con confianza y compasión. Selecciona un tema a continuación para explorar nuestras guías a fondo.'
              )}
            </p>
          </StagedFadeIn>
        </div>
      </section>

      {/* Main Content Hub */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Understanding Autism Card */}
          <StagedFadeIn delay={100}>
            <Link to="/resources/understanding" className="group block h-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-[#8b5cf6]/30 transition-all duration-300">
              <div className="h-64 w-full overflow-hidden relative">
                <img src="/images/understanding_autism.webp" alt={tr('Family connection', 'Conexión familiar')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl inline-block">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-[#8b5cf6] transition-colors">{tr('Understanding & Coping', 'Comprensión y Afrontamiento')}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {tr(
                    'What autism means for your family, parent coping strategies, and how to safely de-escalate meltdowns.',
                    'Lo que el autismo significa para tu familia, estrategias de afrontamiento para padres, y cómo desescalar berrinches de forma segura.'
                  )}
                </p>
                <div className="flex items-center text-[#8b5cf6] font-bold">
                  {tr('Read Guide', 'Leer Guía')} <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </StagedFadeIn>

          {/* Interventions Card */}
          <StagedFadeIn delay={200}>
            <Link to="/resources/interventions" className="group block h-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-[#10b981]/30 transition-all duration-300">
              <div className="h-64 w-full overflow-hidden relative">
                <img src="/images/autism_intervention.webp" alt={tr('Therapist with child', 'Terapeuta con niño')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl inline-block">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-[#10b981] transition-colors">{tr('Interventions & Therapies', 'Intervenciones y Terapias')}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {tr(
                    'A breakdown of FDA-approved therapies including ABA, DIR/Floor Time, SCERTS, OT, and Speech Therapy.',
                    'Un desglose de terapias aprobadas por la FDA, incluyendo ABA, DIR/Floor Time, SCERTS, terapia ocupacional y terapia del habla.'
                  )}
                </p>
                <div className="flex items-center text-[#10b981] font-bold">
                  {tr('Read Guide', 'Leer Guía')} <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </StagedFadeIn>

          {/* Screening Card */}
          <StagedFadeIn delay={300}>
            <Link to="/resources/screening" className="group block h-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-[#0ea5e9]/30 transition-all duration-300">
              <div className="h-64 w-full overflow-hidden relative">
                <img src="/images/autism_screening.webp" alt={tr('Medical professional', 'Profesional médico')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl inline-block">
                    <Microscope className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-[#0ea5e9] transition-colors">{tr('Screening & Diagnosis', 'Evaluación y Diagnóstico')}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {tr(
                    "Understand the CDC's recommendations for developmental screening and what a comprehensive evaluation entails.",
                    'Comprende las recomendaciones de los CDC para la evaluación del desarrollo y lo que implica una evaluación integral.'
                  )}
                </p>
                <div className="flex items-center text-[#0ea5e9] font-bold">
                  {tr('Read Guide', 'Leer Guía')} <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </StagedFadeIn>

        </div>
      </div>
    </div>
  );
};

export default Resources;
