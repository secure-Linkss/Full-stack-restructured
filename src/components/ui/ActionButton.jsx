import React from 'react';
import { Button } from './button';
import { Copy, RefreshCw, Link, Trash2, Edit, Plus, Send, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const ActionButton = ({ action, onClick, disabled, loading, children, className = '' }) => {
  const getProps = () => {
    switch (action) {
      case 'copy':
        return {
          icon: Copy,
          variant: 'outline',
          size: 'icon',
          tooltip: 'Copy to Clipboard',
          defaultClick: () => {
            // Mock clipboard copy
            navigator.clipboard.writeText('Mock data copied!');
            toast.success('Copied to clipboard!');
          },
        };
      case 'regenerate':
        return {
          icon: RefreshCw,
          variant: 'outline',
          size: 'icon',
          tooltip: 'Regenerate',
        };
      case 'test-link':
        return {
          icon: Link,
          variant: 'outline',
          size: 'icon',
          tooltip: 'Test Link',
          defaultClick: () => window.open('https://www.google.com', '_blank'),
        };
      case 'delete':
        return {
          icon: Trash2,
          variant: 'destructive',
          size: 'icon',
          tooltip: 'Delete',
        };
      case 'edit':
        return {
          icon: Edit,
          variant: 'outline',
          size: 'icon',
          tooltip: 'Edit',
        };
      case 'add':
        return {
          icon: Plus,
          variant: 'default',
          tooltip: 'Add New',
        };
      case 'save':
        return {
          icon: CheckCircle,
          variant: 'default',
          tooltip: 'Save Changes',
        };
      case 'send':
        return {
          icon: Send,
          variant: 'default',
          tooltip: 'Send',
        };
      default:
        return {
          icon: null,
          variant: 'default',
          tooltip: '',
        };
    }
  };

  const { icon: Icon, variant, size, tooltip, defaultClick } = getProps();

  const handleClick = (e) => {
    if (loading || disabled) return;
    if (onClick) {
      onClick(e);
    } else if (defaultClick) {
      defaultClick(e);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`relative ${className}`}
    >
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className={size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
      ) : null}
      {children}
      {/* Tooltip implementation would typically be done with a separate component like Radix Tooltip */}
    </Button>
  );
};

export default ActionButton;
