import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black rounded-[30px] md:rounded-[40px] text-white p-10 md:p-14 lg:p-20 relative overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-20 lg:mb-28">
        <div className="space-y-5">
          <h4 className="font-serif text-xl">Quick Links</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors duration-300">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Our Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Meet The Team</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Patient Testimonials</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Insurance & Payment Plans</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">FAQs</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Contact Us</a></li>
          </ul>
        </div>
        <div className="space-y-5">
          <h4 className="font-serif text-xl">Services We Offer</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors duration-300">Eye Exams</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Contact Lenses</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Pediatric Vision</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Dry Eye Treatment</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Laser Consultation</a></li>
          </ul>
        </div>
        <div className="space-y-5">
          <h4 className="font-serif text-xl">Account</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors duration-300">Sign Up</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Log In</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Reset Password</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">My Account</a></li>
          </ul>
        </div>
        <div className="space-y-5">
          <h4 className="font-serif text-xl">Social Media</h4>
          <ul className="space-y-3 text-sm text-white/60">
            <li><a href="#" className="hover:text-white transition-colors duration-300">Facebook</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">Instagram</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">LinkedIn</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">You tube</a></li>
            <li><a href="#" className="hover:text-white transition-colors duration-300">X(Twitter)</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-12">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8">
          <div className="w-full text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-serif mb-6 md:mb-10 leading-tight">Your Vision Deserves The Best</h2>
            <div className="flex flex-col md:flex-row justify-between items-center w-full border-t border-white/5 pt-8 mt-8 lg:border-none lg:pt-0 lg:mt-0">
              <p className="font-serif text-2xl tracking-wide">Crains Vision</p>
              <p className="text-xs text-white/40 mt-4 md:mt-0">© 2025 Copyright Crains Vision. All Right Reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};