import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = ({ isPublic = false }) => {
  const currentYear = new Date().getFullYear();

  if (!isPublic) {
    // Dashboard Minimal Footer
    return (
      <footer className="w-full border-t border-border bg-[rgba(20,29,46,0.5)] mt-auto py-4 px-6 relative z-10 hidden sm:block">
        <div className="flex justify-between items-center text-xs text-muted-foreground w-full">
          <div>
            &copy; {currentYear} <span className="font-semibold text-foreground">Brain Link Tracker</span>. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
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
            <Logo size="md" />
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
