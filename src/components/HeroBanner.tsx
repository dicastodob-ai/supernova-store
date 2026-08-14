import React from 'react';

export default function HeroBanner() {
  return (
    <section id="supernova-demo-hero" className="relative w-full bg-[#F9F9F8] border-b border-[#ECECE8]">
      <div className="py-12 px-5 sm:px-6 lg:px-8 max-w-[1100px] mx-auto text-center font-body">
        
        {/* Bloque Superior: Encabezados y Llamada a la Acción */}
        <div className="inline-block bg-[#D96B27]/10 border border-[#D96B27]/30 text-[#D96B27] text-[11px] font-bold uppercase tracking-[0.08em] px-4 py-1.5 rounded-full mb-4 font-heading">
          ★ Human-Centric Living
        </div>

        <h1 className="text-[#0B2545] text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4 font-heading">
          Design &amp; Technology for Real Life
        </h1>

        <p className="text-[#5C6479] text-[clamp(0.95rem,1.5vw,1.15rem)] max-w-[620px] mx-auto mb-8 leading-[1.6]">
          Una cuidada selección de dispositivos, accesorios y experiencias diseñadas para integrarse de forma natural en tu espacio.
        </p>

        <div className="mb-11">
          <a
            href="#catalog"
            className="inline-block bg-[#D96B27] hover:bg-[#B8551B] text-white font-heading font-bold text-sm uppercase tracking-[0.06em] px-9 py-4 rounded-full shadow-[0_10px_25px_rgba(217,107,39,0.3)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Explore the Collection
          </a>
        </div>

        {/* Bloque Central: Fotografía Protagonista de la Maqueta */}
        <div className="max-w-[960px] mx-auto rounded-[20px] overflow-hidden border border-[#ECECE8] shadow-[0_20px_40px_rgba(11,37,69,0.08)] bg-white group">
          <img
            src="/images/hero-supernova-showcase.jpg"
            alt="Supernova Collection"
            className="w-full h-auto max-h-[480px] object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
            loading="eager"
          />
        </div>

      </div>
    </section>
  );
}
