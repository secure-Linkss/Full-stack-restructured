import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { CreditCard, Lock, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'sonner'

const StripePaymentForm = ({ planType, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const handleInputChange = (field, value) => {
    if (field === 'cardNumber') {
      value = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      value = formatExpiryDate(value)
    } else if (field === 'cvv') {
      value = value.replace(/[^0-9]/gi, '').slice(0, 4)
    }

    setCardDetails(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Please enter a valid card number')
      return false
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      toast.error('Please enter a valid expiry date')
      return false
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast.error('Please enter a valid CVV')
      return false
    }
    if (!cardDetails.cardholderName) {
      toast.error('Please enter cardholder name')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_type: planType,
          success_url: window.location.origin + '/payments?success=true',
          cancel_url: window.location.origin + '/payments?cancelled=true'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        const error = await response.json()
        toast.error(error.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-400" />
          Card Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert className="bg-blue-900/20 border-blue-700">
            <Lock className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-400 text-sm">
              Your payment is secured by Stripe. We never store your card details.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-white">Card Number</Label>
            <Input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              maxLength="19"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Expiry Date</Label>
              <Input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                maxLength="5"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">CVV</Label>
              <Input
                type="text"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength="4"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Cardholder Name</Label>
            <Input
              type="text"
              placeholder="John Doe"
              value={cardDetails.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Processing...' : `Pay for ${planType.toUpperCase()} Plan`}
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

export default StripePaymentForm
