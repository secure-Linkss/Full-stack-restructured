import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, ShieldCheck, Activity, Globe, Zap, ChevronRight, Lock, Code2, Cpu, TrendingUp, Link2, Users2, MousePointerClick, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import Logo from './Logo';
import { useSEO } from '../hooks/useSEO';

// ─── Thresholds: once real data exceeds these, live data is shown ─────────────
const LIVE_THRESHOLDS = {
  total_links:  500,
  total_clicks: 10000,
};

// ─── Promotional milestone data (shown until real data crosses thresholds) ────
const PROMO_STATS = {
  total_links:     5_200_000,
  total_clicks:    98_400_000,
  total_users:     87_300,
  bot_block_rate:  99.3,
  uptime_pct:      99.99,
  total_campaigns: 312_000,
};

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || !target) return;
    const startTime = performance.now();
    const startVal = 0;
    const endVal = Number(target);
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(startVal + (endVal - startVal) * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return value;
}

function formatStat(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ─── Mini bar sparkline ───────────────────────────────────────────────────────
const Sparkline = ({ color = '#3b82f6' }) => {
  const bars = [40, 65, 45, 80, 60, 90, 72, 95, 68, 85, 78, 100];
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm opacity-70"
          style={{ height: `${h}%`, background: color, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
};

// ─── Single stat card ─────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, suffix = '', color, sparkColor, isLive, animate }) => {
  const numVal = typeof value === 'number' ? value : 0;
  const counted = useCountUp(numVal, 1800, animate);
  const displayVal = animate ? formatStat(counted) : formatStat(numVal);

  return (
    <div className="enterprise-card p-5 flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(ellipse at top left, ${color}08 0%, transparent 60%)` }} />
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] text-[#10b981] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />LIVE
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground font-semibold">PLATFORM</span>
        )}
      </div>
      <div>
        <div className="text-2xl font-heading font-extrabold text-foreground tracking-tight">
          {displayVal}{suffix}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
      <Sparkline color={sparkColor || color} />
    </div>
  );
};

// ─── Dashboard mockup component ───────────────────────────────────────────────
const DashboardPreview = () => {
  const [stats, setStats] = useState(PROMO_STATS);
  const [isLive, setIsLive] = useState(false);
  const [animate, setAnimate] = useState(false);
  const sectionRef = useRef(null);

  // Fetch real stats on mount, decide which to display
  useEffect(() => {
    fetch('/api/public/stats')
      .then(r => r.json())
      .then(data => {
        const s = data?.stats || {};
        const realEnough =
          (s.total_links  || 0) >= LIVE_THRESHOLDS.total_links &&
          (s.total_clicks || 0) >= LIVE_THRESHOLDS.total_clicks;

        if (realEnough) {
          setStats({
            total_links:     s.total_links,
            total_clicks:    s.total_clicks,
            total_users:     s.total_users,
            bot_block_rate:  s.bot_block_rate,
            uptime_pct:      s.uptime_pct,
            total_campaigns: s.total_campaigns,
          });
          setIsLive(true);
        }
      })
      .catch(() => {}); // keep promo data on error
  }, []);

  // Trigger counter animation when section scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="rounded-xl border border-border bg-card shadow-2xl relative overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#10b981]" />

      {/* Mock browser chrome */}
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 border-b border-border">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/70" />
        <div className="ml-4 flex-1 max-w-xs bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-3 py-1 text-xs text-muted-foreground font-mono flex items-center gap-2">
          <Lock className="w-2.5 h-2.5 text-[#10b981]" />
          app.brainlinktracker.com/dashboard
        </div>
        {isLive && (
          <span className="ml-auto text-[10px] text-[#10b981] font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> LIVE DATA
          </span>
        )}
      </div>

      <div className="p-5 md:p-6 space-y-4">
        {/* Top KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={Link2}         label="Links Deployed"     value={stats.total_links}     color="#3b82f6"  sparkColor="#3b82f6"  isLive={isLive} animate={animate} />
          <StatCard icon={MousePointerClick} label="Total Clicks Tracked" value={stats.total_clicks} color="#10b981" sparkColor="#10b981" isLive={isLive} animate={animate} />
          <StatCard icon={Users2}        label="Active Users"       value={stats.total_users}     color="#8b5cf6"  sparkColor="#8b5cf6"  isLive={isLive} animate={animate} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={Shield}        label="Bot Block Rate"     value={stats.bot_block_rate}  suffix="%" color="#ef4444" sparkColor="#ef4444" isLive={isLive} animate={animate} />
          <StatCard icon={TrendingUp}    label="Campaigns Running"  value={stats.total_campaigns} color="#f59e0b"  sparkColor="#f59e0b"  isLive={isLive} animate={animate} />
          <StatCard icon={Clock}         label="Uptime SLA"         value={stats.uptime_pct}      suffix="%" color="#10b981" sparkColor="#10b981" isLive={isLive} animate={animate} />
        </div>

        {/* Live event feed mockup */}
        <div className="enterprise-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Event Stream</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse ml-auto" />
          </div>
          <div className="space-y-2">
            {[
              { country: '🇺🇸', event: 'Click captured', link: 'promo-q4-2026', ms: '12ms',  color: '#10b981' },
              { country: '🇬🇧', event: 'Bot blocked',    link: 'retarget-uk-v2', ms: '3ms',  color: '#ef4444' },
              { country: '🇩🇪', event: 'Email captured', link: 'euro-campaign',  ms: '8ms',  color: '#3b82f6' },
              { country: '🇧🇷', event: 'Pixel fired',    link: 'latam-funnel',   ms: '21ms', color: '#8b5cf6' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/40 last:border-0">
                <span className="text-base leading-none">{e.country}</span>
                <span className="font-mono text-muted-foreground truncate flex-1">{e.link}</span>
                <span className="font-semibold" style={{ color: e.color }}>{e.event}</span>
                <span className="text-muted-foreground font-mono">{e.ms}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const HomePage = () => {
   useSEO({
     title: 'Advanced Link Tracking & Quantum Redirect Intelligence',
     description: 'Brain Link Tracker — Institutional-grade link tracking, multi-stage quantum redirect, inbox scoring, real-time analytics, and bot detection. Trusted by elite marketers worldwide.',
     keywords: 'link tracker, quantum redirect, click tracking, UTM analytics, bot detection, inbox score, custom domain, smart redirect',
     canonical: '/',
     type: 'website',
     jsonLd: {
       '@context': 'https://schema.org',
       '@type': 'SoftwareApplication',
       name: 'Brain Link Tracker',
       applicationCategory: 'BusinessApplication',
       operatingSystem: 'Web',
       description: 'Institutional-grade link tracking with quantum redirect, inbox scoring, and real-time analytics.',
       offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
       url: typeof window !== 'undefined' ? window.location.origin : '',
     },
   });
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3b82f6] opacity-20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#10b981] opacity-10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-[rgba(255,255,255,0.03)] backdrop-blur-sm mb-8 animate-fade-in">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
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

            {/* Dashboard Preview */}
            <div className="container mx-auto px-6 md:px-12 mt-20 relative z-10 animate-fade-in" style={{animationDelay: '0.5s'}}>
               <DashboardPreview />
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
                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-6">
                        <ShieldCheck className="w-6 h-6 text-[#3b82f6]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Active Bot Shield</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Proprietary AI firewall that scrubs incoming traffic, eliminating bot traces before they hit your core infrastructure.</p>
                  </div>

                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6">
                        <Activity className="w-6 h-6 text-[#10b981]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Live Telemetry</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Sub-second event streaming. Watch your users globally interact with your routing arrays in absolute real-time.</p>
                  </div>

                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center mb-6">
                        <Globe className="w-6 h-6 text-[#f59e0b]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Global Routing</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Map your own custom domains or utilize our resilient shared FQDN pools to ensure 99.99% redirect uptime globally.</p>
                  </div>

                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center mb-6">
                        <Zap className="w-6 h-6 text-[#8b5cf6]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Pixel Injection</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Seamlessly integrate Facebook, TikTok, and systemic cross-domain pixels without impacting page load latency.</p>
                  </div>

                  <div className="enterprise-card p-8 group hover:-translate-y-1 transition-transform duration-300">
                     <div className="w-12 h-12 rounded-lg bg-[rgba(236,72,153,0.1)] flex items-center justify-center mb-6">
                        <Lock className="w-6 h-6 text-[#ec4899]" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Anonymous Payments</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">Enterprise billing supporting zero-knowledge cryptocurrency contracts and traditional Stripe gateways.</p>
                  </div>

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
            <div className="absolute inset-0 bg-[#3b82f6] opacity-[0.03]" />
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
