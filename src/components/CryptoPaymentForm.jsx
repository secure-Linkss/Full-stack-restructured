import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import {
  Wallet, Copy, CheckCircle, AlertCircle, Loader, ExternalLink,
  Clock, XCircle, Shield, RefreshCw, ArrowRight
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

const POLL_INTERVAL_MS = 15000 // Poll every 15 seconds

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
})

// ─── Confirmation Progress Bar ────────────────────────────────────────────────
const ConfirmationProgress = ({ confirmations, required, status }) => {
  const pct = Math.min(100, Math.round((confirmations / required) * 100))
  const isConfirmed = status === 'confirmed'
  const isRejected = status === 'rejected'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Blockchain Confirmations
        </span>
        <span className={`font-bold tabular-nums ${isConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
          {confirmations} / {required}
        </span>
      </div>
      <Progress
        value={pct}
        className={`h-2 ${isConfirmed ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'}`}
      />
      <p className="text-[11px] text-muted-foreground text-center">
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

// ─── Main Component ──────────────────────────────────────────────────────────
const CryptoPaymentForm = ({ planType = 'pro', planPrice = '0', onSuccess, onCancel }) => {
  const [wallets, setWallets] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState('BTC')
  // steps: select → pay → verify → polling → done
  const [step, setStep] = useState('select')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [transactionId, setTransactionId] = useState(null) // backend tx ID for polling
  const [pollStatus, setPollStatus] = useState(null)       // { status, confirmations, required }
  const [requiredConfs, setRequiredConfs] = useState(30)
  const pollRef = useRef(null)

  // ── Fetch wallets + confirmation threshold on mount
  useEffect(() => {
    fetchWallets()
    fetchConfirmationThreshold()
    return () => clearInterval(pollRef.current)
  }, [])

  const fetchWallets = async () => {
    try {
      const d = await api.payments.getCryptoWallets()
      setWallets(Array.isArray(d.wallets) ? d.wallets : [])
    } catch (_) { /* silent */ }
  }

  const fetchConfirmationThreshold = async () => {
    try {
      const d = await api.adminPayments.getCryptoSettings().catch(() => null)
      if (d?.settings?.required_confirmations) setRequiredConfs(d.settings.required_confirmations)
    } catch (_) { /* silent */ }
  }

  const currentWallet = wallets.find(w =>
    w.currency === selectedCurrency || w.currency === selectedCurrency.toUpperCase()
  )
  const currencyInfo = CURRENCIES.find(c => c.code === selectedCurrency)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'))
  }

  // ── Submit proof to backend
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

  // ── Real-time polling loop
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
          toast.success('🎉 Payment confirmed on-chain! Your plan is now active.')
          if (onSuccess) setTimeout(onSuccess, 2500)
        } else if (d.status === 'rejected') {
          clearInterval(pollRef.current)
          setStep('rejected')
          toast.error('Payment was rejected by admin. Please contact support.')
        }
      } catch (_) { /* network hiccup — keep polling */ }
    }
    poll() // immediate first check
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
  }, [requiredConfs, onSuccess])

  const manualRefresh = () => {
    if (transactionId) startPolling(transactionId)
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  // DONE
  if (step === 'done') {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Payment Confirmed!</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Your {selectedCurrency} payment has been verified on-chain with{' '}
            <span className="text-foreground font-semibold">{pollStatus?.confirmations || requiredConfs} confirmations</span>.
            Your <span className="text-emerald-400 font-bold capitalize">{planType}</span> plan is now active.
          </p>
          {pollStatus?.confirmations && (
            <ConfirmationProgress
              confirmations={pollStatus.confirmations}
              required={pollStatus.required || requiredConfs}
              status="confirmed"
            />
          )}
        </CardContent>
      </Card>
    )
  }

  // REJECTED
  if (step === 'rejected') {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="text-xl font-bold text-foreground">Payment Rejected</h3>
          <p className="text-muted-foreground text-sm">
            Your payment proof could not be verified. Please contact support or try again with a valid transaction.
          </p>
          <Button onClick={onCancel} variant="outline" className="w-full">Close</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-border">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-400" />
          Pay with Cryptocurrency
          <span className="ml-auto text-lg font-bold text-amber-400">${planPrice}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-1 text-[11px] font-medium overflow-x-auto pb-1">
          {['select', 'pay', 'verify', 'polling'].map((s, i) => (
            <span key={s} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <span className={`px-2 py-0.5 rounded-full ${step === s ? 'bg-amber-500/20 text-amber-400' : 'bg-secondary/60 text-muted-foreground'}`}>
                {i + 1}. {s === 'select' ? 'Currency' : s === 'pay' ? 'Send' : s === 'verify' ? 'Submit TX' : 'Confirming'}
              </span>
            </span>
          ))}
        </div>

        {/* ── SELECT CURRENCY ── */}
        {step === 'select' && (
          <div className="space-y-4">
            <Label className="text-foreground text-sm font-medium">Choose your cryptocurrency</Label>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((c) => {
                const wallet = wallets.find(w => w.currency === c.code)
                return (
                  <button
                    key={c.code}
                    type="button"
                    disabled={!wallet}
                    onClick={() => setSelectedCurrency(c.code)}
                    className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                      selectedCurrency === c.code
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : wallet
                          ? 'border-border bg-secondary/30 hover:border-muted-foreground/30'
                          : 'border-border/50 bg-secondary/10 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl block mb-0.5" style={{ color: c.color }}>{c.icon}</span>
                    <div className="text-foreground font-bold text-xs">{c.code}</div>
                    {!wallet && <div className="text-[9px] text-destructive mt-0.5">Unavailable</div>}
                  </button>
                )
              })}
            </div>
            <Button
              onClick={() => setStep('pay')}
              disabled={!currentWallet}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              Continue with {selectedCurrency} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── SEND PAYMENT ── */}
        {step === 'pay' && currentWallet && (
          <div className="space-y-5">
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300 text-sm">
                Send exactly <span className="font-bold">${planPrice} USD</span> worth of{' '}
                <span className="font-bold">{selectedCurrency}</span> to the address below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">{selectedCurrency} Wallet Address</Label>
              <div className="relative group">
                <div className="bg-secondary/80 border border-border rounded-lg p-4 font-mono text-xs break-all text-foreground select-all pr-16">
                  {currentWallet.wallet_address}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(currentWallet.wallet_address)}
                  className="absolute top-2 right-2 bg-card border-border text-foreground hover:bg-secondary h-7 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              {currentWallet.network && (
                <p className="text-[11px] text-muted-foreground">
                  Network: <span className="font-semibold text-foreground">{currentWallet.network}</span>
                  {' '} — only send on this network!
                </p>
              )}
            </div>

            <Alert className="bg-secondary/40 border-border">
              <AlertDescription className="text-xs text-muted-foreground">
                ⏱ After sending, copy your Transaction Hash (TxID) from your wallet.
                We require <span className="font-bold text-foreground">{requiredConfs} confirmations</span> for
                automatic activation, or an admin can manually approve sooner.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">← Back</Button>
              <Button
                onClick={() => setStep('verify')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> I've Sent the Payment
              </Button>
            </div>
          </div>
        )}

        {/* ── SUBMIT TX HASH ── */}
        {step === 'verify' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">Transaction Hash (TxID)</Label>
              <Input
                type="text"
                placeholder={selectedCurrency === 'BTC' ? 'e.g. abc123def456...' : '0x...'}
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="bg-secondary border-border text-foreground font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste the transaction hash from your wallet or exchange.
                Once submitted, we'll monitor confirmations in real time.
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

            <Alert className="bg-secondary/40 border-border">
              <AlertDescription className="text-xs text-muted-foreground">
                🔒 Activation is automatic once{' '}
                <span className="text-foreground font-bold">{requiredConfs} confirmations</span> are reached.
                An admin can also approve manually at any time.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('pay')} className="flex-1">← Back</Button>
              <Button
                onClick={handleSubmitProof}
                disabled={loading || !txHash.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {loading
                  ? <><Loader className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                  : <><Shield className="h-4 w-4 mr-2" /> Submit &amp; Watch Confirmations</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* ── REAL-TIME POLLING ── */}
        {step === 'polling' && pollStatus && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              {pollStatus.status === 'confirmed' ? (
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
              ) : (
                <Loader className="h-10 w-10 text-amber-400 mx-auto animate-spin" />
              )}
              <h3 className="font-semibold text-foreground">
                {pollStatus.status === 'confirmed' ? 'Confirmed!' : 'Watching Blockchain…'}
              </h3>
              <p className="text-[12px] text-muted-foreground">
                Auto-refreshes every 15 seconds.{' '}
                {pollStatus.needs_manual_review && (
                  <span className="text-amber-400">
                    Blockchain APIs unreachable — admin will verify manually.
                  </span>
                )}
              </p>
            </div>

            <ConfirmationProgress
              confirmations={pollStatus.confirmations}
              required={pollStatus.required || requiredConfs}
              status={pollStatus.status}
            />

            <div className="bg-secondary/40 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Plan</span>
                <span className="text-foreground font-semibold capitalize">{planType}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Currency</span>
                <span className="text-foreground font-semibold">{selectedCurrency}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>TX Hash</span>
                <span className="text-foreground font-mono truncate max-w-[180px]">{txHash}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Status</span>
                <span className={`font-semibold capitalize ${
                  pollStatus.status === 'confirmed' ? 'text-emerald-400' :
                  pollStatus.status === 'rejected' ? 'text-destructive' : 'text-amber-400'
                }`}>{pollStatus.status}</span>
              </div>
              {pollStatus.provider && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Verified via</span>
                  <span className="text-foreground">{pollStatus.provider}</span>
                </div>
              )}
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

            <Button
              onClick={manualRefresh}
              variant="outline"
              size="sm"
              className="w-full border-border text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh Now
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              You can close this window. We'll notify you via dashboard when payment is confirmed.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

export default CryptoPaymentForm
