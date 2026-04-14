import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Activity, Globe, Zap, ChevronRight, Lock, Code2, Users2, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import Logo from './Logo';

const HomePage = () => {
   const [scrolled, setScrolled] = useState(false);

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   return (
      <div className="min-h-screen bg-background text-foreground selection:bg-[#3b82f6]/30 font-body overflow-x-hidden">
         {/* Navigation */}
         <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-background/80 backdrop-blur-xl border-border py-4' : 'bg-transparent border-transparent py-6'}`}>
            <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
               <Link to="/" className="flex items-center">
                  <Logo size="md" />
               </Link>
               <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                  <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                  <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                  <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
               </div>
               <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-medium hover:text-[#3b82f6] transition-colors hidden sm:block">Sign In</Link>
                  <Link to="/register" className="btn-primary py-2 px-5 text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                     Start Building <ArrowRight className="w-4 h-4 ml-2 inline-block" />
                  </Link>
               </div>
            </div>
         </nav>

         {/* Hero Section */}
         <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3b82f6] opacity-20 blur-[120px] rounded-full point-events-none"></div>
            <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#10b981] opacity-10 blur-[150px] rounded-full point-events-none"></div>
            
            <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-[rgba(255,255,255,0.03)] backdrop-blur-sm mb-8 animate-fade-in">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Enterprise Tracking Infrastructure v2.0 Live</span>
               </div>
               
               <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tighter mb-8 leading-[1.1] animate-fade-in" style={{animationDelay: '0.1s'}}>
                  Route Infrastructure <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">Without Compromise.</span>
               </h1>
               
               <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
                  BrainLink Tracker provides enterprise-grade URL routing, real-time bot shielding, and multi-network pixel delivery designed for high-volume performance marketing.
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-foreground text-background font-bold rounded-lg hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center text-lg">
                     Deploy Now <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link to="/features" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-border text-foreground font-bold rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center text-lg">
                     <Code2 className="w-5 h-5 mr-2 text-muted-foreground" /> Read Documentation
                  </Link>
               </div>
            </div>

            {/* Mockup Preview */}
            <div className="container mx-auto px-6 md:px-12 mt-20 relative z-10 animate-fade-in" style={{animationDelay: '0.5s'}}>
               <div className="rounded-xl border border-border bg-card shadow-2xl p-2 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#10b981] rounded-t-xl opacity-50"></div>
                  <div className="rounded-lg bg-background border border-border h-[400px] md:h-[600px] w-full flex items-center justify-center relative overflow-hidden">
                     {/* Abstract Mockup Representation */}
                     <div className="absolute inset-0 bg-[radial-gradient(#1e2d47_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
                     <div className="relative text-center">
                        <Activity className="w-16 h-16 text-[#3b82f6] mx-auto mb-6 opacity-80" />
                        <h3 className="text-2xl font-bold font-heading text-white opacity-80">Dashboard Telemetry</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">Real-time data visualization securely processed.</p>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Features Grid */}
         <section className="py-24 border-t border-border bg-[rgba(255,255,255,0.01)] relative">
            <div className="container mx-auto px-6 md:px-12">
               <div className="mb-16 md:mb-24">
                  <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 tracking-tight">Built for Scale and <br/><span className="text-[#10b981]">Extreme Precision.</span></h2>
                  <p className="text-muted-foreground max-w-xl text-lg">A robust suite of tools engineered specifically to protect your data integrity and maximize traffic monetization.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Feature 1 */}
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-6">
                        <ShieldCheck className="w-6 h-6 text-[#3b82f6]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Active Bot Shield</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Proprietary AI firewall that scrubs incoming traffic, eliminating bot traces before they hit your core infrastructure.</p>
                  </div>

                  {/* Feature 2 */}
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6">
                        <Activity className="w-6 h-6 text-[#10b981]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Live Telemetry</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Sub-second event streaming. Watch your users globally interact with your routing arrays in absolute real-time.</p>
                  </div>

                  {/* Feature 3 */}
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center mb-6">
                        <Globe className="w-6 h-6 text-[#f59e0b]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Global Routing</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Map your own custom domains or utilize our resilient shared FQDN pools to ensure 99.99% redirect uptime globally.</p>
                  </div>

                  {/* Feature 4 */}
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center mb-6">
                        <Zap className="w-6 h-6 text-[#8b5cf6]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Pixel Injection</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Seamlessly integrate Facebook, TikTok, and systemic cross-domain pixels without impacting page load latency.</p>
                  </div>

                  {/* Feature 5 */}
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(236,72,153,0.1)] flex items-center justify-center mb-6">
                        <Lock className="w-6 h-6 text-[#ec4899]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Anonymous Payments</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Enterprise billing supporting zero-knowledge cryptocurrency contracts and traditional Stripe gateways.</p>
                  </div>

                  {/* Feature 6 */}
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(14,165,233,0.1)] flex items-center justify-center mb-6">
                        <Cpu className="w-6 h-6 text-[#0ea5e9]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Headless API</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Automate link provisioning globally using our RESTful endpoints with comprehensive documentation.</p>
                  </div>
               </div>
            </div>
         </section>

         {/* CTA Section */}
         <section className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#3b82f6] opacity-[0.03]"></div>
            <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
               <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight">Ready to fortify your traffic?</h2>
               <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                  Join enterprise marketing teams relying on BrainLink's rigorous analytics.
               </p>
               <Link to="/register" className="btn-primary py-4 px-10 text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all inline-flex items-center">
                  Start Your Instance Now <ChevronRight className="w-5 h-5 ml-1" />
               </Link>
            </div>
         </section>


         <Footer isPublic={true} />
      </div>
   );
};

export default HomePage;