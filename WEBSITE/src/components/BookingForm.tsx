'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createAppointment } from '@/lib/api/appointments';

interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
}

interface FormData {
  full_name: string;
  email: string;
  countryCode: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  date: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  date?: string;
}

const countryCodes: CountryCode[] = [
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'US', dialCode: '+1', name: 'United States' },
  { code: 'CA', dialCode: '+1', name: 'Canada' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
  { code: 'AU', dialCode: '+61', name: 'Australia' },
  { code: 'DE', dialCode: '+49', name: 'Germany' },
  { code: 'FR', dialCode: '+33', name: 'France' },
  { code: 'IT', dialCode: '+39', name: 'Italy' },
  { code: 'ES', dialCode: '+34', name: 'Spain' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands' },
  { code: 'BE', dialCode: '+32', name: 'Belgium' },
  { code: 'CH', dialCode: '+41', name: 'Switzerland' },
  { code: 'AT', dialCode: '+43', name: 'Austria' },
  { code: 'SE', dialCode: '+46', name: 'Sweden' },
  { code: 'NO', dialCode: '+47', name: 'Norway' },
  { code: 'DK', dialCode: '+45', name: 'Denmark' },
  { code: 'FI', dialCode: '+358', name: 'Finland' },
  { code: 'PL', dialCode: '+48', name: 'Poland' },
  { code: 'IE', dialCode: '+353', name: 'Ireland' },
  { code: 'PT', dialCode: '+351', name: 'Portugal' },
  { code: 'GR', dialCode: '+30', name: 'Greece' },
  { code: 'CZ', dialCode: '+420', name: 'Czech Republic' },
  { code: 'HU', dialCode: '+36', name: 'Hungary' },
  { code: 'RO', dialCode: '+40', name: 'Romania' },
  { code: 'CN', dialCode: '+86', name: 'China' },
  { code: 'JP', dialCode: '+81', name: 'Japan' },
  { code: 'KR', dialCode: '+82', name: 'South Korea' },
  { code: 'SG', dialCode: '+65', name: 'Singapore' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia' },
  { code: 'TH', dialCode: '+66', name: 'Thailand' },
  { code: 'PH', dialCode: '+63', name: 'Philippines' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia' },
  { code: 'VN', dialCode: '+84', name: 'Vietnam' },
  { code: 'BR', dialCode: '+55', name: 'Brazil' },
  { code: 'MX', dialCode: '+52', name: 'Mexico' },
  { code: 'AR', dialCode: '+54', name: 'Argentina' },
  { code: 'CL', dialCode: '+56', name: 'Chile' },
  { code: 'CO', dialCode: '+57', name: 'Colombia' },
  { code: 'PE', dialCode: '+51', name: 'Peru' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa' },
  { code: 'EG', dialCode: '+20', name: 'Egypt' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia' },
  { code: 'IL', dialCode: '+972', name: 'Israel' },
  { code: 'TR', dialCode: '+90', name: 'Turkey' },
  { code: 'RU', dialCode: '+7', name: 'Russia' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand' },
];

export const BookingForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    gender: 'male',
    date: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateDate = (date: string): boolean => {
    if (!date) return false;
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    // Email is optional but must be valid if provided
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.date) {
      newErrors.date = 'Preferred date is required';
    } else if (!validateDate(formData.date)) {
      newErrors.date = 'Please select a future date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine country code and phone into mobile number
      const mobile = `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`;
      
      console.log('Submitting appointment request...', {
        full_name: formData.full_name.trim(),
        mobile,
        gender: formData.gender,
        appointment_date: formData.date,
      });
      
      const appointmentData = await createAppointment({
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || undefined,
        mobile: mobile,
        gender: formData.gender,
        appointment_date: formData.date,
      });

      console.log('Appointment request successful:', appointmentData);

      // Show success toast
      toast({
        title: 'Appointment Request Submitted!',
        description: 'Your appointment request has been submitted. Our team will contact you soon.',
      });

      // Redirect to success page with request ID
      if (appointmentData?.id) {
        router.push(`/book-appointment/success?id=${appointmentData.id}`);
      } else {
        console.warn('No appointment ID in response:', appointmentData);
        // Reset form if no redirect
        setFormData({
          full_name: '',
          email: '',
          countryCode: '+91',
          phone: '',
          gender: 'male',
          date: '',
        });
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      // Show error toast with detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Please try again later. If the problem persists, please contact us directly.';
      
      toast({
        title: 'Failed to submit appointment',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-primary mb-2">
            Full Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 text-base ${
              errors.full_name
                ? 'border-red-300 bg-red-50'
                : 'border-primary/10 bg-white focus:border-accent'
            }`}
            placeholder="Enter your full name"
          />
          {errors.full_name && (
            <p className="mt-2 text-sm text-red-500 animate-fade-in">{errors.full_name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
            Email Address <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 text-base ${
              errors.email
                ? 'border-red-300 bg-red-50'
                : 'border-primary/10 bg-white focus:border-accent'
            }`}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-500 animate-fade-in">{errors.email}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary mb-2">
            Phone Number <span className="text-accent">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Country Code Selector */}
            <select
              id="countryCode"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              className={`px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white border-primary/10 focus:border-accent text-primary font-medium sm:min-w-[150px] w-full sm:w-auto appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A1C1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.75rem_center] pr-9 sm:pr-10 text-base`}
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.dialCode}>
                  {country.dialCode} {country.code}
                </option>
              ))}
            </select>
            {/* Phone Number Input */}
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`flex-1 px-4 sm:px-6 py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                errors.phone
                  ? 'border-red-300 bg-red-50'
                  : 'border-primary/10 bg-white focus:border-accent'
              }`}
              placeholder="98765 43210"
            />
          </div>
          {errors.phone && (
            <p className="mt-2 text-sm text-red-500 animate-fade-in">{errors.phone}</p>
          )}
        </div>

        {/* Gender Field */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-primary mb-2">
            Gender <span className="text-accent">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white text-base appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A1C1E' d='M6 9L1 4h10z'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.75rem_center] pr-9 sm:pr-10 ${
              errors.gender
                ? 'border-red-300 bg-red-50'
                : 'border-primary/10 focus:border-accent'
            }`}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && (
            <p className="mt-2 text-sm text-red-500 animate-fade-in">{errors.gender}</p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-primary mb-2">
            Preferred Date <span className="text-accent">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 text-base ${
              errors.date
                ? 'border-red-300 bg-red-50'
                : 'border-primary/10 bg-white focus:border-accent'
            }`}
          />
          {errors.date && (
            <p className="mt-2 text-sm text-red-500 animate-fade-in">{errors.date}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 sm:pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Book Appointment</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


