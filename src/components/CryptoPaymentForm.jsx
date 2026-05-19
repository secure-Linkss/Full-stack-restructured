import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, Copy, CheckCircle, AlertCircle, ExternalLink,
  Clock, XCircle, Shield, RefreshCw, ArrowRight, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'

const CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', icon: '₿', color: '#f7931a', explorerUrl: 'https://www.blockchain.com/btc/tx/' },
  { code: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627eea', explorerUrl: 'https://etherscan.io/tx/' },
  { code: 'USDT', name: 'Tether (ERC-20)', icon: '₮', color: '#26a17b', explorerUrl: 'https://etherscan.io/tx/' },
  { code: 'LTC', name: 'Litecoin', icon: 'Ł', color: '#bfbbbb', explorerUrl: 'https://blockchair.com/litecoin/transaction/' },
  { code: 'BNB', name: 'BNB (BSC)', icon: 'B', color: '#f0b90b', explorerUrl: 'https://bscscan.com/tx/' },
]

const POLL_INTERVAL_MS = 15000

const glass = {
  background: 'rgba(8,15,35,0.88)',
  backdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  overflow: 'hidden',
}

const ConfirmationProgress = ({ confirmations, required, status }) => {
  const pct = Math.min(100, Math.round((confirmations / required) * 100))
  const isConfirmed = status === 'confirmed'
  const isRejected = status === 'rejected'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Shield className="h-3.5 w-3.5" />
          Blockchain Confirmations
        </span>
        <span className={`font-bold tabular-nums ${isConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
          {confirmations} / {required}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: isConfirmed ? '#10b981' : '#f59e0b' }}
        />
      </div>
      <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {isConfirmed
          ? '✅ Payment fully confirmed on-chain'
          : isRejected
            ? '❌ Payment was rejected'
            : confirmations === 0
              ? 'Waiting for first confirmation… (checking every 15s)'
              : `${required - confirmations} more confirmation${required - confirmations !== 1 ? 's' : ''} needed`}
      </p>
    </div>
  )
}

const CryptoPaymentForm = ({ planType = 'pro', planPrice = '0', onSuccess, onCancel }) => {
  const [wallets, setWallets] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState('BTC')
  const [step, setStep] = useState('select')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [transactionId, setTransactionId] = useState(null)
  const [pollStatus, setPollStatus] = useState(null)
  const [requiredConfs, setRequiredConfs] = useState(30)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    fetchWallets()
    fetchConfirmationThreshold()
    return () => clearInterval(pollRef.current)
  }, [])

  const fetchWallets = async () => {
    try {
      const d = await api.payments.getCryptoWallets()
      setWallets(Array.isArray(d.wallets) ? d.wallets : [])
    } catch (_) { }
  }

  const fetchConfirmationThreshold = async () => {
    try {
      const d = await api.adminPayments.getCryptoSettings().catch(() => null)
      if (d?.settings?.required_confirmations) setRequiredConfs(d.settings.required_confirmations)
    } catch (_) { }
  }

  const currentWallet = wallets.find(w =>
    w.currency === selectedCurrency || w.currency === selectedCurrency.toUpperCase()
  )
  const currencyInfo = CURRENCIES.find(c => c.code === selectedCurrency)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSubmitProof = async () => {
    if (!txHash.trim()) { toast.error('Transaction hash is required'); return }
    setLoading(true)
    try {
      const d = await api.payments.submitCryptoProof({
        plan_type: planType,
        currency: selectedCurrency,
        tx_hash: txHash.trim(),
        amount_usd: planPrice,
        amount_crypto: 0,
        wallet_address: currentWallet?.wallet_address || '',
      })
      if (d.success) {
        setTransactionId(d.transaction_id)
        setPollStatus({ status: 'pending', confirmations: 0, required: requiredConfs })
        setStep('polling')
        toast.success('Payment proof submitted! Watching blockchain…')
        startPolling(d.transaction_id)
      } else {
        toast.error(d.error || 'Failed to submit payment proof')
      }
    } catch (_) {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = useCallback((txId) => {
    clearInterval(pollRef.current)
    const poll = async () => {
      try {
        const d = await api.payments.getCryptoStatus(txId).catch(() => null)
        if (!d) return
        setPollStatus({
          status: d.status,
          confirmations: d.confirmations || 0,
          required: d.required || requiredConfs,
          provider: d.provider,
          needs_manual_review: d.needs_manual_review,
        })
        if (d.status === 'confirmed') {
          clearInterval(pollRef.current)
          setStep('done')
          toast.success('🎉 Payment confirmed! Your plan is now active.')
          if (onSuccess) setTimeout(onSuccess, 2500)
        } else if (d.status === 'rejected') {
          clearInterval(pollRef.current)
          setStep('rejected')
          toast.error('Payment rejected. Please contact support.')
        }
      } catch (_) { }
    }
    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
  }, [requiredConfs, onSuccess])

  const manualRefresh = () => { if (transactionId) startPolling(transactionId) }

  const stepBtn = (label, onClick, opts = {}) => (
    <button
      onClick={onClick}
      disabled={opts.disabled}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
      style={opts.style || { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
    >
      {opts.icon && <opts.icon className="w-4 h-4" />}
      {label}
    </button>
  )

  // DONE
  if (step === 'done') {
    return (
      <div style={glass}>
        <div className="p-10 flex flex-col items-center gap-5 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)' }}
          >
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white">Payment Confirmed!</h3>
          <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Your {selectedCurrency} payment has been verified on-chain with{' '}
            <span className="text-white font-semibold">{pollStatus?.confirmations || requiredConfs} confirmations</span>.
            Your <span className="text-emerald-400 font-bold capitalize">{planType}</span> plan is now active.
          </p>
          {pollStatus?.confirmations && (
            <ConfirmationProgress confirmations={pollStatus.confirmations} required={pollStatus.required || requiredConfs} status="confirmed" />
          )}
        </div>
      </div>
    )
  }

  // REJECTED
  if (step === 'rejected') {
    return (
      <div style={glass}>
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <XCircle className="h-12 w-12 text-red-400" />
          <h3 className="text-xl font-bold text-white">Payment Rejected</h3>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Payment proof could not be verified. Contact support or try again.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const STEPS = ['select', 'pay', 'verify', 'polling']
  const STEP_LABELS = { select: 'Currency', pay: 'Send', verify: 'Submit TX', polling: 'Confirming' }

  return (
    <div style={glass}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-white">Pay with Cryptocurrency</p>
        </div>
        <span className="text-lg font-bold text-amber-400">${planPrice}</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <span key={s} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>}
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={step === s
                  ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                {i + 1}. {STEP_LABELS[s]}
              </span>
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* SELECT CURRENCY */}
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Choose your cryptocurrency</p>
              <div className="grid grid-cols-3 gap-2">
                {CURRENCIES.map((c) => {
                  const wallet = wallets.find(w => w.currency === c.code)
                  return (
                    <button
                      key={c.code}
                      type="button"
                      disabled={!wallet}
                      onClick={() => setSelectedCurrency(c.code)}
                      className="relative p-3 rounded-xl text-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={selectedCurrency === c.code
                        ? { background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.5)', boxShadow: '0 0 20px rgba(245,158,11,0.1)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      <span className="text-2xl block mb-0.5" style={{ color: c.color }}>{c.icon}</span>
                      <div className="text-white font-bold text-xs">{c.code}</div>
                      {!wallet && <div className="text-[9px] text-red-400 mt-0.5">Unavailable</div>}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setStep('pay')}
                disabled={!currentWallet}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)' }}
              >
                Continue with {selectedCurrency} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* SEND PAYMENT */}
          {step === 'pay' && currentWallet && (
            <motion.div key="pay" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Send exactly <span className="font-bold text-amber-400">${planPrice} USD</span> worth of{' '}
                  <span className="font-bold text-amber-400">{selectedCurrency}</span> to the address below.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedCurrency} Wallet Address</p>
                <div className="relative">
                  <div
                    className="px-4 py-3 rounded-xl font-mono text-xs break-all pr-20 text-white"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {currentWallet.wallet_address}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentWallet.wallet_address)}
                    className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#34d399' : 'rgba(255,255,255,0.7)' }}
                  >
                    <Copy className="h-3 w-3" /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {currentWallet.network && (
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Network: <span className="font-semibold text-white">{currentWallet.network}</span> — only send on this network!
                  </p>
                )}
              </div>

              <div className="px-3 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                ⏱ After sending, copy your Transaction Hash (TxID) from your wallet.
                We require <span className="font-semibold text-white">{requiredConfs} confirmations</span> for automatic activation.
              </div>

              <div className="flex gap-3">
                {stepBtn('← Back', () => setStep('select'))}
                <button
                  onClick={() => setStep('verify')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> I've Sent the Payment
                </button>
              </div>
            </motion.div>
          )}

          {/* SUBMIT TX HASH */}
          {step === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Transaction Hash (TxID)</p>
                <input
                  type="text"
                  placeholder={selectedCurrency === 'BTC' ? 'e.g. abc123def456...' : '0x...'}
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-mono text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Paste the transaction hash from your wallet or exchange. We'll monitor confirmations in real time.
                </p>
              </div>

              {txHash.trim() && currencyInfo && (
                <a
                  href={`${currencyInfo.explorerUrl}${txHash.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Preview on block explorer
                </a>
              )}

              <div className="px-3 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                🔒 Activation is automatic once{' '}
                <span className="font-semibold text-white">{requiredConfs} confirmations</span> are reached.
                An admin can also approve manually at any time.
              </div>

              <div className="flex gap-3">
                {stepBtn('← Back', () => setStep('pay'))}
                <button
                  onClick={handleSubmitProof}
                  disabled={loading || !txHash.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <><Shield className="h-4 w-4 text-emerald-400" /> Submit &amp; Watch Confirmations</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* POLLING */}
          {step === 'polling' && pollStatus && (
            <motion.div key="polling" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                {pollStatus.status === 'confirmed'
                  ? <CheckCircle className="h-10 w-10 text-emerald-400" />
                  : <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                }
                <h3 className="font-semibold text-white">
                  {pollStatus.status === 'confirmed' ? 'Confirmed!' : 'Watching Blockchain…'}
                </h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Auto-refreshes every 15 seconds.{' '}
                  {pollStatus.needs_manual_review && (
                    <span className="text-amber-400">Blockchain APIs unreachable — admin will verify manually.</span>
                  )}
                </p>
              </div>

              <ConfirmationProgress confirmations={pollStatus.confirmations} required={pollStatus.required || requiredConfs} status={pollStatus.status} />

              <div className="rounded-xl p-3 space-y-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  ['Plan', planType, 'capitalize'],
                  ['Currency', selectedCurrency, ''],
                  ['TX Hash', txHash, 'font-mono truncate max-w-[180px]'],
                  ['Status', pollStatus.status, 'capitalize ' + (pollStatus.status === 'confirmed' ? 'text-emerald-400' : pollStatus.status === 'rejected' ? 'text-red-400' : 'text-amber-400')],
                  pollStatus.provider ? ['Verified via', pollStatus.provider, ''] : null,
                ].filter(Boolean).map(([label, value, cls]) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                    <span className={`font-semibold text-white ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>

              {txHash && currencyInfo && (
                <a
                  href={`${currencyInfo.explorerUrl}${txHash.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on block explorer
                </a>
              )}

              <button
                onClick={manualRefresh}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh Now
              </button>

              <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                You can close this window. We'll notify you via dashboard when payment is confirmed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default CryptoPaymentForm
