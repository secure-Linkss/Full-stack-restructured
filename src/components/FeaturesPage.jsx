import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Link2, BarChart3, Shield, Globe, Zap, Users, 
  QrCode, Target, Lock, TrendingUp, Code, Smartphone,
  ArrowRight, CheckCircle, MessageSquare
} from 'lucide-react'
import { motion } from 'framer-motion'
import Logo from './Logo'

const FeaturesPage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Link2 className="w-10 h-10" />,
      title: 'Smart Link Shortening',
      description: 'Create custom branded short links with advanced tracking capabilities. Support for custom domains and vanity URLs.',
      benefits: ['Custom domains', 'Vanity URLs', 'Bulk link creation', 'Link expiration']
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: 'Real-Time Analytics',
      description: 'Track every click with detailed insights including location, device, browser, and referrer information.',
      benefits: ['Live click tracking', 'Device analytics', 'Referrer tracking', 'Conversion metrics']
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: 'Geographic Intelligence',
      description: 'Visualize your audience with interactive maps showing click locations and geographic distribution.',
      benefits: ['Interactive maps', 'Country tracking', 'City-level data', 'Regional insights']
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: 'Campaign Management',
      description: 'Organize links into campaigns and track performance metrics across different marketing initiatives.',
      benefits: ['Campaign grouping', 'Performance tracking', 'ROI analysis', 'A/B testing']
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: 'Enterprise Security',
      description: 'Advanced security features including 2FA, IP blocking, threat detection, and comprehensive audit logs.',
      benefits: ['Two-factor auth', 'IP blocking', 'Threat detection', 'Audit logs']
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: 'Team Collaboration',
      description: 'Work together with role-based access control, team management, and collaborative link management.',
      benefits: ['Role-based access', 'Team management', 'Shared campaigns', 'Activity tracking']
    },
    {
      icon: <QrCode className="w-10 h-10" />,
      title: 'QR Code Generation',
      description: 'Automatically generate QR codes for all your links with customizable designs and download options.',
      benefits: ['Auto-generation', 'Custom designs', 'High resolution', 'Multiple formats']
    },
    {
      icon: <Target className="w-10 h-10" />,
      title: 'A/B Testing',
      description: 'Split test different destinations and optimize your campaigns based on performance data.',
      benefits: ['Split testing', 'Performance comparison', 'Traffic distribution', 'Conversion optimization']
    },
    {
      icon: <Code className="w-10 h-10" />,
      title: 'API Access',
      description: 'Integrate Brain Link Tracker into your applications with our comprehensive REST API.',
      benefits: ['RESTful API', 'Webhooks', 'Documentation', 'SDKs available']
    },
    {
      icon: <Lock className="w-10 h-10" />,
      title: 'Link Protection',
      description: 'Protect your links with passwords, expiration dates, and click limits for enhanced security.',
      benefits: ['Password protection', 'Expiration dates', 'Click limits', 'Access control']
    },
    {
      icon: <TrendingUp className="w-10 h-10" />,
      title: 'Advanced Reporting',
      description: 'Generate detailed reports with customizable date ranges and export options for data analysis.',
      benefits: ['Custom reports', 'Data export', 'Scheduled reports', 'Visual dashboards']
    },
    {
      icon: <MessageSquare className="w-10 h-10" />,
      title: 'Telegram Integration',
      description: 'Receive real-time notifications and manage links directly from Telegram.',
      benefits: ['Real-time alerts', 'Bot commands', 'Link management', 'Analytics in chat']
    }
  ]

  return (
    <>
      <Footer />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Logo size="md" />
            </div>
            <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Powerful Features for
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Modern Link Management
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-3xl mx-auto">
              Everything you need to create, track, and optimize your links at scale. 
              Built for businesses that demand the best.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-all duration-300 h-full hover:scale-105">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 text-white">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-slate-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
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
              Ready to Transform Your Links?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of businesses using Brain Link Tracker to optimize their digital presence.
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
                onClick={() => navigate('/pricing')}
                className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6"
              >
                View Pricing
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

export default FeaturesPage
