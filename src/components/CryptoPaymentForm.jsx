import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Wallet, Copy, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'

const CryptoPaymentForm = ({ planType, planPrice, onSuccess, onCancel }) => {
  const [wallets, setWallets] = useState({})
  const [selectedCurrency, setSelectedCurrency] = useState('BTC')
  const [loading, setLoading] = useState(false)
  const [paymentProof, setPaymentProof] = useState({
    txHash: '',
    amount: planPrice || 0,
    screenshot: null
  })

  useEffect(() => {
    fetchWalletAddresses()
  }, [])

  const fetchWalletAddresses = async () => {
    try {
      const response = await fetch('/api/crypto-payments/wallets')
      if (response.ok) {
        const data = await response.json()
        setWallets(data.wallets || {})
      }
    } catch (error) {
      console.error('Error fetching wallet addresses:', error)
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
      const response = await fetch('/api/crypto-payments/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_type: planType,
          currency: selectedCurrency,
          tx_hash: paymentProof.txHash,
          amount: paymentProof.amount,
          screenshot: paymentProof.screenshot
        })
      })

      if (response.ok) {
        toast.success('Payment proof submitted successfully! Awaiting admin verification.')
        if (onSuccess) onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit payment proof')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit payment proof')
    } finally {
      setLoading(false)
    }
  }

  const currencies = [
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { code: 'LTC', name: 'Litecoin', icon: 'Ł' },
    { code: 'USDT', name: 'Tether', icon: '₮' }
  ]

  const currentWallet = wallets[selectedCurrency] || 'Wallet address not configured'

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
          <AlertDescription className="text-orange-400 text-sm">
            Send payment to the wallet address below, then submit proof for verification.
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
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCurrency === currency.code
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
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="0x..."
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
      </CardContent>
    </Card>
  )
}

export default CryptoPaymentForm
