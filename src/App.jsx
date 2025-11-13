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
import ContactPage from './components/ContactPage'
import TrackingLinks from './components/TrackingLinks'
import Notifications from './components/Notifications'
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
        // Use the actual user data from the backend response
        if (data.user) {
          setUser(data.user);
        }
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
      <div className="text-white">Loading...</div>
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
      <div className="text-white">Loading Application...</div>
    </div>
  }

  return (
    <div className="theme-dark">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={login} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="links" element={<TrackingLinks />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="campaigns" element={<Campaign />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            
            {/* Admin Protected Routes */}
            <Route 
              path="admin" 
              element={
                <ProtectedRoute allowedRoles={['main_admin', 'admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Legacy protected routes for backward compatibility */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
          </Route>
          
          <Route 
            path="/links" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<TrackingLinks />} />
          </Route>

          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Analytics />} />
          </Route>

          <Route 
            path="/campaigns" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Campaign />} />
          </Route>

          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Settings />} />
          </Route>

          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Notifications />} />
          </Route>

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['main_admin', 'admin']}>
                <Layout user={user} logout={logout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminPanel />} />
          </Route>
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App