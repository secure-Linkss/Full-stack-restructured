import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';

const BlockchainVerificationSettings = () => {
    const [settings, setSettings] = useState({
        autoVerify: true,
        confirmationsRequired: 3,
        etherscanApiKey: '',
        blockchainInfoApiKey: '',
        tronscanApiKey: ''
    });

    const handleSave = () => {
        // In a real app, save to backend
        // await api.admin.updateSettings(settings);
        toast.success('Blockchain verification settings saved');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                    Blockchain Verification
                </CardTitle>
                <p className="text-sm text-muted-foreground">Configure automated payment verification settings</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Automatic Verification</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically verify payments using blockchain explorers
                        </p>
                    </div>
                    <Switch
                        checked={settings.autoVerify}
                        onCheckedChange={(checked) => setSettings({ ...settings, autoVerify: checked })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Required Confirmations</Label>
                    <Input
                        type="number"
                        min="1"
                        max="12"
                        value={settings.confirmationsRequired}
                        onChange={(e) => setSettings({ ...settings, confirmationsRequired: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Number of block confirmations before marking as paid</p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">API Keys (Optional)</h4>
                    <div className="space-y-2">
                        <Label>Etherscan API Key (Ethereum)</Label>
                        <Input
                            type="password"
                            placeholder="Enter API Key"
                            value={settings.etherscanApiKey}
                            onChange={(e) => setSettings({ ...settings, etherscanApiKey: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Blockchain.info API Key (Bitcoin)</Label>
                        <Input
                            type="password"
                            placeholder="Enter API Key"
                            value={settings.blockchainInfoApiKey}
                            onChange={(e) => setSettings({ ...settings, blockchainInfoApiKey: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tronscan API Key (TRON/USDT)</Label>
                        <Input
                            type="password"
                            placeholder="Enter API Key"
                            value={settings.tronscanApiKey}
                            onChange={(e) => setSettings({ ...settings, tronscanApiKey: e.target.value })}
                        />
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                </Button>
            </CardContent>
        </Card>
    );
};

export default BlockchainVerificationSettings;
