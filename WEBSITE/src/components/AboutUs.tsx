import React from 'react';

export const AboutUs: React.FC = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start py-16 md:py-20">
      <div className="space-y-10">
        <div className="flex items-center space-x-2 text-accent text-xs font-bold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-accent"></span>
          <span>About Us</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary leading-[1.1]">
          Transform your vision with crains eye care
        </h2>

        <div className="pt-8 border-t border-gray-200 w-full max-w-sm group">
          <span className="text-xs text-gray-500 uppercase tracking-wide block mb-3">Book Appointment</span>
          <a href="tel:4805550103" className="text-3xl font-serif text-primary hover:text-accent transition-all duration-300 inline-block decoration-accent/30 underline underline-offset-8 hover:underline-offset-4">
            (480) 555-0103
          </a>
        </div>
      </div>

      <div className="space-y-10">
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed text-lg font-light">
            We're a trusted, local eye clinic committed to providing families and individuals with personalized care, genuine compassion, and professional service. Our goal is to make quality eye care accessible offering the extra attention you deserve without the extra cost, so you and your loved ones can enjoy sharper, healthier vision.
          </p>
          <div className="font-serif text-xl text-primary font-medium pt-2">
            Kristin Watson
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-8">
          <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
            {[44, 32, 68].map((id, idx) => (
              <img key={idx} src={`https://randomuser.me/api/portraits/med/men/${id}.jpg`} alt="Doctor" className="w-16 h-16 rounded-full border-[3px] border-white shadow-lg object-cover transition-transform hover:scale-110" />
            ))}
            <div className="w-16 h-16 rounded-full border-[3px] border-white bg-gray-50 shadow-lg flex items-center justify-center transition-transform hover:scale-110">
              <img src="https://randomuser.me/api/portraits/med/women/44.jpg" alt="Doctor" className="w-full h-full rounded-full object-cover opacity-80" />
            </div>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-12">
            <div className="group cursor-default">
              <h3 className="text-4xl font-serif text-primary group-hover:text-accent transition-colors">98%</h3>
              <p className="text-sm text-gray-500 mt-1">Vision Improved</p>
            </div>
            <div className="group cursor-default">
              <h3 className="text-4xl font-serif text-primary group-hover:text-accent transition-colors">9/10</h3>
              <p className="text-sm text-gray-500 mt-1">Patient Recommend</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};