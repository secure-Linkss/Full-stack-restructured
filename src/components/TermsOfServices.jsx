import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, FileText, Users, AlertCircle, Menu, X, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

const TermsOfServices = () => {
  const navigate = useNavigate()

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20">
        {/* Navigation - Consistent with HomePage */}
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-900/95 backdrop-blur-lg shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

              {/* Mobile Menu Button - Added a simple back button for mobile view */}
              <div className="md:hidden">
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/10 rounded-full">
                <FileText className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-slate-400">
              Last Updated: November 15, 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Introduction */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-blue-400" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p>
                  Welcome to Brain Link Tracker. These Terms of Service ("Terms") govern your access to and use of our link tracking and analytics platform, including our website, services, and applications (collectively, the "Service").
                </p>
                <p>
                  By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                </p>
              </CardContent>
            </Card>

            {/* Account Terms */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Users className="w-6 h-6 mr-3 text-purple-400" />
                  Account Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">1. Account Creation</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You must be at least 18 years old to use this Service.</li>
                    <li>You must provide accurate and complete information when creating an account.</li>
                    <li>You are responsible for maintaining the security of your account and password.</li>
                    <li>You are responsible for all activities that occur under your account.</li>
                    <li>You must notify us immediately of any unauthorized use of your account.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">2. Account Approval</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>New accounts require admin approval before activation.</li>
                    <li>We reserve the right to refuse service to anyone for any reason at any time.</li>
                    <li>Accounts may be suspended or terminated for violation of these Terms.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Acceptable Use */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3 text-yellow-400" />
                  Acceptable Use Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p className="font-semibold text-white">You agree NOT to use the Service to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate any laws, regulations, or third-party rights.</li>
                  <li>Transmit any harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable content.</li>
                  <li>Distribute spam, malware, viruses, or any other malicious code.</li>
                  <li>Engage in phishing, fraud, or any deceptive practices.</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service.</li>
                  <li>Use the Service for any illegal or unauthorized purpose.</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
                  <li>Collect or harvest any personally identifiable information from the Service without consent.</li>
                  <li>Use automated systems to access the Service without our prior written permission.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Service Terms */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Service Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">1. Service Availability</h3>
                  <p>
                    We strive to provide reliable service but do not guarantee that the Service will be uninterrupted, timely, secure, or error-free. We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">2. Data and Privacy</h3>
                  <p>
                    Your use of the Service is also governed by our Privacy Policy. We collect and use data as described in our Privacy Policy to provide and improve our Service.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">3. Link Tracking</h3>
                  <p>
                    You are responsible for the content and destination of all links you create through our Service. We reserve the right to disable or remove any links that violate these Terms or applicable laws.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Payment and Billing</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">1. Subscription Plans</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Paid plans are billed in advance on a recurring basis (weekly, monthly, quarterly, or annually).</li>
                    <li>All fees are non-refundable except as required by law.</li>
                    <li>You authorize us to charge your payment method for all fees incurred.</li>
                    <li>Prices are subject to change with 30 days' notice.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">2. Free Trial</h3>
                  <p>
                    New users receive a 7-day free trial with limited features. The trial automatically converts to a paid plan unless you cancel before the trial ends.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">3. Cancellation and Refunds</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You may cancel your subscription at any time through your account settings.</li>
                    <li>Cancellation takes effect at the end of the current billing period.</li>
                    <li>No refunds will be provided for partial months or unused services.</li>
                    <li>Upon cancellation, your account will be downgraded to the free plan.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">1. Our Rights</h3>
                  <p>
                    The Service and its original content, features, and functionality are owned by Brain Link Tracker and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">2. Your Rights</h3>
                  <p>
                    You retain all rights to the content you create, upload, or submit to the Service, including your original URLs and link metadata. By using the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content solely for the purpose of operating and improving the Service.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimers and Liability */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Disclaimers and Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">1. Disclaimer of Warranties</h3>
                  <p>
                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the Service, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">2. Limitation of Liability</h3>
                  <p>
                    In no event shall Brain Link Tracker, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p>
                  These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-4">
                <p>
                  If you have any questions about these Terms, please contact us at:
                </p>
                <p className="font-semibold text-white">Email: support@brainlinktracker.com</p>
              </CardContent>
            </Card>
          </div>
        </div>

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

export default TermsOfServices
