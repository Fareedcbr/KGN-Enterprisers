'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Admin {
  id: string;
  full_name: string;
  created_at: string;
}

export default function AboutPage() {
  const [team, setTeam] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setTeam(data || []);
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setError(err.message || 'Failed to load team information.');
    } finally {
      setLoading(false);
    }
  }

  // Navigation helper
  const navigateToPage = (page: string) => {
    window.location.href = `/${page}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:bg-primary-container">
      {/* Reuse the same layout structure as the home page */}
      <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateToPage('')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-secondary-fixed flex items-center justify-center shadow-lg shadow-primary-container/20">
              <span className="material-symbols-outlined text-surface text-2xl font-bold animate-pulse">electric_bike</span>
            </div>
            <div>
              <h1 className="font-display-lg text-lg md:text-xl font-bold text-on-surface tracking-tight">KGN Enterprises</h1>
              <p className="text-[10px] text-primary-container font-label-sm tracking-widest uppercase">Electric Mobility</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8 font-label-sm text-sm">
            <button onClick={() => navigateToPage('')} className="hover:text-primary-container transition-colors font-medium">Home</button>
            <button onClick={() => navigateToPage('offers')} className="hover:text-primary-container transition-colors font-medium">Offers</button>
            <button className="hover:text-primary-container transition-colors font-medium text-primary-container">About</button>
            <button onClick={() => navigateToPage('contact')} className="hover:text-primary-container transition-colors font-medium">Contact</button>
          </nav>

          {/* Navigation Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/admin"
              className="bg-surface-container hover:bg-surface-container-high text-xs text-on-surface py-2.5 px-4 rounded-lg font-bold border border-outline-variant transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>Admin Portal</span>
            </a>
          </div>

          {/* Mobile Hamburguer Toggle */}
          <button
            onClick={() => {
              // For simplicity, we'll just toggle a class that would normally control mobile menu
              // In a real implementation, this would control state
            }}
            className="md:hidden flex items-center justify-center p-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </header>

      <main className="flex-grow">
        {/* ABOUT SECTION */}
        <section className="py-20 bg-surface-container-lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">

            {/* Header */}
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">info</span>
                <span>About KGN Enterprises</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight text-center">
                Our Mission & Vision
              </h2>
              <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-2xl mx-auto">
                Pioneering the electric mobility revolution in Karnataka by providing access to premium electric vehicles with exceptional customer service and after-sales support.
              </p>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* Left Column: Story */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Our Story</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Founded in 2020, KGN Enterprises began with a simple vision: to make electric mobility accessible, reliable, and enjoyable for everyone. What started as a small showroom in Bassvakalyan has grown into Karnataka's premier destination for high-performance electric scooters and motorcycles.
                  </p>
                  <p className="text-on-surface-variant leading-relaxed mt-4">
                    We believe that the transition to electric transportation shouldn't be complicated or compromising. That's why we carefully curate every vehicle in our inventory, ensuring they meet the highest standards of performance, safety, and innovation.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Our Commitment</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="w-3 h-3 bg-primary-container rounded-full flex-shrink-0 mt-0.5"></span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Quality Selection</h4>
                        <p className="text-on-surface-variant text-sm">
                          Every vehicle undergoes rigorous inspection and testing before joining our showroom floor.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="w-3 h-3 bg-secondary-container rounded-full flex-shrink-0 mt-0.5"></span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Customer First</h4>
                        <p className="text-on-surface-variant text-sm">
                          Your satisfaction is our priority - from your first inquiry to years of ownership.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="w-3 h-3 bg-primary-container/20 rounded-full flex-shrink-0 mt-0.5 border border-primary-container/30"></span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Sustainable Future</h4>
                        <p className="text-on-surface-variant text-sm">
                          We're committed to reducing carbon emissions one electric ride at a time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Why Choose Us</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <span className="material-symbols-outlined text-primary-container">check_circle</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">Expert Guidance</h4>
                            <p className="text-on-surface-variant text-sm">
                              Our knowledgeable team helps you find the perfect EV for your lifestyle and budget.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <span className="material-symbols-outlined text-secondary-fixed">local_shipping</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">Nationwide Service</h4>
                            <p className="text-on-surface-variant text-sm">
                              Authorized service partners across Karnataka for timely maintenance and support.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <span className="material-symbols-outiled text-primary-container">verified</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">Trust & Transparency</h4>
                            <p className="text-on-surface-variant text-sm">
                              Clear pricing, genuine warranties, and honest communication at every step.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Team & Stats */}
              <div className="space-y-8">
                {/* Team Section */}
                <div className="space-y-4">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Our Team</h3>

                  {loading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-pulse h-36 w-36 rounded-full bg-surface-container-low"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <span className="material-symbols-outioned text-4xl text-outline-variant/60">error</span>
                      <p className="text-on-surface-variant mt-4">{error}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {team.map((member, index) => (
                        <div key={member.id} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 text-center">
                          <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-primary-container text-xl">
                              person
                            </span>
                          </div>
                          <h4 className="font-bold text-on-surface">{member.full_name}</h4>
                          <p className="text-on-surface-variant text-sm">
                            EV Specialist
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats Section */}
                <div className="space-y-6 border-t border-outline-variant/20 pt-6">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Our Impact</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
                      <h4 className="text-3xl font-extrabold text-primary-container">500+</h4>
                      <p className="text-on-surface-variant font-label-sm uppercase tracking-wider">
                        EVs Delivered
                      </p>
                    </div>
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
                      <h4 className="text-3xl font-extrabold text-secondary-fixed">10+</h4>
                      <p className="text-on-surface-variant font-label-sm uppercase tracking-wider">
                        Brands Available
                      </p>
                    </div>
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
                      <h4 className="text-3xl font-extrabold text-on-surface">98%</h4>
                      <p className="text-on-surface-variant font-label-sm uppercase tracking-wider">
                        Customer Satisfaction
                      </p>
                    </div>
                    <div className="p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
                      <h4 className="text-3xl font-extrabold text-primary-container">24/7</h4>
                      <p className="text-on-surface-variant font-label-sm uppercase tracking-wider">
                        Support Available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Values Section */}
            <div className="mt-16 pt-12 border-t border-outline-variant/20">
              <h2 className="font-display-lg text-3xl font-bold tracking-tight text-center mb-8">
                Our Core Values
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <span className="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center mb-2">
                      <span className="material-symbols-outiled text-primary-container">motorcycle</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-on-surface">Innovation</h4>
                  <p className="text-on-surface-variant text-sm">
                    We constantly seek the latest advancements in electric vehicle technology to bring you cutting-edge options.
                  </p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <span className="w-12 h-12 bg-secondary-container/20 rounded-full flex items-center justify-center mb-2">
                      <span className="material-symbols-outiled text-secondary-fixed">shield</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-on-surface">Integrity</h4>
                  <p className="text-on-surface-variant text-sm">
                    Honest pricing, transparent processes, and ethical business practices guide everything we do.
                  </p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <span className="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center mb-2">
                      <span className="material-symbols-outiled text-primary-container">favorite</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-on-surface">Community</h4>
                  <p className="text-on-surface-variant text-sm">
                    We're more than a dealership - we're building a community of eco-conscious riders.
                  </p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <span className="w-12 h-12 bg-secondary-container/20 rounded-full flex items-center justify-center mb-2">
                      <span className="material-symbols-outiled text-secondary-fixed">eco</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-on-surface">Sustainability</h4>
                  <p className="text-on-surface-variant text-sm">
                    Every electric vehicle we sell contributes to a cleaner, greener future for Karnataka.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Reuse the same footer as the home page */}
      <footer className="bg-surface border-t border-outline-variant/60 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">

          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-secondary-fixed flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-surface text-lg font-bold">electric_bike</span>
              </div>
              <h2 className="font-display-lg text-base font-bold text-on-surface">KGN Enterprises</h2>
            </div>
            <p className="text-xs text-on-surface-variant/80 max-w-sm leading-relaxed">
              Official electric showroom manager bringing you the finest lithium batteries and connectibile EV scooters. Switch over to clean green energy commuting today.
            </p>
          </div>

          {/* Quick scroll links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Navigate</h5>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li><button onClick={() => navigateToPage('')} className="hover:text-primary-container">Home</button></li>
              <li><button onClick={() => navigateToPage('offers')} className="hover:text-primary-container">Offers</button></li>
              <li><button onClick={() => navigateToPage('contact')} className="hover:text-primary-container">Contact</button></li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Support</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Sales: +91 94836 17146<br/>
              Support: +91 94836 17146<br/>
              Email: sales@kgnenterprises.co.in
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-outline font-medium">
          <p>© 2026 KGN Enterprises Showrooms. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-on-surface">Privacy Agreement</span>
            <span className="cursor-pointer hover:text-on-surface">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}