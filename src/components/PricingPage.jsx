import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ArrowRight, Star } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

const PricingPage = () => {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '7-day trial',
      dailyLimit: '10 links/day',
      features: [
        'Basic link tracking',
        '7-day data retention',
        'Basic analytics',
        'QR code generation',
        'Admin approval required'
      ],
      popular: false,
      planType: 'free'
    },
    {
      name: 'Weekly',
      price: '$35',
      period: '7 days',
      dailyLimit: '1,000 links/day',
      features: [
        'Advanced tracking',
        'Real-time analytics',
        'Geographic intelligence',
        'Campaign management',
        'Priority support'
      ],
      popular: false,
      planType: 'weekly'
    },
    {
      name: 'Biweekly',
      price: '$68',
      period: '14 days',
      dailyLimit: '1,000 links/day',
      features: [
        'All Weekly features',
        'Extended data retention',
        'Custom domains',
        'A/B testing',
        'Team collaboration'
      ],
      popular: false,
      planType: 'biweekly'
    },
    {
      name: 'Monthly',
      price: '$150',
      period: '30 days',
      dailyLimit: '5,000 links/day',
      features: [
        'All Biweekly features',
        'Advanced security',
        '2FA authentication',
        'IP blocking',
        'Threat detection'
      ],
      popular: true,
      planType: 'monthly'
    },
    {
      name: 'Quarterly',
      price: '$420',
      period: '90 days',
      dailyLimit: '10,000 links/day',
      features: [
        'All Monthly features',
        'Bulk operations',
        'Advanced reporting',
        'Custom integrations',
        'Dedicated support'
      ],
      popular: false,
      planType: 'quarterly'
    },
    {
      name: 'Pro',
      price: '$299',
      period: 'per month',
      dailyLimit: '10,000 links/day',
      features: [
        'Everything in Quarterly',
        'API access',
        'White-label options',
        'Custom analytics',
        'Priority support',
        'Advanced automation'
      ],
      popular: false,
      planType: 'pro'
    },
    {
      name: 'Enterprise',
      price: '$999',
      period: 'per year',
      dailyLimit: '50,000 links/day',
      features: [
        'Everything in Pro',
        'Unlimited links',
        'Dedicated account manager',
        'Custom SLA',
        'On-premise deployment',
        'Advanced security features',
        '24/7 premium support'
      ],
      popular: false,
      planType: 'enterprise'
    }
  ]

  return (
    <>
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Choose Your Perfect Plan
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Flexible pricing options to match your needs. Start with our free trial and scale as you grow.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <div key={index}>
                  <Card className={`relative h-full flex flex-col ${
                    plan.popular 
                      ? 'bg-gradient-to-b from-blue-900/50 to-purple-900/50 border-blue-500 scale-105' 
                      : 'bg-slate-800/50 border-slate-700'
                  } hover:scale-105 transition-all duration-300`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                          <Star className="w-4 h-4 mr-1" />
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
                      <div className="mt-2 text-sm text-slate-300 font-semibold">
                        {plan.dailyLimit}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                      <ul className="space-y-3 mb-6 flex-grow">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start text-slate-300">
                            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
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
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Can I change my plan later?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What payment methods do you accept?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">
                    We accept all major credit cards, PayPal, and cryptocurrency payments for your convenience.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Is there a free trial?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">
                    Yes! All new users get a 7-day free trial with 10 links per day. No credit card required to start.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What happens when my plan expires?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">
                    Your account will be downgraded to the free plan. Your data is preserved, but you'll be limited to 10 links per day until you renew.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of businesses already using Brain Link Tracker. Start your free trial today.
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
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

export default PricingPage
