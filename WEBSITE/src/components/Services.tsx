'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Service } from '../types';

const servicesData: Service[] = [
  {
    id: 's1',
    number: '01',
    title: 'Comprehensive Eye Exams',
    description: 'Thorough assessment of your visual health using the latest diagnostic technology to detect issues early and ensure crystal clear vision.',
  },
  {
    id: 's2',
    number: '02',
    title: 'Contact Lens Fitting',
    description: 'Find the perfect fit with our wide range of soft, rigid, and specialty contact lenses tailored for your lifestyle and comfort.',
  },
  {
    id: 's3',
    number: '03',
    title: 'Glaucoma Management',
    description: 'Expert monitoring and treatment plans to preserve your vision and manage intraocular pressure effectively.',
  },
  {
    id: 's4',
    number: '04',
    title: 'Designer Eyewear',
    description: 'Explore our curated collection of stylish frames and premium lenses to suit your unique look and specific vision needs.',
  },
];

export const Services: React.FC = () => {
  const [activeService, setActiveService] = useState<string>('s1');

  return (
    <section className="bg-beige rounded-[40px] p-8 sm:p-10 md:p-14 lg:p-20 text-primary grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 overflow-hidden relative">
      <div className="relative z-10 space-y-10 md:space-y-12">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-accent text-xs font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            <span>Our Service</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif leading-tight max-w-md text-primary">
            Caring for your vision with every service
          </h2>
          <div className="pt-2">
            <Link href="/book-appointment" className="inline-block bg-primary text-white px-8 py-4 rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl">Book an appointment</Link>
          </div>
        </div>

        <div className="space-y-2">
          {servicesData.map((service) => (
            <div
              key={service.id}
              className={`border-b border-primary/10 pb-6 pt-5 cursor-pointer transition-all duration-500 hover:border-primary/30 ${activeService === service.id ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
              onClick={() => setActiveService(service.id)}
            >
              <div className="flex items-baseline space-x-4 md:space-x-8">
                <span className="text-sm font-medium font-mono text-accent transition-all">({service.number})</span>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-serif mb-2 text-primary transition-colors">{service.title}</h3>
                  {activeService === service.id && (
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-md animate-fade-in mt-3">
                      {service.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-[350px] sm:h-[450px] lg:h-auto rounded-3xl overflow-hidden hidden md:block shadow-2xl group">
        <img
          src="https://images.unsplash.com/photo-1590393083332-602928889218?q=80&w=2070&auto=format&fit=crop"
          alt="Optician Working"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md w-14 h-14 rounded-full border border-white/20 transition-all group-hover:scale-110"></div>
      </div>
    </section>
  );
};