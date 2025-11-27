'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  textColor?: 'white' | 'black';
}

export const Navbar: React.FC<NavbarProps> = ({ textColor = 'white' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const textColorClass = textColor === 'black' ? 'text-primary' : 'text-white';
  const textColorHoverClass = textColor === 'black' ? 'hover:text-primary/80' : 'hover:text-white/80';
  const textColorSecondaryClass = textColor === 'black' ? 'text-primary/80' : 'text-white/80';

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex items-center justify-between">
      <div className="flex items-center z-50">
        <span className={`text-2xl font-bold ${textColorClass} tracking-tight`}>Crains Vision</span>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-10 text-sm font-medium">
        <a href="#" className={`${textColorClass} ${textColorHoverClass} transition-colors`}>Home</a>
        <a href="#" className={`${textColorSecondaryClass} ${textColorHoverClass} transition-colors`}>About us</a>
        <a href="#" className={`${textColorSecondaryClass} ${textColorHoverClass} transition-colors`}>Our team</a>
        <a href="#" className={`${textColorSecondaryClass} ${textColorHoverClass} transition-colors`}>Services</a>
        <a href="#" className={`${textColorSecondaryClass} ${textColorHoverClass} transition-colors`}>Eye Health</a>
      </div>

      <div className="hidden md:block">
        <button className="bg-white text-primary px-6 py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold hover:bg-white/90 transition-all">
          Get Started
        </button>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`${textColorClass} focus:outline-none`}
        >
          {isMobileMenuOpen ? (
            <X className="w-8 h-8" />
          ) : (
            <Menu className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center space-y-8 animate-fade-in md:hidden">
          <a href="#" className="text-2xl font-sans text-primary hover:text-accent transition-colors">Home</a>
          <a href="#" className="text-xl font-sans text-primary/80 hover:text-primary transition-colors">About us</a>
          <a href="#" className="text-xl font-sans text-primary/80 hover:text-primary transition-colors">Our team</a>
          <a href="#" className="text-xl font-sans text-primary/80 hover:text-primary transition-colors">Services</a>
          <a href="#" className="text-xl font-sans text-primary/80 hover:text-primary transition-colors">Eye Health</a>
          <div className="pt-8">
            <Button variant="primary" className="px-8 py-3 text-sm uppercase tracking-wider font-semibold">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};