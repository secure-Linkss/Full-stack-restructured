import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, DollarSign, Calendar, FileText, Bitcoin, Hash,
  CheckCircle, Copy, RefreshCw, Wallet, ExternalLink, XCircle,
  Clock, ChevronDown, ChevronUp, ArrowRight, Shield, AlertCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

// ─── Confirmation progress mini-bar ──────────────────────────────────────────
const ConfBar = ({ confs, required }) => {
  const pct  = Math.min(100, Math.round((confs / required) * 100));
  const color = confs >= required ? '#10b981' : confs > 0 ? '#f59e0b' : '#6b7280';
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color }} className="font-mono font-bold">{confs}/{required} confs</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{pct}%</span>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const Pill = ({ status }) => {
  const map = {
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    confirmed: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    rejected:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  };
  const style = map[status] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' };
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
};

// ─── Explorer link ────────────────────────────────────────────────────────────
function explorerUrl(currency, hash) {
  if (!hash) return null;
  const m = {
    BTC:  `https://www.blockchain.com/explorer/transactions/btc/${hash}`,
    ETH:  `https://etherscan.io/tx/${hash}`,
    USDT: `https://etherscan.io/tx/${hash}`,
    BNB:  `https://bscscan.com/tx/${hash}`,
  };
  return m[(currency || '').toUpperCase()] || null;
}

// ─── Single crypto TX row ─────────────────────────────────────────────────────
const CryptoTxRow = ({ tx, requiredConfs, onPoll, index }) => {
  const [expanded, setExpanded] = useState(false);
  const url = explorerUrl(tx.currency, tx.transaction_hash);

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.005, transition: { duration: 0.15 } }}
      style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
        style={{ background: 'rgba(255,255,255,0.01)' }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)' }}
          >
            <Bitcoin className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono text-white truncate max-w-[180px]">{tx.transaction_hash}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {tx.currency} · {tx.plan_type} · {new Date(tx.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold text-emerald-400">${Number(tx.amount_usd || 0).toFixed(2)}</span>
          <Pill status={tx.status} />
          {expanded
            ? <ChevronUp className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          }
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
            className="px-4 pb-4 space-y-3 overflow-hidden"
          >
            <ConfBar confs={tx.blockchain_confirmations || 0} required={requiredConfs} />

            <div className="flex gap-3 flex-wrap text-xs pt-1">
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline">
                  <ExternalLink className="w-3 h-3" /> View on Explorer
                </a>
              )}
              <button
                onClick={() => { navigator.clipboard.writeText(tx.transaction_hash); toast.success('TX hash copied'); }}
                className="flex items-center gap-1 hover:text-white transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <Copy className="w-3 h-3" /> Copy TX Hash
              </button>
              {tx.status === 'pending' && (
                <button onClick={() => onPoll(tx.id)} className="flex items-center gap-1 text-emerald-400 hover:underline">
                  <RefreshCw className="w-3 h-3" /> Refresh confirmations
                </button>
              )}
            </div>

            {tx.status === 'rejected' && tx.rejection_reason && (
              <div
                className="text-xs p-2 rounded"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <span className="font-semibold">Rejection Reason: </span>{tx.rejection_reason}
              </div>
            )}

            {tx.status === 'pending' && (
              <div className="text-[11px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Clock className="w-3 h-3 text-amber-400" />
                Awaiting {requiredConfs - (tx.blockchain_confirmations || 0)} more confirmation{requiredConfs - (tx.blockchain_confirmations || 0) !== 1 ? 's' : ''}. Page auto-updates every 30s.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────
const BillingAndSubscription = () => {
  const navigate = useNavigate();
  const [billingInfo, setBillingInfo]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [adminWallets, setAdminWallets]   = useState([]);
  const [myPayments, setMyPayments]       = useState([]);
  const [requiredConfs, setRequiredConfs] = useState(30);
  const [pollingId, setPollingId]         = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, walletsRes, paymentsRes] = await Promise.allSettled([
        api.profile.get(),
        api.payments.getCryptoWallets(),
        api.payments.getMyPayments(),
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

      try {
        const settingsRes = await api.adminPayments.getCryptoSettings().catch(() => null);
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
    const interval = setInterval(() => {
      const hasPending = myPayments.some(p => p.status === 'pending');
      if (hasPending) fetchAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll, myPayments]);

  const pollTx = async (txId) => {
    setPollingId(txId);
    try {
      const res = await api.payments.getCryptoStatus(txId);
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
      const res = await api.payments.createStripeCheckout(billingInfo?.plan || 'pro', 'monthly');
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
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading billing details...</p>
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
    <div className="space-y-5 w-full pb-10">

      {/* ── Subscription Status ───────────────────────────────────────────── */}
      <motion.div
        style={glassCard}
        className="p-6"
        variants={cardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <CreditCard className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-semibold text-white">Subscription Status</p>
        </div>

        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-xl gap-4"
          style={{
            background: planActive ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.04)',
            border: planActive ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(245,158,11,0.15)',
            boxShadow: planActive
              ? '0 0 0 2px rgba(16,185,129,0.06), 0 0 20px rgba(16,185,129,0.04)'
              : '0 0 0 2px rgba(245,158,11,0.06), 0 0 20px rgba(245,158,11,0.04)',
          }}
        >
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              Current Plan:{' '}
              <span
                className="capitalize font-bold"
                style={{
                  color: '#3b82f6',
                  boxShadow: '0 0 0 2px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.1)',
                  padding: '1px 8px',
                  borderRadius: 6,
                  background: 'rgba(59,130,246,0.1)',
                  display: 'inline-block',
                }}
              >
                {billingInfo?.plan}
              </span>
            </p>
            {billingInfo?.expiry && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Calendar className="w-3.5 h-3.5" />
                {new Date(billingInfo.expiry) > new Date() ? 'Expires' : 'Expired'}:{' '}
                {new Date(billingInfo.expiry).toLocaleDateString()}
              </p>
            )}
            {pendingPayments.length > 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} pending confirmation
              </p>
            )}
          </div>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shrink-0"
            style={{
              background: planActive ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              color: planActive ? '#10b981' : '#f59e0b',
            }}
          >
            {planActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </motion.div>

      {/* ── Payment Methods ───────────────────────────────────────────────── */}
      <motion.div
        style={glassCard}
        className="p-6"
        variants={cardVariants}
        custom={1}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Wallet className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-semibold text-white">Upgrade / Manage Subscription</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stripe */}
          <motion.div
            whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            style={{
              background: 'rgba(59,130,246,0.05)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">Credit / Debit Card</h4>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Instant activation via Stripe. Visa, Mastercard, AMEX.
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,130,246,0.15)' }}
              >
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <button
              onClick={handleStripeCheckout}
              disabled={stripeLoading}
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              {stripeLoading
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <ExternalLink className="w-3.5 h-3.5" />}
              {stripeLoading ? 'Loading…' : 'Checkout via Stripe'}
            </button>
          </motion.div>

          {/* Crypto */}
          <motion.div
            whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            style={{
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Cryptocurrency
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}
                  >
                    Decentralized
                  </span>
                </h4>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {adminWallets.length > 0
                    ? `Pay via ${adminWallets.map(w => w.currency).join(', ')}. Requires ${requiredConfs} confirmations.`
                    : 'Crypto payments not yet configured. Contact admin.'}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <Bitcoin className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {adminWallets.length > 0 ? (
              <button
                onClick={() => navigate('/checkout?method=crypto')}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
              >
                <Zap className="w-3.5 h-3.5" /> Open Crypto Payment Form
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div
                className="text-center py-3 text-xs rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                <Wallet className="w-5 h-5 mx-auto mb-1 opacity-40" />
                Not configured by admin
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Crypto Payment History ────────────────────────────────────────── */}
      {myPayments.length > 0 && (
        <motion.div
          style={glassCard}
          className="p-6"
          variants={cardVariants}
          custom={2}
          initial="hidden"
          animate="visible"
        >
          <div
            className="flex items-center justify-between mb-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Crypto Payment History</p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {pendingPayments.length > 0 && (
            <div
              className="mb-4 p-3 rounded-lg flex items-start gap-2 text-xs"
              style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', color: '#f59e0b' }}
            >
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''}</span>
                {' '}— awaiting blockchain confirmations. This page auto-refreshes every 30 seconds.
                You'll receive a notification once confirmed.
              </div>
            </div>
          )}

          <div className="space-y-2">
            {myPayments.map((tx, index) => (
              <CryptoTxRow
                key={tx.id}
                tx={tx}
                requiredConfs={requiredConfs}
                onPoll={pollingId === tx.id ? () => {} : pollTx}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Invoice History ───────────────────────────────────────────────── */}
      <motion.div
        style={glassCard}
        className="p-6"
        variants={cardVariants}
        custom={3}
        initial="hidden"
        animate="visible"
      >
        <div
          className="flex items-center gap-2.5 mb-4 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <FileText className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <p className="text-sm font-semibold text-white">Invoice History</p>
        </div>

        {(billingInfo?.invoices || []).length === 0 ? (
          <div
            className="p-8 text-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No invoices yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
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
                {billingInfo.invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    variants={cardVariants}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    <td className="py-3 font-mono text-xs">{inv.id}</td>
                    <td className="py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm font-bold text-right">${(inv.amount || 0).toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <Pill status={inv.status?.toLowerCase() === 'paid' ? 'confirmed' : 'pending'} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </div>
  );
};

export default BillingAndSubscription;
