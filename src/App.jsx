import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Analytics from './components/Analytics'
import Campaign from './components/Campaign'
import Settings from './components/Settings'
import AdminPanel from './components/AdminPanel'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import HomePage from './components/HomePage'
import FeaturesPage from './components/FeaturesPage'
import PricingPage from './components/PricingPage'
import ContactPage from './components/ContactPage'
import AboutPage from './components/AboutPage'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import TermsOfServicePage from './components/TermsOfServices'
import TrackingLinks from './components/TrackingLinks'
import Notifications from './components/Notifications'
import Geography from './components/Geography'
import Security from './components/Security'
import LinkShortener from './components/LinkShortener'
import LiveActivity from './components/LiveActivity'
import Profile from './components/Profile'
import { toast } from 'sonner'

// Auth Context/Hook
const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for token and fetch user data
    const token = localStorage.getItem('token')
    if (token) {
      // Verify the token with a backend call
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user)
          } else {
            localStorage.removeItem('token')
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.token || data.access_token;
        localStorage.setItem('token', token);
        setUser(data.user);
        toast.success('Login successful!');
        return true;
      } else {
        toast.error(data.error || 'Login failed');
        return false;
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      return false;
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.info('Logged out')
  }

  return { user, loading, login, logout }
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error('Access Denied: You do not have permission to view this page.')
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const App = () => {
  const { user, loading, login, logout } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-white text-xl">Loading Application...</div>
    </div>
  }

  return (
    <div className="theme-dark">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={login} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/links" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <TrackingLinks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/campaigns" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Campaign />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/geography" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Geography />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/security" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Security />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/shortener" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <LinkShortener />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/live-activity" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <LiveActivity />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Profile user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout}>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Admin Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['main_admin', 'admin']}>
                <Layout user={user} logout={logout}>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
