import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, RefreshCw, DollarSign, Receipt, Users, Wallet, Save,
  Bitcoin, CheckCircle, XCircle, AlertTriangle, RotateCcw, Search,
  Settings, Shield, Clock, Eye, ChevronDown, ChevronUp, Hash, ExternalLink,
  TrendingUp, Zap, ToggleLeft, ToggleRight, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import DataTable from '@/components/ui/DataTable';
import api from '../../services/api';

// ─── Confirmation badge ──────────────────────────────────────────────────────
const ConfBadge = ({ confs, required }) => {
  const pct = Math.min(100, Math.round((confs / required) * 100));
  const color = confs >= required ? '#10b981' : confs > 0 ? '#f59e0b' : '#ef4444';
  return (
    <div className="min-w-[110px]">
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color }} className="font-mono font-bold">{confs}/{required}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" style={{ '--progress-color': color }} />
    </div>
  );
};

// ─── Status pill ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = {
    pending:   'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
    confirmed: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30',
    rejected:  'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${map[status] || 'bg-secondary text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
};

// ─── Explorer link helper ─────────────────────────────────────────────────────
function explorerUrl(currency, hash) {
  if (!hash) return null;
  const map = {
    BTC: `https://www.blockchain.com/explorer/transactions/btc/${hash}`,
    ETH: `https://etherscan.io/tx/${hash}`,
    USDT: `https://etherscan.io/tx/${hash}`,
    USDC: `https://etherscan.io/tx/${hash}`,
    BNB: `https://bscscan.com/tx/${hash}`,
    LTC: `https://blockchair.com/litecoin/transaction/${hash}`,
    DOGE: `https://blockchair.com/dogecoin/transaction/${hash}`,
  };
  return map[(currency || '').toUpperCase()] || null;
}

// ─── Expandable TX row detail ─────────────────────────────────────────────────
const TxDetail = ({ payment, requiredConfs, onConfirm, onReject, onRecheck, processing }) => {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const url = explorerUrl(payment.currency, payment.transaction_hash);

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-border rounded-lg p-4 mt-1 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">TX Hash</p>
          <div className="flex items-center gap-1">
            <span className="font-mono text-foreground truncate max-w-[120px]">{payment.transaction_hash}</span>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:text-blue-400 shrink-0">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Plan</p>
          <span className="text-[#3b82f6] font-bold capitalize">{payment.plan_type}</span>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Amount</p>
          <span className="text-[#10b981] font-bold">${Number(payment.amount_usd || 0).toFixed(2)}</span>
          {payment.amount_crypto > 0 && (
            <span className="text-muted-foreground ml-1 text-[10px]">({payment.amount_crypto} {payment.currency})</span>
          )}
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Submitted</p>
          <span>{new Date(payment.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ConfBadge confs={payment.blockchain_confirmations || 0} required={requiredConfs} />
        <span className="text-[10px] text-muted-foreground">{payment.verification_method || 'manual'} verification</span>
        {payment.needs_manual_review && (
          <span className="text-[10px] text-[#f59e0b] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Needs manual review
          </span>
        )}
      </div>

      {payment.status === 'pending' && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <button
            onClick={() => onConfirm(payment.id)}
            disabled={processing === payment.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-[#10b981]/10 hover:bg-[#10b981] text-[#10b981] hover:text-white border border-[#10b981]/30 transition-all font-semibold"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve & Activate
          </button>

          <button
            onClick={() => onRecheck(payment.id)}
            disabled={processing === payment.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-[#3b82f6]/10 hover:bg-[#3b82f6] text-[#3b82f6] hover:text-white border border-[#3b82f6]/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processing === payment.id ? 'animate-spin' : ''}`} />
            Re-check Chain
          </button>

          <button
            onClick={() => setShowRejectBox(!showRejectBox)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 transition-all"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      )}

      {showRejectBox && payment.status === 'pending' && (
        <div className="space-y-2 pt-2 border-t border-[#ef4444]/20">
          <label className="text-[10px] uppercase text-[#ef4444] font-semibold tracking-widest">Rejection Reason (shown to user)</label>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="enterprise-input w-full text-xs h-16 resize-none"
            placeholder="e.g. Transaction not found on-chain, incorrect amount, wrong wallet..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onReject(payment.id, rejectReason); setShowRejectBox(false); }}
              disabled={!rejectReason.trim() || processing === payment.id}
              className="px-3 py-1.5 text-xs rounded bg-[#ef4444] text-white font-semibold disabled:opacity-40"
            >
              Confirm Rejection
            </button>
            <button onClick={() => setShowRejectBox(false)} className="px-3 py-1.5 text-xs rounded bg-secondary text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {payment.rejection_reason && (
        <div className="text-xs text-[#ef4444] border border-[#ef4444]/20 rounded p-2 bg-[#ef4444]/5">
          <span className="font-semibold">Rejection Reason: </span>{payment.rejection_reason}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPayments = ({ isOwner = false }) => {
  const [transactions, setTransactions]   = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [allCrypto, setAllCrypto]         = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [metrics, setMetrics]             = useState({ totalRevenue: 0, totalTransactions: 0, activeSubscriptions: 0, pendingCrypto: 0 });
  const [cryptoWallets, setCryptoWallets] = useState({ BTC: '', ETH: '', USDT: '', BNB: '', LTC: '' });
  const [cryptoSettings, setCryptoSettings] = useState({ required_confirmations: 30, auto_confirm_enabled: true });
  const [stripeSettings, setStripeSettings] = useState({ stripeEnabled: true, stripePublishableKey: '', stripeSecretKey: '' });
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [expandedTx, setExpandedTx]       = useState(null);
  const [processing, setProcessing]       = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txsData, subsData, cryptoData, failedData, walletsData, settingsData, stripeData] = await Promise.allSettled([
        api.adminPayments.getTransactions(),
        api.adminPayments.getSubscriptions(),
        api.adminPayments.getCryptoPayments(),
        api.adminPayments.getFailedPayments(),
        api.adminPayments.getAdminWallets(),
        api.adminPayments.getCryptoSettings(),
        api.adminSettings.getStripeSettings(),
      ]);

      const txs  = txsData.status  === 'fulfilled' && Array.isArray(txsData.value)  ? txsData.value  : [];
      const subs = subsData.status === 'fulfilled' && Array.isArray(subsData.value) ? subsData.value : [];
      const cryptoRaw = cryptoData.status === 'fulfilled'
        ? (Array.isArray(cryptoData.value) ? cryptoData.value : cryptoData.value?.payments || [])
        : [];
      const failed = failedData.status === 'fulfilled' && Array.isArray(failedData.value) ? failedData.value : [];

      setTransactions(txs);
      setSubscriptions(subs);
      setAllCrypto(cryptoRaw);
      setFailedPayments(failed);

      if (walletsData.status === 'fulfilled') {
        const raw = walletsData.value;
        // Backend returns { wallets: [{currency, wallet_address, ...}] } array form
        if (raw?.wallets && Array.isArray(raw.wallets)) {
          const map = {};
          raw.wallets.forEach(w => { map[w.currency?.toUpperCase()] = w.wallet_address || ''; });
          setCryptoWallets(prev => ({ ...prev, ...map }));
        } else if (raw && !Array.isArray(raw)) {
          // Legacy flat object form { btc, eth, ... }
          setCryptoWallets({
            BTC:  raw.btc  || raw.BTC  || '',
            ETH:  raw.eth  || raw.ETH  || '',
            USDT: raw.usdt || raw.USDT || '',
            BNB:  raw.bnb  || raw.BNB  || '',
            LTC:  raw.ltc  || raw.LTC  || '',
          });
        }
      }

      if (settingsData.status === 'fulfilled' && settingsData.value?.settings) {
        setCryptoSettings(settingsData.value.settings);
      }

      if (stripeData.status === 'fulfilled' && stripeData.value) {
        const s = stripeData.value;
        setStripeSettings({
          stripeEnabled: s.stripe_enabled ?? s.stripeEnabled ?? true,
          stripePublishableKey: s.stripe_publishable_key || s.stripePublishableKey || '',
          stripeSecretKey: s.stripe_secret_key || s.stripeSecretKey || '',
        });
      }

      setMetrics({
        totalRevenue: txs.filter(t => t.status === 'completed').reduce((s, t) => s + (Number(t.amount) || 0), 0),
        totalTransactions: txs.length,
        activeSubscriptions: subs.filter(s => s.status === 'active').length,
        pendingCrypto: cryptoRaw.filter(c => c.status === 'pending').length,
      });
    } catch {
      toast.error('Failed to sync billing data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Crypto actions ──────────────────────────────────────────────────────────
  const handleConfirm = async (id) => {
    if (!window.confirm('Approve this payment and activate the user\'s subscription?')) return;
    setProcessing(id);
    try {
      const res = await api.adminPayments.confirmCryptoPayment(id);
      toast.success(res.message || 'Payment approved — subscription activated.');
      fetchData();
      setExpandedTx(null);
    } catch {
      toast.error('Failed to approve payment.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id, reason) => {
    if (!reason?.trim()) return toast.error('Rejection reason is required.');
    setProcessing(id);
    try {
      await api.adminPayments.rejectCryptoPayment(id, reason);
      toast.success('Payment rejected and user notified.');
      fetchData();
      setExpandedTx(null);
    } catch {
      toast.error('Failed to reject payment.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRecheck = async (id) => {
    setProcessing(id);
    try {
      const res = await api.adminPayments.recheckCryptoPayment(id);
      if (res.confirmations !== undefined) {
        toast.success(`Re-check complete: ${res.confirmations}/${res.required} confirmations via ${res.provider || 'blockchain'}.`);
      } else {
        toast.error('Could not re-check at this time.');
      }
      fetchData();
    } catch {
      toast.error('Blockchain re-check failed.');
    } finally {
      setProcessing(null);
    }
  };

  // ── Wallet save ─────────────────────────────────────────────────────────────
  const saveWallets = async () => {
    setIsSavingWallet(true);
    try {
      const promises = Object.entries(cryptoWallets)
        .filter(([, addr]) => addr.trim())
        .map(([currency, address]) =>
          api.adminPayments.upsertCryptoWallet(currency, address).catch(() => null)
        );
      await Promise.all(promises);
      toast.success('Wallet addresses updated.');
    } catch {
      toast.error('Failed to update wallet addresses.');
    } finally {
      setIsSavingWallet(false);
    }
  };

  // ── Settings save ───────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.adminPayments.updateCryptoSettings(cryptoSettings);
      toast.success('Crypto settings saved.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ── Stripe save ────────────────────────────────────────────────────────────
  const saveStripe = async () => {
    setIsSavingStripe(true);
    try {
      await api.adminSettings.updateStripeSettings({
        stripe_enabled: stripeSettings.stripeEnabled,
        stripe_publishable_key: stripeSettings.stripePublishableKey,
        stripe_secret_key: stripeSettings.stripeSecretKey,
      });
      toast.success('Stripe configuration saved.');
    } catch {
      toast.error('Failed to save Stripe settings.');
    } finally {
      setIsSavingStripe(false);
    }
  };

  // ── Filtered crypto list ────────────────────────────────────────────────────
  const filteredCrypto = allCrypto.filter(p => {
    const matchSearch = !searchQuery ||
      (p.transaction_hash || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.user_id?.toString() || '').includes(searchQuery) ||
      (p.currency || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCrypto = allCrypto.filter(c => c.status === 'pending');
  const dueSoonSubs   = subscriptions.filter(s => s.status === 'due_soon');

  // ── Column defs ─────────────────────────────────────────────────────────────
  const txColumns = [
    { header: 'ID',     accessor: 'id',        cell: r => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { header: 'Tenant', accessor: 'userEmail' },
    { header: 'Amount', accessor: 'amount',    cell: r => <span className="font-bold text-[#10b981]">${Number(r.amount || 0).toFixed(2)}</span> },
    { header: 'Method', accessor: 'method',    cell: r => <span className="uppercase text-[10px] bg-secondary px-2 py-1 rounded border border-border">{r.method || 'STRIPE'}</span> },
    { header: 'Status', accessor: 'status',    cell: r => <StatusPill status={r.status} /> },
    { header: 'Actions', accessor: 'actions',  cell: r => r.status === 'completed' && (
      <button onClick={() => {
        const reason = window.prompt('Refund reason (required for audit):');
        if (!reason) return;
        api.adminPayments.refundTransaction(r.id, reason)
          .then(() => { toast.success('Refund processed.'); fetchData(); })
          .catch(() => toast.error('Refund failed.'));
      }} className="p-1.5 rounded hover:bg-[#ef4444]/10 text-muted-foreground hover:text-[#ef4444] transition-colors" title="Refund">
        <RotateCcw className="w-4 h-4" />
      </button>
    )},
  ];

  const subColumns = [
    { header: 'ID',       accessor: 'id',        cell: r => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { header: 'Tenant',   accessor: 'userEmail', cell: r => <span className="font-medium">{r.userEmail}</span> },
    { header: 'Plan',     accessor: 'plan',      cell: r => <span className="text-[#3b82f6] font-bold">{r.plan || 'Standard'}</span> },
    { header: 'Status',   accessor: 'status',    cell: r => <StatusPill status={r.status} /> },
    { header: 'Renewal',  accessor: 'expiresAt', cell: r => <span className="text-xs">{new Date(r.expiresAt || r.current_period_end).toLocaleDateString()}</span> },
  ];

  const failedColumns = [
    { header: 'ID',      accessor: 'id',        cell: r => <span className="font-mono text-xs">{r.id}</span> },
    { header: 'Tenant',  accessor: 'userEmail' },
    { header: 'Amount',  accessor: 'amount',    cell: r => <span className="font-bold text-[#ef4444]">${Number(r.amount || 0).toFixed(2)}</span> },
    { header: 'Reason',  accessor: 'reason',    cell: r => <span className="text-xs text-muted-foreground">{r.reason || r.error_code || 'Card Declined'}</span> },
    { header: 'Date',    accessor: 'date',      cell: r => <span className="text-xs">{new Date(r.date || r.created_at).toLocaleString()}</span> },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h3 className="text-2xl font-bold font-heading text-foreground flex items-center">
            <CreditCard className="w-6 h-6 mr-3 text-[#10b981]" /> Financial Operations
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Stripe billing, crypto payment approvals, wallet management, and revenue oversight.</p>
        </div>
        <button onClick={fetchData} className="btn-secondary h-9 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Gross Revenue',        value: `$${metrics.totalRevenue.toLocaleString()}`,       icon: DollarSign,  color: '#10b981' },
          { title: 'Total Ledgers',         value: metrics.totalTransactions.toLocaleString(),         icon: Receipt,     color: '#3b82f6' },
          { title: 'Active Subscriptions',  value: metrics.activeSubscriptions.toLocaleString(),       icon: TrendingUp,  color: '#f59e0b' },
          { title: 'Pending Crypto',        value: metrics.pendingCrypto.toLocaleString(),             icon: Bitcoin,     color: metrics.pendingCrypto > 0 ? '#f59e0b' : '#10b981', pulse: metrics.pendingCrypto > 0 },
        ].map((c, i) => (
          <div key={i} className="enterprise-card p-4" style={{ borderLeft: `2px solid ${c.color}` }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.title}</p>
                <h3 className={`text-2xl font-heading font-bold tabular-nums-custom ${c.pulse ? 'animate-pulse' : ''}`} style={{ color: c.color }}>{c.value}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)]" style={{ color: c.color }}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending crypto alert banner */}
      {pendingCrypto.length > 0 && (
        <div className="border border-[#f59e0b]/40 bg-[rgba(245,158,11,0.05)] rounded-lg overflow-hidden">
          <div className="p-3 border-b border-[#f59e0b]/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="text-xs font-semibold text-[#f59e0b] uppercase tracking-widest">
              {pendingCrypto.length} Crypto Payment{pendingCrypto.length > 1 ? 's' : ''} Awaiting Review
            </span>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pendingCrypto.map(p => (
              <div key={p.id} className="enterprise-card p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">User #{p.user_id} · {p.currency}</p>
                    <p className="font-bold text-[#f59e0b] text-sm">${Number(p.amount_usd || 0).toFixed(2)}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">{p.transaction_hash}</p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <ConfBadge confs={p.blockchain_confirmations || 0} required={cryptoSettings.required_confirmations} />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleConfirm(p.id)} disabled={processing === p.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded bg-[#10b981]/10 hover:bg-[#10b981] text-[#10b981] hover:text-white border border-[#10b981]/30 transition-all font-semibold">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => setExpandedTx(expandedTx === p.id ? null : p.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all">
                    <Eye className="w-3 h-3" /> Details
                  </button>
                </div>
                {expandedTx === p.id && (
                  <TxDetail
                    payment={p}
                    requiredConfs={cryptoSettings.required_confirmations}
                    onConfirm={handleConfirm}
                    onReject={handleReject}
                    onRecheck={handleRecheck}
                    processing={processing}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="crypto" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full md:grid md:grid-cols-5 bg-secondary border border-border h-11">
            <TabsTrigger value="crypto"         className="text-[11px] uppercase tracking-wider whitespace-nowrap"><Bitcoin className="w-3 h-3 mr-1.5 text-[#f59e0b]" /> Crypto Payments</TabsTrigger>
            <TabsTrigger value="subscriptions"  className="text-[11px] uppercase tracking-wider whitespace-nowrap"><Users className="w-3 h-3 mr-1.5" /> Subscriptions</TabsTrigger>
            <TabsTrigger value="transactions"   className="text-[11px] uppercase tracking-wider whitespace-nowrap"><Receipt className="w-3 h-3 mr-1.5" /> Ledgers</TabsTrigger>
            <TabsTrigger value="failed"         className="text-[11px] uppercase tracking-wider whitespace-nowrap"><AlertTriangle className="w-3 h-3 mr-1.5 text-[#ef4444]" /> Failed</TabsTrigger>
            <TabsTrigger value="settings"       className="text-[11px] uppercase tracking-wider whitespace-nowrap"><Settings className="w-3 h-3 mr-1.5" /> Config</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-5">

          {/* ── CRYPTO PAYMENTS TAB ─────────────────────────────────────────── */}
          <TabsContent value="crypto" className="space-y-4">
            <div className="enterprise-card overflow-hidden">
              <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)] flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold flex items-center">
                  <Bitcoin className="w-4 h-4 mr-2 text-[#f59e0b]" /> All Crypto Transactions
                </h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="TX hash, currency..."
                      className="enterprise-input pl-8 h-9 text-xs w-48"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="enterprise-input h-9 text-xs"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-border">
                {filteredCrypto.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No crypto transactions found.</div>
                ) : filteredCrypto.map(p => (
                  <div key={p.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                    <div
                      className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedTx(expandedTx === p.id ? null : p.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.1)] flex items-center justify-center shrink-0">
                          <Hash className="w-3.5 h-3.5 text-[#f59e0b]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-foreground truncate">{p.transaction_hash}</p>
                          <p className="text-[10px] text-muted-foreground">User #{p.user_id} · {p.currency} · {p.plan_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-bold text-[#10b981]">${Number(p.amount_usd || 0).toFixed(2)}</span>
                        <ConfBadge confs={p.blockchain_confirmations || 0} required={cryptoSettings.required_confirmations} />
                        <StatusPill status={p.status} />
                        {expandedTx === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {expandedTx === p.id && (
                      <div className="px-4 pb-4">
                        <TxDetail
                          payment={p}
                          requiredConfs={cryptoSettings.required_confirmations}
                          onConfirm={handleConfirm}
                          onReject={handleReject}
                          onRecheck={handleRecheck}
                          processing={processing}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── SUBSCRIPTIONS TAB ───────────────────────────────────────────── */}
          <TabsContent value="subscriptions" className="space-y-4">
            {dueSoonSubs.length > 0 && (
              <div className="enterprise-card border-[#ef4444]/30">
                <div className="p-3 border-b border-[#ef4444]/20 bg-[rgba(239,68,68,0.05)] text-[#ef4444] flex items-center text-xs uppercase tracking-widest font-semibold">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Payments Failing Next Cycle ({dueSoonSubs.length})
                </div>
                <DataTable columns={subColumns} data={dueSoonSubs} pageSize={5} />
              </div>
            )}
            <div className="enterprise-card overflow-hidden">
              <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)]">
                <h3 className="text-sm font-semibold flex items-center"><Users className="w-4 h-4 mr-2 text-[#3b82f6]" /> All Subscriptions</h3>
              </div>
              <DataTable columns={subColumns} data={subscriptions} pageSize={10} />
            </div>
          </TabsContent>

          {/* ── LEDGERS TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="enterprise-card overflow-hidden">
              <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)]">
                <h3 className="text-sm font-semibold flex items-center"><Receipt className="w-4 h-4 mr-2 text-[#10b981]" /> Stripe Ledger History</h3>
              </div>
              <div className="p-4">
                <div className="mb-4 relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search transaction ID..." className="enterprise-input pl-9" />
                </div>
                <DataTable columns={txColumns} data={searchQuery ? transactions.filter(t => t.id?.includes(searchQuery)) : transactions} pageSize={15} />
              </div>
            </div>
          </TabsContent>

          {/* ── FAILED TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="failed" className="space-y-4">
            <div className="enterprise-card overflow-hidden">
              <div className="p-4 border-b border-[#ef4444]/20 bg-[rgba(239,68,68,0.02)]">
                <h3 className="text-sm font-semibold text-[#ef4444] flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Failed & Rejected Payments
                </h3>
              </div>
              <DataTable columns={failedColumns} data={failedPayments} pageSize={10} />
            </div>
          </TabsContent>

          {/* ── CONFIG TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6">

            {/* Stripe Gateway Config */}
            <div className="enterprise-card">
              <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center"><CreditCard className="w-4 h-4 mr-2 text-[#3b82f6]" /> Stripe Gateway Configuration</h3>
                {!isOwner && <span className="text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Owner Only</span>}
              </div>
              <div className="p-6 space-y-5 max-w-2xl">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-[rgba(255,255,255,0.02)]">
                  <div>
                    <p className="text-sm font-medium">Enable Stripe Engine</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Accept card payments via Stripe checkout.</p>
                  </div>
                  <button onClick={() => setStripeSettings(s => ({ ...s, stripeEnabled: !s.stripeEnabled }))} disabled={!isOwner} className="ml-4 shrink-0">
                    {stripeSettings.stripeEnabled
                      ? <ToggleRight className="w-8 h-8 text-[#10b981]" />
                      : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block">Stripe Publishable Key</label>
                    <input type="password" disabled={!isOwner} value={stripeSettings.stripePublishableKey} onChange={e => setStripeSettings(s => ({ ...s, stripePublishableKey: e.target.value }))} placeholder="pk_live_..." className="enterprise-input font-mono text-xs w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block">Stripe Secret Key</label>
                    <input type="password" disabled={!isOwner} value={stripeSettings.stripeSecretKey} onChange={e => setStripeSettings(s => ({ ...s, stripeSecretKey: e.target.value }))} placeholder="sk_live_..." className="enterprise-input font-mono text-xs w-full" />
                  </div>
                </div>
                {isOwner && (
                  <button onClick={saveStripe} disabled={isSavingStripe} className="btn-primary">
                    {isSavingStripe ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Stripe Configuration
                  </button>
                )}
              </div>
            </div>

            {/* Confirmation threshold */}
            <div className="enterprise-card">
              <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center"><Shield className="w-4 h-4 mr-2 text-[#3b82f6]" /> Blockchain Confirmation Settings</h3>
              </div>
              <div className="p-6 space-y-6 max-w-xl">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
                    Required Confirmations
                    <span className="text-muted-foreground normal-case font-normal">(1–100, default: 30)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={cryptoSettings.required_confirmations}
                      onChange={e => setCryptoSettings(s => ({ ...s, required_confirmations: Number(e.target.value) }))}
                      className="flex-1 accent-[#10b981]"
                    />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={cryptoSettings.required_confirmations}
                      onChange={e => setCryptoSettings(s => ({ ...s, required_confirmations: Math.min(100, Math.max(1, Number(e.target.value))) }))}
                      className="enterprise-input w-16 text-center font-mono font-bold text-[#10b981]"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Payments auto-confirm once the transaction reaches this many on-chain confirmations.
                    Higher = more secure, slower. BTC: ~1 hr at 6 confs, ~5 hrs at 30 confs.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-[rgba(255,255,255,0.02)]">
                  <div>
                    <p className="text-sm font-medium">Auto-Confirm Payments</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Automatically activate subscription when confirmation threshold is reached.
                      Disable for fully manual review mode.
                    </p>
                  </div>
                  <button
                    onClick={() => setCryptoSettings(s => ({ ...s, auto_confirm_enabled: !s.auto_confirm_enabled }))}
                    className="ml-4 shrink-0"
                  >
                    {cryptoSettings.auto_confirm_enabled
                      ? <ToggleRight className="w-8 h-8 text-[#10b981]" />
                      : <ToggleLeft  className="w-8 h-8 text-muted-foreground" />
                    }
                  </button>
                </div>

                {isOwner && (
                  <button onClick={saveSettings} disabled={isSavingSettings} className="btn-primary w-full sm:w-auto">
                    {isSavingSettings ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Confirmation Settings
                  </button>
                )}
              </div>
            </div>

            {/* Wallet addresses */}
            <div className="enterprise-card">
              <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)]">
                <h3 className="text-sm font-semibold flex items-center">
                  <Wallet className="w-4 h-4 mr-2 text-[#f59e0b]" /> Receiving Wallet Addresses
                  {!isOwner && (
                    <span className="ml-2 text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Owner Only</span>
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">These are the addresses displayed to users on the payment form.</p>
              </div>
              <div className="p-6">
                {!isOwner ? (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5">
                    <Shield className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#f59e0b]">Wallet management is restricted to the Owner.</p>
                      <p className="text-xs text-muted-foreground mt-1">Admins can view revenue and approve payments, but cannot modify receiving wallet addresses. Contact the platform owner to update addresses.</p>
                      <div className="mt-3 space-y-2">
                        {[
                          { key: 'BTC', label: 'Bitcoin (BTC)', color: '#f59e0b' },
                          { key: 'ETH', label: 'Ethereum (ETH)', color: '#3b82f6' },
                          { key: 'USDT', label: 'USDT (TRC-20)', color: '#10b981' },
                          { key: 'BNB', label: 'BNB (BSC)', color: '#f59e0b' },
                          { key: 'LTC', label: 'Litecoin (LTC)', color: '#94a3b8' },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono" style={{ color }}>
                              {cryptoWallets[key] ? `${cryptoWallets[key].substring(0, 8)}...${cryptoWallets[key].slice(-6)}` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-w-2xl">
                      {[
                        { key: 'BTC',  label: 'Bitcoin (BTC)',  color: '#f59e0b', placeholder: 'bc1q...' },
                        { key: 'ETH',  label: 'Ethereum (ETH / ERC-20)', color: '#3b82f6', placeholder: '0x...' },
                        { key: 'USDT', label: 'USDT (TRC-20)',  color: '#10b981', placeholder: 'T...' },
                        { key: 'BNB',  label: 'BNB (BSC)',      color: '#f59e0b', placeholder: '0x...' },
                        { key: 'LTC',  label: 'Litecoin (LTC)', color: '#94a3b8', placeholder: 'ltc1...' },
                      ].map(({ key, label, color, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-2" style={{ color }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                            {label}
                          </label>
                          <input
                            type="text"
                            value={cryptoWallets[key] || ''}
                            onChange={e => setCryptoWallets(w => ({ ...w, [key]: e.target.value }))}
                            className="enterprise-input font-mono text-sm"
                            placeholder={placeholder}
                            style={{ '--tw-ring-color': color }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-border">
                      <button onClick={saveWallets} disabled={isSavingWallet} className="btn-primary">
                        {isSavingWallet ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Wallet Addresses
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminPayments;
