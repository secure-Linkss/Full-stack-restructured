import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard, Check, AlertCircle, Zap, Crown, Star, Bitcoin, Copy, RefreshCw,
  ArrowRight, Clock, CheckCircle, Upload, Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const CURRENCY_ICONS = {
  BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '$', LTC: 'Ł', BNB: 'B', SOL: '◎', XRP: '✕'
};

const Payments = () => {
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);

  // Crypto payment state
  const [cryptoWallets, setCryptoWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [txNetwork, setTxNetwork] = useState('');
  const [submittingHash, setSubmittingHash] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
    fetchCryptoWallets();
    fetchPaymentHistory();
  }, []);

  const fetchPlans = async () => {
    try {
      const json = await api.payments.getPlans();
      setPlans(json.plans || {});
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const data = await api.payments.getSubscription();
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchCryptoWallets = async () => {
    try {
      const res = await api.payments.getCryptoWallets();
      setCryptoWallets(res.wallets || res || []);
    } catch {
      // Admin may not have set up wallets yet
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const res = await api.payments.getHistory();
      setPaymentHistory(res.payments || res || []);
    } catch {
      // silent
    }
  };

  const handleStripeSubscribe = async (planType) => {
    setLoading(true);
    setProcessingPlan(planType);
    try {
      const data = await api.payments.createStripeCheckout(planType, 'monthly');
      if (data.url || data.checkout_url) {
        window.location.href = data.url || data.checkout_url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch {
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  const handleCryptoSubmit = async (e) => {
    e.preventDefault();
    if (!txHash.trim()) return toast.error('Please enter your transaction hash.');
    if (!selectedWallet) return toast.error('Please select a wallet you paid to.');
    setSubmittingHash(true);
    try {
      await api.payments.submitCryptoHash(txHash.trim(), txNetwork || selectedWallet?.currency);
      toast.success('Transaction submitted! Our team will verify it within 1-24 hours.');
      setTxHash('');
      setTxNetwork('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit transaction.');
    } finally {
      setSubmittingHash(false);
    }
  };

  const copyAddress = (address, id) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(id);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const PlanIcon = ({ planType }) => {
    if (planType === 'enterprise') return <Crown className="h-8 w-8 text-yellow-400" />;
    if (planType === 'pro' || planType === 'monthly') return <Zap className="h-8 w-8 text-blue-400" />;
    return <Star className="h-8 w-8 text-slate-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
        <p className="text-slate-400">Choose the plan that fits your needs</p>
      </div>

      {currentSubscription?.plan_type && currentSubscription.plan_type !== 'free' && (
        <Alert className="border-blue-500 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-400">
            You are currently on the <strong>{currentSubscription.plan_type?.toUpperCase()}</strong> plan
            {currentSubscription.subscription_expiry && (
              <> (expires {new Date(currentSubscription.subscription_expiry).toLocaleDateString()})</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([key, plan]) => (
          <Card key={key} className={`bg-slate-800 border-slate-700 transition-all hover:border-slate-600 ${currentSubscription?.plan_type === key ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <PlanIcon planType={key} />
                {currentSubscription?.plan_type === key && <Badge className="bg-blue-500">Current Plan</Badge>}
              </div>
              <CardTitle className="text-white text-2xl mt-4">{plan.name || key}</CardTitle>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.price > 0 && <span className="text-slate-400">/{plan.duration_days <= 7 ? 'week' : plan.duration_days <= 31 ? 'month' : 'year'}</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {(plan.features || []).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              {key === 'free' ? (
                <Button className="w-full" variant="outline" disabled>Free Forever</Button>
              ) : currentSubscription?.plan_type === key ? (
                <Button className="w-full bg-slate-700 hover:bg-slate-600" disabled>Current Plan</Button>
              ) : (
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStripeSubscribe(key)} disabled={loading}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {processingPlan === key ? 'Processing...' : 'Subscribe via Card'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method Tabs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Payment Methods</CardTitle>
          <CardDescription>Pay with card (Stripe) or cryptocurrency</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="card">
            <TabsList className="bg-slate-900 border border-slate-700">
              <TabsTrigger value="card" className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Card / Stripe</TabsTrigger>
              <TabsTrigger value="crypto" className="flex items-center gap-2"><Bitcoin className="w-4 h-4" /> Cryptocurrency</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-300">Credit / Debit Card</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
                  <span className="text-slate-300">Powered by</span>
                  <span className="font-bold text-white">Stripe</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">Click "Subscribe via Card" on any plan above to be redirected to Stripe's secure checkout.</p>
            </TabsContent>

            <TabsContent value="crypto" className="mt-4 space-y-6">
              {cryptoWallets.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No crypto wallets have been set up by the admin yet. Please check back later or use card payment.</p>
                </div>
              ) : (
                <>
                  {/* Wallet addresses */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Bitcoin className="w-4 h-4 text-[#f59e0b]" /> Send Payment To</h3>
                    <p className="text-xs text-slate-400 mb-4">Select your preferred currency, send the exact plan amount to the wallet address, then submit your transaction hash below for verification.</p>
                    <div className="space-y-3">
                      {cryptoWallets.map((wallet, i) => (
                        <div
                          key={wallet.id || i}
                          onClick={() => setSelectedWallet(wallet)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedWallet?.id === wallet.id || selectedWallet?.wallet_address === wallet.wallet_address ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.08)]' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${wallet.currency === 'BTC' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : wallet.currency === 'ETH' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {CURRENCY_ICONS[wallet.currency] || ''} {wallet.currency}
                              </span>
                              {wallet.network && <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{wallet.network}</span>}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyAddress(wallet.wallet_address, wallet.id || i); }}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
                            >
                              {copiedAddress === (wallet.id || i) ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                            </button>
                          </div>
                          <code className="text-xs text-slate-300 font-mono mt-2 block break-all">{wallet.wallet_address}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TX hash submission */}
                  <div className="border-t border-slate-700 pt-5">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-[#3b82f6]" /> Submit Your Transaction</h3>
                    <form onSubmit={handleCryptoSubmit} className="space-y-4 max-w-xl">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Selected Wallet</Label>
                        <Input
                          readOnly
                          className="bg-slate-900 border-slate-700 text-slate-400 font-mono text-xs"
                          value={selectedWallet ? `${selectedWallet.currency} — ${selectedWallet.wallet_address}` : 'Click a wallet above to select it'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Transaction Hash / TX ID</Label>
                        <Input
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                          placeholder="e.g. 0x3f2b9a1c4e5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b..."
                          required
                        />
                        <p className="text-xs text-slate-500">Copy the transaction hash from your wallet or exchange after sending.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Network (optional)</Label>
                        <Input
                          value={txNetwork}
                          onChange={(e) => setTxNetwork(e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white text-sm"
                          placeholder="e.g. ERC-20, TRC-20, BEP-20"
                        />
                      </div>
                      <Button type="submit" disabled={submittingHash || !txHash.trim()} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold">
                        {submittingHash ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><ArrowRight className="w-4 h-4 mr-2" /> Submit for Verification</>}
                      </Button>
                    </form>
                    <div className="mt-4 p-3 bg-slate-900/60 rounded-lg border border-slate-700">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-400">After submission, our admin team typically verifies transactions within <strong className="text-slate-300">1-24 hours</strong>. You'll receive a notification once your plan is activated.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentHistory.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{p.plan_type?.toUpperCase() || p.description || 'Payment'}</p>
                    <p className="text-xs text-slate-400">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{p.amount ? `$${p.amount}` : ''}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' || p.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.status === 'completed' || p.status === 'confirmed' ? <CheckCircle className="w-3 h-3 inline mr-1" /> : null}{p.status || 'unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">Frequently Asked Questions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-2">Can I cancel anytime?</h3>
            <p className="text-slate-400 text-sm">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-slate-400 text-sm">We accept all major credit/debit cards via Stripe, and cryptocurrency (BTC, ETH, USDT, and more). For crypto payments, send the amount to the displayed wallet address and submit your transaction hash for manual verification.</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">How long does crypto verification take?</h3>
            <p className="text-slate-400 text-sm">Crypto transactions are manually reviewed and typically activated within 1-24 hours after submission.</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">Can I upgrade or downgrade?</h3>
            <p className="text-slate-400 text-sm">Yes, you can change your plan at any time. Contact support if you need to switch plans.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
