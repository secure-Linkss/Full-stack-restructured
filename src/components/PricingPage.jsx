import React, { useState } from 'react';
import { Check, X, ArrowRight, Zap, Shield, Cpu, Brain, Lock, Globe, BarChart3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import Footer from './Footer';

const PricingPage = () => {
   const [billingCycle, setBillingCycle] = useState('monthly');

   const annualDiscount = 0.8; // 20% off

   const plans = [
      {
         id: 'trial',
         name: 'Trial',
         tagline: 'Admin-approved access. Test the core system.',
         price: { monthly: 0, annual: 0 },
         cta: 'Apply for Trial',
         ctaLink: '/register',
         ctaStyle: 'btn-secondary',
         highlighted: false,
         badge: null,
         icon: <Zap className="w-5 h-5 text-muted-foreground" />,
         includes: 'Core features',
         features: [
            { label: 'Up to 3 tracking links', available: true },
            { label: '50 clicks per link', available: true },
            { label: 'Basic bot filtering', available: true },
            { label: 'Quantum Redirect (Stage 1–2)', available: true },
            { label: 'Email capture', available: true },
            { label: 'Custom domains', available: false },
            { label: 'Inbox Score™', available: false },
            { label: 'Channel Adaptive Mode™', available: false },
            { label: 'SafeRoute™', available: false },
            { label: 'Inbox Shield AI™', available: false },
            { label: 'Data export', available: false },
            { label: 'Advanced stealth headers', available: false },
         ],
         note: '24–72 hour admin approval. Expired after 14 days.',
      },
      {
         id: 'pro',
         name: 'Pro',
         tagline: 'Serious marketers. Full quantum routing stack.',
         price: { monthly: 100, annual: Math.round(100 * annualDiscount) },
         cta: 'Deploy Pro',
         ctaLink: '/register',
         ctaStyle: 'btn-primary shadow-[0_0_20px_rgba(59,130,246,0.4)]',
         highlighted: true,
         badge: 'Most Popular',
         icon: <Shield className="w-5 h-5 text-[#3b82f6]" />,
         includes: 'Everything in Trial, plus',
         features: [
            { label: 'Unlimited tracking links', available: true },
            { label: 'Unlimited clicks', available: true },
            { label: 'Full Quantum Redirect (4-stage)', available: true },
            { label: 'Inbox Score™ + manual optimize', available: true },
            { label: 'Channel Adaptive Mode™ (email, sms, linkedin)', available: true },
            { label: 'SafeRoute™ basic (human / bot split)', available: true },
            { label: '2–3 custom domain rotation', available: true },
            { label: 'All stealth headers', available: true },
            { label: 'Pixel injection (FB, GA, TikTok)', available: true },
            { label: 'Data export (CSV)', available: true },
            { label: 'Inbox Shield AI™ auto-defense', available: false },
            { label: 'Admin Intelligence Layer', available: false },
         ],
      },
      {
         id: 'premium',
         name: 'Premium',
         tagline: 'Full AI-driven inbox survival. Maximum evasion.',
         price: { monthly: 150, annual: Math.round(150 * annualDiscount) },
         cta: 'Go Premium',
         ctaLink: '/register',
         ctaStyle: 'w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-semibold rounded-md py-3 text-center text-sm hover:opacity-90 transition-opacity',
         highlighted: false,
         badge: 'Full Power',
         badgeColor: 'bg-[#8b5cf6]',
         icon: <Brain className="w-5 h-5 text-[#8b5cf6]" />,
         includes: 'Everything in Pro, plus',
         features: [
            { label: 'Unlimited tracking links', available: true },
            { label: 'Unlimited clicks', available: true },
            { label: 'Full Quantum Redirect (4-stage)', available: true },
            { label: 'Inbox Score™ + AI auto-optimize', available: true },
            { label: 'Channel Adaptive Mode™ (AI-tuned)', available: true },
            { label: 'SafeRoute™ full (smart delay, fallback)', available: true },
            { label: 'Unlimited domain rotation', available: true },
            { label: 'Inbox Shield AI™ — auto bot-spike defense', available: true },
            { label: 'ASN pattern auto-blocking', available: true },
            { label: 'Admin Intelligence Layer access', available: true },
            { label: 'Dedicated account manager', available: true },
            { label: 'SLA guarantee (99.99%)', available: true },
         ],
      },
   ];

   return (
      <div className="min-h-screen bg-background text-foreground selection:bg-[#3b82f6]/30 font-body pb-20">
         {/* Nav */}
         <nav className="border-b bg-background/80 backdrop-blur-xl border-border py-4 sticky top-0 z-50">
            <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
               <Link to="/" className="flex items-center">
                  <Logo size="md" />
               </Link>
               <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-medium hover:text-[#3b82f6] transition-colors">Sign In</Link>
               </div>
            </div>
         </nav>

         <div className="container mx-auto px-6 md:px-12 mt-20 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-full px-4 py-1.5 mb-6">
               <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
               <span className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest">Institutional-Grade Routing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight mb-6">
               Infrastructure pricing for <br className="hidden md:block"/>
               <span className="text-[#3b82f6]">inbox survival.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
               No hidden fees. Crypto & Fiat accepted. Cancel anytime. Choose the tier that keeps your links alive.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 mb-16">
               <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
               <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="w-14 h-7 rounded-full border border-border bg-[rgba(255,255,255,0.05)] relative transition-colors p-1"
               >
                  <div className={`w-5 h-5 rounded-full bg-[#3b82f6] transition-transform ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'}`}></div>
               </button>
               <span className={`text-sm font-semibold flex items-center gap-2 ${billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Annual
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded">Save 20%</span>
               </span>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
               {plans.map((plan) => (
                  <div
                     key={plan.id}
                     className={`enterprise-card p-8 flex flex-col relative hover:-translate-y-2 transition-transform duration-300 ${
                        plan.highlighted
                           ? 'border-[#3b82f6]/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] transform scale-105 z-10'
                           : ''
                     }`}
                  >
                     {plan.badge && (
                        <div className={`absolute top-0 right-0 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg rounded-tr-lg ${plan.badgeColor || 'bg-[#3b82f6]'}`}>
                           {plan.badge}
                        </div>
                     )}

                     {/* Header */}
                     <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                           {plan.icon}
                           <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-[#3b82f6]' : plan.id === 'premium' ? 'text-[#8b5cf6]' : 'text-foreground'}`}>
                              {plan.name}
                           </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                     </div>

                     {/* Price */}
                     <div className="mb-6">
                        {plan.price.monthly === 0 ? (
                           <div>
                              <span className="text-5xl font-heading font-extrabold pb-2 inline-block">Free</span>
                              <p className="text-xs text-muted-foreground mt-1">Admin approval required</p>
                           </div>
                        ) : (
                           <div>
                              <span className="text-5xl font-heading font-extrabold pb-2 inline-block">
                                 £{billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual}
                              </span>
                              <span className="text-muted-foreground">/mo</span>
                              {billingCycle === 'annual' && (
                                 <p className="text-xs text-[#10b981] mt-1">
                                    £{plan.price.monthly * 12 - plan.price.annual * 12} saved per year
                                 </p>
                              )}
                           </div>
                        )}
                     </div>

                     {/* CTA */}
                     <Link to={plan.ctaLink} className={`${plan.ctaStyle} w-full justify-center mb-8 py-3 text-sm text-center block`}>
                        {plan.cta}
                     </Link>

                     {/* Features */}
                     <div className="space-y-3 flex-1">
                        <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">{plan.includes}</p>
                        {plan.features.map((feature, i) => (
                           <div key={i} className="flex items-start gap-3">
                              {feature.available ? (
                                 <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-[#3b82f6]' : plan.id === 'premium' ? 'text-[#8b5cf6]' : 'text-[#10b981]'}`} />
                              ) : (
                                 <X className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/30" />
                              )}
                              <span className={`text-sm ${feature.available ? (plan.highlighted ? 'text-foreground font-medium' : 'text-muted-foreground') : 'text-muted-foreground/40 line-through'}`}>
                                 {feature.label}
                              </span>
                           </div>
                        ))}
                     </div>

                     {plan.note && (
                        <p className="mt-5 text-[11px] text-muted-foreground/50 border-t border-border/30 pt-4">{plan.note}</p>
                     )}
                  </div>
               ))}
            </div>

            {/* Feature highlights */}
            <div className="mt-24 max-w-5xl mx-auto">
               <h2 className="text-2xl font-heading font-bold mb-3">What makes Pro &amp; Premium different?</h2>
               <p className="text-muted-foreground mb-12 text-sm">Every plan above Trial runs the full Quantum Redirect 4-stage pipeline. Here's what Pro and Premium unlock on top.</p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {[
                     {
                        icon: <Shield className="w-6 h-6 text-[#3b82f6]" />,
                        title: 'Channel Adaptive Mode™',
                        desc: 'Email, LinkedIn, SMS, and General profiles each apply unique delay, param-stripping, and stealth header logic tuned to defeat that channel\'s scanner fingerprint.',
                        plan: 'Pro+',
                        color: '#3b82f6',
                     },
                     {
                        icon: <Globe className="w-6 h-6 text-[#10b981]" />,
                        title: 'SafeRoute™',
                        desc: 'Real humans get a full redirect. Scanners get a convincing decoy. Bots get hard-blocked. Suspicious traffic enters an adaptive delay loop. All automatic.',
                        plan: 'Pro+',
                        color: '#10b981',
                     },
                     {
                        icon: <Brain className="w-6 h-6 text-[#8b5cf6]" />,
                        title: 'Inbox Shield AI™',
                        desc: 'Monitors bot spike patterns, ASN clusters, and honeypot hit rates in real-time. Automatically tightens routing rules before your sender reputation takes damage.',
                        plan: 'Premium only',
                        color: '#8b5cf6',
                     },
                     {
                        icon: <BarChart3 className="w-6 h-6 text-[#f59e0b]" />,
                        title: 'Inbox Survival Score™',
                        desc: 'A 0–100 score computed from redirect cleanliness, domain reputation, bot activity ratio, quantum security violations, and honeypot exposure. No paid APIs.',
                        plan: 'Pro+',
                        color: '#f59e0b',
                     },
                     {
                        icon: <Cpu className="w-6 h-6 text-[#ef4444]" />,
                        title: 'Admin Intelligence Layer',
                        desc: 'Platform-wide scanner rates, per-user risk analysis, domain reputation scoring, ASN abuse maps, and real-time alert system. Built for power operators.',
                        plan: 'Premium only',
                        color: '#ef4444',
                     },
                     {
                        icon: <Lock className="w-6 h-6 text-[#06b6d4]" />,
                        title: 'Quantum Redirect 4-Stage',
                        desc: 'PBKDF2/SHA-256 transit tokens, time-bound validation, geo-aware routing, and browser fingerprinting across 4 cryptographic stages. Zero-trace architecture.',
                        plan: 'All paid plans',
                        color: '#06b6d4',
                     },
                  ].map((item, i) => (
                     <div key={i} className="enterprise-card p-6">
                        <div className="flex items-start gap-3 mb-3">
                           {item.icon}
                           <div>
                              <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.plan}</span>
                           </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* FAQ */}
            <div className="mt-24 max-w-2xl mx-auto text-left">
               <h2 className="text-2xl font-heading font-bold mb-8 text-center">Common questions</h2>
               <div className="space-y-6">
                  {[
                     {
                        q: 'What payment methods do you accept?',
                        a: 'We accept Stripe (card / bank), and crypto (BTC, ETH, USDT via manual verification). All crypto payments go through our admin-verified approval flow.',
                     },
                     {
                        q: 'How does the Trial plan work?',
                        a: 'You register and request a trial. An admin approves within 24–72 hours. Trial access lasts 14 days, capped at 3 links and 50 clicks per link. No credit card required.',
                     },
                     {
                        q: 'Can I upgrade mid-cycle?',
                        a: 'Yes. Upgrades take effect immediately. You\'ll be charged the prorated difference for the remainder of your billing cycle.',
                     },
                     {
                        q: 'Is Inbox Shield AI™ fully automated?',
                        a: 'Yes, on Premium. The system monitors bot spike patterns, ASN clusters, and honeypot hit rates continuously and tightens routing rules automatically without any manual input.',
                     },
                  ].map((item, i) => (
                     <div key={i} className="border-b border-border/50 pb-6">
                        <h4 className="font-semibold text-sm text-foreground mb-2">{item.q}</h4>
                        <p className="text-sm text-muted-foreground">{item.a}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
         <Footer isPublic={true} />
      </div>
   );
};

export default PricingPage;
