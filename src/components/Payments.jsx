import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard,
  Check,
  AlertCircle,
  Zap,
  Crown,
  Star
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const Payments = () => {
  const [plans, setPlans] = useState({})
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [processingPlan, setProcessingPlan] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlans()
    fetchSubscription()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/payments/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/payments/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const handleSubscribe = async (planType) => {
    setLoading(true)
    setProcessingPlan(planType)

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_type: planType,
          success_url: window.location.origin + '/payment/success',
          cancel_url: window.location.origin + '/payment/cancel'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create checkout session',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setProcessingPlan(null)
    }
  }

  const PlanIcon = ({ planType }) => {
    switch(planType) {
      case 'pro':
        return <Zap className="h-8 w-8 text-blue-400" />
      case 'enterprise':
        return <Crown className="h-8 w-8 text-yellow-400" />
      default:
        return <Star className="h-8 w-8 text-slate-400" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
        <p className="text-slate-400">Choose the plan that fits your needs</p>
      </div>

      {/* Current Subscription Alert */}
      {currentSubscription && (
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
          <Card
            key={key}
            className={`bg-slate-800 border-slate-700 transition-all hover:border-slate-600 ${
              currentSubscription?.plan_type === key ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <PlanIcon planType={key} />
                {currentSubscription?.plan_type === key && (
                  <Badge className="bg-blue-500">Current Plan</Badge>
                )}
              </div>
              <CardTitle className="text-white text-2xl mt-4">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.price > 0 && <span className="text-slate-400">/month</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features List */}
              <div className="space-y-3">
                {plan.features?.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {key === 'free' ? (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled
                >
                  Free Forever
                </Button>
              ) : currentSubscription?.plan_type === key ? (
                <Button
                  className="w-full bg-slate-700 hover:bg-slate-600"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleSubscribe(key)}
                  disabled={loading}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {processingPlan === key ? 'Processing...' : 'Subscribe Now'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Payment Methods</CardTitle>
          <CardDescription>We accept the following payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <span className="text-slate-300">Credit Card</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
              <span className="text-slate-300">Powered by</span>
              <span className="font-bold text-white">Stripe</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-2">Can I cancel anytime?</h3>
            <p className="text-slate-400 text-sm">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-slate-400 text-sm">
              We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Stripe.
            </p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">Can I upgrade or downgrade?</h3>
            <p className="text-slate-400 text-sm">
              Yes, you can change your plan at any time. Changes will be prorated based on your billing cycle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Payments
