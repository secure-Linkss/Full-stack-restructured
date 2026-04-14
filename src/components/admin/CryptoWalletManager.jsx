import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Wallet, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const NETWORK_MAP = {
  BTC: 'Bitcoin Mainnet',
  ETH: 'Ethereum Mainnet (ERC-20)',
  USDT: 'Ethereum Mainnet (ERC-20)',
  USDC: 'Ethereum Mainnet (ERC-20)',
};

const CryptoWalletManager = () => {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newWallet, setNewWallet] = useState({ currency: 'BTC', wallet_address: '', network: 'Bitcoin Mainnet' });
    const [isAdding, setIsAdding] = useState(false);

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const response = await api.adminSettings.getCryptoWallets();
            const data = response.wallets || response || [];
            setWallets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching wallets:', error);
            // Try alternative endpoint
            try {
                const response = await api.admin.payments.getCryptoWallets();
                const data = response.wallets || response || [];
                setWallets(Array.isArray(data) ? data : []);
            } catch {
                toast.error('Failed to load crypto wallets');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    const handleAddWallet = async () => {
        if (!newWallet.wallet_address) {
            toast.error('Please enter a wallet address');
            return;
        }

        try {
            await api.adminSettings.addCryptoWallet({
                currency: newWallet.currency,
                wallet_address: newWallet.wallet_address,
                network: NETWORK_MAP[newWallet.currency] || newWallet.network,
            });
            toast.success(`${newWallet.currency} wallet added successfully`);
            setNewWallet({ currency: 'BTC', wallet_address: '', network: 'Bitcoin Mainnet' });
            setIsAdding(false);
            fetchWallets();
        } catch (error) {
            toast.error(error.message || 'Failed to add wallet');
        }
    };

    const handleDeleteWallet = async (id) => {
        if (!window.confirm('Are you sure you want to delete this wallet? Users will no longer be able to pay with this currency.')) return;
        try {
            await api.adminSettings.deleteCryptoWallet(id);
            toast.success('Wallet deleted successfully');
            fetchWallets();
        } catch (error) {
            toast.error('Failed to delete wallet');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Address copied!');
    };

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                <div>
                    <CardTitle className="flex items-center text-foreground">
                        <Wallet className="h-5 w-5 mr-2 text-amber-400" />
                        Crypto Wallet Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage receiving addresses for BTC, ETH, and USDT payments.
                        Users will see these addresses when paying via crypto.
                    </p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
                    {isAdding ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add Wallet</>}
                </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {isAdding && (
                    <div className="p-5 border border-border rounded-xl bg-secondary/30 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">Currency</Label>
                                <Select
                                    value={newWallet.currency}
                                    onValueChange={(val) => setNewWallet({ ...newWallet, currency: val, network: NETWORK_MAP[val] || '' })}
                                >
                                    <SelectTrigger className="bg-card border-border">
                                        <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BTC">₿ Bitcoin (BTC)</SelectItem>
                                        <SelectItem value="ETH">Ξ Ethereum (ETH)</SelectItem>
                                        <SelectItem value="USDT">₮ Tether (USDT)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-foreground">Wallet Address</Label>
                                <Input
                                    placeholder="Enter your receiving wallet address"
                                    value={newWallet.wallet_address}
                                    onChange={(e) => setNewWallet({ ...newWallet, wallet_address: e.target.value })}
                                    className="bg-card border-border font-mono text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Network: <span className="font-medium text-foreground">{NETWORK_MAP[newWallet.currency]}</span>
                        </p>
                        <div className="flex justify-end">
                            <Button onClick={handleAddWallet} className="bg-emerald-600 hover:bg-emerald-700">
                                <Save className="h-4 w-4 mr-2" />
                                Save Wallet
                            </Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading wallets...</div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="font-medium">No crypto wallets configured</p>
                        <p className="text-xs mt-1">Add a wallet to start accepting crypto payments from users.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {wallets.map((wallet) => (
                            <div key={wallet.id} className="relative group flex items-center justify-between p-4 bg-secondary/30 border border-border rounded-xl hover:bg-secondary/50 transition-colors">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                                        wallet.currency === 'BTC' ? 'bg-amber-500/20 text-amber-400' :
                                        wallet.currency === 'ETH' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                        {wallet.currency === 'BTC' ? '₿' : wallet.currency === 'ETH' ? 'Ξ' : '₮'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{wallet.currency}</span>
                                            <span className="text-xs text-muted-foreground">{wallet.network}</span>
                                            {wallet.is_active && (
                                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                                    <CheckCircle className="h-2.5 w-2.5" /> Active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-mono text-muted-foreground truncate mt-1 max-w-md">
                                            {wallet.wallet_address}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(wallet.wallet_address)}
                                        title="Copy address"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteWallet(wallet.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CryptoWalletManager;
