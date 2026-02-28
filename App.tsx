import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import PermissionDenied from './pages/PermissionDenied';
import ProtectedRoute from './components/ProtectedRoute';
import Delight from './components/Delight';

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

// Loading fallback
const PageLoader = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <div className="h-12 w-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Layout>
            <Suspense fallback={<PageLoader />}>
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