'use client';

import React, { useState } from 'react';

// Tipos para los paquetes de oferta
interface BundleOption {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  units: number;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  savings: number;
  shipping: string;
  includes: string[];
  ctaText: string;
  isPopular?: boolean;
  affiliateUrl: string;
}

const BUNDLE_OPTIONS: BundleOption[] = [
  {
    id: 'single',
    name: '1x Unidad Kinship SPF 32',
    tagline: 'Tratamiento Diario Individual (50ml / 1.75 oz)',
    units: 1,
    originalPrice: 28.0,
    salePrice: 28.0,
    discountPercentage: 0,
    savings: 0,
    shipping: 'Envío estándar ($4.95 o Gratis en +$40)',
    includes: [
      '1x Self Reflect Probiotic Moisturizing Sunscreen SPF 32 (50ml)',
      'Garantía de Satisfacción 30 Días'
    ],
    ctaText: 'COMPRAR 1 UNIDAD — $28.00',
    isPopular: false,
    affiliateUrl: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/getkinship_1x/https://lovekinship.com/search?q=Self+Reflect'
  },
  {
    id: 'duo',
    name: '2x Pack Dúo (Más Vendido)',
    tagline: 'Doble Protección para Rostro y Bolso / Pareja',
    badge: '⭐ MÁS VENDIDO — AHORRA 15%',
    badgeColor: 'bg-[#FF5A36] text-white',
    units: 2,
    originalPrice: 56.0,
    salePrice: 47.6,
    discountPercentage: 15,
    savings: 8.4,
    shipping: '⚡ Envío Gratis Prioritario',
    includes: [
      '2x Self Reflect Probiotic Sunscreen SPF 32 (50ml c/u)',
      '15% Descuento Directo Aplicado',
      'Envío Gratis Express',
      'Garantía Total de Reembolso 30 Días'
    ],
    ctaText: 'RECLAMAR PACK DÚO (15% OFF) — $47.60',
    isPopular: true,
    affiliateUrl: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/getkinship_2x/https://lovekinship.com/search?q=Self+Reflect'
  },
  {
    id: 'routine',
    name: '1x Kit Rutina Completa 4 Pasos',
    tagline: 'Transformación Total: Limpiador + Sérum + Crema + SPF',
    badge: '💎 MÁXIMO AHORRO — 25% OFF',
    badgeColor: 'bg-[#0B2545] text-white',
    units: 4,
    originalPrice: 112.0,
    salePrice: 84.0,
    discountPercentage: 25,
    savings: 28.0,
    shipping: '⚡ Envío Gratis Prioritario + Neceser Eco de Regalo',
    includes: [
      '1x Self Reflect Probiotic Sunscreen SPF 32 (50ml)',
      '1x Naked Papaya Gentle Enzyme Face Cleanser (100ml)',
      '1x Brightwave 10% Vitamin C + Peptide Eye Cream / Serum',
      '1x Supermello Hydrating Gel-Cream Moisturizer (50ml)',
      'Neceser de Viaje Sostenible de Regalo',
      'Envío Gratis Express + Garantía 30 Días'
    ],
    ctaText: 'OBTENER KIT RUTINA (25% OFF) — $84.00',
    isPopular: false,
    affiliateUrl: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/getkinship_kit/https://lovekinship.com/collections/best-sellers'
  }
];

const GALLERY_IMAGES = [
  {
    id: 1,
    title: 'Kinship Self Reflect SPF 32',
    subtitle: 'Botella con dosificador & fórmula mineral',
    src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    alt: 'Kinship Self Reflect Probiotic Moisturizing Sunscreen SPF 32'
  },
  {
    id: 2,
    title: 'Textura Sedosa & Glow Natural',
    subtitle: 'Sin capa blanca, acabado iluminado y suave',
    src: 'https://images.unsplash.com/photo-1608248597359-0097728f32bc?auto=format&fit=crop&w=1000&q=80',
    alt: 'Textura en piel del protector solar Kinship Self Reflect'
  },
  {
    id: 3,
    title: '100% Mineral & Reef Safe',
    subtitle: 'Filtro físico de Óxido de Zinc no nano 22.4%',
    src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80',
    alt: 'Ingredientes minerales limpios y respetuosos con el océano'
  },
  {
    id: 4,
    title: 'Rutina Completa Kinship',
    subtitle: 'Kit sinérgico para una barrera cutánea radiante',
    src: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=80',
    alt: 'Gama de productos y rutina de cuidado facial Kinship'
  }
];

const COMPARISON_DATA = [
  {
    feature: 'Acabado en la Piel',
    kinship: 'Glow saludable, transparente y sin sensación pegajosa',
    traditional: 'Capa blanca pastosa o acabado grasoso y pesado',
    kinshipWin: true
  },
  {
    feature: 'Filtros Solares',
    kinship: '100% Mineral (Óxido de Zinc No-Nano 22.4%)',
    traditional: 'Filtros químicos sintéticos (Avobenzona, Oxibenzona)',
    kinshipWin: true
  },
  {
    feature: 'Salud de la Barrera Cutánea',
    kinship: 'Reforzada con complejo probiótico patentado Kinbiome™',
    traditional: 'Sin probióticos; puede alterar el microbioma',
    kinshipWin: true
  },
  {
    feature: 'Impacto en Arrecifes de Coral',
    kinship: '100% Reef-Safe certificado (Sin químicos dañinos)',
    traditional: 'Contiene químicos prohibidos en reservas marinas',
    kinshipWin: true
  },
  {
    feature: 'Aroma y Sensación',
    kinship: 'Sutil aroma a vainilla natural delicioso y relajante',
    traditional: 'Fuerte olor sintético a químico de playa',
    kinshipWin: true
  },
  {
    feature: 'Pieles Sensibles y Tendencia Acnéica',
    kinship: 'No comedogénico, hipoalergénico y testado por dermatólogos',
    traditional: 'Frecuente causa de brotes, ardor en ojos o irritación',
    kinshipWin: true
  }
];

const FAQS = [
  {
    q: '¿Deja capa blanca (white cast) en tonos de piel morenos u oscuros?',
    a: '¡Rotundamente no! A diferencia de los protectores minerales convencionales que dejan un residuo blanquecino o grisáceo, Kinship Self Reflect está formulado con Óxido de Zinc micronizado no-nano y un toque botánico de cúrcuma que se funde al instante con cualquier tono de piel, aportando un brillo natural e invisible (sheer glow).'
  },
  {
    q: '¿Puedo usar Kinship Self Reflect debajo del maquillaje como primer?',
    a: 'Es uno de sus usos favoritos. Gracias a su textura ligera y su acabado hidratante sedoso, actúa como una prebase perfecta que alisa la textura del rostro, retiene la hidratación y no hace pelotillas ("pilling") cuando aplicas corrector, base o polvos encima.'
  },
  {
    q: '¿Qué es el complejo probiótico Kinbiome™ y qué beneficios aporta?',
    a: 'Kinbiome™ es un fermento probiótico derivado de plantas patentado por Kinship. Apoya la microbiota natural de la piel, sella la humedad esencial, calma rojeces y fortalece la barrera cutánea frente a la polución urbana y el estrés ambiental.'
  },
  {
    q: '¿Es seguro para pieles muy sensibles, con rosácea o acné?',
    a: 'Absolutamente. El óxido de zinc es el ingrediente mineral de referencia médica para calmar pieles reactivas e inflamadas. La fórmula no obstruye los poros (no comedogénica), está libre de fragancias sintéticas, parabenos, sulfatos y ftalatos, y ha sido dermatológicamente probada.'
  },
  {
    q: '¿Es realmente Reef-Safe y respetuoso con el océano?',
    a: 'Sí, 100%. Cumple con los estándares más exigentes de Hawái y los arrecifes de todo el mundo. No contiene oxibenzona, octinoxato ni nanopartículas que puedan blanquear los corales o dañar la fauna marina. Además, el envase está fabricado con plástico reciclado retirado del océano (OWP).'
  },
  {
    q: '¿Cuál es la política de garantía y envíos?',
    a: 'Disfrutas de 30 días de garantía de satisfacción total. Si por cualquier motivo no te enamoras de tu producto, puedes solicitar el reembolso íntegro de tu compra. Los pedidos con Pack Dúo y Kit Rutina disfrutan además de Envío Gratis Prioritario.'
  }
];

const REVIEWS = [
  {
    id: 1,
    author: 'Camila R.',
    verified: true,
    rating: 5,
    title: '¡El mejor protector solar mineral que he probado en mi vida!',
    text: 'He probado decenas de protectores minerales y todos me dejaban la cara como un fantasma o me sacaban granitos. Kinship se absorbe en segundos, huele delicioso a vainilla suave y deja una luminosidad increíble sin grasa. ¡Ya voy por mi tercer bote!',
    skinType: 'Piel mixta con tendencia acnéica',
    age: '28 años',
    packBought: '2x Pack Dúo'
  },
  {
    id: 2,
    author: 'Elena M.',
    verified: true,
    rating: 5,
    title: 'Perfecto para piel con rosácea y debajo del maquillaje',
    text: 'Tengo rosácea y casi todo me arde. Este protector con probióticos y cúrcuma me calma la rojez al instante. No hace falta usar primer de maquillaje porque deja la piel lisa y suave como la seda.',
    skinType: 'Piel sensible y reactiva',
    age: '34 años',
    packBought: 'Kit Rutina Completa'
  },
  {
    id: 3,
    author: 'Sofía V.',
    verified: true,
    rating: 5,
    title: 'Cero capa blanca en piel morena. ¡Magia pura!',
    text: 'Tenía miedo por el óxido de zinc, pero en cuanto lo extiendes desaparece y solo queda un glow precioso. Me encanta que sea reef-safe y que el packaging use plástico reciclado del océano.',
    skinType: 'Piel seca / Tono medio',
    age: '31 años',
    packBought: '2x Pack Dúo'
  }
];

export default function KinshipPage() {
  const [selectedBundleId, setSelectedBundleId] = useState<string>('duo');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const selectedBundle = BUNDLE_OPTIONS.find(b => b.id === selectedBundleId) || BUNDLE_OPTIONS[1];

  const handleSelectBundle = (bundleId: string) => {
    setSelectedBundleId(bundleId);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] text-[#1B2430] font-sans antialiased selection:bg-[#FF8E72] selection:text-white">
      
      {/* 1. TOP URGENCY ANNOUNCEMENT BAR */}
      <div className="bg-[#0B2545] text-white text-xs md:text-sm font-semibold py-2.5 px-4 text-center tracking-wide sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#FF5A36] animate-ping" />
        <span>⚡ <strong>OFERTA ESPECIAL D2C:</strong> 15% OFF EN PACK DÚO & 25% OFF EN RUTINA COMPLETA • ENVÍO GRATIS DISPONIBLE</span>
      </div>

      {/* 2. D2C MINIMALIST BRAND HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#F0EBE6] py-3.5 px-4 sm:px-8 sticky top-[37px] z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-[#FF5A36] font-heading">
              kinship<span className="text-[#0B2545]">.</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFF0EC] text-[#FF5A36] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#FFD5CC]">
              ✓ Verified D2C Partner
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 text-xs font-semibold text-[#5C6479]">
              <div className="flex text-[#FFB800] text-sm">★★★★★</div>
              <span className="text-[#1B2430] font-bold">4.9/5</span>
              <span>(+2.500 reseñas)</span>
            </div>
            <a
              href="#ofertas"
              className="bg-[#0B2545] hover:bg-[#FF5A36] text-white text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 shadow-sm"
            >
              Ver Ofertas Disponibles ↓
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO CRO SECTION */}
      <section className="py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: INTERACTIVE IMAGE GALLERY */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-[#EFE8E1] shadow-lg aspect-square">
              {/* Product Badge Pill */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="bg-[#FF5A36] text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  Allure Best of Beauty Winner
                </span>
                <span className="bg-white/95 backdrop-blur-sm text-[#0B2545] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-[#EAE4DC] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  100% Mineral Zinc Oxide SPF 32
                </span>
              </div>

              {/* White Cast Zero Badge */}
              <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-[#F2ECE4] text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF5A36]">Acabado Invisible</p>
                <p className="text-xs font-bold text-[#0B2545]">Cero Capa Blanca ✨</p>
              </div>

              <img
                src={GALLERY_IMAGES[activeImageIndex].src}
                alt={GALLERY_IMAGES[activeImageIndex].alt}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* Thumbnail Selector */}
            <div className="grid grid-cols-4 gap-3">
              {GALLERY_IMAGES.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 bg-white ${
                    activeImageIndex === idx
                      ? 'border-[#FF5A36] shadow-md ring-2 ring-[#FF5A36]/30'
                      : 'border-[#E8E1D9] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>

            {/* Micro Highlights Below Gallery */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-medium text-[#5C6479]">
              <div className="p-2.5 rounded-xl bg-white border border-[#EFE8E1] shadow-2xs">
                <p className="font-bold text-[#0B2545]">🌊 Reef Safe</p>
                <p className="text-[11px] text-[#7E8B9B]">Sin Oxibenzona</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EFE8E1] shadow-2xs">
                <p className="font-bold text-[#0B2545]">✨ Kinbiome™</p>
                <p className="text-[11px] text-[#7E8B9B]">Probiótico activo</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EFE8E1] shadow-2xs">
                <p className="font-bold text-[#0B2545]">🐰 Leaping Bunny</p>
                <p className="text-[11px] text-[#7E8B9B]">100% Cruelty Free</p>
              </div>
            </div>
          </div>

          {/* RIGHT: CONVERSION BUY BOX & BUNDLE SELECTOR */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            
            {/* Social Proof & Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-[#FFB800] text-sm">★★★★★</div>
                <span className="text-xs font-bold text-[#0B2545]">4.9 / 5.0</span>
                <span className="text-xs text-[#5C6479]">(+2.548 Reseñas Verificadas)</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B2545] tracking-tight leading-tight">
                Kinship Self Reflect Probiotic Moisturizing Sunscreen SPF 32
              </h1>

              <p className="text-sm sm:text-base text-[#5C6479] mt-3 leading-relaxed">
                El protector solar mineral hidratante premiado que no deja capa blanca. Formulado con <strong className="text-[#0B2545]">Óxido de Zinc no nano (22.4%)</strong>, complejo probiótico <strong className="text-[#0B2545]">Kinbiome™</strong> y cúrcuma para proteger, calmar e iluminar tu piel con un glow natural irresistible.
              </p>
            </div>

            {/* Quick Benefits Checklist */}
            <div className="bg-[#FFF8F5] border border-[#FFE2D6] rounded-2xl p-4 text-xs sm:text-sm space-y-2 text-[#2D3748]">
              <div className="flex items-start gap-2.5">
                <span className="text-[#FF5A36] font-bold text-base leading-none">✓</span>
                <span><strong>Protección Solar 100% Mineral:</strong> SPF 32 de amplio espectro contra rayos UVA/UVB y luz azul.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[#FF5A36] font-bold text-base leading-none">✓</span>
                <span><strong>Complejo Probiótico Kinbiome™:</strong> Refuerza y equilibra la barrera de hidratación cutánea.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[#FF5A36] font-bold text-base leading-none">✓</span>
                <span><strong>Cúrcuma Antioxidante:</strong> Calma rojeces e inflamación, aportando luminosidad al instante.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[#FF5A36] font-bold text-base leading-none">✓</span>
                <span><strong>Cero Efecto Fantasma:</strong> Se funde en segundos sin residuo blanco. Ideal como prebase de maquillaje.</span>
              </div>
            </div>

            {/* INTERACTIVE BUNDLE SELECTOR */}
            <div id="ofertas" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#0B2545]">
                  Paso 1: Selecciona Tu Pack / Oferta
                </label>
                <span className="text-xs font-semibold text-[#FF5A36]">
                  Ahorro de hasta el 25%
                </span>
              </div>

              <div className="space-y-3">
                {BUNDLE_OPTIONS.map((bundle) => {
                  const isSelected = selectedBundleId === bundle.id;
                  return (
                    <div
                      key={bundle.id}
                      onClick={() => handleSelectBundle(bundle.id)}
                      className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border-2 ${
                        isSelected
                          ? 'border-[#FF5A36] bg-[#FFF9F6] shadow-md ring-2 ring-[#FF5A36]/20'
                          : 'border-[#EAE3DA] bg-white hover:border-[#FFB29E]'
                      }`}
                    >
                      {/* Top Badge */}
                      {bundle.badge && (
                        <div className="absolute -top-3 right-4">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm ${bundle.badgeColor}`}>
                            {bundle.badge}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Radio circle */}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isSelected ? 'border-[#FF5A36] bg-[#FF5A36]' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div>
                            <p className="font-extrabold text-sm sm:text-base text-[#0B2545]">
                              {bundle.name}
                            </p>
                            <p className="text-xs text-[#5C6479]">
                              {bundle.tagline}
                            </p>
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="text-right">
                          <div className="flex items-baseline gap-1.5 justify-end">
                            {bundle.originalPrice > bundle.salePrice && (
                              <span className="text-xs line-through text-[#8D99AE]">
                                ${bundle.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span className="text-lg sm:text-xl font-black text-[#0B2545]">
                              ${bundle.salePrice.toFixed(2)}
                            </span>
                          </div>
                          {bundle.savings > 0 && (
                            <span className="text-[11px] font-bold text-[#FF5A36] block">
                              Ahorras ${bundle.savings.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Included Items Details */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-[#F2E8DF] text-xs text-[#4A5568] space-y-1">
                          <p className="font-bold text-[#0B2545]">Incluye:</p>
                          <ul className="space-y-1 pl-1">
                            {bundle.includes.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] font-semibold text-[#FF5A36] pt-1">
                            {bundle.shipping}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DYNAMIC HIGH-CONVERTING CTA BUTTON */}
            <div className="pt-2 space-y-3">
              <a
                href={selectedBundle.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="w-full bg-[#FF5A36] hover:bg-[#E63E19] text-white font-extrabold text-base sm:text-lg py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-[#FF5A36]/30 flex flex-col items-center justify-center gap-1 text-center transform active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span>{selectedBundle.ctaText}</span>
                  <span className="text-xl">➔</span>
                </div>
                <span className="text-xs font-medium text-white/90">
                  {selectedBundle.discountPercentage > 0
                    ? `Descuento del ${selectedBundle.discountPercentage}% aplicado automáticamente en checkout oficial`
                    : 'Compra directa en la tienda oficial Kinship vía CJ'}
                </span>
              </a>

              {/* Trust & Guarantee Micro-Proof */}
              <div className="space-y-2 text-center text-xs text-[#5C6479]">
                <p className="flex items-center justify-center gap-2 font-medium">
                  <span>🔒 Pago 100% Seguro SSL 256-bit</span>
                  <span>•</span>
                  <span>🛡️ 30 Días Garantía de Devolución</span>
                  <span>•</span>
                  <span>⚡ Stock Disponible</span>
                </p>

                {/* Payment Icons Simulation */}
                <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-[#718096] opacity-90">
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">Visa</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">Mastercard</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">Amex</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">Apple Pay</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-semibold">PayPal</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. TRUST BADGES & PRESS BANNER */}
      <section className="bg-white border-y border-[#ECE5DD] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-[#8D99AE] mb-6">
            Galardonado y recomendado por las principales publicaciones de belleza
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-[#0B2545] font-serif font-black text-lg sm:text-xl opacity-75">
            <span>allure</span>
            <span>VOGUE</span>
            <span>BYRDIE</span>
            <span>ELLE</span>
            <span>GLAMOUR</span>
            <span>REFINERY29</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[#F2ECE5]">
            <div className="text-center p-3">
              <span className="text-2xl mb-1 block">⭐</span>
              <p className="font-extrabold text-sm text-[#0B2545]">4.9 / 5 Estrellas</p>
              <p className="text-xs text-[#5C6479]">+2.500 opiniones reales</p>
            </div>
            <div className="text-center p-3">
              <span className="text-2xl mb-1 block">🌿</span>
              <p className="font-extrabold text-sm text-[#0B2545]">100% Mineral Zinc</p>
              <p className="text-xs text-[#5C6479]">Filtro físico no nano</p>
            </div>
            <div className="text-center p-3">
              <span className="text-2xl mb-1 block">🐠</span>
              <p className="font-extrabold text-sm text-[#0B2545]">100% Reef Safe</p>
              <p className="text-xs text-[#5C6479]">Protege corales y océanos</p>
            </div>
            <div className="text-center p-3">
              <span className="text-2xl mb-1 block">🐰</span>
              <p className="font-extrabold text-sm text-[#0B2545]">Leaping Bunny</p>
              <p className="text-xs text-[#5C6479]">Cruelty-Free & Vegano</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPARISON TABLE: KINSHIP VS TRADITIONAL SUNSCREENS */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF5A36] bg-[#FFF0EC] px-3 py-1 rounded-full border border-[#FFD5CC]">
            Por qué Kinship es Superior
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] mt-3">
            Kinship Self Reflect vs Protectores Solares Tradicionales
          </h2>
          <p className="text-sm text-[#5C6479] mt-2">
            Descubre por qué miles de personas han cambiado su protector solar diario por la fórmula innovadora de Kinship.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#EAE3DA] shadow-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-[#0B2545] text-white p-4 sm:p-5 text-xs sm:text-sm font-bold items-center">
            <div className="col-span-4 sm:col-span-4 uppercase tracking-wider text-white/80">Características</div>
            <div className="col-span-4 sm:col-span-4 text-center bg-[#FF5A36] py-2 px-3 rounded-xl font-extrabold text-white shadow-sm">
              Kinship Self Reflect SPF 32 ✨
            </div>
            <div className="col-span-4 sm:col-span-4 text-center text-white/70">
              Protectores Tradicionales
            </div>
          </div>

          <div className="divide-y divide-[#F2EBE3]">
            {COMPARISON_DATA.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 p-4 sm:p-5 items-center text-xs sm:text-sm hover:bg-[#FFFDFB] transition-colors">
                <div className="col-span-4 sm:col-span-4 font-bold text-[#0B2545] pr-2">
                  {row.feature}
                </div>
                
                {/* Kinship Column */}
                <div className="col-span-4 sm:col-span-4 text-center bg-[#FFF8F5] py-2.5 px-2 rounded-xl border border-[#FFE8DF] font-semibold text-[#0B2545] flex items-center justify-center gap-1.5 mx-1">
                  <span className="text-emerald-600 font-black text-base">✓</span>
                  <span>{row.kinship}</span>
                </div>

                {/* Traditional Column */}
                <div className="col-span-4 sm:col-span-4 text-center text-[#718096] px-2 flex items-center justify-center gap-1.5">
                  <span className="text-red-400 font-black text-base">✕</span>
                  <span>{row.traditional}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Intermedio */}
        <div className="text-center mt-8">
          <a
            href="#ofertas"
            className="inline-flex items-center gap-2 bg-[#0B2545] hover:bg-[#FF5A36] text-white font-bold text-sm px-6 py-3.5 rounded-full transition-all duration-200 shadow-md"
          >
            <span>Quiero Probar Kinship con Descuento</span>
            <span>➔</span>
          </a>
        </div>
      </section>

      {/* 6. KEY INGREDIENTS & SKIN SCIENCE */}
      <section className="bg-[#FFFBF9] border-y border-[#EDE6DE] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF5A36]">
              Fórmula Limpia & Eficaz
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] mt-2">
              Ingredientes Activos Respaldados por la Ciencia
            </h2>
            <p className="text-sm text-[#5C6479] mt-2">
              Sin filtros químicos nocivos, sin sulfatos, sin parabenos. Solo nutrición y protección de grado dermocosmético.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#EAE3DB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0EC] text-[#FF5A36] flex items-center justify-center font-black text-xl mb-4">
                Zn
              </div>
              <h3 className="font-extrabold text-base text-[#0B2545]">Óxido de Zinc 22.4%</h3>
              <p className="text-xs font-bold text-[#FF5A36] mt-0.5">Filtro Mineral No-Nano</p>
              <p className="text-xs text-[#5C6479] mt-2 leading-relaxed">
                Crea una pantalla física invisible que refleja el 97% de los rayos UVA y UVB sin penetrar el torrente sanguíneo ni irritar pieles reactivas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EAE3DB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0EC] text-[#FF5A36] flex items-center justify-center font-black text-xl mb-4">
                ✨
              </div>
              <h3 className="font-extrabold text-base text-[#0B2545]">Kinbiome™ Probiótico</h3>
              <p className="text-xs font-bold text-[#FF5A36] mt-0.5">Complejo Vegetal Fermentado</p>
              <p className="text-xs text-[#5C6479] mt-2 leading-relaxed">
                Patente exclusiva de Kinship que equilibra el microbioma facial, reteniendo la hidratación esencial y restaurando la barrera protectora.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EAE3DB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0EC] text-[#FF5A36] flex items-center justify-center font-black text-xl mb-4">
                🧡
              </div>
              <h3 className="font-extrabold text-base text-[#0B2545]">Cúrcuma Orgánica</h3>
              <p className="text-xs font-bold text-[#FF5A36] mt-0.5">Antioxidante Anti-Rojeces</p>
              <p className="text-xs text-[#5C6479] mt-2 leading-relaxed">
                Potente antiinflamatorio que neutraliza los radicales libres causados por la luz solar y la contaminación, calmando la piel irritada.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EAE3DB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0EC] text-[#FF5A36] flex items-center justify-center font-black text-xl mb-4">
                🌻
              </div>
              <h3 className="font-extrabold text-base text-[#0B2545]">Vitamina E & Girasol</h3>
              <p className="text-xs font-bold text-[#FF5A36] mt-0.5">Nutrición & Elasticidad</p>
              <p className="text-xs text-[#5C6479] mt-2 leading-relaxed">
                Acondicionadores emolientes ligeros que suavizan la textura del cutis y previenen el envejecimiento prematuro sin dejar sensación oleosa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CLINICAL RESULTS & USER METRICS */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-[#0B2545] rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Resultados Clínicamente Demostrados
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-2">
              Estudio independiente realizado en usuarios de distintos tipos y tonos de piel durante 28 días de uso diario:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-4xl sm:text-5xl font-black text-[#FF8E72]">96%</p>
              <p className="text-sm font-bold mt-2">Cero Capa Blanca</p>
              <p className="text-xs text-white/70 mt-1">Confirmó absorción transparente e invisible en cualquier fototipo.</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-4xl sm:text-5xl font-black text-[#FF8E72]">98%</p>
              <p className="text-sm font-bold mt-2">Hidratación Todo el Día</p>
              <p className="text-xs text-white/70 mt-1">Sintió la piel más suave, flexible y calmada sin sensación pesada.</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-4xl sm:text-5xl font-black text-[#FF8E72]">94%</p>
              <p className="text-sm font-bold mt-2">Base de Maquillaje Ideal</p>
              <p className="text-xs text-white/70 mt-1">Lo prefiere como prebase antes de aplicar cosméticos y polvos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VERIFIED CUSTOMER REVIEWS */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-1 text-[#FFB800] text-lg mb-2">
            ★★★★★
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
            Lo Que Dicen Quienes Ya Usan Kinship
          </h2>
          <p className="text-sm text-[#5C6479] mt-1">
            Más de 2.500 reseñas de 5 estrellas de amantes del cuidado de la piel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 border border-[#EAE3DA] shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-[#FFB800] text-sm">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  {review.verified && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Compra Verificada
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-[#0B2545] mb-2">
                  "{review.title}"
                </h3>

                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                  {review.text}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F2ECE5] flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-[#0B2545]">{review.author}</p>
                  <p className="text-[11px] text-[#718096]">{review.skinType} • {review.age}</p>
                </div>
                <span className="text-[10px] font-semibold text-[#FF5A36] bg-[#FFF0EC] px-2 py-1 rounded">
                  {review.packBought}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. INTERACTIVE FAQ ACCORDION */}
      <section className="bg-white border-y border-[#EDE6DE] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF5A36]">
              ¿Tienes Dudas?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] mt-2">
              Preguntas Frecuentes
            </h2>
            <p className="text-sm text-[#5C6479] mt-1">
              Todo lo que necesitas saber antes de hacer tu pedido.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen ? 'border-[#FF5A36] bg-[#FFF9F6] shadow-sm' : 'border-[#EAE3DA] bg-white'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#0B2545]"
                  >
                    <span>{faq.q}</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-extrabold transition-transform duration-200 ${
                      isOpen ? 'bg-[#FF5A36] text-white rotate-180' : 'bg-[#F0EAE3] text-[#0B2545]'
                    }`}>
                      ↓
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#4A5568] leading-relaxed border-t border-[#F5ECE4]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL BOTTOM CRO CALL TO ACTION */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-b from-[#FFF5F1] to-[#FFF0EC] rounded-3xl p-8 sm:p-12 border-2 border-[#FFD5CC] shadow-xl">
          <span className="bg-[#FF5A36] text-white text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full inline-block mb-4 shadow-sm">
            Garantía 100% Sin Riesgo
          </span>
          
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight">
            Consigue Tu Glow Natural Kinship Hoy
          </h2>

          <p className="text-sm sm:text-base text-[#4A5568] mt-3 max-w-xl mx-auto leading-relaxed">
            Aprovecha los descuentos exclusivos del <strong className="text-[#FF5A36]">15% en el Pack Dúo</strong> o el <strong className="text-[#FF5A36]">25% en la Rutina Completa</strong> con Envío Gratis y 30 días de garantía.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#ofertas"
              className="w-full sm:w-auto bg-[#FF5A36] hover:bg-[#E63E19] text-white font-extrabold text-base px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-[#FF5A36]/30 flex items-center justify-center gap-2"
            >
              <span>Elegir Mi Pack con Descuento</span>
              <span>➔</span>
            </a>
          </div>

          <p className="text-xs text-[#718096] mt-4">
            🛡️ Pruébalo por 30 días. Si no te convence, te devolvemos el dinero sin preguntas.
          </p>
        </div>
      </section>

      {/* 11. STICKY MOBILE BOTTOM BUY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE6DE] p-3 shadow-2xl md:hidden">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <p className="text-xs font-extrabold text-[#0B2545] truncate max-w-[170px]">
              {selectedBundle.name}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-[#FF5A36]">
                ${selectedBundle.salePrice.toFixed(2)}
              </span>
              {selectedBundle.originalPrice > selectedBundle.salePrice && (
                <span className="text-[10px] line-through text-[#8D99AE]">
                  ${selectedBundle.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <a
            href={selectedBundle.affiliateUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="bg-[#FF5A36] text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md flex items-center gap-1.5"
          >
            <span>Comprar Ahora</span>
            <span>➔</span>
          </a>
        </div>
      </div>

      {/* 12. D2C DEDICATED FOOTER */}
      <footer className="bg-white border-t border-[#ECE5DC] py-10 px-4 sm:px-6 lg:px-8 text-xs text-[#718096]">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tighter text-[#FF5A36] font-heading">
                kinship<span className="text-[#0B2545]">.</span>
              </span>
              <span className="text-[11px] text-[#A0AEC0]">
                • Cuidado facial limpio & probiótico
              </span>
            </div>
            <p className="text-[11px] text-[#A0AEC0]">
              © {new Date().getFullYear()} Kinship D2C Direct Partner. Todos los derechos reservados.
            </p>
          </div>

          <p className="text-[11px] leading-relaxed text-[#A0AEC0] border-t border-[#F2ECE5] pt-4">
            Aviso de Transparencia y Afiliación: Este portal es un socio autorizado de difusión de Kinship. Los enlaces de compra dirigen a la tienda oficial de Kinship a través del programa de afiliados de Commission Junction (CJ Affiliate). Podemos recibir una comisión por compras calificadas sin ningún coste adicional para el usuario. Precios, promociones y disponibilidad sujetos a cambios por parte del fabricante.
          </p>
        </div>
      </footer>

    </div>
  );
}
