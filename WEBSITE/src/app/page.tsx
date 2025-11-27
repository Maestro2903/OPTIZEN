import { Hero } from '@/components/Hero';
import { AboutUs } from '@/components/AboutUs';
import { Services } from '@/components/Services';
import { Doctors } from '@/components/Doctors';
import { Consultation } from '@/components/Consultation';
import { Testimonials } from '@/components/Testimonials';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { PreFooter } from '@/components/PreFooter';
import { Footer } from '@/components/Footer';

export default function Home() {
    return (
        <div className="w-full min-h-screen bg-white text-primary font-sans selection:bg-accent selection:text-white">
            {/* Hero Section - Full viewport with consistent padding */}
            <div className="p-4 sm:p-6 lg:p-8">
                <Hero />
            </div>

            {/* Other Sections */}
            <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-16 lg:space-y-32">
                <AboutUs />
                <Services />
                <Doctors />
                <Consultation />
                <Testimonials />
                <WhyChooseUs />
            </div>

            {/* Footer Sections - Full width */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-0">
                <PreFooter />
                <Footer />
            </div>
        </div>
    );
}
