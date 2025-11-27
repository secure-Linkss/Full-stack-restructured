import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CreditCard, DollarSign, Calendar, FileText, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/Badge';
import { toast } from 'sonner';
import api from '../services/api';

const BillingAndSubscription = () => {
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const userProfile = await api.profile.get();
      setBillingInfo({
        plan: userProfile.plan || 'Free',
        status: userProfile.subscription_status || 'Active',
        next_billing_date: userProfile.next_billing_date || new Date().toISOString(),
        payment_method: userProfile.payment_method || 'N/A',
        invoices: userProfile.invoices || []
      });
    } catch (error) {
      console.error('Error fetching billing info:', error);
      toast.error('Failed to load billing information.');
      setBillingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // In a real application, this would redirect to a Stripe/Paddle portal
    toast.info('Redirecting to secure billing portal...');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><CreditCard className="h-5 w-5 mr-2 text-primary" /> Billing & Subscription</CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground ml-2">Loading billing details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><CreditCard className="h-5 w-5 mr-2 text-primary" /> Billing & Subscription</CardTitle>
        <p className="text-sm text-muted-foreground">Manage your payment methods, view your current plan, and access invoices.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="border-b pb-4 space-y-3">
          <h4 className="font-semibold text-lg flex items-center"><DollarSign className="h-5 w-5 mr-2" /> Current Plan</h4>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold">{billingInfo.plan} Plan</p>
              <p className="text-sm text-muted-foreground">Status: <Badge variant={billingInfo.status === 'Active' ? 'default' : 'secondary'}>{billingInfo.status}</Badge></p>
            </div>
            <Button onClick={handleManageSubscription} variant="outline">
              Manage Subscription
            </Button>
          </div>
          <p className="text-sm flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Next Billing Date: {new Date(billingInfo.next_billing_date).toLocaleDateString()}
          </p>
        </div>

        {/* Payment Method */}
        <div className="border-b pb-4 space-y-3">
          <h4 className="font-semibold text-lg flex items-center"><CreditCard className="h-5 w-5 mr-2" /> Payment Method</h4>
          <p className="text-base">{billingInfo.payment_method}</p>
          <Button variant="link" className="p-0 h-auto">Update Payment Method</Button>
        </div>

        {/* Invoice History */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg flex items-center"><FileText className="h-5 w-5 mr-2" /> Invoice History</h4>
          <div className="space-y-2">
            {(billingInfo.invoices || []).map(invoice => (
              <div key={invoice.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                  <Badge variant={invoice.status === 'Paid' ? 'success' : 'destructive'}>{invoice.status}</Badge>
                  <Button variant="outline" size="sm" onClick={() => toast.info(`Downloading ${invoice.id}`)}>Download</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingAndSubscription;
