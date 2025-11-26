import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Bitcoin, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const CryptoPaymentSettings = () => {
  const [wallets, setWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({
    currency: '',
    address: '',
    network: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      // Assuming a new API endpoint for fetching crypto wallets
      const data = await api.admin.payments.getCryptoWallets();
      setWallets(data);
      toast.success('Crypto wallets loaded.');
    } catch (error) {
      console.error('Fetch crypto wallets error:', error);
      toast.error('Failed to load crypto wallets.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async () => {
    if (!newWallet.currency || !newWallet.address) {
      toast.error('Currency and Address are required.');
      return;
    }
    setSaving(true);
    try {
      // Assuming a new API endpoint for adding a crypto wallet
      await api.admin.payments.addCryptoWallet(newWallet);
      setNewWallet({ currency: '', address: '', network: '' });
      await fetchWallets();
      toast.success(`${newWallet.currency} wallet added successfully.`);
    } catch (error) {
      console.error('Add crypto wallet error:', error);
      toast.error('Failed to add crypto wallet.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWallet = async (id) => {
    setSaving(true);
    try {
      // Assuming a new API endpoint for removing a crypto wallet
      await api.admin.payments.removeCryptoWallet(id);
      await fetchWallets();
      toast.success('Wallet removed successfully.');
    } catch (error) {
      console.error('Remove crypto wallet error:', error);
      toast.error('Failed to remove wallet.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Bitcoin className="h-5 w-5 mr-2" /> Manual Crypto Payments</CardTitle>
        <p className="text-sm text-muted-foreground">Configure crypto wallet addresses for manual user payments.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Wallet Form */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-semibold">Add New Wallet</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">Currency (e.g., BTC, ETH, USDT)</Label>
              <Input 
                id="currency" 
                value={newWallet.currency} 
                onChange={(e) => setNewWallet({ ...newWallet, currency: e.target.value })} 
                placeholder="BTC"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="network">Network (e.g., ERC20, TRC20)</Label>
              <Input 
                id="network" 
                value={newWallet.network} 
                onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })} 
                placeholder="ERC20"
                disabled={saving}
              />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="address">Wallet Address</Label>
              <Input 
                id="address" 
                value={newWallet.address} 
                onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })} 
                placeholder="0x..."
                disabled={saving}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddWallet} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" /> Add Wallet
            </Button>
          </div>
        </div>

        {/* Existing Wallets List */}
        <div className="space-y-2">
          <h4 className="font-semibold flex justify-between items-center">
            Existing Wallets
            <Button variant="outline" size="sm" onClick={fetchWallets} disabled={loading || saving}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </h4>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading wallets...</div>
            ) : wallets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No crypto wallets configured.</div>
            ) : (
              wallets.map((wallet) => (
                <div key={wallet.id} className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-medium">{wallet.currency} ({wallet.network || 'N/A'})</span>
                    <code className="text-xs text-muted-foreground break-all">{wallet.address}</code>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveWallet(wallet.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoPaymentSettings;
