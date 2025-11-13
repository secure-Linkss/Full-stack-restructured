import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Analytics from './components/Analytics'
import Campaign from './components/Campaign'
import Settings from './components/Settings'
import AdminPanel from './components/AdminPanel'
import LoginPage from './components/LoginPage'
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
      // Fetch user data from backend using token
      // In a real app, you would fetch user data from a protected endpoint
	      // For now, we'll assume the token is valid and set a mock user
	      // The actual user data should be fetched from the backend
	      setUser({ 
	        id: 1, 
	        username: 'Brain', 
	        role: 'main_admin', 
	        plan_type: 'enterprise' 
	      })
    }
    setLoading(false)
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
        } else {
          setUser({ 
            id: 1, 
            username: username, 
            role: 'main_admin', 
            plan_type: 'enterprise' 
          });
        }
	        toast.success('Login successful!');
	        return true;
	      } else {
	        toast.error(data.msg || 'Login failed');
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
    return <div>Loading...</div> // Or a proper spinner
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
	    return <div>Loading Application...</div>
	  }
	
	  return (
	    <div className="theme-dark">
	      <Router>
	      <Routes>
	        <Route path="/login" element={<LoginPage onLogin={login} />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout user={user} logout={logout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
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
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
</Router>
	    </div>
	  )
}

export default App
