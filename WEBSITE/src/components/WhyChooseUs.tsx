import React from 'react';
import { Star } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
   return (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 py-16 md:py-20">
         {/* Left Image Side */}
         <div className="relative h-[650px] rounded-[40px] overflow-hidden group">
            <img
               src="https://images.unsplash.com/photo-1570222094114-28a9d88a27e6?q=80&w=1974&auto=format&fit=crop"
               alt="Advanced Optical Technology"
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Colored Overlay Effect (simulated) */}
            <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
            {/* Circle gradient flare */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
         </div>

         {/* Right Content Side */}
         <div className="flex flex-col justify-center space-y-8">
            <div className="flex items-center space-x-2 text-accent text-xs font-bold tracking-widest uppercase">
               <span className="w-2 h-2 rounded-full bg-accent"></span>
               <span>Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary leading-tight">
               Experience Crains Vision Difference in Every Sight
            </h2>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg">
               At Crains Vision, we're dedicated to delivering exceptional eye care with a personal touch. Our experienced team uses the latest technology to provide precise, comfortable, and effective solutions — from routine eye exams to advanced vision correction procedures.
            </p>

            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-3">
               {['Eye Exams', 'Glaucoma Care', 'Designer Frames', 'Contact Lenses', '12+'].map((tag, idx) => (
                  <span key={idx} className="px-5 py-3 bg-white rounded-full text-sm font-medium text-primary border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all cursor-default">
                     {tag}
                  </span>
               ))}
            </div>

            {/* Bottom Images Row */}
            <div className="flex items-end gap-4 pt-8">
               <div className="w-36 h-36 rounded-2xl overflow-hidden relative shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Doctor" />
               </div>
               <div className="w-36 h-36 rounded-2xl overflow-hidden relative shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1534008779430-c3d5e23769c3?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Happy Patient" />
               </div>
               <div className="h-36 w-36 bg-primary rounded-2xl flex flex-col items-center justify-center text-white p-3 shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-primary/90">
                  <div className="flex items-center space-x-1">
                     <span className="text-5xl font-serif">4.9</span>
                     <Star className="w-5 h-5 fill-current text-accent" />
                  </div>
                  <span className="text-white/70 text-[11px] mt-2 tracking-wide uppercase">Trusted Reviews</span>
               </div>
            </div>
         </div>
      </section>
   );
};