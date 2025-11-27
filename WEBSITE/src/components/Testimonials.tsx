import React from 'react';
import { Quote, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export const Testimonials: React.FC = () => {
  return (
    <section className="bg-beige rounded-[40px] p-8 md:p-12 lg:p-20 text-primary grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

      <div className="space-y-12 relative">
        <Quote className="w-14 h-14 text-primary/10 fill-current" />

        <div className="space-y-6">
          <p className="text-lg md:text-xl lg:text-2xl leading-relaxed font-light text-primary/90">
            I was initially nervous about my first comprehensive eye exam, but the entire team at Crains Vision made me feel completely at ease. The clinic is spotless, the staff is warm and attentive, and Dr. Sarah explained my prescription clearly with genuine care. My new glasses are perfect, stylish, and crystal clear. Crains Vision is a place I now trust completely.
          </p>
          <p className="text-accent font-semibold text-sm">Highly recommended!</p>
        </div>

        <div>
          <h4 className="font-serif text-2xl font-medium">Marie Selinger Kramer</h4>
          <div className="flex items-center mt-3">
            <span className="w-10 h-[1px] bg-primary/20 mr-3"></span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Designer, Airbnb Inc.</span>
          </div>
        </div>
      </div>

      <div className="relative h-[350px] md:h-[450px] w-full rounded-3xl overflow-hidden group cursor-pointer shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1582239433299-b1d5a7d9b9c9?q=80&w=2069&auto=format&fit=crop"
          alt="Testimonial Video Thumbnail"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center pl-1 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/90">
            <Play className="w-7 h-7 text-white fill-current" />
          </div>
        </div>

        {/* Overlay Info */}
        <div className="absolute bottom-6 left-6 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
            <img src="https://randomuser.me/api/portraits/women/65.jpg" className="w-full h-full object-cover" alt="Reviewer" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold drop-shadow-lg">See the story of</p>
            <p className="text-white/95 text-xs drop-shadow-lg">Marie Selinger Kramer</p>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute top-6 right-6 flex space-x-2">
          <button className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all duration-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-11 h-11 rounded-full bg-white text-primary flex items-center justify-center hover:bg-gray-100 transition-all duration-300 shadow-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};