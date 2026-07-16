import React, { useEffect } from 'react';
import { ShieldCheck, Activity, Users, Sparkles, HandHeart, CalendarHeart, GraduationCap } from 'lucide-react';
import StagedFadeIn from '../components/StagedFadeIn';
import { tr } from '../lib/lang';

const Interventions: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#10b981]/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-[#10b981]/20 rounded-full mb-6 relative">
              <Activity className="h-8 w-8 text-[#10b981]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              {tr('Interventions & ', 'Intervenciones y ')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#8b5cf6]">{tr('Therapies', 'Terapias')}</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {tr('The dramatic increase in autism awareness has led to highly effective, evidence-based practices (EBPs). Early intervention is crucial—it can significantly improve communication, social skills, and cognitive development.', 'El notable aumento en la conciencia sobre el autismo ha dado lugar a prácticas basadas en evidencia (EBPs) muy efectivas. La intervención temprana es fundamental: puede mejorar significativamente la comunicación, las habilidades sociales y el desarrollo cognitivo.')}
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
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{tr('No Single Intervention Fits All', 'Ninguna Intervención Sirve para Todos')}</h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                {tr('Keep in mind that no single intervention is effective for everyone. Families should collaborate with medical professionals to find the right fit. When evaluating options, always ask questions about staff training, predictable schedules, individual attention, and how progress is continuously measured.', 'Ten en cuenta que ninguna intervención es efectiva para todos por igual. Las familias deben colaborar con los profesionales médicos para encontrar la opción adecuada. Al evaluar opciones, pregunta siempre sobre la capacitación del personal, los horarios predecibles, la atención individual y cómo se mide el progreso continuamente.')}
              </p>
            </div>
            <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shadow-md shrink-0 border border-slate-200 dark:border-slate-700">
              <img src="/images/autism_intervention.webp" alt={tr('Special educator teaching', 'Educador especializado enseñando')} className="w-full h-full object-cover" />
            </div>
          </div>
        </StagedFadeIn>

        {/* Therapy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <StagedFadeIn delay={200}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#A8E6CF]/20 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7 text-[#10b981]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {tr('Applied Behavior Analysis (ABA)', 'Análisis Conductual Aplicado (ABA)')}
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {tr('Often considered a gold standard, ABA systematically applies behavioral principles to improve socially significant behaviors, including reading, communication, and adaptive living skills. Therapists define goals, break them down, and measure progress continuously.', 'A menudo considerado el estándar de oro, el ABA aplica de forma sistemática principios conductuales para mejorar comportamientos socialmente significativos, incluyendo la lectura, la comunicación y las habilidades de vida adaptativa. Los terapeutas definen metas, las desglosan y miden el progreso continuamente.')}
              </p>
            </div>
          </StagedFadeIn>

          <StagedFadeIn delay={300}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#FFB6C1]/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-[#f43f5e]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {tr('DIR / Floor Time', 'DIR / Floor Time')}
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {tr('A relationship-based model designed to help children work around processing difficulties. By getting on the floor to play, parents and therapists reestablish effective contact and guide children to master developmentally appropriate skills through engagement rather than directives.', 'Un modelo basado en la relación diseñado para ayudar a los niños a superar dificultades de procesamiento. Al ponerse en el suelo a jugar, los padres y terapeutas restablecen un contacto efectivo y guían a los niños a dominar habilidades apropiadas para su desarrollo a través del juego compartido en lugar de instrucciones directas.')}
              </p>
            </div>
          </StagedFadeIn>

          <StagedFadeIn delay={400}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#00AEEF]/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-[#00AEEF]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {tr('SCERTS® Model', 'Modelo SCERTS®')}
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {tr("A comprehensive approach prioritizing Social Communication, Emotional Regulation, and Transactional Support. It heavily involves parents and educators to build a support network that adapts to the child's evolving daily needs.", 'Un enfoque integral que prioriza la Comunicación Social, la Regulación Emocional y el Apoyo Transaccional. Involucra activamente a padres y educadores para construir una red de apoyo que se adapta a las necesidades diarias cambiantes del niño.')}
              </p>
            </div>
          </StagedFadeIn>

          <StagedFadeIn delay={500}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 h-full hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mb-6">
                <CalendarHeart className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {tr('Early Start Denver Model (ESDM)', 'Modelo Denver de Inicio Temprano (ESDM)')}
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {tr('A behavioral early intervention approach specifically engineered for children ages 12 to 48 months. It integrates a play-based, developmental curriculum with teaching procedures focused on relationships and positive affect.', 'Un enfoque de intervención temprana conductual diseñado específicamente para niños de 12 a 48 meses. Integra un currículo de desarrollo basado en el juego con procedimientos de enseñanza centrados en las relaciones y el afecto positivo.')}
              </p>
            </div>
          </StagedFadeIn>

        </div>

        {/* Supplemental Therapies */}
        <StagedFadeIn delay={600}>
          <div className="mt-12 bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 shadow-inner border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">{tr('Core Supportive Therapies', 'Terapias de Apoyo Principales')}</h3>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <HandHeart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{tr('Occupational Therapy (OT)', 'Terapia Ocupacional (TO)')}</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {tr('OT helps children develop necessary skills for daily living (eating, dressing, writing). It often includes sensory integration therapy—a specialized framework addressing sensory processing differences, helping children better handle light, sound, and textures.', 'La TO ayuda a los niños a desarrollar las habilidades necesarias para la vida diaria (comer, vestirse, escribir). A menudo incluye terapia de integración sensorial, un marco especializado que aborda las diferencias en el procesamiento sensorial, ayudando a los niños a manejar mejor la luz, el sonido y las texturas.')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-10 h-10 bg-[#0ea5e9]/20 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-[#0ea5e9]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{tr('Speech-Language Therapy', 'Terapia del Habla y Lenguaje')}</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {tr('Vital for both verbal and non-verbal communication. Therapists teach everything from forming words to reading facial expressions. For non-speaking individuals, they introduce AAC (Augmentative and Alternative Communication) tools to give them a voice.', 'Vital tanto para la comunicación verbal como la no verbal. Los terapeutas enseñan desde formar palabras hasta interpretar expresiones faciales. Para las personas no verbales, introducen herramientas de CAA (Comunicación Aumentativa y Alternativa) para darles una voz.')}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </StagedFadeIn>
      </div>
    </div>
  );
};

export default Interventions;
