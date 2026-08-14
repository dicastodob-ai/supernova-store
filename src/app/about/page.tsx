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
    <div className="max-w-4xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-24 font-courier">
      {/* Header section with generous breathing room */}
      <div className="border-b border-black pb-8 mb-12">
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">Editorial & Purpose</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase">About Supernova</h1>
      </div>

      {/* Main content */}
      <div className="space-y-12 text-xs md:text-sm tracking-[0.08em] leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            01 / Concept & Curation
          </h2>
          <p>
            Supernova Store is a curated minimalist storefront designed to eliminate visual noise and bring clarity to modern product discovery. We index high-grade electronics, functional design, literature, and lifestyle essentials from premier brands.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            02 / Affiliate Partnerships
          </h2>
          <p>
            All products and merchants featured in Supernova are curated and sourced exclusively through verified global affiliate partnerships with <strong>CJ Affiliate</strong>. When you click on a product link, you are redirected to the authorized merchant’s checkout with full buyer protections.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            03 / Transparency & Disclosure
          </h2>
          <p className="opacity-80">
            Supernova may earn an affiliate commission when purchases are completed through our links at no additional cost to you. We only index items that adhere to our standards of design, quality, and technical integrity.
          </p>
        </section>

        {/* 04 / Contact Section */}
        <section className="space-y-6 pt-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            04 / Contact & Inquiries
          </h2>
          <p className="opacity-80">
            For brand partnerships, press inquiries, or curation questions, reach out directly or use the form below:
          </p>

          <div className="border border-black p-6 md:p-8 space-y-6 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/10 gap-2">
              <span className="text-[10px] tracking-[0.2em] uppercase opacity-50">Direct Email:</span>
              <a
                href="mailto:anne.neumann@humancentric.online"
                className="text-xs font-bold tracking-[0.1em] hover:underline underline-offset-4"
              >
                anne.neumann@humancentric.online
              </a>
            </div>

            {submitted ? (
              <div className="bg-black text-white p-4 text-xs tracking-[0.15em] uppercase text-center space-y-2">
                <p className="font-bold">Message Initiated</p>
                <p className="text-[10px] opacity-80">
                  Your mail client has been opened to send your inquiry to anne.neumann@humancentric.online.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-[10px] underline uppercase tracking-wider"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-[10px] tracking-[0.2em] uppercase opacity-60 mb-1">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER YOUR NAME"
                    className="w-full bg-white text-black text-xs uppercase tracking-wider py-2.5 px-3 border border-black focus:outline-none focus:ring-1 focus:ring-black placeholder:opacity-30"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] tracking-[0.2em] uppercase opacity-60 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="YOUR.EMAIL@DOMAIN.COM"
                    className="w-full bg-white text-black text-xs uppercase tracking-wider py-2.5 px-3 border border-black focus:outline-none focus:ring-1 focus:ring-black placeholder:opacity-30"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-[10px] tracking-[0.2em] uppercase opacity-60 mb-1">
                    Message / Inquiry
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="WRITE YOUR MESSAGE HERE..."
                    className="w-full bg-white text-black text-xs uppercase tracking-wider py-2.5 px-3 border border-black focus:outline-none focus:ring-1 focus:ring-black placeholder:opacity-30 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white text-xs tracking-[0.25em] uppercase py-3 border border-black hover:bg-white hover:text-black transition-colors font-bold"
                >
                  Send Inquiry →
                </button>
              </form>
            )}
          </div>
        </section>

        <div className="pt-8 border-t border-black/10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-block bg-black text-white text-xs tracking-[0.2em] uppercase px-6 py-3 border border-black hover:bg-white hover:text-black transition-colors"
          >
            ← Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
