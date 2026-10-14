'use client';

import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '@/lib/supabase';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  vehicleId: string;
}

export default function ContactPage() {
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    message: '',
    vehicleId: 'none'
  });

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);

  // Fetch vehicles for the dropdown
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select('id, name, brand')
        .order('name');

      if (fetchErr) throw fetchErr;
      setVehicles(data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Failed to load vehicle list.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!contactForm.name || !contactForm.message) {
    alert('Please fill in your name and message.');
    return;
  }

  setIsSubmitting(true);

  try {
    let selectedVehName = null;

    if (contactForm.vehicleId !== 'none') {
      const vehObj = vehicles.find(v => v.id === contactForm.vehicleId);
      selectedVehName = vehObj ? vehObj.name : null;
    }

    // Create email subject
    const emailSubject = selectedVehName
      ? `New Enquiry - ${selectedVehName}`
      : 'New Enquiry - KGN Enterprises Website';

    // Current date and time
    const submissionTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // 1. Save enquiry to Supabase
    const { error: insertErr } = await supabase.from('enquiries').insert({
      customer_name: contactForm.name,
      email: contactForm.email || null,
      phone: contactForm.phone || null,
      vehicle_id: contactForm.vehicleId === 'none' ? null : contactForm.vehicleId,
      vehicle_name: selectedVehName,
      message: contactForm.message,
      status: 'new'
    });

    if (insertErr) throw insertErr;

    // 2. Send enquiry to owner's email through EmailJS
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      {
        name: contactForm.name,
        email: contactForm.email || 'Not provided',
        phone: contactForm.phone || 'Not provided',
        subject: emailSubject,
        message: contactForm.message,
        time: submissionTime
      },
      {
        publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      }
    );

    // 3. Show success message
    setShowThankYou(true);

    // Reset form
    setContactForm({
      name: '',
      email: '',
      phone: '',
      message: '',
      vehicleId: 'none'
    });

  } catch (err: any) {
    console.error('Error submitting contact form:', err);

    alert(
      err?.text ||
      err?.message ||
      'Failed to submit your message. Please try again.'
    );
  } finally {
    setIsSubmitting(false);
  }
};

  // Navigation helper
  const navigateToPage = (page: string) => {
    window.location.href = `/${page}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Header - Reused from main layout */}
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
            <button onClick={() => navigateToPage('offers')} className="hover:text-primary-transition-colors font-medium">Offers</button>
            <button onClick={() => navigateToPage('about')} className="hover:text-primary-container transition-colors font-medium">About</button>
            <button className="hover:text-primary-container transition-colors font-medium text-primary-container">Contact</button>
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
            className="md:hidden flex items-center justify-center p-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </header>

      <main className="flex-grow">
        {/* CONTACT SECTION */}
        <section className="py-20 bg-surface-container-lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">

            {/* Page Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">contact_support</span>
                <span>Get In Touch</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight text-center">
                Contact KGN Enterprises
              </h2>
              <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-2xl mx-auto">
                Have questions about our electric vehicles, want to schedule a test ride, or need after-sales support? We're here to help!
              </p>
            </div>

            {/* Contact Info & Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* Contact Information */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Contact Information</h3>
                  <div className="space-y-6">
                    {/* Address */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-primary-container">
                          <span className="material-symbols-outlined text-[22px]">location_on</span>
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Showroom Address</h4>
                        <p className="text-on-surface-variant">
                          KGN Enterprises, Bus Stand main Road, Basvakalyan, Karnataka - 585327
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-secondary-fixed">
                          <span className="material-symbols-outlined text-[22px]">call</span>
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Phone Numbers</h4>
                        <p className="text-on-surface-variant">
                          Sales: +91 97400 20909<br/>
                          Support: +91 94836 17146
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-primary-container">
                          <span className="material-symbols-outlined text-[22px]">mail</span>
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Email Addresses</h4>
                        <p className="text-on-surface-variant">
                          Sales: kgnenterprises952@gmail.com<br/>
                          Info: kgnenterprises952@gmail.com<br/>
                          Support: kgnenterprises952@gmail.com
                        </p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-primary-container">
                          <span className="material-symbols-outlined text-[22px]">schedule</span>
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">Showroom Hours</h4>
                        <p className="text-on-surface-variant">
                          Monday - Saturday: 9:30 AM - 8:00 PM<br/>
                          Sunday: Holiday (Closed)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media / Quick Links */}
                <div className="space-y-6 border-t border-outline-variant/20 pt-6">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Connect With Us</h3>
                  <div className="flex flex-wrap gap-4">
                    <a href="#" className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 hover:border-primary-container transition-colors">
                      <span className="material-symbols-outlined text-primary-container">forum</span>
                      <span>Community Forum</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 hover:border-primary-container transition-colors">
                      <span className="material-symbols-outiled text-secondary-fixed">share</span>
                      <span>Follow Us</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 hover:border-primary-container transition-colors">
                      <span className="material-symbols-outiled text-primary-container">feedback</span>
                      <span>Leave Feedback</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="space-y-8">
                {showThankYou ? (
                  <div className="text-center py-16 bg-surface-container-low rounded-xl border border-outline-variant/40">
                    <span className="material-symbols-outlined text-4xl text-primary-container mb-4 block">check_circle</span>
                    <h3 className="font-display-lg text-3xl font-bold tracking-tight text-center mb-4">Thank You!</h3>
                    <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
                      Your message has been successfully sent. Our team will get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setShowThankYou(false)}
                      className="mt-8 px-6 py-3 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg font-bold transition-all"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-display-lg text-3xl font-bold tracking-tight">Send us a Message</h3>
                    <p className="text-on-surface-variant">
                      Fill out the form below and we'll get back to you as soon as possible.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Your Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+91 99999 88888"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none transition-colors"
                        />
                      </div>

                      {/* Vehicle Selection */}
                      <div>
                        <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Interested In (Optional)</label>
                        <select
                          value={contactForm.vehicleId}
                          onChange={(e) => setContactForm({ ...contactForm, vehicleId: e.target.value })}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary-container transition-colors cursor-pointer"
                          disabled={loading}
                        >
                          <option value="none">General Inquiry (No Specific Vehicle)</option>
                          {loading ? (
                            <option>Loading vehicles...</option>
                          ) : (
                            vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.brand} - {vehicle.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Your Message *</label>
                        <textarea
                          rows={5}
                          required
                          placeholder="Tell us about your inquiry... (e.g., pricing, test rides, availability, financing)"
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none transition-colors resize-none"
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin h-4 w-4 border-2 border-on-primary-container border-t-transparent rounded-full"></span>
                              <span>Sending Message...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">send</span>
                              <span>Send Message</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Reused from main layout */}
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

          {/* Quick links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Navigate</h5>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li><button onClick={() => navigateToPage('')} className="hover:text-primary-container">Home</button></li>
              <li><button onClick={() => navigateToPage('about')} className="hover:text-primary-container">About</button></li>
              <li><button onClick={() => navigateToPage('offers')} className="hover:text-primary-container">Offers</button></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Contact</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              📍 KGN Enterprises, Bus Stand main Road, Basvakalyan<br/>
              📞 Sales: +91 94836 17146<br/>
              ✉️ kgnenterprises952@gmail.com
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