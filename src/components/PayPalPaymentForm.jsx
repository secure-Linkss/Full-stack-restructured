import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const PayPalPaymentForm = ({ amount, planId, onSuccess, onError }) => {
    const [clientId, setClientId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // In a real app, fetch this from backend to keep it secure or use env var
                // const config = await api.payments.getPayPalConfig();
                // setClientId(config.clientId);

                // For now, using a placeholder or env var if available
                setClientId(import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test');
            } catch (error) {
                console.error('Error loading PayPal config:', error);
                toast.error('Failed to load payment system');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>;
    }

    if (!clientId) {
        return <div className="text-red-500 p-4">PayPal configuration missing. Please contact support.</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Pay with PayPal</CardTitle>
            </CardHeader>
            <CardContent>
                <PayPalScriptProvider options={{ "client-id": clientId, currency: "USD" }}>
                    <PayPalButtons
                        style={{ layout: "vertical" }}
                        createOrder={(data, actions) => {
                            return actions.order.create({
                                purchase_units: [
                                    {
                                        amount: {
                                            value: amount.toString(),
                                        },
                                        description: `Subscription for ${planId} plan`,
                                    },
                                ],
                            });
                        }}
                        onApprove={async (data, actions) => {
                            try {
                                const details = await actions.order.capture();
                                toast.success(`Transaction completed by ${details.payer.name.given_name}`);

                                // Record transaction in backend
                                await api.payments.recordPayPalTransaction({
                                    orderId: data.orderID,
                                    details: details,
                                    planId: planId,
                                    amount: amount
                                });

                                if (onSuccess) onSuccess(details);
                            } catch (error) {
                                console.error('Payment capture error:', error);
                                toast.error('Payment verification failed');
                                if (onError) onError(error);
                            }
                        }}
                        onError={(err) => {
                            console.error('PayPal error:', err);
                            toast.error('PayPal payment failed');
                            if (onError) onError(err);
                        }}
                    />
                </PayPalScriptProvider>
            </CardContent>
        </Card>
    );
};

export default PayPalPaymentForm;
