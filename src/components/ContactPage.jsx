import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
// import Footer from './Footer' - Replaced with inline footer from HomePage

const ContactPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success('Message sent successfully! We will get back to you shortly.')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    } catch (error) {
      toast.error('Network error. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

	  return (
	    <div className="min-h-screen flex flex-col">
	      <div className="flex-grow bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="lg" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            We're here to help and answer any question you might have. We look forward to hearing from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 text-white">
              <CardHeader>
                <Mail className="w-6 h-6 text-blue-400 mb-2" />
                <CardTitle className="text-xl">Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Send us an email for general inquiries.</p>
                <a href="mailto:support@brainlinktracker.com" className="text-blue-400 hover:text-blue-300 font-medium mt-2 block">
                  support@brainlinktracker.com
                </a>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 text-white">
              <CardHeader>
                <Phone className="w-6 h-6 text-purple-400 mb-2" />
                <CardTitle className="text-xl">Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Call our sales team for enterprise solutions.</p>
                <a href="tel:+1234567890" className="text-purple-400 hover:text-purple-300 font-medium mt-2 block">
                  +1 (234) 567-890
                </a>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 text-white">
              <CardHeader>
                <MapPin className="w-6 h-6 text-pink-400 mb-2" />
                <CardTitle className="text-xl">Our Office</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Brain Link Tracker HQ</p>
                <p className="text-slate-400">123 Analytics Ave, Suite 400</p>
                <p className="text-slate-400">Data City, CA 90210</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Subject of your inquiry"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
		      </div>
          <Footer />
		    </div>
		  )
}

export default ContactPage
