import React, { useEffect } from 'react';
import { Microscope, Activity, Star, ClipboardCheck, ArrowRight } from 'lucide-react';
import StagedFadeIn from '../components/StagedFadeIn';
import { tr } from '../lib/lang';

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
              {tr('Screening & ', 'Detección y ')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#0ea5e9]">{tr('Diagnosis', 'Diagnóstico')}</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {tr("Diagnosing autism can be challenging because there isn't a specific medical test, like a blood test, to identify it. Instead, specialists rely on a child's developmental milestones and behavioral history.", 'Diagnosticar el autismo puede ser un desafío porque no existe una prueba médica específica, como un análisis de sangre, para identificarlo. En cambio, los especialistas se basan en los hitos del desarrollo y el historial de comportamiento del niño.')}
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
              alt={tr('Medical professional smiling safely', 'Profesional médico sonriendo con calidez')}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8">
              <p className="text-white text-lg lg:text-xl font-bold max-w-2xl">
                {tr('The American Academy of Pediatrics recommends routine ASD screening at 18 and 24 months during well-child visits.', 'La Academia Americana de Pediatría recomienda la detección rutinaria del TEA a los 18 y 24 meses durante las consultas de control del niño sano.')}
              </p>
            </div>
          </div>
        </StagedFadeIn>

        <div className="space-y-12">
          
          {/* Step 1: Developmental Screening */}
          <StagedFadeIn delay={200}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shrink-0 hidden md:block border border-slate-200 dark:border-slate-700">
                 <img src="/images/understanding_autism.webp" alt={tr("Child's hands playing", 'Manos de un niño jugando')} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold text-sm">1</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{tr('Developmental Screening', 'Detección del Desarrollo')}</h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-base">
                  <p>
                    {tr("Developmental screening is a crucial first step, performed by doctors or nurses. This often involves research-backed questionnaires comparing a child's development to peers, covering language, movement, thinking, and emotion.", 'La detección del desarrollo es un primer paso crucial, realizado por médicos o enfermeras. A menudo implica cuestionarios respaldados por investigación que comparan el desarrollo de un niño con el de sus pares, abarcando el lenguaje, el movimiento, el pensamiento y las emociones.')}
                  </p>
                  <p className="font-medium bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border-l-4 border-amber-400">
                    {tr("A very common tool is the Modified Checklist for Autism in Toddlers (M-CHAT-R/F). If your pediatrician hasn't brought this up by 18 months, you have the right to request it.", 'Una herramienta muy común es la Lista de Verificación Modificada para el Autismo en Niños Pequeños (M-CHAT-R/F). Si tu pediatra no la ha mencionado a los 18 meses, tienes derecho a solicitarla.')}
                  </p>
                </div>
              </div>
            </div>
          </StagedFadeIn>

          {/* Step 2: Comprehensive Diagnostic Evaluation */}
          <StagedFadeIn delay={300}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row-reverse gap-8 items-center">
              <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shrink-0 hidden md:block border border-slate-200 dark:border-slate-700">
                 <img src="/images/autism_screening.webp" alt={tr('Medical team taking notes', 'Equipo médico tomando notas')} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] font-bold text-sm">2</div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{tr('Comprehensive Diagnostic Evaluation', 'Evaluación Diagnóstica Integral')}</h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none text-base">
                  <p>
                    {tr('If screening indicates potential signs, a comprehensive evaluation is the next step. This involves a multidisciplinary team to observe interactions, play, communication, and perform parental interviews.', 'Si la detección indica posibles señales, el siguiente paso es una evaluación integral. Esto implica un equipo multidisciplinario que observa interacciones, juego, comunicación y realiza entrevistas a los padres.')}
                  </p>
                  <p>
                    {tr('This evaluation utilizes standardized (non-medical) tools like the Autism Diagnostic Observation Schedule (ADOS-2) and the Autism Diagnostic Interview-Revised (ADI-R).', 'Esta evaluación utiliza herramientas estandarizadas (no médicas) como el Programa de Observación para el Diagnóstico del Autismo (ADOS-2) y la Entrevista para el Diagnóstico del Autismo Revisada (ADI-R).')}
                  </p>
                  <div className="flex items-start gap-4 mt-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
                    <Activity className="h-6 w-6 text-[#00AEEF] mt-1 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{tr('Who performs this evaluation?', '¿Quién realiza esta evaluación?')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {tr('Usually specialists such as Developmental Pediatricians, Neurologists, Child Psychologists/Psychiatrists, Speech-Language Pathologists, and Occupational Therapists.', 'Generalmente especialistas como pediatras del desarrollo, neurólogos, psicólogos/psiquiatras infantiles, patólogos del habla y lenguaje, y terapeutas ocupacionales.')}
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
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{tr('Ruling Out Other Conditions', 'Descartar Otras Condiciones')}</h3>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                {tr('Many behaviors associated with autism can overlap with other disorders. Because of this, certain medical tests (like hearing/vision tests or genetic screening) might be ordered to identify or rule out physiological causes for exhibited symptoms.', 'Muchos comportamientos asociados con el autismo pueden superponerse con otros trastornos. Por esto, se pueden ordenar ciertas pruebas médicas (como exámenes de audición/visión o pruebas genéticas) para identificar o descartar causas fisiológicas de los síntomas presentados.')}
              </p>
              <div className="flex items-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl">
                <Star className="h-5 w-5 text-amber-500 mr-3" />
                <span className="font-bold text-slate-800 dark:text-white text-sm">{tr('A timely diagnosis is power. It opens doors for critical early interventions and support systems for families.', 'Un diagnóstico oportuno es poder. Abre puertas a intervenciones tempranas fundamentales y sistemas de apoyo para las familias.')}</span>
              </div>
            </div>
          </StagedFadeIn>

        </div>
      </div>
    </div>
  );
};

export default Screening;
