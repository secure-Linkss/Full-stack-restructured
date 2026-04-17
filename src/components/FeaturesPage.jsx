import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Link2, BarChart3, Shield, Globe, Zap, Users,
  QrCode, Target, Lock, TrendingUp, Code, Smartphone,
  ArrowRight, CheckCircle, MessageSquare, Mail, Brain,
  Activity, Eye, Cpu, RefreshCw, CreditCard, Layers
} from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { useSEO } from '../hooks/useSEO'

const FeaturesPage = () => {
  useSEO({
    title: 'Features — Quantum Redirect, Inbox Score & More',
    description: 'Explore Brain Link Tracker features: 4-stage Quantum Redirect, Inbox Score™, Channel Adaptive Mode™, real-time analytics, custom domains, bot filtering, and Inbox Shield AI™.',
    keywords: 'quantum redirect, inbox score, channel adaptive, link tracking features, bot detection, custom domain tracking, click analytics',
    canonical: '/features',
  });
  const navigate = useNavigate()

  const coreFeatures = [
    {
      icon: <Zap className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500',
      title: 'Quantum Redirect™',
      description: 'Industry-leading 4-stage redirect pipeline with JWT token validation at each stage. Eliminates scanner detection while delivering humans to your target page at near-zero latency.',
      benefits: ['4-stage redirect pipeline', 'JWT token at each hop', 'Bot scanner deflection', 'Sub-100ms redirect time']
    },
    {
      icon: <Shield className="w-8 h-8" />,
      color: 'from-red-500 to-pink-600',
      title: 'Scanner Detection & Deflection',
      description: 'Advanced bot fingerprinting using user-agent parsing, ASN reputation, headless browser signals, and honeypot detection. Real users pass through; scanners see decoy pages.',
      benefits: ['Headless browser detection', 'ASN reputation scoring', 'IP honeypot traps', 'Decoy page delivery']
    },
    {
      icon: <Layers className="w-8 h-8" />,
      color: 'from-purple-500 to-indigo-600',
      title: 'Cloaking Templates',
      description: 'Pre-built cloaking templates that mimic enterprise software portals. Microsoft 365, DocuSign, Google Drive, Zoom, and more — designed to pass manual review.',
      benefits: ['Microsoft 365 template', 'DocuSign template', 'Google Drive template', 'Zoom login template']
    },
    {
      icon: <Mail className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      title: 'Email Intelligence & Inbox Score™',
      description: 'Real-time inbox deliverability scoring powered by header analysis, domain reputation, and SMTP fingerprinting. Know your inbox placement before you send.',
      benefits: ['Inbox Score 0–100', 'Header reputation scan', 'Domain warmup guide', 'SMTP fingerprint analysis']
    },
    {
      icon: <Brain className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
      title: 'Channel Adaptive Mode™',
      description: 'Automatically detects the traffic source (email, SMS, LinkedIn, WhatsApp) and adapts redirect behavior, headers, and landing experience per channel.',
      benefits: ['Email channel detection', 'SMS deep-link handling', 'LinkedIn preview bypass', 'WhatsApp safe routing']
    },
    {
      icon: <Eye className="w-8 h-8" />,
      color: 'from-violet-500 to-purple-700',
      title: 'Admin Intelligence Layer',
      description: 'Full admin control panel with user management, global link monitoring, suspicious IP dashboards, and audit logs. Manage your entire operation from one command center.',
      benefits: ['Global link overview', 'User access control', 'Suspicious IP alerts', 'Full audit log trail']
    },
    {
      icon: <Activity className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-600',
      title: 'Real-Time Live Tracking',
      description: 'Every click, visitor, and bot attempt logged in real-time with full telemetry: IP, ISP, device, browser, location, email capture, and connection state.',
      benefits: ['Real-time event stream', 'IP & ISP geolocation', 'Device fingerprinting', 'Email capture logging']
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      color: 'from-amber-500 to-yellow-600',
      title: 'Crypto & Stripe Payments',
      description: 'Accept payments via Stripe (cards, Apple Pay) or directly in crypto (BTC, ETH, USDT). Subscriptions auto-activate on confirmed payment.',
      benefits: ['Stripe card payments', 'BTC, ETH, USDT support', 'Auto plan activation', 'Webhook-based billing']
    },
    {
      icon: <Globe className="w-8 h-8" />,
      color: 'from-blue-600 to-indigo-700',
      title: 'Geographic Intelligence',
      description: 'Visualize your audience with interactive maps. Country-level and city-level analytics with conversion rate breakdowns per region.',
      benefits: ['Interactive world map', 'Country + city tracking', 'Regional conversion rates', 'Timezone-aware insights']
    },
    {
      icon: <RefreshCw className="w-8 h-8" />,
      color: 'from-teal-500 to-green-600',
      title: 'Campaign Management',
      description: 'Group tracking links into campaigns. Monitor aggregate performance, pause/resume entire campaigns, and export data for external reporting.',
      benefits: ['Campaign grouping', 'Aggregate performance', 'Pause/resume control', 'CSV data export']
    },
    {
      icon: <QrCode className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-600',
      title: 'QR Code Generation',
      description: 'Auto-generate high-resolution QR codes for all tracking links. Download as PNG or SVG in multiple sizes for offline campaigns.',
      benefits: ['Auto-generated QR codes', 'PNG + SVG formats', 'Custom sizes up to 800px', 'One-click download']
    },
    {
      icon: <Code className="w-8 h-8" />,
      color: 'from-gray-600 to-slate-700',
      title: 'REST API & Webhooks',
      description: 'Full REST API with JWT auth for programmatic link creation, event polling, and webhook delivery for real-time event push to your own systems.',
      benefits: ['JWT-secured REST API', 'Webhook delivery', 'Bulk link creation', 'API key management']
    },
  ]

  return (
    <>
      <div className="min-h-screen bg-[#0f172a] text-white">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f1a]/95 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <Logo size="md" />
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15)_0%,_transparent_70%)]"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#3b82f6] tracking-wider uppercase">Enterprise Feature Stack</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Institutional-Grade
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent">
                Link Tracking Infrastructure
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Every feature engineered for high-volume performance marketing. From quantum redirect pipelines to real-time telemetry — built for operators who demand precision.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-lg px-8 py-6"
            >
              Deploy Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">The Full Feature Stack</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Every tool you need to track, protect, and optimize at institutional scale.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature, index) => (
                <Card key={index} className="bg-[#1e293b]/60 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-[#1e293b]/80 h-full">
                  <CardHeader>
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white text-lg mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-slate-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-[#10b981] mr-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Deploy?
            </h2>
            <p className="text-lg text-slate-400 mb-10">
              Get access to the full stack. Plans start at $100/mo for serious operators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </section>

        <Footer isPublic={true} />
      </div>
    </>
  )
}

export default FeaturesPage
