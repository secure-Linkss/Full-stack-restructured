import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Link2, BarChart3, Shield, Zap, Globe, Users, 
  ArrowRight, Check, Star, TrendingUp, Lock, Smartphone,
  ChevronRight, Menu, X
} from 'lucide-react'
import { motion } from 'framer-motion'
import Logo from './Logo'

const HomePage = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: <Link2 className="w-8 h-8" />,
      title: 'Smart Link Shortening',
      description: 'Create custom short links with advanced tracking and analytics in seconds.'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Real-Time Analytics',
      description: 'Track clicks, conversions, and user behavior with detailed insights and reports.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: '2FA, IP blocking, threat detection, and advanced security features included.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Geographic Intelligence',
      description: 'Track user locations with interactive maps and detailed geographic data.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Campaign Management',
      description: 'Organize links into campaigns and track performance metrics effortlessly.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Collaboration',
      description: 'Work together with role-based access control and team management tools.'
    }
  ]

  // Updated pricing to match PricingPage - showing key plans only
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '7-day trial',
      features: ['10 links/day', 'Basic analytics', 'QR codes', '7-day data retention'],
      popular: false,
      planType: 'free'
    },
    {
      name: 'Monthly',
      price: '$150',
      period: '30 days',
      features: ['5,000 links/day', 'Advanced security', '2FA authentication', 'IP blocking', 'Threat detection'],
      popular: true,
      planType: 'monthly'
    },
    {
      name: 'Enterprise',
      price: '$999',
      period: 'per year',
      features: ['50,000 links/day', 'Unlimited links', 'Dedicated manager', 'Custom SLA', '24/7 support'],
      popular: false,
      planType: 'enterprise'
    }
  ]

  const stats = [
    { value: '10M+', label: 'Links Created' },
    { value: '500K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '150+', label: 'Countries' }
  ]

  return (
    <>
      <Footer />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-900/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}>
       <div className="max-w-7xl mx-auto pt-16 pb-24">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <Logo size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-slate-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/contact" className="text-slate-300 hover:text-white transition-colors">
                Contact
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-900 border-t border-slate-800"
          >
            <div className="px-4 py-4 space-y-3">
              <Link to="/features" className="block text-slate-300 hover:text-white py-2">
                Features
              </Link>
              <Link to="/pricing" className="block text-slate-300 hover:text-white py-2">
                Pricing
              </Link>
              <Link to="/contact" className="block text-slate-300 hover:text-white py-2">
                Contact
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Track Every Click,
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Optimize Every Link
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
              The most powerful link management platform for modern businesses. 
              Create, track, and optimize your links with enterprise-grade analytics and security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/contact')}
                className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6"
              >
                Contact Sales
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Powerful features designed to help you create, manage, and optimize your links at scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-all duration-300 h-full hover:scale-105">
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 text-white">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start with our free trial and scale as you grow.
            </p>
            <Button 
              variant="link"
              onClick={() => navigate('/pricing')}
              className="text-blue-400 hover:text-blue-300 mt-2"
            >
              View all pricing options →
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-blue-900/50 to-purple-900/50 border-blue-500 scale-105' 
                    : 'bg-slate-800/50 border-slate-700'
                } hover:scale-105 transition-all duration-300`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400 ml-2">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-slate-300">
                          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          : 'bg-slate-700 hover:bg-slate-600'
                      } text-white`}
                      onClick={() => navigate(`/register?plan=${plan.planType}`)}
                    >
                      Get Started
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Link Management?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of businesses already using Brain Link Tracker to optimize their digital presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/contact')}
                className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6"
              >
                Talk to Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      </div>
    </>
  )
}

export default HomePage
