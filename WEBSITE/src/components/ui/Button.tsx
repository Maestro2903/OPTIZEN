import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'white' | 'accent';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center px-8 py-4 rounded-full font-medium transition-all duration-300 text-sm tracking-wide";
  
  const variants = {
    // Primary Action: Solid Black
    primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10",
    // Accent (Mapped to Primary for Black Pill Buttons request): Solid Black
    accent: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10",
    // White: Used on dark backgrounds
    white: "bg-white text-primary hover:bg-gray-100 shadow-md",
    // Outline: Transparent with Black border
    outline: "border border-primary text-primary hover:bg-primary hover:text-white bg-transparent",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};