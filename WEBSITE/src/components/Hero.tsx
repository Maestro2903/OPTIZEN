import React from 'react';
import Link from 'next/link';
import { Navbar } from './Navbar';

export const Hero: React.FC = () => {
    return (
        <div className="relative w-full h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] rounded-[40px] overflow-hidden flex flex-col">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/hero-bg.jpg"
                    alt="Eye Care Background"
                    className="w-full h-full object-cover"
                />
            </div>

            <Navbar />

            <div className="flex-1 flex items-center px-6 md:px-12 lg:px-16 relative z-10">
                {/* Left Content */}
                <div className="space-y-8 max-w-2xl">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-white leading-[1.05] tracking-tight">
                        Trusted <br />
                        <span className="text-white">Eye Care</span>
                    </h1>

                    <p className="text-white/90 text-lg leading-relaxed max-w-md">
                        Caring & local eye care for families and individuals, where compassion meets clarity, without the high costs.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link href="/book-appointment" className="bg-white text-primary px-8 py-4 rounded-full font-medium hover:bg-white/90 transition-all shadow-xl shadow-black/20 text-center">
                            Book Appointment
                        </Link>
                        <button className="bg-transparent text-white border border-white/60 px-8 py-4 rounded-full font-medium hover:border-white hover:bg-white/10 transition-all">
                            View Services
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};