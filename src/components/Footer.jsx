import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = ({ isPublic = false }) => {
  const currentYear = new Date().getFullYear();

  if (!isPublic) {
    // Dashboard / Admin Footer — full detailed footer matching marketing pages
    return (
      <footer className="w-full border-t border-border bg-[#0b0f1a] mt-auto relative z-10">
        <div className="max-w-full px-6 pt-10 pb-6">
          {/* Top grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/">
                <Logo size="sm" />
              </Link>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Advanced telemetry and analytics for high-performance marketing teams.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">Pricing</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">Contact</Link></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">Terms of Service</Link></li>
                <li><Link to="/tickets" className="text-xs text-muted-foreground hover:text-[#10b981] transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="border-t border-border pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
            <span>&copy; {currentYear} Brain Link Tracker Inc. All rights reserved.</span>
            <span className="text-[#10b981] font-semibold text-[10px] uppercase tracking-widest">v2.0 Production</span>
          </div>
        </div>
      </footer>
    );
  }

  // Public Marketing Footer
  return (
    <footer className="border-t border-border bg-[#0b0f1a] pt-16 pb-8 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/"><Logo size="md" /></Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Advanced telemetry and analytics engineered for high-performance marketing teams. Identify users, track deeply, scale endlessly.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Brain Link Tracker Inc. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="cursor-pointer hover:text-primary transition-colors">Twitter</span>
            <span className="cursor-pointer hover:text-primary transition-colors">LinkedIn</span>
            <span className="cursor-pointer hover:text-primary transition-colors">GitHub</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
