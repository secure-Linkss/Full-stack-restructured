import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Wallet, Copy, Upload, CheckCircle, AlertCircle, Loader, RefreshCw, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'

const AdvancedCryptoPaymentForm = ({ planType, planPrice, onSuccess, onCancel }) => {
  const [wallets, setWallets] = useState({})
  const [selectedCurrency, setSelectedCurrency] = useState('BTC')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [paymentProof, setPaymentProof] = useState({
    txHash: '',
    amount: planPrice || 0,
    screenshot: null
  })
  const [submittedPayment, setSubmittedPayment] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)

  useEffect(() => {
    fetchWalletAddresses()
  }, [])

  // Auto-check payment status every 10 seconds if payment is pending
  useEffect(() => {
    if (submittedPayment && submittedPayment.status !== 'confirmed') {
      const interval = setInterval(() => {
        checkPaymentStatus()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [submittedPayment])

  const fetchWalletAddresses = async () => {
    try {
      const response = await api.payments.getCryptoWallets()
      setWallets(response.wallets || {})
    } catch (error) {
      console.error('Error fetching wallet addresses:', error)
      toast.error('Failed to load wallet addresses')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Wallet address copied to clipboard')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentProof(prev => ({ ...prev, screenshot: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!paymentProof.txHash) {
      toast.error('Please enter transaction hash')
      return
    }

    if (!paymentProof.amount || paymentProof.amount <= 0) {
      toast.error('Please enter valid amount')
      return
    }

    setLoading(true)

    try {
      const response = await api.payments.submitCryptoPayment({
        plan_type: planType,
        currency: selectedCurrency,
        tx_hash: paymentProof.txHash,
        amount: paymentProof.amount,
        screenshot: paymentProof.screenshot
      })

      if (response.success) {
        setSubmittedPayment(response.payment)
        setPaymentStatus(response.payment)
        toast.success('Payment proof submitted! Checking confirmations...')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.error || 'Failed to submit payment proof')
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!submittedPayment) return

    try {
      setChecking(true)
      const response = await api.payments.checkStatus(submittedPayment.id)

      if (response.payment) {
        setPaymentStatus(response.payment)

        if (response.payment.is_confirmed) {
          toast.success('Payment confirmed! Your subscription is now active.')
          if (onSuccess) onSuccess()
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setChecking(false)
    }
  }

  const currencies = [
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { code: 'LTC', name: 'Litecoin', icon: 'Ł' },
    { code: 'USDT', name: 'Tether', icon: '₮' }
  ]

  const currentWallet = wallets[selectedCurrency] || 'Wallet address not configured'

  // If payment is submitted, show status
  if (submittedPayment) {
    const isConfirmed = paymentStatus?.is_confirmed
    const confirmations = paymentStatus?.confirmations || 0
    const estimatedTime = paymentStatus?.estimated_confirmation_time || 'Calculating...'

    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConfirmed ? (
            <Alert className="bg-green-900/20 border-green-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400 ml-2">
                <p className="font-semibold">Payment Confirmed!</p>
                <p className="text-sm mt-1">Your subscription has been activated.</p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-900/20 border-blue-700">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-400 ml-2">
                <p className="font-semibold">Waiting for Confirmations</p>
                <p className="text-sm mt-1">Your payment is being verified on the blockchain.</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Confirmations</p>
                <p className="text-2xl font-bold text-white mt-2">{confirmations}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-lg font-semibold text-white mt-2">{estimatedTime}</p>
              </div>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Transaction Hash</p>
              <p className="text-white font-mono text-sm mt-2 break-all">{paymentStatus?.tx_hash || submittedPayment.tx_hash}</p>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-white font-semibold mt-2">{paymentStatus?.amount || submittedPayment.amount} {selectedCurrency}</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={checkPaymentStatus}
                disabled={checking || isConfirmed}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {checking ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Cancel
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Status updates automatically every 10 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Initial payment form
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-orange-400" />
          Cryptocurrency Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-orange-900/20 border-orange-700">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-400 text-sm ml-2">
            Send payment to the wallet address below, then submit the transaction hash for verification.
          </AlertDescription>
        </Alert>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label className="text-white">Select Cryptocurrency</Label>
          <div className="grid grid-cols-2 gap-2">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => setSelectedCurrency(currency.code)}
                className={`p-3 rounded-lg border-2 transition-all ${selectedCurrency === currency.code
                    ? 'border-orange-500 bg-orange-900/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currency.icon}</span>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">{currency.code}</div>
                    <div className="text-slate-400 text-xs">{currency.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Address */}
        <div className="space-y-2">
          <Label className="text-white">Send {selectedCurrency} to this address:</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              readOnly
              value={currentWallet}
              className="flex-1 bg-slate-700 border-slate-600 text-white truncate"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(currentWallet)}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Amount Sent ({selectedCurrency})</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={paymentProof.amount}
                onChange={(e) => setPaymentProof(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Transaction Hash (TxID)</Label>
              <Input
                type="text"
                placeholder="0x... or transaction ID"
                value={paymentProof.txHash}
                onChange={(e) => setPaymentProof(prev => ({ ...prev, txHash: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Payment Screenshot (Optional but recommended)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-upload"
              />
              <Label
                htmlFor="screenshot-upload"
                className="flex-1 flex items-center justify-center p-3 border-2 border-dashed rounded-lg cursor-pointer bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 text-slate-400"
              >
                <Upload className="h-4 w-4 mr-2" />
                {paymentProof.screenshot ? 'File Selected' : 'Click to upload screenshot (Max 5MB)'}
              </Label>
              {paymentProof.screenshot && (
                <CheckCircle className="h-6 w-6 text-green-500" />
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Submitting Proof...' : 'Submit Payment Proof'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </form>

        <Alert className="bg-slate-700/50 border-slate-600">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <AlertDescription className="text-slate-400 text-xs ml-2">
            Your transaction will be automatically verified on the blockchain. Confirmation times vary by cryptocurrency.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default AdvancedCryptoPaymentForm
