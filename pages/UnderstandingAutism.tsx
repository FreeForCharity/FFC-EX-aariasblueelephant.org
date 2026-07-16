import React, { useEffect } from 'react';
import { BookOpen, Brain, ShieldAlert, Heart, ArrowRight } from 'lucide-react';
import StagedFadeIn from '../components/StagedFadeIn';
import { tr } from '../lib/lang';

const UnderstandingAutism: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#00AEEF]/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-[#00AEEF]/20 rounded-full mb-6 relative">
              <BookOpen className="h-8 w-8 text-[#00AEEF]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              {tr('Understanding Autism & ', 'Entendiendo el Autismo y el ')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] to-[#8b5cf6]">{tr('Coping', 'Afrontamiento')}</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {tr('If you are hearing an autism diagnosis for the first time, take a deep breath. With the right support and early intervention, your child will grow, learn, and flourish. Here is a guide to help you navigate this new journey with confidence.', 'Si estás escuchando un diagnóstico de autismo por primera vez, respira profundo. Con el apoyo adecuado y la intervención temprana, tu hijo crecerá, aprenderá y florecerá. Aquí tienes una guía para ayudarte a navegar este nuevo camino con confianza.')}
            </p>
          </StagedFadeIn>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Featured Image */}
        <StagedFadeIn delay={100}>
          <div className="w-full h-[400px] mb-12 rounded-3xl overflow-hidden shadow-lg relative group">
            <img 
              src="/images/understanding_autism.webp"
              alt={tr('Parent and child connecting calmly', 'Padre e hijo conectando con calma')}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8">
              <p className="text-white text-lg font-bold">{tr('You are not alone in this journey.', 'No estás solo en este camino.')}</p>
            </div>
          </div>
        </StagedFadeIn>

        <div className="space-y-12">
          
          {/* What is Autism */}
          <StagedFadeIn delay={200}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[#C3AED6]/20 rounded-2xl">
                      <Brain className="h-6 w-6 text-[#C3AED6]" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{tr('What is Autism?', '¿Qué es el Autismo?')}</h2>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed">
                    <p>
                      {tr('Autism Spectrum Disorder (ASD) is a complex developmental difference that can affect communication, social interaction, and behavior. Just decades ago, professionals were less educated about autism, but the picture is much clearer today.', 'El Trastorno del Espectro Autista (TEA) es una diferencia compleja del desarrollo que puede afectar la comunicación, la interacción social y el comportamiento. Hace apenas unas décadas, los profesionales tenían menos formación sobre el autismo, pero hoy el panorama es mucho más claro.')}
                    </p>
                    <p>
                      {tr('There is no single symptom or behavior that identifies everyone with autism. It is a spectrum, meaning each individual experiences it differently. While some individuals may have significant support needs, others may be highly independent. What remains true for every child is that with evidence-based interventions, they have the potential to reach incredible milestones.', 'No existe un único síntoma o comportamiento que identifique a todas las personas con autismo. Es un espectro, lo que significa que cada persona lo experimenta de manera diferente. Mientras algunas personas pueden necesitar mucho apoyo, otras pueden ser muy independientes. Lo que sigue siendo cierto para cada niño es que, con intervenciones basadas en evidencia, tienen el potencial de alcanzar logros increíbles.')}
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shadow-md shrink-0 border-4 border-white dark:border-slate-700">
                  <img src="/images/autism_intervention.webp" alt={tr('Child playing with blocks', 'Niño jugando con bloques')} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </StagedFadeIn>

          {/* Handling Tantrums & Meltdowns */}
          <StagedFadeIn delay={300}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{tr('Handling Meltdowns Safely', 'Cómo Manejar las Crisis con Seguridad')}</h2>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed">
                <p>
                  {tr('It is crucial to differentiate between a behavioral ', 'Es fundamental diferenciar entre una ')}<strong>{tr('tantrum', 'rabieta')}</strong>{tr(' and an autistic ', ' de conducta y una ')}<strong>{tr('meltdown', 'crisis autista (meltdown)')}</strong>{tr('. Meltdowns are often physiological responses to sensory overload or overwhelming emotions, not a manipulation tactic to get what they want.', '. Las crisis suelen ser respuestas fisiológicas a la sobrecarga sensorial o a emociones abrumadoras, no una táctica de manipulación para conseguir algo.')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] flex items-center justify-center font-bold text-sm">1</span>
                      {tr('Stay Calm & Regulated', 'Mantente Calmado y Regulado')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {tr('Your child co-regulates with you. If you panic, their anxiety will escalate. Maintain a soothing, soft tone of voice and avoid expressing anger. Give them the emotional anchor they need.', 'Tu hijo se corregula contigo. Si entras en pánico, su ansiedad se agravará. Mantén un tono de voz suave y calmado, y evita expresar enojo. Dale el ancla emocional que necesita.')}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] flex items-center justify-center font-bold text-sm">2</span>
                      {tr('Reduce Sensory Input', 'Reduce la Estimulación Sensorial')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {tr('Immediately decrease lighting, turn off loud music or TV, and ask bystanders to give space. Creating a "low-arousal" environment helps the nervous system reset safely.', 'Reduce inmediatamente la luz, apaga la música o el televisor, y pide a las personas cercanas que den espacio. Crear un ambiente de "bajo estímulo" ayuda al sistema nervioso a restablecerse con seguridad.')}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] flex items-center justify-center font-bold text-sm">3</span>
                      {tr('Prioritize Physical Safety', 'Prioriza la Seguridad Física')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {tr('Use pillows or soft items if there is a risk of self-injury. Do not physically restrain unless absolutely necessary to prevent immediate harm to themselves or others. Safety first, discipline later.', 'Usa almohadas u objetos suaves si hay riesgo de que se lastime a sí mismo. No lo restrinjas físicamente a menos que sea absolutamente necesario para prevenir un daño inmediato a sí mismo o a otros. Primero la seguridad, luego la disciplina.')}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] flex items-center justify-center font-bold text-sm">4</span>
                      {tr('Visuals & Redirection', 'Apoyos Visuales y Redirección')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {tr('In a distressed state, auditory processing drops drastically. Use simple visual cards or signs. Consider introducing a highly preferred, soothing distractor to divert attention once safety is established.', 'En un estado de angustia, el procesamiento auditivo disminuye drásticamente. Usa tarjetas o señales visuales simples. Considera introducir un elemento de distracción muy preferido y calmante para desviar la atención una vez que la seguridad esté garantizada.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StagedFadeIn>

          {/* Coping Mechanisms for Parents */}
          <StagedFadeIn delay={400}>
            <div className="bg-gradient-to-br from-[#00AEEF] to-sky-600 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1">
                  <Heart className="h-10 w-10 text-white/90 mb-6 drop-shadow-md" />
                  <h2 className="text-3xl font-black mb-6">{tr('Parent Coping Mechanisms', 'Estrategias de Afrontamiento para Padres')}</h2>
                  <p className="text-white/90 mb-8 text-lg leading-relaxed">
                    {tr('Accepting an autism diagnosis can be an emotional journey involving grief, confusion, and fear. It challenges everything you envisioned, but it also opens a new world of profound connection. You are absolutely not alone.', 'Aceptar un diagnóstico de autismo puede ser un camino emocional que involucra duelo, confusión y miedo. Desafía todo lo que habías imaginado, pero también abre un nuevo mundo de conexión profunda. No estás solo en absoluto.')}
                  </p>
                  <ul className="space-y-4 text-base text-white/90 font-medium">
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-white/20 rounded-full mt-0.5 shrink-0">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                      {tr('Seek out parent support groups to connect with others who truly understand the day-to-day.', 'Busca grupos de apoyo para padres y conecta con otros que realmente entienden el día a día.')}
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-white/20 rounded-full mt-0.5 shrink-0">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                      {tr('Give yourself permission to process complex emotions without guilt.', 'Date permiso para procesar emociones complejas sin sentir culpa.')}
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-white/20 rounded-full mt-0.5 shrink-0">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                      {tr('Prioritize your own mental health—therapy is profoundly beneficial. You cannot pour from an empty cup.', 'Prioriza tu propia salud mental: la terapia es profundamente beneficiosa. No puedes servir de una taza vacía.')}
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-white/20 rounded-full mt-0.5 shrink-0">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                      {tr('Remember that your child is the exact same wonderful person they were before the piece of paper gave a name to their differences.', 'Recuerda que tu hijo es exactamente la misma persona maravillosa que era antes de que un papel le diera nombre a sus diferencias.')}
                    </li>
                  </ul>
                </div>

                <div className="w-full md:w-2/5 rounded-2xl overflow-hidden shadow-2xl shrink-0 border-4 border-white/20">
                  <img src="/images/understanding_autism.webp" alt={tr('Embracing families', 'Familias unidas con cariño')} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </StagedFadeIn>

        </div>
      </div>
    </div>
  );
};

export default UnderstandingAutism;
