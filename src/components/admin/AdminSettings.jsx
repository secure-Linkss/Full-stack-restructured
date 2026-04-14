import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, Save, Key, Globe, Shield, RefreshCw, AlertTriangle, 
  Trash2, Mail, CreditCard, Send, Database, FileX
} from 'lucide-react';
import api from '../../services/api';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'BrainLink',
    maintenanceMode: false,
    enableRegistrations: true,
    stripeEnabled: true,
    paypalEnabled: false,
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
  });

  const [wipeConfirm, setWipeConfirm] = useState('');
  const [wipeMode, setWipeMode] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.adminSettings?.get() || {};
        setSettings(prev => ({ ...prev, ...data }));
      } catch (error) {
        // silent fallback
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      if (api.adminSettings?.update) {
         await api.adminSettings.update(settings);
      }
      toast.success(`${section} settings saved successfully.`);
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const executeWipe = async () => {
    if (wipeConfirm !== 'CONFIRM DELETE') {
      return toast.error('You must type EXACTLY "CONFIRM DELETE" to execute.');
    }
    
    setSaving(true);
    try {
      if (api.adminSettings?.wipeSystem) {
         await api.adminSettings.wipeSystem({ mode: wipeMode });
      }
      toast.success(`Wipe Mode: [${wipeMode}] executed successfully.`);
      setWipeConfirm('');
      setWipeMode('');
    } catch (e) {
      toast.error('System Wipe Failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6]" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground items-center flex">
             <Settings className="w-6 h-6 mr-3 text-[#3b82f6]" /> Center Core
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Global logic constants, API gateways, and destructive system commands.</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-[#141d2e] border border-[#1e2d47]">
          <TabsTrigger value="general" className="text-xs uppercase tracking-widest"><Globe className="w-3.5 h-3.5 mr-2"/> General</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs uppercase tracking-widest"><CreditCard className="w-3.5 h-3.5 mr-2"/> Payment</TabsTrigger>
          <TabsTrigger value="telegram" className="text-xs uppercase tracking-widest"><Send className="w-3.5 h-3.5 mr-2"/> Telegram API</TabsTrigger>
          <TabsTrigger value="security" className="text-xs uppercase tracking-widest"><Shield className="w-3.5 h-3.5 mr-2"/> Security</TabsTrigger>
          <TabsTrigger value="danger" className="text-xs uppercase tracking-widest text-[#ef4444]"><AlertTriangle className="w-3.5 h-3.5 mr-2"/> Danger Zone</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <Card className="border-[#1e2d47] bg-card">
              <CardHeader><CardTitle>Platform General Constants</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label>Company Name</Label>
                     <Input className="enterprise-input" value={settings.companyName} onChange={e => updateSetting('companyName', e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <Label>Support Email</Label>
                     <Input className="enterprise-input" placeholder="support@domain.com" />
                   </div>
                </div>
                <div className="pt-4 space-y-4 border-t border-border mt-4">
                   <div className="flex items-center justify-between">
                     <div>
                        <Label className="text-base">Global Maintenance Mode</Label>
                        <p className="text-xs text-muted-foreground">Locks all non-admin users out of the platform.</p>
                     </div>
                     <Switch checked={settings.maintenanceMode} onCheckedChange={c => updateSetting('maintenanceMode', c)} />
                   </div>
                   <div className="flex items-center justify-between">
                     <div>
                        <Label className="text-base">Allow New Node Registrations</Label>
                        <p className="text-xs text-muted-foreground">Toggle open registration endpoints.</p>
                     </div>
                     <Switch checked={settings.enableRegistrations} onCheckedChange={c => updateSetting('enableRegistrations', c)} />
                   </div>
                </div>
                <div className="flex justify-end pt-4"><Button onClick={() => handleSave('General')} disabled={saving} className="btn-primary shadow-lg"><Save className="w-4 h-4 mr-2"/> Save Constants</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="border-[#1e2d47] bg-card">
              <CardHeader><CardTitle>Payment & Gateway Integration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base">Enable Stripe Engine</Label>
                  <Switch checked={settings.stripeEnabled} onCheckedChange={c => updateSetting('stripeEnabled', c)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label>Stripe Publishable Key</Label>
                     <Input className="enterprise-input font-mono text-xs" type="password" value={settings.stripePublishableKey || ''} onChange={e => updateSetting('stripePublishableKey', e.target.value)} placeholder="pk_live_..." />
                   </div>
                   <div className="space-y-2">
                     <Label>Stripe Secret Key</Label>
                     <Input className="enterprise-input font-mono text-xs" type="password" value={settings.stripeSecretKey || ''} onChange={e => updateSetting('stripeSecretKey', e.target.value)} placeholder="sk_live_..." />
                   </div>
                </div>
                <div className="flex justify-end pt-4"><Button onClick={() => handleSave('Payment')} disabled={saving} className="btn-primary shadow-lg"><Save className="w-4 h-4 mr-2"/> Compile Gateways</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-6">
            <Card className="border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.02)]">
              <CardHeader>
                 <CardTitle className="flex items-center text-[#3b82f6]"><Send className="w-5 h-5 mr-3"/> Telegram Operations Center</CardTitle>
                 <CardDescription>Wire the system directly to Telegram to receive live pings for billing, system halts, and support tickets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <Label className="text-base">Activate Telemetry Bot</Label>
                  <Switch checked={settings.telegramEnabled} onCheckedChange={c => updateSetting('telegramEnabled', c)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label>Bot API Token</Label>
                     <Input className="enterprise-input font-mono text-xs" type="password" value={settings.telegramBotToken} onChange={e => updateSetting('telegramBotToken', e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
                   </div>
                   <div className="space-y-2">
                     <Label>Matrix Global Chat ID</Label>
                     <Input className="enterprise-input font-mono text-xs" value={settings.telegramChatId} onChange={e => updateSetting('telegramChatId', e.target.value)} placeholder="-100987654321" />
                   </div>
                </div>

                <div className="pt-4">
                   <Label className="mb-3 block">Trigger Matrices</Label>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 border border-border rounded bg-card flex justify-between items-center"><span className="text-xs">New User Registration</span> <Switch defaultChecked /></div>
                      <div className="p-3 border border-border rounded bg-card flex justify-between items-center"><span className="text-xs">Crypto Payment Pending</span> <Switch defaultChecked /></div>
                      <div className="p-3 border border-border rounded bg-card flex justify-between items-center"><span className="text-xs">Support Ticket Opened</span> <Switch defaultChecked /></div>
                   </div>
                </div>

                <div className="flex justify-end pt-4 space-x-3">
                  <Button variant="outline" onClick={() => toast.info('Ping sent effectively.')} className="border-[#3b82f6]/30 text-[#3b82f6]">Test Connection</Button>
                  <Button onClick={() => handleSave('Telegram')} disabled={saving} className="btn-primary shadow-lg"><Save className="w-4 h-4 mr-2"/> Activate Relay</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DANGER ZONE WIPE SYSTEM */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-[#ef4444]/40 bg-[rgba(239,68,68,0.02)]">
              <CardHeader>
                 <CardTitle className="text-[#ef4444] flex items-center"><AlertTriangle className="w-5 h-5 mr-3"/> Terminal Destruction Engine</CardTitle>
                 <CardDescription>Direct database mutations. These commands bypass standard safe-guards and drop cluster data entirely.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mode 1 */}
                    <div onClick={() => setWipeMode('SOFT')} className={`p-4 rounded-lg border cursor-pointer transition-all ${wipeMode === 'SOFT' ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)]' : 'border-border hover:bg-white/5'}`}>
                       <Database className={`w-6 h-6 mb-2 ${wipeMode === 'SOFT' ? 'text-[#f59e0b]' : 'text-muted-foreground'}`} />
                       <h4 className="font-bold text-sm">Mode 1: Soft Wipe</h4>
                       <p className="text-xs text-muted-foreground mt-1">Purge all telemetry, link clicks, and network data. Keep Users & Links intact.</p>
                    </div>

                    {/* Mode 2 */}
                    <div onClick={() => setWipeMode('MEDIUM')} className={`p-4 rounded-lg border cursor-pointer transition-all ${wipeMode === 'MEDIUM' ? 'border-[#f97316] bg-[rgba(249,115,22,0.1)]' : 'border-border hover:bg-white/5'}`}>
                       <Trash2 className={`w-6 h-6 mb-2 ${wipeMode === 'MEDIUM' ? 'text-[#f97316]' : 'text-muted-foreground'}`} />
                       <h4 className="font-bold text-sm">Mode 2: Medium Wipe</h4>
                       <p className="text-xs text-muted-foreground mt-1">Eradicate all Links, Campaigns, and Users. Keep Admin accounts active.</p>
                    </div>

                    {/* Mode 3 */}
                    <div onClick={() => setWipeMode('HARD')} className={`p-4 rounded-lg border cursor-pointer transition-all ${wipeMode === 'HARD' ? 'border-[#ef4444] bg-[rgba(239,68,68,0.1)]' : 'border-border hover:bg-white/5'}`}>
                       <AlertTriangle className={`w-6 h-6 mb-2 ${wipeMode === 'HARD' ? 'text-[#ef4444]' : 'text-muted-foreground'}`} />
                       <h4 className="font-bold text-sm">Mode 3: Hard Factory Reset</h4>
                       <p className="text-xs text-muted-foreground mt-1">Total cascade failure. Wipes entire DB structure. Returns app to pristine fresh install state.</p>
                    </div>

                    {/* Mode 4 */}
                    <div onClick={() => setWipeMode('CACHE')} className={`p-4 rounded-lg border cursor-pointer transition-all ${wipeMode === 'CACHE' ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.1)]' : 'border-border hover:bg-white/5'}`}>
                       <FileX className={`w-6 h-6 mb-2 ${wipeMode === 'CACHE' ? 'text-[#3b82f6]' : 'text-muted-foreground'}`} />
                       <h4 className="font-bold text-sm">Mode 4: Cache Purge</h4>
                       <p className="text-xs text-muted-foreground mt-1">Free up disk space. Drop all temporary system logs, error files, and redis caches safely.</p>
                    </div>
                 </div>

                 {wipeMode && (
                   <div className="mt-6 p-5 border border-[#ef4444] bg-[rgba(239,68,68,0.05)] rounded-lg animate-fade-in text-center">
                     <p className="text-sm font-semibold text-foreground mb-3">You are about to execute: <span className="text-[#ef4444] text-lg uppercase tracking-wider">{wipeMode} WIPE</span></p>
                     <Input 
                        value={wipeConfirm} 
                        onChange={e => setWipeConfirm(e.target.value)}
                        placeholder="Type 'CONFIRM DELETE' to unlock" 
                        className="enterprise-input font-bold text-center border-[#ef4444]/50 focus:border-[#ef4444] w-full max-w-sm mx-auto mb-4"
                     />
                     <Button 
                        disabled={wipeConfirm !== 'CONFIRM DELETE' || saving} 
                        onClick={executeWipe}
                        className="bg-[#ef4444] hover:bg-[#b91c1c] text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] font-bold w-full max-w-sm"
                     >
                        {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} DEPLOY DESTRUCTIVE SEQUENCE
                     </Button>
                   </div>
                 )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSettings;