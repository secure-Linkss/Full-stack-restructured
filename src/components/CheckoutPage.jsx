import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Bitcoin, ArrowLeft, Check, Zap, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import CryptoPaymentForm from './CryptoPaymentForm';
import { toast } from 'sonner';

const PLANS = {
  free:       { label: 'Free',       price: 0,     features: ['5 links/month', 'Basic analytics', 'Standard support'] },
  pro:        { label: 'Pro',        price: 29.99, features: ['Unlimited links', 'Advanced analytics', 'Custom domains', 'Priority support'] },
  enterprise: { label: 'Enterprise', price: 99.99, features: ['Everything in Pro', 'White-label', 'API access', 'Dedicated manager'] },
};

const CheckoutPage = () => {
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const [method, setMethod]   = useState(searchParams.get('method') || null); // 'stripe' | 'crypto'
  const [plan]                = useState(searchParams.get('plan') || 'pro');
  const [billing]             = useState(searchParams.get('billing') || 'monthly');
  const [stripeLoading, setStripeLoading] = useState(false);

  const planInfo = PLANS[plan] || PLANS.pro;

  const handleStripe = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ plan, billing_cycle: billing }),
      }).then(r => r.json());

      const url = res.url || res.checkout_url || res.session_url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error(res.error || 'Stripe checkout unavailable. Please contact support.');
      }
    } catch {
      toast.error('Could not start Stripe checkout.');
    } finally {
      setStripeLoading(false);
    }
  };

  if (method === 'crypto') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMethod(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-sm font-semibold text-foreground">Crypto Payment — {planInfo.label} Plan</span>
        </div>
        <div className="flex-1 flex items-start justify-center p-6">
          <div className="w-full max-w-lg">
            <CryptoPaymentForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-[#10b981]" /> Secure Checkout
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-2xl space-y-6 pt-4">

          {/* Order summary */}
          <div className="enterprise-card p-6">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">Order Summary</h2>
            <div className="flex items-start justify-between p-4 rounded-lg border border-border bg-[rgba(255,255,255,0.02)]">
              <div>
                <p className="font-semibold text-foreground capitalize">{planInfo.label} Plan — {billing}</p>
                <ul className="mt-2 space-y-1">
                  {planInfo.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-[#10b981]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-bold text-foreground">${planInfo.price}</p>
                <p className="text-xs text-muted-foreground">/{billing === 'yearly' ? 'yr' : 'mo'}</p>
              </div>
            </div>
          </div>

          {/* Payment method selection */}
          <div className="enterprise-card p-6">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">Choose Payment Method</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stripe */}
              <div className="enterprise-card p-5 border-[#3b82f6]/30 bg-gradient-to-br from-[rgba(59,130,246,0.05)] to-transparent cursor-pointer hover:border-[#3b82f6]/60 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-foreground">Credit / Debit Card</p>
                    <p className="text-xs text-muted-foreground mt-1">Instant activation. Visa, Mastercard, AMEX.</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-[#3b82f6]" />
                </div>
                <div className="space-y-1.5 mb-4">
                  {['Instant activation', 'Recurring billing', 'PCI compliant via Stripe'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-[#3b82f6]" /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleStripe}
                  disabled={stripeLoading}
                  className="w-full py-2.5 text-xs font-semibold rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors flex items-center justify-center gap-2"
                >
                  {stripeLoading
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <ExternalLink className="w-3.5 h-3.5" />}
                  {stripeLoading ? 'Redirecting…' : 'Pay with Stripe'}
                </button>
              </div>

              {/* Crypto */}
              <div className="enterprise-card p-5 border-[#10b981]/30 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent cursor-pointer hover:border-[#10b981]/60 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-foreground">Cryptocurrency</p>
                    <p className="text-xs text-muted-foreground mt-1">BTC, ETH, USDT, BNB, LTC. Decentralized.</p>
                  </div>
                  <Bitcoin className="w-6 h-6 text-[#10b981]" />
                </div>
                <div className="space-y-1.5 mb-4">
                  {['No credit card required', 'Blockchain-verified', '30-confirmation security'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-[#10b981]" /> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setMethod('crypto')}
                  className="w-full py-2.5 text-xs font-semibold rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" /> Pay with Crypto
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By completing payment you agree to our <a href="/terms" className="underline hover:text-foreground">Terms of Service</a> and <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
