'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CheckCircle, Calendar, Clock, User, FileText, ArrowLeft } from 'lucide-react';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('id');
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      const fetchAppointment = async () => {
        try {
          // Fetch directly from Supabase (RLS allows public reads)
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          
          const { data: appointmentRequest, error } = await supabase
            .from('appointment_requests')
            .select('*')
            .eq('id', appointmentId)
            .single();
          
          if (error) {
            console.error('Error fetching appointment:', error);
          } else if (appointmentRequest) {
            setAppointment({
              id: appointmentRequest.id,
              status: appointmentRequest.status,
              full_name: appointmentRequest.full_name,
              email: appointmentRequest.email,
              mobile: appointmentRequest.mobile,
              appointment_date: appointmentRequest.appointment_date,
              start_time: appointmentRequest.start_time,
              end_time: appointmentRequest.end_time,
              type: appointmentRequest.type,
              notes: appointmentRequest.notes || appointmentRequest.reason,
            });
          }
        } catch (error) {
          console.error('Error fetching appointment:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAppointment();
    } else {
      setLoading(false);
    }
  }, [appointmentId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    // Extract HH:MM from HH:MM:SS format
    return time.slice(0, 5);
  };

  return (
    <div className="w-full min-h-screen bg-white text-primary font-sans">
      {/* Header Section with Navbar */}
      <div className="relative w-full pt-20 sm:pt-24 pb-8 sm:pb-12">
        <Navbar textColor="black" />
      </div>

      {/* Success Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-24">
        <div className="bg-beige rounded-[30px] sm:rounded-[40px] p-6 sm:p-8 md:p-10 lg:p-14 xl:p-20 max-w-3xl mx-auto">
          {/* Success Icon and Title */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-primary mb-2 sm:mb-4 leading-tight">
              {appointment?.status === 'pending' 
                ? 'Appointment Request Submitted!'
                : 'Appointment Booked Successfully!'}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              {appointment?.status === 'pending'
                ? 'Your appointment request has been submitted. Our team will contact you soon to confirm your appointment.'
                : 'Your appointment has been confirmed. We look forward to seeing you!'}
            </p>
          </div>

          {/* Appointment Details */}
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Loading appointment details...</p>
            </div>
          ) : appointment ? (
            <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-beige rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Patient</p>
                      <p className="font-serif text-base sm:text-lg font-semibold text-primary">
                        {appointment.full_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-beige rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Date</p>
                      <p className="font-serif text-base sm:text-lg font-semibold text-primary">
                        {formatDate(appointment.appointment_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-beige rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Time</p>
                      <p className="font-serif text-base sm:text-lg font-semibold text-primary">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-beige rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Type</p>
                      <p className="font-serif text-base sm:text-lg font-semibold text-primary capitalize">
                        {appointment.type || 'Consultation'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="bg-white/80 border border-primary/10 rounded-2xl p-4 sm:p-6">
                  <p className="text-xs sm:text-sm font-semibold text-primary mb-2">Notes</p>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              )}

              {appointment.email && (
                <div className="bg-white/80 border border-primary/10 rounded-2xl p-4 sm:p-6">
                  <p className="text-xs sm:text-sm font-semibold text-primary mb-2">Contact Email</p>
                  <p className="text-sm sm:text-base text-gray-700">{appointment.email}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-600">Appointment details not available</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-primary/20 text-primary rounded-full font-medium hover:bg-beige transition-all text-sm sm:text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Back to Home
            </Link>
            <Link
              href="/book-appointment"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Book Another Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

