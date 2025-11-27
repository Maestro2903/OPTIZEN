import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface ConsultationProps {
   onBookingClick?: () => void;
}

export const Consultation: React.FC<ConsultationProps> = ({ onBookingClick }) => {
   return (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center py-16 md:py-20">
         <div className="relative h-[550px] w-full rounded-[40px] overflow-hidden group">
            <img
               src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop"
               alt="Eye Checkup"
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Floating Card */}
            <div className="absolute bottom-8 left-8 bg-white p-6 rounded-2xl shadow-2xl max-w-[280px] transition-all duration-500 group-hover:shadow-3xl group-hover:-translate-y-1">
               <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-lg absolute -top-12 left-0">
                     <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Doc" className="w-full h-full object-cover" />
                  </div>
               </div>
               <div className="mt-2">
                  <h4 className="font-serif text-base text-primary font-bold leading-tight mb-2">Best Optometrist Near You</h4>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed italic">"The service is superb. I'm really very satisfied with my lasik results."</p>
                  <div className="flex items-center text-accent text-xs font-bold bg-beige px-3 py-1.5 rounded-full inline-block">
                     <Star className="w-3 h-3 fill-current inline mr-1" />
                     <span>4.9 Ratings</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="flex items-center space-x-2 text-accent text-xs font-bold tracking-widest uppercase">
               <span className="w-2 h-2 rounded-full bg-accent"></span>
               <span>Zero Cost Care</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary leading-tight">
               Trusted & Free Vision Screenings
            </h2>

            <div className="flex gap-6">
               <div className="hidden md:block w-12 border-t border-primary/20 mt-3"></div>
               <p className="text-gray-600 leading-relaxed text-base md:text-lg flex-1">
                  Take control of your sight with a comprehensive assessment unlike any other. We use the latest medical innovations, including next-generation retinal imaging, glaucoma detection, and corneal mapping. Our team carefully evaluates your results to provide actionable insights for improving your eye health & preserving your vision.
               </p>
            </div>

            <div className="pt-4">
               <Link href="/book-appointment" className="inline-block bg-primary text-white px-8 py-4 rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl">Book an appointment</Link>
            </div>
         </div>
      </section>
   );
};