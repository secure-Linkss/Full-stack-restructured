import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-10">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo and Description */}
          <div className="space-y-4 xl:col-span-1">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground max-w-md">
              Advanced link tracking and analytics platform designed for performance and security.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Product
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><Link to="/features" className="text-base text-muted-foreground hover:text-primary">Features</Link></li>
                  <li><Link to="/pricing" className="text-base text-muted-foreground hover:text-primary">Pricing</Link></li>
                  <li><Link to="/dashboard" className="text-base text-muted-foreground hover:text-primary">Dashboard</Link></li>
                  <li><Link to="/link-shortener" className="text-base text-muted-foreground hover:text-primary">Shortener</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><Link to="/about" className="text-base text-muted-foreground hover:text-primary">About Us</Link></li>
                  <li><Link to="/contact" className="text-base text-muted-foreground hover:text-primary">Contact</Link></li>
                  <li><Link to="/admin" className="text-base text-muted-foreground hover:text-primary">Admin</Link></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Legal
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><Link to="/privacy" className="text-base text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-base text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                  Support
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><Link to="/tickets" className="text-base text-muted-foreground hover:text-primary">Support Tickets</Link></li>
                  <li><Link to="/notifications" className="text-base text-muted-foreground hover:text-primary">Notifications</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-base text-muted-foreground xl:text-center">
            &copy; {currentYear} Brain Link Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
