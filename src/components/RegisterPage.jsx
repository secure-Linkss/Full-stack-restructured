import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Logo from './Logo'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedPlan = searchParams.get('plan') || 'free'
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: preselectedPlan
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  })

  useEffect(() => {
    if (preselectedPlan) {
      setFormData(prev => ({ ...prev, plan: preselectedPlan }))
    }
  }, [preselectedPlan])

  const checkPasswordStrength = (password) => {
    const feedback = []
    let score = 0

    if (password.length >= 8) {
      score++
      feedback.push({ text: 'At least 8 characters', met: true })
    } else {
      feedback.push({ text: 'At least 8 characters', met: false })
    }

    if (/[A-Z]/.test(password)) {
      score++
      feedback.push({ text: 'Contains uppercase letter', met: true })
    } else {
      feedback.push({ text: 'Contains uppercase letter', met: false })
    }

    if (/[a-z]/.test(password)) {
      score++
      feedback.push({ text: 'Contains lowercase letter', met: true })
    } else {
      feedback.push({ text: 'Contains lowercase letter', met: false })
    }

    if (/[0-9]/.test(password)) {
      score++
      feedback.push({ text: 'Contains number', met: true })
    } else {
      feedback.push({ text: 'Contains number', met: false })
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score++
      feedback.push({ text: 'Contains special character', met: true })
    } else {
      feedback.push({ text: 'Contains special character', met: false })
    }

    setPasswordStrength({ score, feedback })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'password') {
      checkPasswordStrength(value)
    }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          plan: formData.plan
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Registration successful! Your account is pending admin approval.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500'
    if (passwordStrength.score === 3) return 'bg-yellow-500'
    if (passwordStrength.score === 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak'
    if (passwordStrength.score === 3) return 'Fair'
    if (passwordStrength.score === 4) return 'Good'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Create Your Account</CardTitle>
          <CardDescription className="text-slate-400">
            Join thousands of users tracking their links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {formData.password && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`font-semibold ${
                      passwordStrength.score <= 2 ? 'text-red-500' :
                      passwordStrength.score === 3 ? 'text-yellow-500' :
                      passwordStrength.score === 4 ? 'text-blue-500' : 'text-green-500'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <div key={index} className="flex items-center text-xs">
                        {item.met ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-500 mr-2" />
                        )}
                        <span className={item.met ? 'text-green-500' : 'text-slate-500'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan" className="text-white text-sm font-medium">
                Select Plan
              </Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="free" className="text-white">Free Plan - $0 (7-day trial, 10 links/day)</SelectItem>
                  <SelectItem value="weekly" className="text-white">Weekly Plan - $35 (7 days)</SelectItem>
                  <SelectItem value="biweekly" className="text-white">Biweekly Plan - $68 (14 days)</SelectItem>
                  <SelectItem value="monthly" className="text-white">Monthly Plan - $150 (30 days)</SelectItem>
                  <SelectItem value="quarterly" className="text-white">Quarterly Plan - $420 (90 days)</SelectItem>
                  <SelectItem value="pro" className="text-white">Pro Plan - $299/month</SelectItem>
                  <SelectItem value="enterprise" className="text-white">Enterprise Plan - $999/year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage
