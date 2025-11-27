import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import CryptoIcon from '@/components/ui/CryptoIcon';

const CryptoWalletDisplay = ({ wallet }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        toast.success('Wallet address copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <CryptoIcon symbol={wallet.currency} className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg">{wallet.currency}</h4>
                        <p className="text-sm text-muted-foreground font-mono hidden md:block">
                            {wallet.address}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono md:hidden">
                            {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {wallet.explorerUrl && (
                        <Button variant="ghost" size="icon" asChild>
                            <a href={wallet.explorerUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CryptoWalletDisplay;
