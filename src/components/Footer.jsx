import React from 'react';
import Logo from './Logo';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Logo and Copyright */}
            <div className="flex items-center space-x-4">
              <Logo size="sm" showText={false} />
              <div className="text-sm text-muted-foreground">
                © {currentYear} Brain Link Tracker. All rights reserved.
              </div>
            </div>


          {/* Links */}
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;