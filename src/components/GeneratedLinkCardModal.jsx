import React from 'react';
import { Link as LinkIcon, Copy, QrCode, Code, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

const GeneratedLinkCardModal = ({ link, onClose }) => {
  if (!link) return null;

  const trackingUrl = link.trackingUrl || link.tracking_url || link.short_url || link.shortUrl || 'https://link.com/unknown';
  const pixelUrl = link.pixelUrl || link.pixel_url || 'https://link.com/pixel/unknown';
  const emailCode = `<!-- Tracking Pixel & Email Capture -->\n<img src="${pixelUrl}" width="1" height="1" style="display:none;" />\n<script src="https://link.com/capture.js?id=${link.id}"></script>`;

  const copyToClipboard = async (text, label) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} Copied!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="enterprise-card w-full max-w-2xl mx-4 p-0 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#10b981] to-[#3b82f6]"></div>
        
        <div className="flex items-center justify-between p-6 border-b border-border bg-[#141d2e] rounded-t-xl">
          <div className="flex items-center">
             <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center mr-4">
                <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
             </div>
             <div>
                <h3 className="text-xl font-heading font-bold text-foreground">Link Configuration Ready</h3>
                <p className="text-sm text-muted-foreground">{link.campaign_name || link.campaignName || 'Unnamed Link'}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Tracking URL */}
          <div className="space-y-2">
             <label className="text-sm font-semibold text-foreground flex items-center">
                <LinkIcon className="w-4 h-4 mr-2 text-[#3b82f6]" /> URL Target
             </label>
             <div className="flex bg-[#0f172a] border border-[#1e2d47] rounded-lg p-1 items-center">
                <input type="text" readOnly value={trackingUrl} className="bg-transparent border-none w-full text-sm font-mono text-muted-foreground px-3 outline-none" />
                <button onClick={() => copyToClipboard(trackingUrl, 'Routing URL')} className="btn-primary text-xs px-4 py-1.5 whitespace-nowrap">
                   Copy URL
                </button>
             </div>
          </div>

          {/* Pixel URL */}
          <div className="space-y-2">
             <label className="text-sm font-semibold text-foreground flex items-center">
                <QrCode className="w-4 h-4 mr-2 text-[#10b981]" /> Telemetry Pixel
             </label>
             <div className="flex bg-[#0f172a] border border-[#1e2d47] rounded-lg p-1 items-center">
                <input type="text" readOnly value={pixelUrl} className="bg-transparent border-none w-full text-sm font-mono text-muted-foreground px-3 outline-none" />
                <button onClick={() => copyToClipboard(pixelUrl, 'Pixel URL')} className="btn-secondary text-xs px-4 py-1.5 whitespace-nowrap">
                   Copy Pixel
                </button>
             </div>
             <p className="text-[11px] text-muted-foreground">Inject this as an image tag to strictly track page loads invisibly.</p>
          </div>

          {/* Email Capture Code */}
          <div className="space-y-2">
             <label className="text-sm font-semibold text-foreground flex items-center">
                <Code className="w-4 h-4 mr-2 text-[#f59e0b]" /> Email Capture Snippet (HTML)
             </label>
             <div className="relative">
                <textarea readOnly value={emailCode} rows="3" className="w-full bg-[#0f172a] border border-[#1e2d47] rounded-lg p-4 text-xs font-mono text-muted-foreground custom-scrollbar outline-none resize-none" />
                <button onClick={() => copyToClipboard(emailCode, 'HTML Snippet')} className="absolute top-3 right-3 p-1.5 rounded bg-white/5 hover:bg-white/10 text-white transition-colors">
                   <Copy className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-[#141d2e] rounded-b-xl">
           <button onClick={() => window.open(trackingUrl, '_blank')} className="btn-secondary px-4 py-2 text-sm">Test Link Matrix</button>
           <button onClick={onClose} className="btn-primary px-6 py-2 text-sm">Done</button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedLinkCardModal;
