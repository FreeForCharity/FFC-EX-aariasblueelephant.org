import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, Gamepad2, HandHeart, LayoutDashboard, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { tr } from '../lib/lang';

const WHATSAPP_COMMUNITY = 'https://chat.whatsapp.com/FPEmQYA8TKd4wzRGB5PXtb';

// Landing page for the printed banner / digital card ("Join the Herd").
// Google is the only sign-in method; signed-in visitors see a welcome instead.
const Join: React.FC = () => {
  const { loginWithGoogle, user, isLoading } = useAuth();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleGoogle = async () => {
    // After the OAuth round trip, land on the dashboard (same as /login's default)
    localStorage.setItem('authReturnTo', '/dashboard');
    await loginWithGoogle();
  };

  const perks = [
    { icon: CalendarHeart, text: tr('Register for events and workshops', 'Regístrate en eventos y talleres') },
    { icon: HandHeart, text: tr('Volunteer and support families', 'Sé voluntario y apoya a las familias') },
    { icon: Gamepad2, text: tr("Play Aaria's free games", 'Juega los juegos gratis de Aaria') },
  ];

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-7 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400"></div>

        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-white p-2 flex items-center justify-center mb-5 shadow-2xl ring-4 ring-sky-500/20">
            <Logo className="h-full w-full" alt="Organization Logo" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {tr('Join the Herd', 'Únete a la Manada')}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {tr('Create your free account to join our inclusive community. 100% free for every family.', 'Crea tu cuenta gratis y únete a nuestra comunidad inclusiva. 100% gratis para cada familia.')}
          </p>
        </div>

        <ul className="space-y-3">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {user ? (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {tr("You're in the herd", 'Ya eres parte de la manada')}{user.name ? `, ${user.name.split(' ')[0]}` : ''}! 💙
            </p>
            <Link to="/dashboard" className="block">
              <Button type="button" fullWidth className="flex items-center justify-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> {tr('Go to my dashboard', 'Ir a mi panel')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleGoogle}
              disabled={isLoading}
              className="relative flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-sm google-login-btn font-semibold"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isLoading ? tr('Connecting...', 'Conectando...') : tr('Sign in / Sign up with Google', 'Iniciar sesión / Registrarte con Google')}
            </Button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {tr('New here? Your account is created automatically the first time you sign in.', '¿Eres nuevo? Tu cuenta se crea automáticamente la primera vez que inicias sesión.')}
            </p>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-800 pt-5 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {tr('Prefer to chat? Join our parent community on WhatsApp.', '¿Prefieres chatear? Únete a nuestra comunidad de padres en WhatsApp.')}
          </p>
          <a
            href={WHATSAPP_COMMUNITY}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> {tr('Join on WhatsApp', 'Unirme por WhatsApp')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Join;
