import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const BlockedIPs = () => {
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    try {
      // Assuming a new API endpoint for fetching blocked IPs
      const data = await api.admin.security.getBlockedIPs();
      setBlockedIPs(data);
      toast.success('Blocked IPs list refreshed.');
    } catch (error) {
      console.error('Fetch blocked IPs error:', error);
      toast.error('Failed to load blocked IPs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) {
      toast.error('IP address cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      // Assuming a new API endpoint for adding a blocked IP
      await api.admin.security.addBlockedIP(newIP.trim());
      setNewIP('');
      await fetchBlockedIPs();
      toast.success(`IP ${newIP} blocked successfully.`);
    } catch (error) {
      console.error('Add blocked IP error:', error);
      toast.error('Failed to block IP address.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIP = async (ip) => {
    setLoading(true);
    try {
      // Assuming a new API endpoint for removing a blocked IP
      await api.admin.security.removeBlockedIP(ip);
      await fetchBlockedIPs();
      toast.success(`IP ${ip} unblocked successfully.`);
    } catch (error) {
      console.error('Remove blocked IP error:', error);
      toast.error('Failed to unblock IP address.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  return (
    <Card className="bg-red-500/10 border-red-500/20">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center">Blocked IPs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter IP address to block (e.g., 192.168.1.1)"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleAddIP} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Block
          </Button>
        </div>
        
        <div className="max-h-48 overflow-y-auto space-y-2 p-2 border rounded-lg border-red-500/30">
          {loading ? (
            <div className="text-center text-red-400/70">Loading...</div>
          ) : blockedIPs.length === 0 ? (
            <div className="text-center text-red-400/70">No IPs currently blocked.</div>
          ) : (
            blockedIPs.map((ip, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-red-500/15 rounded-md">
                <code className="text-sm text-red-300">{ip}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveIP(ip)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchBlockedIPs}
          disabled={loading}
          className="w-full text-red-400 border-red-400 hover:bg-red-500/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh List
        </Button>
      </CardContent>
    </Card>
  );
};

export default BlockedIPs;
