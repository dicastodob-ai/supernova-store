import React from 'react';

export default function HeroBanner() {
  return (
    <section id="supernova-demo-hero" className="w-full bg-[#F9F9F8] py-8 md:py-12 border-b border-[#ECECE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Contenedor Principal con Imagen y Gradiente Overlay */}
        <div className="relative w-full h-[550px] md:h-[650px] overflow-hidden rounded-2xl md:rounded-3xl border border-[#ECECE8] shadow-2xl shadow-[#0B2545]/15">
          <img
            src="/hero-banner.jpg"
            alt="Supernova Store - Ofertas Exclusivas"
            className="w-full h-full object-cover object-top md:object-center brightness-90 transition-transform duration-700 hover:scale-[1.02]"
            loading="eager"
          />
          
          {/* Overlay Gradiente con Textos y CTA */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/90 via-[#0B2545]/40 to-transparent flex flex-col justify-end p-8 md:p-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D96B27]/20 border border-[#D96B27]/40 text-[#D96B27] text-xs font-bold uppercase tracking-wider mb-4 w-fit font-heading backdrop-blur-sm">
              ★ Human-Centric Living
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight font-heading max-w-2xl">
              Las mejores marcas, <br />
              <span className="text-[#D96B27]">precios exclusivos</span>
            </h1>

            <p className="text-slate-200 text-base md:text-lg mb-8 max-w-xl font-body leading-relaxed">
              Descubre tecnología, viajes, software y entretenimiento con ofertas directas y verificadas.
            </p>

            <div>
              <a
                href="#catalog"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#D96B27] hover:bg-[#B8551B] text-white font-heading font-bold rounded-xl md:rounded-2xl text-sm sm:text-base uppercase tracking-wider transition-all duration-300 shadow-xl shadow-[#D96B27]/30 hover:shadow-[#D96B27]/50 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Explorar Ofertas Destacadas →
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
