import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Campaigns from './components/Campaigns';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import FeaturesPage from './components/FeaturesPage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import AboutPage from './components/AboutPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServices';
import TrackingLinks from './components/TrackingLinks';
import Notifications from './components/Notifications';
import Geography from './components/Geography';
import Security from './components/Security';
import LinkShortener from './components/LinkShortener';
import LiveActivity from './components/LiveActivity';
import Profile from './components/Profile';
import SupportTickets from './components/SupportTickets'; // New component
import { Toaster, toast } from 'sonner';

// Auth Context/Hook (Simplified for frontend focus)
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock user data for frontend development
    const mockUser = {
      id: 1,
      username: 'admin',
      email: 'admin@brainlinktracker.com',
      role: 'main_admin', // Use 'user' for non-admin
      avatar_url: 'https://i.pravatar.cc/150?img=1',
    };

    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, this would verify the token
      setUser(mockUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Mock login success
    localStorage.setItem('token', 'mock-token');
    setUser({
      id: 1,
      username: 'admin',
      email: 'admin@brainlinktracker.com',
      role: 'main_admin',
      avatar_url: 'https://i.pravatar.cc/150?img=1',
    });
    toast.success('Login successful! (Mock)');
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out');
  };

  return { user, loading, login, logout };
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground text-xl">Loading...</div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error('Access Denied: You do not have permission to view this page.');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const { user, loading, login, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/tracking-links': return 'Tracking Links';
      case '/live-activity': return 'Live Activity';
      case '/campaigns': return 'Campaigns';
      case '/analytics': return 'Advanced Analytics';
      case '/geography': return 'Geography';
      case '/security': return 'Security Center';
      case '/settings': return 'User Settings';
      case '/link-shortener': return 'Link Shortener';
      case '/admin': return 'Admin Panel';
      case '/profile': return 'User Profile';
      case '/notifications': return 'Notifications';
      case '/tickets': return 'Support Tickets'; // New route
      default: return 'Dashboard';
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground text-xl">Loading Application...</div>
    </div>;
  }

  // Helper to wrap protected routes with Layout and Auth props
  const ProtectedLayout = ({ children, allowedRoles }) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout user={user} logout={logout} pageTitle={pageTitle}>
        {children}
      </Layout>
    </ProtectedRoute>
  );

  return (
    <div className="theme-dark">
      <Toaster richColors position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes (Not to be touched) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={login} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          {/* Protected Routes (User Dashboard) */}
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/tracking-links" element={<ProtectedLayout><TrackingLinks /></ProtectedLayout>} />
          <Route path="/live-activity" element={<ProtectedLayout><LiveActivity /></ProtectedLayout>} />
          <Route path="/campaigns" element={<ProtectedLayout><Campaigns /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
          <Route path="/geography" element={<ProtectedLayout><Geography /></ProtectedLayout>} />
          <Route path="/security" element={<ProtectedLayout><Security /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="/link-shortener" element={<ProtectedLayout><LinkShortener /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile user={user} /></ProtectedLayout>} />
          <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
          <Route path="/tickets" element={<ProtectedLayout><SupportTickets /></ProtectedLayout>} /> {/* New route */}

          {/* Admin Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedLayout allowedRoles={['main_admin', 'admin']}>
                <AdminPanel />
              </ProtectedLayout>
            } 
          />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
