import React from 'react';

export default function HeroBanner() {
  return (
    <section className="relative w-full bg-[#F9F9F8] py-12 md:py-16 border-b border-[#ECECE8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Bloque Superior: Encabezados y Llamada a la Acción */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D96B27]/10 border border-[#D96B27]/30 text-[#D96B27] text-xs font-bold uppercase tracking-wider mb-4">
            ★ Human-Centric Living
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B2545] tracking-tight leading-tight mb-4 font-heading">
            Design &amp; Technology for Real Life
          </h1>

          <p className="text-base sm:text-lg text-[#5C6479] font-body max-w-2xl mx-auto mb-8 leading-relaxed">
            Una cuidada selección de dispositivos, accesorios y experiencias diseñadas para integrarse de forma natural en tu espacio.
          </p>

          <a
            href="#catalog"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#D96B27] hover:bg-[#B8551B] text-white font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 shadow-xl shadow-[#D96B27]/25 hover:shadow-[#D96B27]/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Explore the Collection
          </a>
        </div>

        {/* Bloque Central: Fotografía Protagonista de la Maqueta */}
        <div className="relative mx-auto max-w-5xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-[#0B2545]/10 border border-[#ECECE8] bg-white group">
          <img
            src="/images/hero-supernova-showcase.jpg"
            alt="Supernova Collection Showcase"
            className="w-full h-auto max-h-[520px] object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
            loading="eager"
          />
        </div>

      </div>
    </section>
  );
}
