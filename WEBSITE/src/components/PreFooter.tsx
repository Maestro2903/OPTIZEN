import React from 'react';
import Link from 'next/link';

export const PreFooter: React.FC = () => {
  return (
    <section className="py-28 md:py-32 relative overflow-hidden">
      <div className="flex flex-col items-center justify-center text-center space-y-10 relative z-10 px-4 max-w-5xl mx-auto">
        <div className="text-accent mb-2 animate-spin-slow">
          {/* Simple star/sparkle SVG */}
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#EAF6FF" stroke="none" />
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" />
          </svg>
        </div>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-primary tracking-tight leading-tight">
          Let's Make Your <br /> Vision Clear
        </h2>

        <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-44 h-32 rounded-2xl overflow-hidden -rotate-12 shadow-2xl opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-500">
          <img src="https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Clear Vision" />
        </div>

        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-44 h-44 rounded-full overflow-hidden rotate-12 shadow-2xl opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-500 border-4 border-white">
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1976&auto=format&fit=crop" className="w-full h-full object-cover" alt="Happy Person" />
        </div>

        <div className="max-w-2xl text-gray-500 text-base md:text-lg leading-relaxed">
          Experience personalized, gentle, and expert eye care at Crains Vision. Whether it's a routine checkup or finding the perfect pair of glasses — we're here to help you see brighter and healthier.
        </div>
        <div className="pt-4">
          <Link href="/book-appointment" className="inline-block bg-primary text-white px-8 py-4 rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl">Book an appointment</Link>
        </div>
      </div>
    </section>
  );
};