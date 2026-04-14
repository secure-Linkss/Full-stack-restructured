import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, DollarSign, Calendar, FileText, Bitcoin, Hash,
  CheckCircle, Copy, RefreshCw, Wallet, ExternalLink, XCircle,
  Clock, ChevronDown, ChevronUp, ArrowRight, Shield, AlertCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import api from '../services/api';

// ─── Confirmation progress mini-bar ──────────────────────────────────────────
const ConfBar = ({ confs, required }) => {
  const pct  = Math.min(100, Math.round((confs / required) * 100));
  const color = confs >= required ? '#10b981' : confs > 0 ? '#f59e0b' : '#6b7280';
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color }} className="font-mono font-bold">{confs}/{required} confs</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1" />
    </div>
  );
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const Pill = ({ status }) => {
  const map = {
    pending:   'bg-[#f59e0b]/10 text-[#f59e0b]',
    confirmed: 'bg-[#10b981]/10 text-[#10b981]',
    rejected:  'bg-[#ef4444]/10 text-[#ef4444]',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${map[status] || 'bg-secondary text-muted-foreground'}`}>
      {status}
    </span>
  );
};

// ─── Explorer link ────────────────────────────────────────────────────────────
function explorerUrl(currency, hash) {
  if (!hash) return null;
  const m = { BTC: `https://www.blockchain.com/explorer/transactions/btc/${hash}`, ETH: `https://etherscan.io/tx/${hash}`, USDT: `https://etherscan.io/tx/${hash}`, BNB: `https://bscscan.com/tx/${hash}` };
  return m[(currency || '').toUpperCase()] || null;
}

// ─── Single crypto TX row ─────────────────────────────────────────────────────
const CryptoTxRow = ({ tx, requiredConfs, onPoll }) => {
  const [expanded, setExpanded] = useState(false);
  const url = explorerUrl(tx.currency, tx.transaction_hash);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center shrink-0">
            <Bitcoin className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono text-foreground truncate max-w-[180px]">{tx.transaction_hash}</p>
            <p className="text-[10px] text-muted-foreground">{tx.currency} · {tx.plan_type} · {new Date(tx.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold text-[#10b981]">${Number(tx.amount_usd || 0).toFixed(2)}</span>
          <Pill status={tx.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border space-y-3 bg-[rgba(255,255,255,0.01)]">
          <ConfBar confs={tx.blockchain_confirmations || 0} required={requiredConfs} />

          <div className="flex gap-3 flex-wrap text-xs">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#3b82f6] hover:underline">
                <ExternalLink className="w-3 h-3" /> View on Explorer
              </a>
            )}
            <button onClick={() => { navigator.clipboard.writeText(tx.transaction_hash); toast.success('TX hash copied'); }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Copy className="w-3 h-3" /> Copy TX Hash
            </button>
            {tx.status === 'pending' && (
              <button onClick={() => onPoll(tx.id)} className="flex items-center gap-1 text-[#10b981] hover:underline">
                <RefreshCw className="w-3 h-3" /> Refresh confirmations
              </button>
            )}
          </div>

          {tx.status === 'rejected' && tx.rejection_reason && (
            <div className="text-xs text-[#ef4444] bg-[#ef4444]/5 border border-[#ef4444]/20 rounded p-2">
              <span className="font-semibold">Rejection Reason: </span>{tx.rejection_reason}
            </div>
          )}

          {tx.status === 'pending' && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#f59e0b]" />
              Awaiting {requiredConfs - (tx.blockchain_confirmations || 0)} more confirmation{requiredConfs - (tx.blockchain_confirmations || 0) !== 1 ? 's' : ''}. Page auto-updates every 30s.
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────
const BillingAndSubscription = () => {
  const navigate = useNavigate();
  const [billingInfo, setBillingInfo]         = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [adminWallets, setAdminWallets]       = useState([]);
  const [myPayments, setMyPayments]           = useState([]);
  const [requiredConfs, setRequiredConfs]     = useState(30);
  const [pollingId, setPollingId]             = useState(null);
  const [stripeLoading, setStripeLoading]     = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, walletsRes, paymentsRes] = await Promise.allSettled([
        api.profile.get(),
        fetch('/api/crypto-payments/wallets').then(r => r.json()),
        fetch('/api/crypto-payments/my-payments', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
      ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value;
        setBillingInfo({
          plan: p.plan || p.subscription_plan || p.plan_type || 'Free',
          status: p.subscription_status || 'active',
          expiry: p.subscription_expiry || p.subscription_end_date,
          payment_method: p.payment_method || null,
          invoices: p.invoices || [],
        });
      }

      if (walletsRes.status === 'fulfilled' && walletsRes.value?.wallets) {
        setAdminWallets(walletsRes.value.wallets.filter(w => w.is_active));
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.payments) {
        setMyPayments(paymentsRes.value.payments);
      }

      // Get required confirmations (public-ish — use settings if available)
      try {
        const settingsRes = await fetch('/api/admin/crypto-payments/settings', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json());
        if (settingsRes?.settings?.required_confirmations) {
          setRequiredConfs(settingsRes.settings.required_confirmations);
        }
      } catch { /* non-admin users may get 403 — use default 30 */ }

    } catch (err) {
      toast.error('Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh pending confirmations every 30s
    const interval = setInterval(() => {
      const hasPending = myPayments.some(p => p.status === 'pending');
      if (hasPending) fetchAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll, myPayments]);

  // Manual poll for a single transaction
  const pollTx = async (txId) => {
    setPollingId(txId);
    try {
      const res = await fetch(`/api/crypto-payments/status/${txId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json());

      if (res.success) {
        setMyPayments(prev => prev.map(p =>
          p.id === txId
            ? { ...p, blockchain_confirmations: res.confirmations, status: res.status }
            : p
        ));
        if (res.auto_confirmed) {
          toast.success('Payment auto-confirmed! Your subscription is now active.');
          fetchAll();
        } else {
          toast.info(`${res.confirmations}/${res.required} confirmations via ${res.provider || 'blockchain'}.`);
        }
      }
    } catch {
      toast.error('Could not fetch confirmation status.');
    } finally {
      setPollingId(null);
    }
  };

  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ plan: billingInfo?.plan || 'pro', billing_cycle: 'monthly' })
      }).then(r => r.json());

      if (res.url || res.checkout_url || res.session_url) {
        window.location.href = res.url || res.checkout_url || res.session_url;
      } else {
        toast.error(res.error || 'Stripe checkout not available. Check your configuration.');
      }
    } catch {
      toast.error('Failed to start Stripe checkout.');
    } finally {
      setStripeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading billing details...</p>
        </div>
      </div>
    );
  }

  const pendingPayments   = myPayments.filter(p => p.status === 'pending');
  const confirmedPayments = myPayments.filter(p => p.status === 'confirmed');
  const planActive = ['active', 'pro', 'enterprise', 'premium'].includes(
    (billingInfo?.status || '').toLowerCase()
  ) || confirmedPayments.length > 0;

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">

      {/* ── Subscription status ─────────────────────────────────────────── */}
      <div className="enterprise-card p-6">
        <h3 className="text-sm font-heading font-semibold text-foreground flex items-center mb-5 border-b border-border pb-4">
          <CreditCard className="w-4 h-4 mr-2" /> Subscription Status
        </h3>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[rgba(255,255,255,0.01)] border border-border p-5 rounded-lg">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Current Plan: <span className="text-[#3b82f6] capitalize">{billingInfo?.plan}</span>
            </p>
            {billingInfo?.expiry && (
              <p className="text-xs text-muted-foreground flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {new Date(billingInfo.expiry) > new Date() ? 'Expires' : 'Expired'}:
                {' '}{new Date(billingInfo.expiry).toLocaleDateString()}
              </p>
            )}
            {pendingPayments.length > 0 && (
              <p className="text-xs text-[#f59e0b] flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" /> {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} pending confirmation
              </p>
            )}
          </div>
          <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest mt-4 md:mt-0 ${planActive ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
            {planActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* ── Payment methods ─────────────────────────────────────────────── */}
      <div className="enterprise-card p-6">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-5 border-b border-border pb-4">
          Upgrade / Manage Subscription
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Stripe */}
          <div className="enterprise-card p-5 border-[#3b82f6]/30 bg-gradient-to-br from-[rgba(59,130,246,0.05)] to-transparent group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Credit / Debit Card</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Instant activation via Stripe. Visa, Mastercard, AMEX.</p>
              </div>
              <CreditCard className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <button
              onClick={handleStripeCheckout}
              disabled={stripeLoading}
              className="btn-primary w-full text-xs py-2.5"
            >
              {stripeLoading
                ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                : <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
              {stripeLoading ? 'Loading…' : 'Checkout via Stripe'}
            </button>
          </div>

          {/* Crypto */}
          <div className="enterprise-card p-5 border-[#10b981]/30 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center">
                  Cryptocurrency
                  <span className="ml-2 bg-[#10b981]/20 text-[#10b981] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Decentralized</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {adminWallets.length > 0
                    ? `Pay via ${adminWallets.map(w => w.currency).join(', ')}. Requires ${requiredConfs} confirmations.`
                    : 'Crypto payments not yet configured. Contact admin.'}
                </p>
              </div>
              <Bitcoin className="w-6 h-6 text-[#10b981]" />
            </div>

            {adminWallets.length > 0 ? (
              <button
                onClick={() => navigate('/checkout?method=crypto')}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> Open Crypto Payment Form
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="text-center py-3 text-xs text-muted-foreground bg-background border border-border rounded-md">
                <Wallet className="w-5 h-5 mx-auto mb-1 opacity-40" />
                Not configured by admin
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Crypto payment history ───────────────────────────────────────── */}
      {myPayments.length > 0 && (
        <div className="enterprise-card p-6">
          <div className="flex items-center justify-between mb-5 border-b border-border pb-4">
            <h3 className="text-sm font-heading font-semibold text-foreground flex items-center">
              <Hash className="w-4 h-4 mr-2 text-[#10b981]" /> Crypto Payment History
            </h3>
            <button onClick={fetchAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {pendingPayments.length > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 text-xs text-[#f59e0b] flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''}</span>
                {' '}— awaiting blockchain confirmations. This page auto-refreshes every 30 seconds.
                You'll receive a notification once confirmed.
              </div>
            </div>
          )}

          <div className="space-y-2">
            {myPayments.map(tx => (
              <CryptoTxRow
                key={tx.id}
                tx={tx}
                requiredConfs={requiredConfs}
                onPoll={pollingId === tx.id ? () => {} : pollTx}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Invoice history ──────────────────────────────────────────────── */}
      <div className="enterprise-card p-6">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4 border-b border-border pb-3 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Invoice History
        </h3>
        {(billingInfo?.invoices || []).length === 0 ? (
          <div className="enterprise-card p-8 text-center">
            <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          </div>
        ) : (
          <div className="enterprise-card overflow-hidden">
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingInfo.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="py-3 font-mono text-xs">{inv.id}</td>
                    <td className="py-3 text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-3 text-sm font-bold text-right">${(inv.amount || 0).toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <Pill status={inv.status?.toLowerCase() === 'paid' ? 'confirmed' : 'pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default BillingAndSubscription;
