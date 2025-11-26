import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, Database, UserCheck, FileText, Mail, AlertCircle, ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

const PrivacyPolicyPage = () => {
  const navigate = useNavigate()

  const sections = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Account Information',
          text: 'When you create an account, we collect your username, email address, and password (encrypted). We may also collect optional profile information you choose to provide.'
        },
        {
          subtitle: 'Link Data',
          text: 'We collect information about the links you create, including original URLs, shortened URLs, custom aliases, and associated metadata such as creation dates and expiration settings.'
        },
        {
          subtitle: 'Analytics Data',
          text: 'We automatically collect analytics data when someone clicks your shortened links, including IP addresses, geographic location, device type, browser information, referrer URLs, and timestamp of clicks.'
        },
        {
          subtitle: 'Usage Information',
          text: 'We collect information about how you use our platform, including features accessed, pages viewed, time spent on the platform, and interaction patterns.'
        },
        {
          subtitle: 'Payment Information',
          text: 'For paid subscriptions, we collect billing information through secure third-party payment processors. We do not store complete credit card numbers on our servers.'
        }
      ]
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Service Delivery',
          text: 'We use your information to provide, maintain, and improve our link management services, including creating and tracking shortened links, generating analytics reports, and managing your account.'
        },
        {
          subtitle: 'Analytics and Insights',
          text: 'We process click data to provide you with detailed analytics about your link performance, including geographic distribution, device statistics, and traffic sources.'
        },
        {
          subtitle: 'Communication',
          text: 'We may use your email address to send you service-related notifications, security alerts, subscription updates, and optional marketing communications (which you can opt out of at any time).'
        },
        {
          subtitle: 'Security and Fraud Prevention',
          text: 'We use your information to detect and prevent fraudulent activity, abuse, security incidents, and other harmful activities on our platform.'
        },
        {
          subtitle: 'Platform Improvement',
          text: 'We analyze aggregated usage data to understand how our platform is used, identify areas for improvement, and develop new features and services.'
        }
      ]
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Data Security',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All data transmitted between your browser and our servers is encrypted using industry-standard SSL/TLS protocols. Passwords are hashed using bcrypt with salt before storage.'
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict access controls and authentication mechanisms to ensure that only authorized personnel can access user data, and only when necessary for service delivery or support.'
        },
        {
          subtitle: 'Infrastructure Security',
          text: 'Our infrastructure is hosted on secure cloud platforms with regular security audits, automated backups, and disaster recovery procedures in place.'
        },
        {
          subtitle: 'Monitoring and Logging',
          text: 'We maintain comprehensive security logs and monitoring systems to detect and respond to potential security incidents in real-time.'
        },
        {
          subtitle: 'Regular Updates',
          text: 'We regularly update our systems and dependencies to patch security vulnerabilities and maintain the highest security standards.'
        }
      ]
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Data Sharing and Disclosure',
      content: [
        {
          subtitle: 'Third-Party Service Providers',
          text: 'We may share your information with trusted third-party service providers who assist us in operating our platform, such as hosting providers, payment processors, and analytics services. These providers are contractually obligated to protect your data.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.'
        },
        {
          subtitle: 'Business Transfers',
          text: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such change and provide options regarding your data.'
        },
        {
          subtitle: 'Aggregated Data',
          text: 'We may share aggregated, anonymized data that cannot identify individual users for research, marketing, or business intelligence purposes.'
        },
        {
          subtitle: 'Your Consent',
          text: 'We will not share your personal information with third parties for their marketing purposes without your explicit consent.'
        }
      ]
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: 'Your Rights and Choices',
      content: [
        {
          subtitle: 'Access and Portability',
          text: 'You have the right to access your personal data and request a copy in a portable format. You can export your link data and analytics at any time through your account dashboard.'
        },
        {
          subtitle: 'Correction and Update',
          text: 'You can update your account information, profile details, and preferences at any time through your account settings.'
        },
        {
          subtitle: 'Deletion',
          text: 'You have the right to request deletion of your account and associated data. Upon deletion, we will remove your personal information within 30 days, except where retention is required by law.'
        },
        {
          subtitle: 'Opt-Out',
          text: 'You can opt out of marketing communications at any time by clicking the unsubscribe link in our emails or adjusting your notification preferences in your account settings.'
        },
        {
          subtitle: 'Data Retention Control',
          text: 'You can configure data retention periods for your link analytics and choose to delete historical data at any time.'
        },
        {
          subtitle: 'Cookie Preferences',
          text: 'You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect platform functionality.'
        }
      ]
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Cookies and Tracking Technologies',
      content: [
        {
          subtitle: 'Essential Cookies',
          text: 'We use essential cookies required for platform functionality, including authentication, session management, and security features. These cookies cannot be disabled.'
        },
        {
          subtitle: 'Analytics Cookies',
          text: 'We use analytics cookies to understand how users interact with our platform, which helps us improve our services. You can opt out of analytics cookies through your browser settings.'
        },
        {
          subtitle: 'Preference Cookies',
          text: 'We use preference cookies to remember your settings and preferences, such as language selection and display options.'
        },
        {
          subtitle: 'Third-Party Cookies',
          text: 'Some third-party services we use (such as payment processors) may set their own cookies. These are governed by their respective privacy policies.'
        }
      ]
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Data Retention',
      content: [
        {
          subtitle: 'Account Data',
          text: 'We retain your account information for as long as your account is active or as needed to provide you services. After account deletion, we retain minimal data for legal and security purposes for up to 90 days.'
        },
        {
          subtitle: 'Link Data',
          text: 'Link data is retained according to your subscription plan. Free users have 7-day retention, while paid plans offer extended retention periods. You can manually delete links at any time.'
        },
        {
          subtitle: 'Analytics Data',
          text: 'Click analytics are retained according to your plan\'s data retention period. You can configure retention settings and delete historical data through your dashboard.'
        },
        {
          subtitle: 'Backup Data',
          text: 'Backup copies of data may be retained for disaster recovery purposes for up to 30 days after deletion from active systems.'
        }
      ]
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'International Data Transfers',
      content: [
        {
          subtitle: 'Global Infrastructure',
          text: 'Our services are hosted on cloud infrastructure that may store and process data in multiple countries. We ensure that all data transfers comply with applicable data protection laws.'
        },
        {
          subtitle: 'Data Protection Standards',
          text: 'We implement appropriate safeguards for international data transfers, including standard contractual clauses and data processing agreements with our service providers.'
        },
        {
          subtitle: 'EU-US Data Transfers',
          text: 'For users in the European Union, we comply with GDPR requirements and ensure adequate protection for data transferred outside the EU.'
        }
      ]
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: 'Children\'s Privacy',
      content: [
        {
          subtitle: 'Age Requirement',
          text: 'Our Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.'
        }
      ]
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Contact Us',
      content: [
        {
          subtitle: 'Questions',
          text: 'If you have any questions about this Privacy Policy, please contact us at:'
        },
        {
          subtitle: 'Email',
          text: 'support@brainlinktracker.com'
        },
        {
          subtitle: 'Address',
          text: 'Brain Link Tracker, 123 Analytics Way, San Francisco, CA 94105'
        }
      ]
    }
  ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20">
        {/* Navigation */}
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
        <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Last Updated: November 26, 2025
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                <div className="flex items-center mb-4">
                  {section.icon}
                  <h2 className="text-2xl font-bold text-white ml-3">{section.title}</h2>
                </div>
                <div className="space-y-6 text-slate-300">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      <h3 className="text-lg font-semibold text-blue-400 mb-1">{item.subtitle}</h3>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Have Questions?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              If you have any concerns about our privacy practices, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/contact')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6"
              >
                Contact Support
                <ArrowRight className="ml-2 w-5 h-5" />
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

export default PrivacyPolicyPage
