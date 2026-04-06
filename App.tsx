// Main application entry point - Triggering redeploy 3 (Cache bust)
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import PermissionDenied from './pages/PermissionDenied';
import ProtectedRoute from './components/ProtectedRoute';
import Delight from './components/Delight';
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
      if (returnTo) {
        localStorage.removeItem('authReturnTo');
        let redirectPath = returnTo;
        if (window.location.hostname.includes('github.io') && !redirectPath.startsWith('/FFC-EX-aariasblueelephant.org')) {
          redirectPath = '/FFC-EX-aariasblueelephant.org' + redirectPath;
        }
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, navigate]);

  return null;
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

// Loading fallback
const PageLoader = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50 dark:bg-brand-dark transition-colors duration-500">
    <div className="relative mb-6">
      <div className="h-20 w-20 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
      <div className="absolute top-0 left-0 h-20 w-20 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <img src="/logo.png" alt="ABE" className="h-10 w-10 opacity-70 animate-pulse" />
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
                    <ProtectedRoute allowedRoles={['BoardMember.Owner', 'User', 'Donor']}>
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
                <Route path="/story" element={<Navigate to="/about?share=story" replace />} />
              </Routes>
            </Suspense>
          </Layout>
          <Delight />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;