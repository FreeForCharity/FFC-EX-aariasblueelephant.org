import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, Send, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { tr, isEs } from '../lib/lang';

const INTEREST_LABELS_ES: Record<string, string> = {
  'Event Support': 'Apoyo en Eventos',
  'Event Facilitator': 'Facilitador de Eventos',
  'Administrative Help': 'Ayuda Administrativa',
  'Fundraising': 'Recaudación de Fondos',
  'Professional Services (Therapy/Legal)': 'Servicios Profesionales (Terapia/Legal)',
};

const Volunteer: React.FC = () => {
  const { submitVolunteerApp, volunteerApplications } = useData();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const pendingApp = volunteerApplications.find(app => app.email === user?.email && app.status === 'Pending');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    interest: 'Event Support',
    message: ''
  });

  // Re-sync if the user logs in after the component loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitVolunteerApp({
      name: formData.name,
      email: formData.email,
      interest: formData.interest,
    });

    if (result.success) {
      setSubmitted(true);
    } else {
      alert(tr('Submission failed: ', 'Error al enviar: ') + result.error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto">
        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-8 animate-bounce">
          <Heart className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{tr('Application Received!', '¡Solicitud Recibida!')}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-10">
          {tr("Thank you for offering your time and heart to Aaria's Blue Elephant.", "Gracias por ofrecer tu tiempo y corazón a Aaria's Blue Elephant.")}{' '}
          {tr('Your commitment to building inclusive communities is what makes our mission possible.', 'Tu compromiso de construir comunidades inclusivas es lo que hace posible nuestra misión.')}{' '}
          {tr('Our team will review your application and reach out to you at', 'Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en')} <strong>{formData.email}</strong> {tr('to discuss how we can best signify your impact together.', 'para hablar de cómo podemos amplificar tu impacto juntos.')}
        </p>

        <div className="w-full bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-8 mb-8 border border-sky-100 dark:border-sky-800/50">
          <h3 className="text-sky-900 dark:text-sky-300 font-bold mb-3">{tr('While you wait...', 'Mientras esperas...')}</h3>
          <p className="text-sky-700 dark:text-sky-400 mb-6">
            {tr(
              "Help us fund the very programs you'll be supporting. Every donation directly creates more inclusive spaces for children through our events.",
              'Ayúdanos a financiar los mismos programas que apoyarás. Cada donación crea directamente más espacios inclusivos para niños a través de nuestros eventos.'
            )}
          </p>
          <Link
            to="/#join-herd"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-cyan text-white rounded-full font-bold hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-500/25"
          >
            {tr('Signify Impact with a Donation', 'Amplifica tu Impacto con una Donación')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setSubmitted(false)}>{tr('Back to Form', 'Volver al Formulario')}</Button>
          <Link to="/dashboard">
            <Button variant="outline">{tr('Go to My Dashboard', 'Ir a Mi Panel')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (pendingApp) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Send className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{tr('Application Under Review', 'Solicitud en Revisión')}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {tr(
            'You already have an active volunteer application being processed. To provide the best experience for our community, we limit active applications to one at a time.',
            'Ya tienes una solicitud de voluntariado activa siendo procesada. Para brindar la mejor experiencia a nuestra comunidad, limitamos las solicitudes activas a una a la vez.'
          )}
        </p>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700 mb-8">
          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
            {tr('Currently interested in:', 'Actualmente interesado en:')} <span className="font-bold text-slate-700 dark:text-slate-200">{isEs() ? (INTEREST_LABELS_ES[pendingApp.interest] || pendingApp.interest) : pendingApp.interest}</span>
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline">{tr('Check Status in Dashboard', 'Ver Estado en el Panel')}</Button>
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mb-6">
          <Users className="h-8 w-8 text-sky-600 dark:text-sky-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{tr('Want to Collaborate?', '¿Quieres Colaborar?')}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {tr(
            'To submit a volunteer application and get involved with our events and events, please sign in or create an account first. This helps us stay connected!',
            'Para enviar una solicitud de voluntariado y participar en nuestros eventos, primero inicia sesión o crea una cuenta. ¡Esto nos ayuda a mantenernos conectados!'
          )}
        </p>
        <Link to="/login" state={{ returnTo: '/volunteer' }}>
          <Button size="lg" className="flex items-center gap-2 shadow-lg shadow-sky-500/25">
            {tr('Sign In to Volunteer', 'Iniciar Sesión para Ser Voluntario')} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/20 mb-6">
          <Heart className="h-8 w-8 text-sky-600 dark:text-sky-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{tr('Volunteer With Us', 'Sé Voluntario con Nosotros')}</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          {tr(
            'Help us create inclusive spaces. We need compassionate individuals for events, events, and administrative support.',
            'Ayúdanos a crear espacios inclusivos. Necesitamos personas compasivas para eventos y apoyo administrativo.'
          )}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Full Name', 'Nombre Completo')}</label>
              <input
                type="text"
                id="name"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Email Address', 'Correo Electrónico')}</label>
              <input
                type="email"
                id="email"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Phone Number', 'Número de Teléfono')}</label>
              <input
                type="tel"
                id="phone"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="interest" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Area of Interest', 'Área de Interés')}</label>
              <select
                id="interest"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              >
                <option value="Event Support">{tr('Event Support', 'Apoyo en Eventos')}</option>
                <option value="Event Facilitator">{tr('Event Facilitator', 'Facilitador de Eventos')}</option>
                <option value="Administrative Help">{tr('Administrative Help', 'Ayuda Administrativa')}</option>
                <option value="Fundraising">{tr('Fundraising', 'Recaudación de Fondos')}</option>
                <option value="Professional Services (Therapy/Legal)">{tr('Professional Services (Therapy/Legal)', 'Servicios Profesionales (Terapia/Legal)')}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Why do you want to volunteer?', '¿Por qué quieres ser voluntario?')}</label>
            <textarea
              id="message"
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            ></textarea>
          </div>

          <Button type="submit" fullWidth size="lg" className="flex items-center justify-center gap-2">
            {tr('Submit Application', 'Enviar Solicitud')} <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Volunteer;