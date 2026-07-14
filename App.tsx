// Main application entry point - Triggering redeploy 3 (Cache bust)
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import PermissionDenied from './pages/PermissionDenied';
import ProtectedRoute from './components/ProtectedRoute';
import Delight from './components/Delight';
import ParentalGate from './components/ParentalGate';
import ScrollToTop from './components/ScrollToTop';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Simple cache-buster to ensure mobile users get the latest scrolling fixes
const VersionWatcher = () => {
    React.useEffect(() => {
        const checkVersion = async () => {
            try {
                // Fetch current version from public/version.json
                const response = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
                const data = await response.json();
                const remoteVersion = data.version;
                const localVersion = localStorage.getItem('app_version');

                if (remoteVersion && remoteVersion !== localVersion) {
                    // [SENTRY] GUARD: Never refresh if we are currently landing with auth tokens
                    const hasAuthTokens = window.location.search.includes('userId') || window.location.hash.includes('userId');
                    
                    if (hasAuthTokens) {
                        console.warn('ABE: New version detected, but delaying refresh for Auth Handshake.');
                        localStorage.setItem('app_version', remoteVersion); // Silently update version so it doesn't loop
                        return;
                    }

                    console.log('ABE: New version detected, refreshing cache...', remoteVersion);
                    localStorage.setItem('app_version', remoteVersion);
                    // Force a hard reload to clear stubborn mobile cache
                    window.location.reload();
                }
            } catch (e) {
                // Silent fail if version file is missing during dev
            }
        };
        checkVersion();
    }, []);
    return null;
};

// Internal component to handle post-login redirects cleanly through React Router
const AuthRedirector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const returnTo = localStorage.getItem('authReturnTo');
      if (returnTo && returnTo !== '/') {
        localStorage.removeItem('authReturnTo');
        // Defer execution slightly to ensure Router is fully mounted and ready
        setTimeout(() => {
          navigate(returnTo, { replace: true });
        }, 100);
      }
    }
  }, [user, navigate]);

  return null;
};

// Component to handle external redirects (e.g. Google Forms)
const ExternalRedirect = ({ url, message = "Taking you to your destination..." }: { url: string, message?: string }) => {
  React.useEffect(() => {
    window.location.replace(url);
  }, [url]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-brand-dark transition-colors duration-500">
      <div className="h-12 w-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Redirecting you...</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2">{message}</p>
    </div>
  );
};

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Events = lazy(() => import('./pages/Events'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Donate = lazy(() => import('./pages/Donate'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const WheelPage = lazy(() => import('./pages/WheelPage'));
const Resources = lazy(() => import('./pages/Resources'));
const UnderstandingAutism = lazy(() => import('./pages/UnderstandingAutism'));
const Interventions = lazy(() => import('./pages/Interventions'));
const Screening = lazy(() => import('./pages/Screening'));
const CircleOfFriends = lazy(() => import('./pages/CircleOfFriends'));
const BelusWorld = lazy(() => import('./pages/BelusWorld'));
const Games = lazy(() => import('./pages/Games'));
const Playtest = lazy(() => import('./pages/Playtest'));

// Loading fallback
const PageLoader = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-brand-dark transition-colors duration-500">
    <div className="relative mb-6">
      <div className="h-20 w-20 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
      <div className="absolute top-0 left-0 h-20 w-20 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <img src="/logo.webp" alt="ABE" className="h-10 w-10 opacity-70 animate-pulse" />
      </div>
    </div>
    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Creating an Inclusive World</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto animate-pulse">Making sure everything is perfect for you...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <VersionWatcher />
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <AuthRedirector />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Navigate to="/login" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/permission-denied" element={<PermissionDenied />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/volunteer" element={<Volunteer />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/wheel" element={<WheelPage />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/resources/understanding" element={<UnderstandingAutism />} />
                <Route path="/resources/interventions" element={<Interventions />} />
                <Route path="/resources/screening" element={<Screening />} />
                <Route path="/circle-of-friends" element={<CircleOfFriends />} />
                <Route path="/games" element={<Games />} />
                <Route path="/playtest" element={<Playtest />} />
                <Route path="/nelus-world" element={<BelusWorld />} />
                {/* aliases: old link + likely spelling both land on the game */}
                <Route path="/belus-world" element={<Navigate to="/nelus-world" replace />} />
                <Route path="/nilus-world" element={<Navigate to="/nelus-world" replace />} />
                <Route path="/buddy" element={<Navigate to="/circle-of-friends" replace />} />
                <Route path="/story" element={<Navigate to="/?share=story" replace />} />

                {/* Short game links — aariasblueelephant.org/1, /2, … */}
                <Route path="/1" element={<ExternalRedirect url="/elly-tubbies/index.html" message="Loading Aaria's Elly-Tubbies… 🐘☀️" />} />
                <Route path="/2" element={<ExternalRedirect url="/blockcraft/index.html" message="Loading Aaria's Block Craft 3D… 🧱🌈" />} />
                <Route path="/3" element={<Navigate to="/nelus-world" replace />} />
                <Route path="/4" element={<ExternalRedirect url="/roadsafety/index.html" message="Loading Aaria's Road Safety Heroes… 🚲" />} />
                <Route path="/5" element={<ExternalRedirect url="/doughlab/index.html" message="Loading Aaria's Dough Lab… 🍪" />} />
                <Route path="/6" element={<ExternalRedirect url="/magnetblocks/index.html" message="Loading Aaria's Magnet Blocks… 🧲🧱" />} />
                <Route path="/7" element={<ExternalRedirect url="/helpinghands/index.html" message="Loading Aaria's Helping Hands… 🖐️💙" />} />
                <Route path="/8" element={<ExternalRedirect url="/grocery/index.html" message="Loading Aaria's Grocery Store… 🛒🍎" />} />
                <Route path="/9" element={<ExternalRedirect url="/dayplanner/index.html" message="Loading Aaria's Day Planner… 📅🌅" />} />
                <Route path="/10" element={<ExternalRedirect url="/feelings/index.html" message="Loading Aaria's Feelings Faces… 🎭" />} />
                <Route path="/11" element={<ExternalRedirect url="/rhythm/index.html" message="Loading Aaria's Rhythm & Calm… 🎵" />} />
                <Route path="/12" element={<ExternalRedirect url="/flying/index.html" message="Loading Aaria's Flying Elephant… 🐘☁️" />} />

                {/* External Redirects */}
                <Route path="/inclusion" element={<ExternalRedirect url="https://forms.gle/mCtYLoiJa3j1Ztqe9" message="Taking you to our inclusion form." />} />
                <Route path="/RSVP" element={<ExternalRedirect url="https://docs.google.com/forms/d/e/1FAIpQLSeanyQe-RaswGQ_jIti8PLquRKMjcQokBHt6-rZZXbkSQR7eg/viewform?usp=sharing&ouid=102650340016089261237" message="Taking you to the RSVP form." />} />
                <Route path="/rsvp" element={<ExternalRedirect url="https://docs.google.com/forms/d/e/1FAIpQLSeanyQe-RaswGQ_jIti8PLquRKMjcQokBHt6-rZZXbkSQR7eg/viewform?usp=sharing&ouid=102650340016089261237" message="Taking you to the RSVP form." />} />
                <Route path="/softball" element={<ExternalRedirect url="https://forms.gle/Ec5Y5N3uE7URZeE79" message="Taking you to the Softball form." />} />
              </Routes>
            </Suspense>
          </Layout>
          <Delight />
          <ParentalGate />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;