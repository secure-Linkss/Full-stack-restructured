import { Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { 
  Target, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp, 
  Award,
  Globe,
  Heart,
  Lightbulb,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import Logo from './Logo'

const AboutPage = () => {
  const navigate = useNavigate()
  const values = [
    {
      icon: Target,
      title: 'Precision Tracking',
      description: 'We believe in providing accurate, real-time data that empowers businesses to make informed decisions.'
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Your data security is our top priority. We employ industry-leading encryption and security protocols.'
    },
    {
      icon: Users,
      title: 'Customer Success',
      description: 'We measure our success by yours. Our dedicated team ensures you get maximum value from our platform.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We continuously evolve our platform with cutting-edge features to stay ahead of market demands.'
    }
  ]

  const milestones = [
    { year: '2020', title: 'Founded', description: 'Brain Link Tracker was born from a vision to simplify link tracking' },
    { year: '2021', title: '10K Users', description: 'Reached our first major milestone with 10,000 active users' },
    { year: '2022', title: 'Global Expansion', description: 'Expanded services to 50+ countries worldwide' },
    { year: '2023', title: 'AI Integration', description: 'Launched advanced AI-powered analytics and bot detection' },
    { year: '2024', title: 'Enterprise Ready', description: 'Introduced enterprise-grade features and dedicated support' }
  ]

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former VP of Analytics at a Fortune 500 company with 15+ years in data science'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Google engineer specializing in distributed systems and real-time analytics'
    },
    {
      name: 'Emily Watson',
      role: 'Head of Product',
      bio: 'Product strategist with a track record of building user-centric SaaS platforms'
    },
    {
      name: 'David Kim',
      role: 'VP of Engineering',
      bio: 'Infrastructure expert who scaled systems handling billions of daily requests'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20">
      {/* Navigation - Consistent with HomePage */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-900/95 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => navigate("/")}>
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
                onClick={() => navigate("/login")}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button - Added a simple back button for mobile view */}
            <div className="md:hidden">
              <Button 
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Built by Marketers,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              For Marketers
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
            We're on a mission to give every business—from startups to enterprises—the power to track, 
            analyze, and optimize their digital campaigns with precision and ease.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-300 text-lg">
                <p>
                  Brain Link Tracker was founded in 2020 when our team of marketing professionals and engineers 
                  realized there was a gap in the market for truly intelligent link tracking.
                </p>
                <p>
                  We were frustrated with existing solutions that either lacked advanced features or were 
                  prohibitively expensive. We knew there had to be a better way—a platform that combined 
                  powerful analytics with an intuitive interface, all at a fair price.
                </p>
                <p>
                  Today, we're proud to serve thousands of businesses worldwide, from solo entrepreneurs 
                  to Fortune 500 companies, helping them make data-driven decisions that drive real growth.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-3xl opacity-20"></div>
              <Card className="relative bg-slate-800 border-slate-700">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-400 mb-2">50K+</div>
                      <div className="text-slate-400">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-400 mb-2">100M+</div>
                      <div className="text-slate-400">Links Tracked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
                      <div className="text-slate-400">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-400 mb-2">50+</div>
                      <div className="text-slate-400">Countries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-400">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-all">
                <CardContent className="p-6">
                  <value.icon className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-slate-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Journey</h2>
            <p className="text-xl text-slate-400">Key milestones in our growth</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 to-purple-600"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <Card className="bg-slate-800 border-slate-700 inline-block">
                      <CardContent className="p-6">
                        <div className="text-2xl font-bold text-blue-400 mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                        <p className="text-slate-400">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-slate-900 z-10"></div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Meet Our Leadership</h2>
            <p className="text-xl text-slate-400">The team driving innovation at Brain Link Tracker</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-blue-400 mb-3">{member.role}</p>
                  <p className="text-slate-400 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-xl text-slate-300 mb-8">
            To democratize advanced link tracking and analytics, making enterprise-grade tools accessible 
            to businesses of all sizes. We believe every marketer deserves the insights needed to succeed 
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Transparent Pricing</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Regular Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Tracking?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Join thousands of businesses already using Brain Link Tracker to optimize their campaigns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white text-lg px-8">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Consistent with HomePage */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <p className="text-slate-400 text-sm">
                The most powerful link management platform for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Brain Link Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AboutPage
