import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react'

const CreateLinkModal = ({ isOpen, onClose, onLinkCreated }) => {
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    campaign: '',
    domain: 'vercel',
    customDomain: '',
    expiryDate: '',
    password: '',
    description: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [adminDomains, setAdminDomains] = useState([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [createdLink, setCreatedLink] = useState(null)

  // Fetch admin-loaded domains on component mount
  useEffect(() => {
    if (isOpen) {
      fetchAdminDomains()
    }
  }, [isOpen])

  const fetchAdminDomains = async () => {
    try {
      setDomainsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/domains', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const domains = Array.isArray(data) ? data : data.items || []
        const activeDomains = domains.filter(d => d.is_active)
        setAdminDomains(activeDomains)
      }
    } catch (error) {
      console.error('Failed to fetch admin domains:', error)
      setAdminDomains([])
    } finally {
      setDomainsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate required fields
    if (!formData.originalUrl) {
      setError('Original URL is required')
      setLoading(false)
      return
    }

    if (!formData.domain) {
      setError('Please select a domain')
      setLoading(false)
      return
    }

    if (formData.domain === 'custom' && !formData.customDomain) {
      setError('Custom domain is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedLink(data.link)
        setSuccess('Link created successfully!')
        onLinkCreated(data.link)
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            originalUrl: '',
            title: '',
            campaign: '',
            domain: 'vercel',
            customDomain: '',
            expiryDate: '',
            password: '',
            description: ''
          })
          setCreatedLink(null)
          onClose()
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create link')
      }
    } catch (error) {
      setError('Network error occurred. Please try again.')
      console.error('Error creating link:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Create Short Link</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Generate a new shortened URL with advanced tracking</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm sm:text-base">{success}</p>
              {createdLink && (
                <p className="text-xs sm:text-sm text-green-300 mt-1">Short URL: {createdLink.short_url}</p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Original URL */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Original URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              name="originalUrl"
              value={formData.originalUrl}
              onChange={handleChange}
              placeholder="https://example.com/your-long-url"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              required
            />
            <p className="text-xs text-slate-400 mt-1">The destination URL you want to shorten</p>
          </div>

          {/* Title and Campaign - 2 Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="My Campaign Link"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
              <p className="text-xs text-slate-400 mt-1">Optional descriptive title</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Campaign
              </label>
              <input
                type="text"
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                placeholder="Summer Sale 2025"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
              <p className="text-xs text-slate-400 mt-1">Campaign identifier for tracking</p>
            </div>
          </div>

          {/* Domain Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Domain <span className="text-red-400">*</span>
              </label>
              <select
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              >
                <option value="vercel">Vercel Domain (Default)</option>
                {!domainsLoading && adminDomains.length > 0 && (
                  <optgroup label="Admin-Loaded Domains">
                    {adminDomains.map(domain => (
                      <option key={domain.id} value={domain.domain}>
                        {domain.domain} {domain.description ? `- ${domain.description}` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Integration Services">
                  <option value="shortio">Short.io Service</option>
                  <option value="custom">Custom Domain</option>
                </optgroup>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {domainsLoading ? 'Loading domains...' : `${adminDomains.length} custom domains available`}
              </p>
            </div>

            {/* Custom Domain Input - Show when custom is selected */}
            {formData.domain === 'custom' && (
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Custom Domain <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="customDomain"
                  value={formData.customDomain}
                  onChange={handleChange}
                  placeholder="yourdomain.com"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
                <p className="text-xs text-slate-400 mt-1">Enter your custom domain</p>
              </div>
            )}

            {/* Short.io Domain Info - Show when shortio is selected */}
            {formData.domain === 'shortio' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-blue-300">
                  <span className="font-semibold">Short.io Domain:</span> Secure-links.short.gy
                </p>
                <p className="text-xs text-blue-400 mt-1">Premium short link service with advanced analytics</p>
              </div>
            )}
          </div>

          {/* Expiry Date and Password - 2 Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
              <p className="text-xs text-slate-400 mt-1">Link will expire on this date</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password Protection (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Protect link with password</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about this link..."
              rows="3"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">Internal notes for reference</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Link'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateLinkModal

