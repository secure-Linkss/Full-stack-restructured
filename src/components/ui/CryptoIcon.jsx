import React from 'react';
import { Bitcoin, Wallet, DollarSign } from 'lucide-react';

const CryptoIcon = ({ symbol, className = "h-6 w-6" }) => {
    const getIcon = () => {
        switch (symbol?.toUpperCase()) {
            case 'BTC':
                return <Bitcoin className={className} />;
            case 'ETH':
                // Lucide doesn't have a specific ETH icon, using a generic one or custom SVG could work.
                // For now, using a stylized generic icon or fallback.
                return (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={className}
                    >
                        <path d="M12 2L2 12h20L12 2z" />
                        <path d="M2 12l10 10 10-10" />
                    </svg>
                );
            case 'USDT':
            case 'USDC':
                return <DollarSign className={className} />;
            default:
                return <Wallet className={className} />;
        }
    };

    return getIcon();
};

export default CryptoIcon;
