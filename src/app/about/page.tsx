'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    // Trigger direct mail client with pre-filled content
    const subject = encodeURIComponent(`Supernova Store Inquiry - ${name || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nSent from Supernova Store About Page`
    );
    window.location.href = `mailto:anne.neumann@humancentric.online?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-24">
      {/* Header section */}
      <div className="border-b border-[#ECECE8] pb-8 mb-12">
        <span className="text-xs font-bold tracking-wider uppercase text-[#D96B27] block mb-2">
          Editorial & Purpose
        </span>
        <h1 className="hero-title text-3xl md:text-4xl font-extrabold tracking-tight text-[#0B2545]">
          About Supernova
        </h1>
      </div>

      {/* Main content */}
      <div className="space-y-10 text-sm leading-relaxed text-[#2D3142]">
        <section className="space-y-3 bg-white p-6 md:p-8 rounded-2xl border border-[#ECECE8] shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#0B2545] border-b border-[#ECECE8] pb-2 font-heading">
            01 / Concept & Curation
          </h2>
          <p className="text-[#5C6479]">
            Supernova Store is a curated minimalist storefront designed to eliminate visual noise and bring clarity to modern product discovery. We index high-grade electronics, functional design, literature, and lifestyle essentials from premier brands.
          </p>
        </section>

        <section className="space-y-3 bg-white p-6 md:p-8 rounded-2xl border border-[#ECECE8] shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#0B2545] border-b border-[#ECECE8] pb-2 font-heading">
            02 / Affiliate Partnerships
          </h2>
          <p className="text-[#5C6479]">
            All products and merchants featured in Supernova are curated and sourced exclusively through verified global affiliate partnerships with <strong className="text-[#0B2545]">CJ Affiliate (Commission Junction)</strong>. When you click on a product link, you are redirected to the authorized merchant’s checkout with official buyer protections.
          </p>
        </section>

        <section className="space-y-3 bg-white p-6 md:p-8 rounded-2xl border border-[#ECECE8] shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#0B2545] border-b border-[#ECECE8] pb-2 font-heading">
            03 / Transparency & Disclosure
          </h2>
          <p className="text-[#5C6479]">
            Supernova may earn an affiliate commission when purchases are completed through our links at no additional cost to you. We only index items that adhere to our standards of design, quality, and technical integrity.
          </p>
        </section>

        {/* 04 / Contact Section */}
        <section className="space-y-6 pt-4">
          <div className="rounded-2xl border border-[#ECECE8] p-6 md:p-8 space-y-6 bg-white shadow-sm">
            <h2 className="text-base font-bold uppercase tracking-wide text-[#0B2545] border-b border-[#ECECE8] pb-2 font-heading">
              04 / Contact & Inquiries
            </h2>
            <p className="text-xs text-[#5C6479]">
              For brand partnerships, press inquiries, or curation questions, reach out directly or use the form below:
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECECE8] gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6479]">Direct Email:</span>
              <a
                href="mailto:anne.neumann@humancentric.online"
                className="text-xs font-bold text-[#D96B27] hover:underline"
              >
                anne.neumann@humancentric.online
              </a>
            </div>

            {submitted ? (
              <div className="bg-[#0B2545] text-white p-6 rounded-xl text-center space-y-2">
                <p className="font-bold text-sm">Message Initiated</p>
                <p className="text-xs text-white/80">
                  Your mail client has been opened to send your inquiry to anne.neumann@humancentric.online.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs font-bold underline text-[#D96B27] cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[#5C6479] mb-1">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#F9F9F8] text-[#2D3142] text-xs py-3 px-4 rounded-xl border border-[#ECECE8] focus:outline-none focus:border-[#D96B27] focus:ring-2 focus:ring-[#D96B27]/20 placeholder:text-[#5C6479]/40"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#5C6479] mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@domain.com"
                    className="w-full bg-[#F9F9F8] text-[#2D3142] text-xs py-3 px-4 rounded-xl border border-[#ECECE8] focus:outline-none focus:border-[#D96B27] focus:ring-2 focus:ring-[#D96B27]/20 placeholder:text-[#5C6479]/40"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#5C6479] mb-1">
                    Message / Inquiry
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full bg-[#F9F9F8] text-[#2D3142] text-xs py-3 px-4 rounded-xl border border-[#ECECE8] focus:outline-none focus:border-[#D96B27] focus:ring-2 focus:ring-[#D96B27]/20 placeholder:text-[#5C6479]/40 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="button-primary w-full !py-3.5 !text-xs tracking-wider"
                >
                  Send Inquiry →
                </button>
              </form>
            )}
          </div>
        </section>

        <div className="pt-6 border-t border-[#ECECE8] flex items-center justify-between">
          <Link
            href="/"
            className="button-primary !bg-[#0B2545] hover:!bg-[#07172B] !text-xs !py-3 !px-6"
          >
            ← Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
