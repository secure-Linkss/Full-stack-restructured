import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, XCircle, Zap, Shield, Brain, Check } from 'lucide-react'
import { toast } from 'sonner'
import Logo from './Logo'
import { useSEO } from '../hooks/useSEO'

const PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 'Free',
    billing: 'Admin-approved',
    icon: Zap,
    color: 'border-slate-600',
    activeColor: 'border-[#10b981] bg-[#10b981]/5',
    badgeColor: 'bg-slate-700 text-slate-300',
    features: ['Up to 3 tracking links', '50 clicks per link', 'Quantum Redirect (Stage 1–2)', 'Basic bot filtering', '14-day trial period'],
    note: '24–72 hr admin approval',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£100',
    billing: '/month',
    icon: Shield,
    color: 'border-slate-600',
    activeColor: 'border-[#3b82f6] bg-[#3b82f6]/5',
    badgeColor: 'bg-[#3b82f6] text-white',
    badge: 'Most Popular',
    features: ['Unlimited tracking links', 'Full Quantum Redirect (4-stage)', 'Inbox Score™', 'Channel Adaptive Mode™', '2–3 custom domains', 'CSV export'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '£150',
    billing: '/month',
    icon: Brain,
    color: 'border-slate-600',
    activeColor: 'border-[#8b5cf6] bg-[#8b5cf6]/5',
    badgeColor: 'bg-[#8b5cf6] text-white',
    badge: 'Full Power',
    features: ['Everything in Pro', 'Inbox Shield AI™ auto-defense', 'Unlimited domain rotation', 'ASN pattern auto-blocking', 'Admin Intelligence Layer', 'Dedicated account manager'],
  },
]

const RegisterPage = () => {
  useSEO({
    title: 'Create Account — Start Your Free Trial',
    description: 'Sign up for Brain Link Tracker. Start free with a 14-day trial or choose Pro/Premium for unlimited tracking links, Quantum Redirect, and full analytics suite.',
    keywords: 'sign up link tracker, create account, free trial link tracking, quantum redirect signup',
    canonical: '/register',
  });
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Normalize plan from URL — accept trial/free/pro/premium
  const rawPlan = searchParams.get('plan') || localStorage.getItem('selected_plan') || 'trial'
  const normalizePlan = (p) => {
    if (p === 'free') return 'trial'
    if (['trial', 'pro', 'premium'].includes(p)) return p
    return 'trial'
  }

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: normalizePlan(rawPlan),
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] })

  useEffect(() => {
    const plan = normalizePlan(rawPlan)
    setFormData(prev => ({ ...prev, plan }))
  }, [rawPlan])

  const checkPasswordStrength = (password) => {
    const checks = [
      { text: 'At least 8 characters', met: password.length >= 8 },
      { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { text: 'Contains number', met: /[0-9]/.test(password) },
      { text: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    ]
    setPasswordStrength({ score: checks.filter(c => c.met).length, feedback: checks })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'password') checkPasswordStrength(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }
    if (passwordStrength.score < 3) {
      toast.error('Password is too weak. Please meet at least 3 requirements.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          plan: formData.plan,
        }),
      })
      const data = await response.json()

      if (response.ok) {
        localStorage.removeItem('selected_plan')
        toast.success('Registration successful! Your account is pending admin approval.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500'
    if (passwordStrength.score === 3) return 'bg-yellow-500'
    if (passwordStrength.score === 4) return 'bg-blue-500'
    return 'bg-green-500'
  }
  const strengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak'
    if (passwordStrength.score === 3) return 'Fair'
    if (passwordStrength.score === 4) return 'Good'
    return 'Strong'
  }

  const selectedPlan = PLANS.find(p => p.id === formData.plan) || PLANS[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="flex justify-center mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Selector */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p className="text-slate-400 text-sm mb-5">Select the plan that fits your needs. You can upgrade anytime.</p>
            <div className="space-y-3">
              {PLANS.map(plan => {
                const Icon = plan.icon
                const isSelected = formData.plan === plan.id
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, plan: plan.id }))}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? plan.activeColor : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-current/10' : 'bg-slate-700'}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? (plan.id === 'pro' ? 'text-[#3b82f6]' : plan.id === 'premium' ? 'text-[#8b5cf6]' : 'text-[#10b981]') : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>{plan.name}</span>
                            {plan.badge && (
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${plan.badgeColor}`}>{plan.badge}</span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className={`text-lg font-extrabold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{plan.price}</span>
                            <span className="text-xs text-slate-400">{plan.billing}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${isSelected ? (plan.id === 'pro' ? 'border-[#3b82f6] bg-[#3b82f6]' : plan.id === 'premium' ? 'border-[#8b5cf6] bg-[#8b5cf6]' : 'border-[#10b981] bg-[#10b981]') : 'border-slate-600'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <ul className="space-y-1 mt-2">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-xs text-slate-500">+{plan.features.length - 3} more features</li>
                      )}
                    </ul>
                    {plan.note && isSelected && (
                      <p className="text-[10px] text-[#10b981] mt-2 font-semibold">{plan.note}</p>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              All paid plans: Crypto & Fiat accepted. Cancel anytime.
            </p>
          </div>

          {/* Registration Form */}
          <Card className="bg-slate-900 border-slate-800 h-fit">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Create Your Account</CardTitle>
              <p className="text-slate-400 text-sm">
                Selected: <span className={`font-semibold ${selectedPlan.id === 'pro' ? 'text-[#3b82f6]' : selectedPlan.id === 'premium' ? 'text-[#8b5cf6]' : 'text-[#10b981]'}`}>{selectedPlan.name}</span>
                {selectedPlan.price !== 'Free' && <span className="text-slate-400"> — {selectedPlan.price}{selectedPlan.billing}</span>}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white text-sm font-medium">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="username" name="username" type="text" placeholder="Choose a username" value={formData.username} onChange={handleChange} required className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={formData.password} onChange={handleChange} required className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Strength:</span>
                        <span className={`font-semibold ${passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score === 3 ? 'text-yellow-500' : passwordStrength.score === 4 ? 'text-blue-500' : 'text-green-500'}`}>{strengthText()}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${strengthColor()}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordStrength.feedback.map((item, i) => (
                          <div key={i} className="flex items-center text-[10px]">
                            {item.met ? <CheckCircle2 className="w-2.5 h-2.5 text-green-500 mr-1 shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-slate-500 mr-1 shrink-0" />}
                            <span className={item.met ? 'text-green-500' : 'text-slate-500'}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium">
                  {loading ? 'Creating Account...' : `Create Account — ${selectedPlan.name}`}
                </Button>

                <div className="text-center text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
