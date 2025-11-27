import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import CryptoWalletDisplay from './CryptoWalletDisplay';

const CryptoWalletManager = () => {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newWallet, setNewWallet] = useState({ currency: 'BTC', address: '', network: 'Bitcoin' });
    const [isAdding, setIsAdding] = useState(false);

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const response = await api.adminSettings.getCryptoWallets();
            setWallets(Array.isArray(response) ? response : (response.wallets || []));
        } catch (error) {
            console.error('Error fetching wallets:', error);
            toast.error('Failed to load crypto wallets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const handleAddWallet = async () => {
        if (!newWallet.address) {
            toast.error('Please enter a wallet address');
            return;
        }

        try {
            await api.adminSettings.addCryptoWallet(newWallet);
            await fetchWallets(); // Refresh the list
            setNewWallet({ currency: 'BTC', address: '', network: 'Bitcoin' });
            setIsAdding(false);
            toast.success('Crypto wallet added successfully');
        } catch (error) {
            console.error('Error adding wallet:', error);
            toast.error('Failed to add wallet');
        }
    };

    const handleDeleteWallet = async (id) => {
        if (window.confirm('Are you sure you want to delete this wallet?')) {
            try {
                await api.adminSettings.deleteCryptoWallet(id);
                await fetchWallets(); // Refresh the list
                toast.success('Wallet deleted successfully');
            } catch (error) {
                console.error('Error deleting wallet:', error);
                toast.error('Failed to delete wallet');
            }
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center">
                        <Wallet className="h-5 w-5 mr-2 text-primary" />
                        Crypto Wallet Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Manage receiving addresses for crypto payments</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
                    {isAdding ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add Wallet</>}
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {isAdding && (
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select
                                    value={newWallet.currency}
                                    onValueChange={(val) => setNewWallet({ ...newWallet, currency: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Wallet Address</Label>
                                <Input
                                    placeholder="Enter wallet address"
                                    value={newWallet.address}
                                    onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddWallet}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Wallet
                            </Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading wallets...</div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        No crypto wallets configured. Add one to start accepting crypto payments.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {wallets.map((wallet) => (
                            <div key={wallet.id} className="relative group">
                                <CryptoWalletDisplay wallet={wallet} />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteWallet(wallet.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CryptoWalletManager;
