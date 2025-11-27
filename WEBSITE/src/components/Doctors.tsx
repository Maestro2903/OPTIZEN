import React from 'react';

const doctors = [
  { id: 1, name: 'Dr. Emily Chen', role: 'Optometrist', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop', active: false },
  { id: 2, name: 'Dr. Sarah Rahman', role: 'Lead Ophthalmologist', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop', active: true },
  { id: 3, name: 'Dr. Michael Ross', role: 'Retinal Specialist', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop', active: false },
  { id: 4, name: 'Dr. Kenji Sato', role: 'Pediatric Optometrist', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop', active: false },
];

export const Doctors: React.FC = () => {
  return (
    <section className="py-16 md:py-20 text-center">
      <div className="flex items-center justify-center space-x-2 text-accent text-xs font-bold tracking-widest uppercase mb-6">
        <span className="w-2 h-2 rounded-full bg-accent"></span>
        <span>Doctors</span>
      </div>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mb-16">
        Our Specialist Doctors
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {doctors.map((doc) => (
          <div key={doc.id} className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 bg-gray-50">
            <img
              src={doc.img}
              alt={doc.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale-[15%] group-hover:grayscale-0"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="absolute bottom-6 left-6 right-6 text-left">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl text-white transform transition-all duration-500 group-hover:-translate-y-3 group-hover:bg-white/15">
                <h3 className="font-serif text-lg text-white">{doc.name}</h3>
                <p className="text-[11px] uppercase tracking-wider text-white/90 mt-1.5">{doc.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};