import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BookingForm } from '@/components/BookingForm';
import { ArrowLeft } from 'lucide-react';

export default function BookAppointmentPage() {
  return (
    <div className="w-full min-h-screen bg-white text-primary font-sans">
      {/* Header Section with Navbar */}
      <div className="relative w-full pt-20 sm:pt-24 pb-8 sm:pb-12 mb-6 sm:mb-8">
        <Navbar textColor="black" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 sm:space-y-6 max-w-4xl">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-primary/70 hover:text-primary transition-colors group text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-primary leading-[1.05] tracking-tight">
              Book Your <br />
              <span className="text-primary">Appointment</span>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              Schedule your visit with our expert eye care team. We're here to help you see clearly and maintain optimal eye health.
            </p>
          </div>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-24">
        <div className="bg-beige rounded-[30px] sm:rounded-[40px] p-6 sm:p-8 md:p-10 lg:p-14 xl:p-20">
          <div className="space-y-4 sm:space-y-6 md:space-y-8 mb-8 sm:mb-10 md:mb-12">
            <div className="flex items-center space-x-2 text-accent text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span>Appointment Request</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-primary leading-tight max-w-2xl">
              Let's schedule your visit
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg max-w-2xl">
              Fill out the form below and we'll get back to you to confirm your appointment time. All fields marked with <span className="text-accent">*</span> are required.
            </p>
          </div>

          <BookingForm />
        </div>

        {/* Additional Information */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center md:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-beige rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-3 sm:mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-primary mb-1.5 sm:mb-2">Call Us</h3>
            <a
              href="tel:4805550103"
              className="text-gray-600 hover:text-accent transition-colors text-sm sm:text-base"
            >
              (480) 555-0103
            </a>
          </div>

          <div className="text-center md:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-beige rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-3 sm:mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-primary mb-1.5 sm:mb-2">Office Hours</h3>
            <p className="text-gray-600 text-sm sm:text-base">Mon - Fri: 9:00 AM - 6:00 PM</p>
            <p className="text-gray-600 text-sm sm:text-base">Sat: 10:00 AM - 4:00 PM</p>
          </div>

          <div className="text-center md:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-beige rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-3 sm:mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-primary mb-1.5 sm:mb-2">Visit Us</h3>
            <p className="text-gray-600 text-sm sm:text-base">123 Vision Street</p>
            <p className="text-gray-600 text-sm sm:text-base">Phoenix, AZ 85001</p>
          </div>
        </div>
      </div>
    </div>
  );
}

