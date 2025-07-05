import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from './ui/button';

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-full">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Lady's Essence</h3>
                <p className="text-sm text-primary-foreground/80">Empowering Women</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Empowering women and girls in rural Rwanda through comprehensive health education, 
              tangible support, and accessible technology.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-primary-foreground/80 hover:text-white transition-colors text-sm">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/impact" className="text-primary-foreground/80 hover:text-white transition-colors text-sm">
                  Our Impact
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-primary-foreground/80 hover:text-white transition-colors text-sm">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Our Services</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://ladys-essenced.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-white transition-colors text-sm"
                >
                  Web Platform
                </a>
              </li>
              <li>
                <Link to="/ussd-simulator" className="text-primary-foreground/80 hover:text-white transition-colors text-sm">
                  USSD Service
                </Link>
              </li>
              <li>
                <span className="text-primary-foreground/80 text-sm">
                  Mobile App (Coming Soon)
                </span>
              </li>
              <li>
                <Link to="/resources" className="text-primary-foreground/80 hover:text-white transition-colors text-sm">
                  Educational Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary-foreground/80" />
                <a 
                  href="mailto:contact@laddyseccense.org" 
                  className="text-primary-foreground/80 hover:text-white transition-colors text-sm"
                >
                  contact@laddyseccense.org
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary-foreground/80" />
                <a 
                  href="tel:+250780784924" 
                  className="text-primary-foreground/80 hover:text-white transition-colors text-sm"
                >
                  +250 780 784 924
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 text-sm">
                  Kigali, Rwanda
                </span>
              </div>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/get-involved">Support Our Mission</Link>
            </Button>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/80 text-sm">
            © 2024 Lady's Essence. All rights reserved. | 
            <span className="italic"> "When you empower a woman, you empower a generation."</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

