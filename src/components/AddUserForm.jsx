import { useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"

export function AddUserForm({ onUserAdded, onClose }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "member",
    status: "active"
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError("")
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required")
      return false
    }
    if (formData.username.length < 2) {
      setError("Username must be at least 2 characters")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email address")
      return false
    }
    if (!formData.password) {
      setError("Password is required")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSuccess("User created successfully!")
      
      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "member",
        status: "active"
      })

      // Notify parent component
      if (onUserAdded) {
        onUserAdded(data)
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        if (onClose) onClose()
      }, 2000)
    } catch (error) {
      setError(error.message || 'Error adding user')
      console.error('Error adding user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Add New User</h2>
          <p className="text-sm text-slate-400 mt-1">Create a new user account with specified role and permissions</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{success}</p>
              <p className="text-xs text-green-300 mt-1">The user has been created and can now log in</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="john.doe"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Unique identifier for login</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Valid email address for notifications</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
          </div>

          {/* Role and Status - 2 Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Role <span className="text-red-400">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="assistant_admin">Assistant Admin</option>
                <option value="main_admin">Main Admin</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">User permission level</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Account status</p>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
            <p className="text-xs font-semibold text-blue-300 mb-2">Role Permissions:</p>
            <ul className="text-xs text-blue-200 space-y-1">
              {formData.role === 'member' && (
                <>
                  <li>• Create and manage own links</li>
                  <li>• View own analytics</li>
                  <li>• Basic campaign management</li>
                </>
              )}
              {formData.role === 'admin' && (
                <>
                  <li>• Manage all users and links</li>
                  <li>• Access admin dashboard</li>
                  <li>• View system analytics</li>
                  <li>• Cannot modify system settings</li>
                </>
              )}
              {formData.role === 'assistant_admin' && (
                <>
                  <li>• Assist with user management</li>
                  <li>• View system reports</li>
                  <li>• Limited admin access</li>
                </>
              )}
              {formData.role === 'main_admin' && (
                <>
                  <li>• Full system access</li>
                  <li>• Manage all settings</li>
                  <li>• User and role management</li>
                  <li>• System configuration</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-700">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-all font-medium text-sm"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUserForm


export default AddUserForm
