import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, FileText, Users, AlertCircle, Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'
import Logo from './Logo'

const TermsOfServices = () => {
  const navigate = useNavigate()

  return (
    <>
      <Footer />
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
                  You retain all rights to the content you create and track through our Service. By using the Service, you grant us a limited license to use, store, and display your content solely for the purpose of providing the Service.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">3. Feedback</h3>
                <p>
                  Any feedback, comments, or suggestions you provide regarding the Service may be used by us without any obligation to you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BRAIN LINK TRACKER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your access to or use of or inability to access or use the Service.</li>
                <li>Any conduct or content of any third party on the Service.</li>
                <li>Any content obtained from the Service.</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
              </ul>
              <p className="text-yellow-400 font-semibold">
                IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY.
              </p>
            </CardContent>
          </Card>

          {/* Indemnification */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                You agree to indemnify, defend, and hold harmless Brain Link Tracker, its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any way connected with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your access to or use of the Service.</li>
                <li>Your violation of these Terms.</li>
                <li>Your violation of any third-party rights, including intellectual property rights.</li>
                <li>Any content you submit, post, or transmit through the Service.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">1. Governing Law</h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">2. Arbitration</h3>
                <p>
                  Any dispute arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules, except that either party may seek injunctive relief in court.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">3. Class Action Waiver</h3>
                <p>
                  You agree to resolve disputes with us on an individual basis and waive your right to participate in class actions or class arbitrations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last Updated" date.
              </p>
              <p>
                Your continued use of the Service after any changes to these Terms constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the Service.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Termination</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
              <p>
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer - Consistent with HomePage */}
    </div>
    </>
  )
}

export default TermsOfServices
