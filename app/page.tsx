'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// Type definitions
interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  offer_price: number | null;
  battery: string;
  range: string;
  charging_time: string;
  top_speed: string;
  motor_power: string;
  description: string;
  specifications: Record<string, any> | null;
  colors: string[];
  featured: boolean;
  availability: string;
  stock: number;
  images: string[];
  created_at: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function PublicWebsite() {
  // States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation & UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailImageIdx, setDetailImageIdx] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockOnly, setStockOnly] = useState(false);
  const [priceSort, setPriceSort] = useState('default');
  
  // Form submission states
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '', vehicleId: 'none' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Realtime subscription and initial load
  useEffect(() => {
    fetchVehicles();
    
    // Realtime listener
    const subscription = supabase
      .channel('public-vehicles-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchVehicles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Fetch from Supabase
  async function fetchVehicles() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setVehicles(data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Failed to retrieve showroom vehicles. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Toast helper
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  // Handle Enquiry submission
  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message) {
      showToast('Please enter your name and message.', 'error');
      return;
    }
    
    setIsSubmittingContact(true);
    try {
      let selectedVehName = null;
      if (contactForm.vehicleId !== 'none') {
        const vehObj = vehicles.find(v => v.id === contactForm.vehicleId);
        selectedVehName = vehObj ? vehObj.name : null;
      }

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

      showToast('Thank you! Your enquiry has been received successfully.', 'success');
      setContactForm({ name: '', email: '', phone: '', message: '', vehicleId: 'none' });
    } catch (err: any) {
      console.error('Error submitting enquiry:', err);
      showToast(err.message || 'Failed to submit enquiry. Please try again.', 'error');
    } finally {
      setIsSubmittingContact(false);
    }
  }

  // Handle Test Ride Booking submission
  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingVehicle) return;
    if (!bookingForm.name || !bookingForm.phone) {
      showToast('Name and phone number are required to book a ride.', 'error');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const { error: insertErr } = await supabase.from('enquiries').insert({
        customer_name: bookingForm.name,
        email: bookingForm.email || null,
        phone: bookingForm.phone,
        vehicle_id: bookingVehicle.id,
        vehicle_name: bookingVehicle.name,
        message: bookingForm.message 
          ? `[Test Ride Booking Request] ${bookingForm.message}` 
          : `Requested a test ride for model: ${bookingVehicle.name}`,
        status: 'new'
      });

      if (insertErr) throw insertErr;

      showToast(`Test ride successfully requested for ${bookingVehicle.name}! We will call you soon.`, 'success');
      setBookingForm({ name: '', email: '', phone: '', message: '' });
      setBookingVehicle(null);
    } catch (err: any) {
      console.error('Error booking test ride:', err);
      showToast(err.message || 'Failed to request test ride. Please try again.', 'error');
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  // Format Price in Indian Rupees
  function formatPrice(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Helper for color name mapping
  function getColorHex(colorName: string) {
    const clean = colorName.toLowerCase().trim();
    const map: Record<string, string> = {
      red: '#EF4444',
      blue: '#3B82F6',
      green: '#10B981',
      black: '#111827',
      white: '#F9FAFB',
      gray: '#6B7280',
      grey: '#6B7280',
      yellow: '#F59E0B',
      orange: '#F97316',
      purple: '#8B5CF6',
      silver: '#D1D5DB',
      gold: '#FBBF24',
      cyan: '#06B6D4',
      teal: '#14B8A6',
    };
    return map[clean] || '#4B5563'; // Fallback gray
  }

  // Dynamic filter collections
  const categories = useMemo(() => {
    const cats = new Set(vehicles.map((v) => v.category));
    return ['all', ...Array.from(cats)];
  }, [vehicles]);

  const brands = useMemo(() => {
    const brs = new Set(vehicles.map((v) => v.brand));
    return ['all', ...Array.from(brs)];
  }, [vehicles]);

  // Filter & Sort Logic
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((v) => v.category === selectedCategory);
    }

    // 3. Brand Filter
    if (selectedBrand !== 'all') {
      result = result.filter((v) => v.brand === selectedBrand);
    }

    // 4. Stock Availability Filter
    if (stockOnly) {
      result = result.filter((v) => v.stock > 0);
    }

    // 5. Sorting
    if (priceSort === 'asc') {
      result.sort((a, b) => {
        const priceA = a.offer_price ?? a.price;
        const priceB = b.offer_price ?? b.price;
        return priceA - priceB;
      });
    } else if (priceSort === 'desc') {
      result.sort((a, b) => {
        const priceA = a.offer_price ?? a.price;
        const priceB = b.offer_price ?? b.price;
        return priceB - priceA;
      });
    }

    return result;
  }, [vehicles, searchQuery, selectedCategory, selectedBrand, stockOnly, priceSort]);

  // Featured Vehicles (filtered dynamically from Supabase database)
  const featuredVehicles = useMemo(() => {
    return vehicles.filter((v) => v.featured);
  }, [vehicles]);

  // Latest Vehicles (first matching sequence sorted by created_at)
  const latestVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [vehicles]);

  // Offer Vehicles (where offer_price exists)
  const offerVehicles = useMemo(() => {
    return vehicles.filter((v) => v.offer_price !== null && v.offer_price !== undefined && v.offer_price < v.price);
  }, [vehicles]);

  // Navigation click helper
  function scrollToSection(id: string) {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Open Details panel and reset image preview index
  function openDetails(veh: Vehicle) {
    setSelectedVehicle(veh);
    setDetailImageIdx(0);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      
      {/* Top Banner (Real-time indicators) */}
      <div className="bg-gradient-to-r from-primary-container/20 to-secondary-container/20 py-2 text-center text-xs font-semibold border-b border-outline-variant/30 flex justify-center items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
        <span>Explore live inventory directly synced from KGN Showroom.</span>
      </div>

      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop h-20 flex justify-between items-center">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
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
            <button onClick={() => scrollToSection('home')} className="hover:text-primary-container transition-colors font-medium">Home</button>
            <button onClick={() => scrollToSection('showroom')} className="hover:text-primary-container transition-colors font-medium">Showroom</button>
            <button onClick={() => scrollToSection('offers')} className="hover:text-primary-container transition-colors font-medium">Offers</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-primary-container transition-colors font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-primary-container transition-colors font-medium">Contact Us</button>
          </nav>

          {/* Navigation Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="/admin" 
              className="bg-surface-container hover:bg-surface-container-high text-xs text-on-surface py-2.5 px-4 rounded-lg font-bold border border-outline-variant transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
              <span>Admin Portal</span>
            </a>
            <button 
              onClick={() => scrollToSection('showroom')}
              className="bg-primary-container hover:bg-primary-container/95 text-on-primary-container text-xs py-2.5 px-5 rounded-lg font-bold ev-glow transition-all active:scale-95 flex items-center gap-1"
            >
              <span>Explore Bikes</span>
              <span className="material-symbols-outlined text-xs">arrow_downward</span>
            </button>
          </div>

          {/* Mobile Hamburguer Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg bg-surface-container border border-outline-variant hover:border-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full border-b border-outline-variant bg-surface-container-low px-margin-mobile py-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
            <button onClick={() => scrollToSection('home')} className="text-left font-medium py-2 border-b border-outline-variant/10 text-on-surface hover:text-primary-container">Home</button>
            <button onClick={() => scrollToSection('showroom')} className="text-left font-medium py-2 border-b border-outline-variant/10 text-on-surface hover:text-primary-container">Showroom</button>
            <button onClick={() => scrollToSection('offers')} className="text-left font-medium py-2 border-b border-outline-variant/10 text-on-surface hover:text-primary-container">Offers</button>
            <button onClick={() => scrollToSection('about')} className="text-left font-medium py-2 border-b border-outline-variant/10 text-on-surface hover:text-primary-container">About Us</button>
            <button onClick={() => scrollToSection('contact')} className="text-left font-medium py-2 border-b border-outline-variant/10 text-on-surface hover:text-primary-container">Contact</button>
            <div className="flex flex-col gap-3 pt-2">
              <a 
                href="/admin" 
                className="w-full bg-surface-container-high py-2.5 px-4 text-center rounded-lg text-sm font-bold border border-outline-variant text-on-surface flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>Admin Dashboard</span>
              </a>
              <button 
                onClick={() => scrollToSection('showroom')}
                className="w-full bg-primary-container text-on-primary-container py-2.5 px-4 text-center rounded-lg text-sm font-bold ev-glow flex items-center justify-center gap-2"
              >
                <span>Book Test Ride</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Sections Wrapper */}
      <main className="flex-grow">
        
        {/* HERO SECTION */}
        <section id="home" className="relative min-h-[85vh] flex items-center py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Copy block */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>100% Eco-Friendly Smart Drives</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-6xl font-bold tracking-tight text-on-surface leading-tight">
                Ride Into The <br/>
                <span className="bg-gradient-to-r from-primary-container to-secondary-fixed bg-clip-text text-transparent ev-glow-text">
                  Electric Revolution
                </span>
              </h2>
              <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-xl">
                Experience high-performance smart electric vehicles at KGN Enterprises. Discover high ranges, smart diagnostics, zero carbon footprints, and exceptional warranty programs.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <button 
                  onClick={() => scrollToSection('showroom')}
                  className="bg-primary-container hover:bg-primary-container/90 text-on-primary-container py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 ev-glow transition-all duration-150 active:scale-95 text-base"
                >
                  <span className="material-symbols-outlined text-lg">electric_scooter</span>
                  <span>Explore Electric Showroom</span>
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="bg-surface-container border border-outline-variant hover:border-primary-container text-on-surface hover:text-primary-container py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-base"
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                  <span>Contact Sales Team</span>
                </button>
              </div>

              {/* Specs pill indicators */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-outline-variant/20 max-w-md">
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-primary-container">120+ KM</h4>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-label-sm">Typical Range</p>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-secondary-fixed">2.5 Hr</h4>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-label-sm">Fast Charging</p>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-on-surface">₹0</h4>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-label-sm">Fuel Expense</p>
                </div>
              </div>
            </div>

            {/* Right Graphic block with Glowing effects */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-primary-container/20 to-secondary-container/10 filter blur-3xl -z-10 animate-pulse"></div>
              
              {/* Central Glowing EV Showpiece */}
              <div className="glass-panel p-8 rounded-3xl border border-outline-variant/40 flex flex-col items-center justify-center w-full max-w-sm space-y-6 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-3 right-3 bg-secondary-container/20 text-secondary-fixed px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">
                  Featured model
                </div>
                
                {/* Fallback Electric bike icon style illustration if no vehicles loaded yet */}
                {featuredVehicles[0] ? (
                  <div className="w-full flex flex-col items-center space-y-4">
                    <div className="h-44 w-full flex items-center justify-center bg-surface-container-low/40 rounded-xl overflow-hidden relative">
                      <img 
                        src={featuredVehicles[0].images?.[0] || ''} 
                        alt={featuredVehicles[0].name}
                        className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-on-surface">{featuredVehicles[0].name}</h3>
                      <p className="text-xs text-primary-container font-semibold mt-1">{formatPrice(featuredVehicles[0].price)}</p>
                    </div>
                    <button 
                      onClick={() => openDetails(featuredVehicles[0])}
                      className="w-full py-2 bg-primary-container/10 text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container border border-primary-container/30 hover:border-transparent rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <span>Explore Vehicle</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <span className="material-symbols-outlined text-7xl text-primary-container/80 animate-bounce">electric_scooter</span>
                    <div>
                      <h3 className="text-lg font-bold">Premium Smart Scooters</h3>
                      <p className="text-xs text-on-surface-variant mt-2">Loading latest models directly from showroom database...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Background glowing decorations */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary-container rounded-full blur-[80px] -z-10"></div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-secondary-container/30 rounded-full blur-[90px] -z-10"></div>
            </div>

          </div>

          {/* Abstract geometric glowing line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"></div>
        </section>

        {/* LOADING & ERROR STATUS FALLBACKS */}
        {loading && vehicles.length === 0 && (
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-6">
            <h3 className="text-lg font-bold text-center">Syncing Database with Showroom Inventory...</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-surface-container rounded-xl p-6 border border-outline-variant space-y-4 animate-pulse">
                  <div className="h-44 bg-surface-container-high rounded-lg w-full"></div>
                  <div className="h-6 bg-surface-container-high rounded w-2/3"></div>
                  <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-6 bg-surface-container-high rounded w-1/3"></div>
                    <div className="h-8 bg-surface-container-high rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mx-4 my-12 p-6 glass-panel rounded-2xl border border-error/20 bg-error-container/5 text-center space-y-4 animate-in fade-in">
            <span className="material-symbols-outlined text-4xl text-error">cloud_off</span>
            <h3 className="text-lg font-bold text-error">Inventory Sync Error</h3>
            <p className="text-xs text-on-surface-variant">{error}</p>
            <button 
              onClick={fetchVehicles} 
              className="px-4 py-2 bg-error-container text-on-error-container text-xs font-bold rounded-lg border border-error/30 hover:bg-error-container/85 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* FEATURED VEHICLES SECTION */}
        {featuredVehicles.length > 0 && (
          <section id="featured" className="py-20 bg-surface-container-lowest/30 relative">
            <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop space-y-12">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-container uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    <span>Handpicked Excellence</span>
                  </div>
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight">Flagship Models</h3>
                </div>
                <p className="text-on-surface-variant text-sm max-w-md">
                  Our premier selections featuring outstanding ranges, powerful electric motors, and smart console dashboards.
                </p>
              </div>

              {/* Featured Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {featuredVehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/60 group hover:border-primary-container transition-all duration-300 flex flex-col justify-between h-full relative"
                  >
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary-container text-on-primary-container text-[10px] uppercase font-bold tracking-wider rounded-full shadow-md">
                      Flagship
                    </div>

                    <div>
                      {/* Image panel */}
                      <div className="h-56 relative overflow-hidden bg-surface-container-low/60 flex items-center justify-center p-6 border-b border-outline-variant/20">
                        {vehicle.images?.[0] ? (
                          <img 
                            className="max-h-48 object-contain group-hover:scale-105 transition-transform duration-500" 
                            src={vehicle.images[0]} 
                            alt={vehicle.name} 
                            loading="lazy"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-5xl text-outline-variant">electric_scooter</span>
                        )}
                        
                        {/* Out of stock badge overlays */}
                        {vehicle.stock === 0 && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="px-3 py-1 bg-error-container/20 text-error border border-error/30 font-label-sm rounded-full text-xs font-bold uppercase tracking-wider">
                              Sold Out / Backorder
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-wider font-label-sm text-primary-container">{vehicle.brand}</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-semibold">{vehicle.category}</span>
                          </div>
                          <h4 className="font-display-lg text-[22px] font-bold text-on-surface group-hover:text-primary-container transition-colors mt-2">
                            {vehicle.name}
                          </h4>
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                            {vehicle.description || 'High-performance electric drivetrain with smart throttle feedback.'}
                          </p>
                        </div>

                        {/* High-level specs summary */}
                        <div className="grid grid-cols-2 gap-2 py-3 border-y border-outline-variant/20 text-xs font-semibold">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-secondary-fixed">battery_charging_full</span>
                            <span>Range: {vehicle.range || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-primary-container">speed</span>
                            <span>Speed: {vehicle.top_speed || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-outline font-label-sm uppercase tracking-wider">Price</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-primary-container text-xl font-bold">
                                {formatPrice(vehicle.offer_price ?? vehicle.price)}
                              </span>
                              {vehicle.offer_price && (
                                <span className="text-xs text-outline line-through">
                                  {formatPrice(vehicle.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2 flex gap-3">
                      <button 
                        onClick={() => openDetails(vehicle)}
                        className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-2.5 rounded-lg text-xs font-bold border border-outline-variant/50 transition-all text-center"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => {
                          setBookingVehicle(vehicle);
                          setBookingForm({ name: '', email: '', phone: '', message: '' });
                        }}
                        disabled={vehicle.stock === 0}
                        className={`flex-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          vehicle.stock === 0 
                            ? 'bg-surface-container text-outline cursor-not-allowed' 
                            : 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 ev-glow'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Book Ride</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* LATEST VEHICLES SECTION */}
        {latestVehicles.length > 0 && (
          <section className="py-20 border-t border-outline-variant/20 bg-background relative">
            <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop space-y-12">
              
              <div className="flex items-center gap-3">
                <span className="p-1 bg-secondary-container/10 border border-secondary-container/20 rounded text-secondary-fixed">
                  <span className="material-symbols-outlined text-sm">new_releases</span>
                </span>
                <h3 className="font-display-lg text-2xl font-bold tracking-tight">New Arrivals</h3>
              </div>

              {/* Latest grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestVehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/40 group hover:border-primary-container/70 transition-all flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Image Preview Container */}
                      <div className="h-44 relative bg-surface-container-lowest/60 flex items-center justify-center p-4">
                        {vehicle.images?.[0] ? (
                          <img 
                            className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-500" 
                            src={vehicle.images[0]} 
                            alt={vehicle.name} 
                            loading="lazy"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-outline-variant">electric_scooter</span>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[8px] uppercase tracking-wider font-bold rounded">
                          New
                        </span>
                      </div>

                      {/* Info Panel */}
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-outline font-label-sm font-semibold">{vehicle.brand}</span>
                          <h4 className="font-headline-md text-base font-bold text-on-surface truncate group-hover:text-primary-container transition-colors mt-0.5">
                            {vehicle.name}
                          </h4>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-primary-container font-bold text-sm">
                            {formatPrice(vehicle.offer_price ?? vehicle.price)}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                            <span className="material-symbols-outlined text-[12px] text-secondary-fixed">battery_full</span>
                            <span>{vehicle.range}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-0">
                      <button 
                        onClick={() => openDetails(vehicle)}
                        className="w-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container border border-outline-variant/40 hover:border-transparent py-2 rounded-lg text-xs font-bold transition-all text-center"
                      >
                        View Specifications
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* OFFERS SECTION */}
        {offerVehicles.length > 0 && (
          <section id="offers" className="py-20 border-t border-outline-variant/20 bg-surface-container-lowest/20">
            <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop space-y-12">
              
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="px-3 py-1 bg-secondary-container/10 border border-secondary-container/20 text-secondary-fixed rounded-full text-xs font-bold uppercase tracking-wider">
                  Exclusive Deals
                </span>
                <h3 className="font-display-lg text-3xl font-bold tracking-tight">Active Offers & Discounts</h3>
                <p className="text-on-surface-variant text-sm">
                  Limited period showroom offers. Save instantly on green mobility switchovers.
                </p>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {offerVehicles.map((vehicle) => {
                  const savings = vehicle.price - (vehicle.offer_price ?? 0);
                  const discountPct = Math.round((savings / vehicle.price) * 100);

                  return (
                    <div 
                      key={vehicle.id} 
                      className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant group hover:border-secondary-container transition-all flex flex-col justify-between h-full relative"
                    >
                      {/* Deal highlight tag */}
                      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full shadow-md">
                        Save {discountPct}%
                      </div>

                      <div>
                        {/* Image preview */}
                        <div className="h-52 relative overflow-hidden bg-surface-container-low flex items-center justify-center p-6 border-b border-outline-variant/20">
                          <img 
                            className="max-h-44 object-contain group-hover:scale-105 transition-transform duration-500" 
                            src={vehicle.images?.[0] || ''} 
                            alt={vehicle.name} 
                          />
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-outline">{vehicle.brand}</span>
                            <h4 className="font-display-lg text-xl font-bold text-on-surface mt-1">{vehicle.name}</h4>
                          </div>

                          <div className="flex items-center gap-4 py-3 border-y border-outline-variant/10">
                            <div>
                              <p className="text-[10px] text-outline uppercase tracking-wider font-label-sm">Offer price</p>
                              <p className="text-secondary-fixed text-2xl font-bold">{formatPrice(vehicle.offer_price || 0)}</p>
                            </div>
                            <div className="border-l border-outline-variant/30 pl-4">
                              <p className="text-[10px] text-outline uppercase tracking-wider font-label-sm">Original price</p>
                              <p className="text-on-surface-variant line-through text-sm">{formatPrice(vehicle.price)}</p>
                            </div>
                          </div>

                          {/* Extra Savings Indicator */}
                          <div className="text-xs font-medium text-secondary-fixed flex items-center gap-1.5 bg-secondary-container/10 px-3 py-2 rounded-lg border border-secondary-container/20">
                            <span className="material-symbols-outlined text-sm">payments</span>
                            <span>Save {formatPrice(savings)} instantly on direct bookings.</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="px-6 pb-6 pt-2 flex gap-3">
                        <button 
                          onClick={() => openDetails(vehicle)}
                          className="flex-1 bg-surface-container-high hover:bg-surface-container-highest py-2.5 rounded-lg text-xs font-bold border border-outline-variant/50 transition-all text-center"
                        >
                          Specs Detail
                        </button>
                        <button 
                          onClick={() => {
                            setBookingVehicle(vehicle);
                            setBookingForm({ name: '', email: '', phone: '', message: '' });
                          }}
                          className="flex-1 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container hover:text-on-secondary-fixed py-2.5 rounded-lg text-xs font-bold ev-glow-green transition-all"
                        >
                          Claim Offer
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </section>
        )}

        {/* SHOWROOM VEHICLE LISTING (SEARCH, FILTERS, GRID) */}
        <section id="showroom" className="py-24 border-t border-outline-variant/20 bg-surface-container-lowest/10 relative">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop space-y-12">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-container uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">electric_scooter</span>
                <span>Virtual Showroom</span>
              </div>
              <h3 className="font-display-lg text-3xl md:text-4xl font-bold tracking-tight">Browse All Vehicles</h3>
              <p className="text-on-surface-variant text-sm max-w-xl">
                Explore our full line-up. Use search features and filters to locate your perfect electric ride. Everything is loaded live from the showroom floor database.
              </p>
            </div>

            {/* Filter Panel / Search Header block */}
            <div className="glass-panel p-6 rounded-2xl border border-outline-variant/40 space-y-6">
              
              {/* Search input & Sort selectors */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Search Bar */}
                <div className="md:col-span-6 relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline text-lg">search</span>
                  <input 
                    type="text" 
                    placeholder="Search by name, brand, spec description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 text-outline hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>

                {/* Brand Filter */}
                <div className="md:col-span-3">
                  <select 
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary-container transition-all cursor-pointer"
                  >
                    <option value="all">All Brands</option>
                    {brands.filter(b => b !== 'all').map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Price Sorter */}
                <div className="md:col-span-3">
                  <select 
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary-container transition-all cursor-pointer"
                  >
                    <option value="default">Sort by Price</option>
                    <option value="asc">Price: Low to High</option>
                    <option value="desc">Price: High to Low</option>
                  </select>
                </div>

              </div>

              {/* Sub-Filters / Tags row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant/15">
                
                {/* Category Tags */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-outline font-semibold uppercase tracking-wider mr-2">Category:</span>
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      selectedCategory === 'all' 
                        ? 'bg-primary-container text-on-primary-container border-transparent' 
                        : 'bg-surface hover:bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All Types
                  </button>
                  {categories.filter(c => c !== 'all').map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                        selectedCategory === cat 
                          ? 'bg-primary-container text-on-primary-container border-transparent' 
                          : 'bg-surface hover:bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* In stock switch toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold select-none">
                  <input 
                    type="checkbox" 
                    checked={stockOnly} 
                    onChange={(e) => setStockOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-surface-container border border-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-outline after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-secondary-container peer-checked:bg-secondary-container/10 peer-checked:border-secondary-container/40 relative"></div>
                  <span className="text-on-surface-variant peer-checked:text-on-surface">Available In-Stock Only</span>
                </label>

              </div>

            </div>

            {/* Showroom Grid Result block */}
            {filteredVehicles.length === 0 ? (
              <div className="py-24 text-center max-w-md mx-auto space-y-4">
                <span className="material-symbols-outlined text-6xl text-outline-variant/60">search_off</span>
                <h4 className="text-xl font-bold">No Vehicles Match Your Selection</h4>
                <p className="text-xs text-on-surface-variant">
                  We currently do not have vehicles matching all filters. Try clearing search keywords or selecting 'All Types'.
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBrand('all');
                    setSelectedCategory('all');
                    setStockOnly(false);
                    setPriceSort('default');
                  }}
                  className="px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg text-xs font-bold transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {filteredVehicles.map((vehicle) => (
                  <div 
                    key={vehicle.id} 
                    className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/60 group hover:border-primary-container/80 transition-all duration-300 flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Image block */}
                      <div className="h-56 relative overflow-hidden bg-surface-container-low/40 flex items-center justify-center p-6 border-b border-outline-variant/20">
                        {vehicle.images?.[0] ? (
                          <img 
                            className="max-h-48 object-contain group-hover:scale-105 transition-transform duration-500" 
                            src={vehicle.images[0]} 
                            alt={vehicle.name} 
                            loading="lazy"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-5xl text-outline-variant">electric_scooter</span>
                        )}

                        {/* Availability badge */}
                        <div className="absolute top-4 left-4 z-10">
                          {vehicle.stock > 0 ? (
                            <span className="px-3 py-1 bg-secondary-container/20 text-secondary-fixed border border-secondary-container/30 text-[10px] uppercase font-bold tracking-wider rounded-full backdrop-blur-md">
                              In Stock
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-error-container/20 text-error border border-error/30 text-[10px] uppercase font-bold tracking-wider rounded-full backdrop-blur-md">
                              Backorder
                            </span>
                          )}
                        </div>

                        {/* Brand overlay text */}
                        <span className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-outline font-bold bg-surface-container-high/60 backdrop-blur-sm px-2 py-0.5 rounded border border-outline-variant/30">
                          {vehicle.brand}
                        </span>
                      </div>

                      {/* Content panel */}
                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-primary-container uppercase tracking-wider font-bold">Smart EV</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-semibold capitalize">{vehicle.category}</span>
                          </div>
                          <h4 className="font-display-lg text-xl font-bold text-on-surface group-hover:text-primary-container transition-colors mt-2">
                            {vehicle.name}
                          </h4>
                          <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                            {vehicle.description || 'High range battery system with zero emission drive performance.'}
                          </p>
                        </div>

                        {/* Key performance highlights */}
                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-outline-variant/20 text-xs font-semibold">
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-secondary-fixed">battery_charging_full</span>
                            <span>{vehicle.range || 'N/A Range'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-primary-container">speed</span>
                            <span>{vehicle.top_speed || 'N/A Speed'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-secondary-fixed">charging_station</span>
                            <span>{vehicle.charging_time || 'N/A Charger'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-primary-container">offline_bolt</span>
                            <span>{vehicle.motor_power || 'N/A Motor'}</span>
                          </div>
                        </div>

                        {/* Pricing details */}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-outline font-label-sm uppercase tracking-wider">Price (Ex-Showroom)</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-primary-container text-xl font-bold">
                                {formatPrice(vehicle.offer_price ?? vehicle.price)}
                              </span>
                              {vehicle.offer_price && (
                                <span className="text-xs text-outline line-through">
                                  {formatPrice(vehicle.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="px-6 pb-6 pt-2 flex gap-3">
                      <button 
                        onClick={() => openDetails(vehicle)}
                        className="flex-1 bg-surface-container-high hover:bg-surface-container-highest py-2.5 rounded-lg text-xs font-bold border border-outline-variant/50 transition-all text-center"
                      >
                        Specs & Gallery
                      </button>
                      <button 
                        onClick={() => {
                          setBookingVehicle(vehicle);
                          setBookingForm({ name: '', email: '', phone: '', message: '' });
                        }}
                        disabled={vehicle.stock === 0}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          vehicle.stock === 0 
                            ? 'bg-surface-container text-outline cursor-not-allowed' 
                            : 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 ev-glow'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Book Ride</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-24 border-t border-outline-variant/20 bg-surface-container-low/30 relative">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Image mock column */}
            <div className="relative flex justify-center items-center">
              {/* Glow panel card decoration */}
              <div className="absolute w-72 h-72 rounded-full bg-primary-container/5 filter blur-3xl -z-10 animate-pulse"></div>
              
              <div className="glass-panel p-8 rounded-3xl border border-outline-variant/50 max-w-md w-full relative overflow-hidden space-y-6">
                <span className="material-symbols-outlined text-5xl text-secondary-fixed animate-spin" style={{ animationDuration: '6s' }}>settings</span>
                <h4 className="text-xl font-bold">Leading EV Dealership</h4>
                <p className="text-xs text-on-surface-variant">
                  We are certified sales and service channels for high-performance electric vehicles. Offering fully test-driven bikes, genuine warranty packages, spares support, and direct booking systems.
                </p>
                <div className="pt-4 grid grid-cols-2 gap-4 border-t border-outline-variant/30 text-xs">
                  <div>
                    <p className="font-bold text-primary-container">100% Reliable</p>
                    <p className="text-[10px] text-outline uppercase font-semibold">Genuine Spares</p>
                  </div>
                  <div>
                    <p className="font-bold text-secondary-fixed">Certified</p>
                    <p className="text-[10px] text-outline uppercase font-semibold">Service Network</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story column */}
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/10 border border-secondary-container/20 rounded-full text-secondary-fixed font-label-sm text-xs uppercase tracking-wider">
                <span>Revolutionizing Commute</span>
              </div>
              <h3 className="font-display-lg text-3xl md:text-4xl font-bold tracking-tight">KGN Enterprises</h3>
              <p className="text-on-surface-variant font-body-lg text-sm md:text-base leading-relaxed">
                Founded with a mission to expedite the transition to sustainable electric transportation, KGN Enterprises acts as the premier hub for high-efficiency electric scooters and bikes. 
              </p>
              <p className="text-on-surface-variant font-body-lg text-sm md:text-base leading-relaxed">
                We select EV models with cutting-edge tech (including lithium ion battery modules, smart cloud dashboards, recovery braking systems) and make the purchasing experience extremely seamless. Let our staff guide you through your first switchover!
              </p>

              {/* Stats blocks */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-outline-variant/20">
                <div>
                  <h4 className="text-3xl font-extrabold text-primary-container">5,000+</h4>
                  <p className="text-xs text-outline uppercase font-label-sm mt-1">Happy Commuters</p>
                </div>
                <div>
                  <h4 className="text-3xl font-extrabold text-secondary-fixed">12M+</h4>
                  <p className="text-xs text-outline uppercase font-label-sm mt-1">KM Traveled</p>
                </div>
                <div>
                  <h4 className="text-3xl font-extrabold text-on-surface">50+</h4>
                  <p className="text-xs text-outline uppercase font-label-sm mt-1">Charging Stations</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CONTACT SECTION (WITH ACTIVE ENQUIRY FORM) */}
        <section id="contact" className="py-24 border-t border-outline-variant/20 bg-background relative">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Contact details */}
            <div className="lg:col-span-5 space-y-8 text-left">
              <div className="space-y-3">
                <span className="text-xs font-bold text-primary-container uppercase tracking-widest block">Get In Touch</span>
                <h3 className="font-display-lg text-3xl font-bold tracking-tight">We'd Love to Hear From You</h3>
                <p className="text-on-surface-variant text-sm max-w-sm">
                  Have questions about models, specifications, finance programs, or test rides? Contact our sales office.
                </p>
              </div>

              <div className="space-y-6">
                
                {/* Address block */}
                <div className="flex gap-4 items-start">
                  <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-primary-container">
                    <span className="material-symbols-outlined text-[22px]">location_on</span>
                  </span>
                  <div>
                    <h5 className="font-bold text-sm">Showroom Address</h5>
                    <p className="text-xs text-on-surface-variant mt-1">KGN Enterprises, EV Arcade Main Road, Pune, Maharashtra - 411001</p>
                  </div>
                </div>

                {/* Phone block */}
                <div className="flex gap-4 items-start">
                  <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-secondary-fixed">
                    <span className="material-symbols-outlined text-[22px]">call</span>
                  </span>
                  <div>
                    <h5 className="font-bold text-sm">Phone Contacts</h5>
                    <p className="text-xs text-on-surface-variant mt-1">Sales: +91 98765 43210</p>
                    <p className="text-xs text-on-surface-variant">Support: +91 98765 43211</p>
                  </div>
                </div>

                {/* Email block */}
                <div className="flex gap-4 items-start">
                  <span className="p-3 bg-surface-container border border-outline-variant/30 rounded-xl text-primary-container">
                    <span className="material-symbols-outlined text-[22px]">mail</span>
                  </span>
                  <div>
                    <h5 className="font-bold text-sm">Email Address</h5>
                    <p className="text-xs text-on-surface-variant mt-1">sales@kgnenterprises.co.in</p>
                    <p className="text-xs text-on-surface-variant">info@kgnenterprises.co.in</p>
                  </div>
                </div>

              </div>

              {/* Working hours indicator */}
              <div className="p-4 bg-surface-container/40 border border-outline-variant/30 rounded-xl max-w-sm">
                <h6 className="font-bold text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">schedule</span>
                  <span>Showroom Timings</span>
                </h6>
                <p className="text-[11px] text-on-surface-variant mt-1.5">Monday - Saturday: 09:30 AM to 08:00 PM</p>
                <p className="text-[11px] text-on-surface-variant">Sunday: 10:00 AM to 04:00 PM</p>
              </div>
            </div>

            {/* Active Contact Form block */}
            <div className="lg:col-span-7">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-outline-variant shadow-xl">
                <h4 className="text-lg font-bold mb-6">Send an Inquiry</h4>
                
                <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Your Name</label>
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

                  {/* Dynamic select for specific vehicles */}
                  <div>
                    <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Select Vehicle Model (Optional)</label>
                    <select 
                      value={contactForm.vehicleId}
                      onChange={(e) => setContactForm({ ...contactForm, vehicleId: e.target.value })}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary-container transition-colors cursor-pointer"
                    >
                      <option value="none">General Inquiry (No Specific Bike)</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.brand} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Your Message</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Specify your queries here... (e.g. price breaks, test rides, color availability)"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none transition-colors resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isSubmittingContact}
                      className="w-full py-3 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {isSubmittingContact ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-on-primary-container border-t-transparent rounded-full"></span>
                          <span>Sending Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">send</span>
                          <span>Submit Showroom Inquiry</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* PREMIUM FOOTER */}
      <footer className="bg-surface border-t border-outline-variant/60 py-16">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-secondary-fixed flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-surface text-lg font-bold">electric_bike</span>
              </div>
              <h2 className="font-display-lg text-base font-bold text-on-surface">KGN Enterprises</h2>
            </div>
            <p className="text-xs text-on-surface-variant/80 max-w-sm leading-relaxed">
              Official electric showroom manager bringing you the finest lithium batteries and connectible EV scooters. Switch over to clean green energy commuting today.
            </p>
            <div className="flex gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined cursor-pointer hover:text-primary-container text-base">forum</span>
              <span className="material-symbols-outlined cursor-pointer hover:text-primary-container text-base">share</span>
              <span className="material-symbols-outlined cursor-pointer hover:text-primary-container text-base">feedback</span>
            </div>
          </div>

          {/* Quick scroll links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Showroom Navigation</h5>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li><button onClick={() => scrollToSection('home')} className="hover:text-primary-container">Home Dashboard</button></li>
              <li><button onClick={() => scrollToSection('featured')} className="hover:text-primary-container">Featured Flagships</button></li>
              <li><button onClick={() => scrollToSection('showroom')} className="hover:text-primary-container">All EV Listings</button></li>
              <li><button onClick={() => scrollToSection('offers')} className="hover:text-primary-container">Special Deals</button></li>
            </ul>
          </div>

          {/* Core tech specs */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Legal & Administration</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Authorized dealership systems under regional regulations. All price listings are ex-showroom approximations.
            </p>
            <a 
              href="/admin/login" 
              className="inline-flex items-center gap-1 text-xs text-primary-container hover:underline font-semibold"
            >
              <span>Authorized Employee Login</span>
              <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
            </a>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop mt-12 pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-outline font-medium">
          <p>© 2026 KGN Enterprises Showrooms. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-on-surface">Privacy Agreement</span>
            <span className="cursor-pointer hover:text-on-surface">Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* VEHICLE DETAILS DIALOG OVERLAY (MODAL) */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          
          {/* Main Modal panel */}
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            
            {/* Header/Close button */}
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-base">info</span>
                <span className="text-xs text-outline font-label-sm font-bold uppercase tracking-wider">Specifications Detail</span>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              
              {/* Left Column: Image Gallery & Previews */}
              <div className="md:col-span-6 p-6 border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col justify-between">
                
                {/* Large Preview */}
                <div className="space-y-4">
                  <div 
                    onClick={() => {
                      if (selectedVehicle.images?.[detailImageIdx]) {
                        setFullscreenImage(selectedVehicle.images[detailImageIdx]);
                      }
                    }}
                    className="h-64 bg-surface-container-low rounded-xl flex items-center justify-center p-4 border border-outline-variant/40 relative cursor-zoom-in group"
                  >
                    {selectedVehicle.images?.[detailImageIdx] ? (
                      <img 
                        src={selectedVehicle.images[detailImageIdx]} 
                        alt={selectedVehicle.name} 
                        className="max-h-56 object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-outline-variant">electric_scooter</span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-surface-container-high/70 backdrop-blur-sm text-[10px] font-semibold text-on-surface px-2.5 py-1 rounded flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-xs">zoom_in</span>
                      <span>Zoom Preview</span>
                    </span>
                  </div>

                  {/* Thumbnail gallery */}
                  {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto py-1">
                      {selectedVehicle.images.map((imgUrl, i) => (
                        <button 
                          key={i}
                          onClick={() => setDetailImageIdx(i)}
                          className={`w-16 h-16 rounded-lg bg-surface-container-low border overflow-hidden p-1 flex-shrink-0 transition-all ${
                            i === detailImageIdx 
                              ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container' 
                              : 'border-outline-variant/40 hover:border-outline'
                          }`}
                        >
                          <img src={imgUrl} alt={`${selectedVehicle.name} ${i + 1}`} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors visualization */}
                {selectedVehicle.colors && selectedVehicle.colors.length > 0 && (
                  <div className="pt-6 border-t border-outline-variant/15 mt-6">
                    <span className="text-[10px] text-outline font-semibold uppercase tracking-wider block mb-2.5">Available Colors:</span>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedVehicle.colors.map((colorName, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-full border border-outline-variant/30 text-xs">
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-outline-variant/50 flex-shrink-0"
                            style={{ backgroundColor: getColorHex(colorName) }}
                          ></span>
                          <span className="font-semibold text-on-surface-variant capitalize">{colorName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Specification details */}
              <div className="md:col-span-6 p-6 flex flex-col justify-between">
                
                {/* Text specs */}
                <div className="space-y-6">
                  
                  <div>
                    <span className="text-xs text-primary-container font-semibold tracking-wider uppercase">{selectedVehicle.brand}</span>
                    <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{selectedVehicle.name}</h3>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-primary-container">
                        {formatPrice(selectedVehicle.offer_price ?? selectedVehicle.price)}
                      </span>
                      {selectedVehicle.offer_price && (
                        <span className="text-sm text-outline line-through">
                          {formatPrice(selectedVehicle.price)}
                        </span>
                      )}
                      <span className="text-[10px] text-outline bg-surface-container-high px-2 py-0.5 rounded uppercase font-bold border border-outline-variant/30">
                        Ex-Showroom Price
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs uppercase font-bold tracking-wider text-outline mb-2">Description</h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {selectedVehicle.description || 'Experience the best zero carbon emission commute with this high performance electric drivetrain. Smart instrument console included.'}
                    </p>
                  </div>

                  {/* Detailed Spec Table */}
                  <div>
                    <h5 className="text-xs uppercase font-bold tracking-wider text-outline mb-3">Technical Specifications</h5>
                    <div className="bg-surface rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/20 overflow-hidden text-xs">
                      
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="font-medium text-on-surface-variant">Battery Module</span>
                        <span className="font-bold text-on-surface">{selectedVehicle.battery || 'Lithium-ion Pack'}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 p-2.5">
                        <span className="font-medium text-on-surface-variant">Certified Range</span>
                        <span className="font-bold text-secondary-fixed">{selectedVehicle.range || 'N/A'}</span>
                      </div>

                      <div className="grid grid-cols-2 p-2.5">
                        <span className="font-medium text-on-surface-variant">Top Speed</span>
                        <span className="font-bold text-primary-container">{selectedVehicle.top_speed || 'N/A'}</span>
                      </div>

                      <div className="grid grid-cols-2 p-2.5">
                        <span className="font-medium text-on-surface-variant">Charging Duration</span>
                        <span className="font-bold text-on-surface">{selectedVehicle.charging_time || 'N/A'}</span>
                      </div>

                      <div className="grid grid-cols-2 p-2.5">
                        <span className="font-medium text-on-surface-variant">Motor Power Output</span>
                        <span className="font-bold text-on-surface">{selectedVehicle.motor_power || 'N/A'}</span>
                      </div>

                    </div>
                  </div>

                  {/* Extra specifications JSON if available */}
                  {selectedVehicle.specifications && Object.keys(selectedVehicle.specifications).length > 0 && (
                    <div>
                      <h5 className="text-xs uppercase font-bold tracking-wider text-outline mb-2">Additional Features</h5>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedVehicle.specifications).map(([key, val]) => (
                          <div key={key} className="bg-surface-container-high border border-outline-variant/30 rounded px-2.5 py-1 text-[11px] font-semibold">
                            <span className="text-outline uppercase text-[10px] mr-1">{key}:</span>
                            <span className="text-on-surface">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Booking & action button */}
                <div className="pt-6 border-t border-outline-variant/15 mt-6 flex gap-3">
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="flex-1 py-3 bg-surface hover:bg-surface-container-high border border-outline-variant/40 rounded-xl text-sm font-bold transition-all"
                  >
                    Close Specs
                  </button>
                  <button 
                    onClick={() => {
                      setBookingVehicle(selectedVehicle);
                      setBookingForm({ name: '', email: '', phone: '', message: '' });
                      setSelectedVehicle(null); // Close details modal
                    }}
                    disabled={selectedVehicle.stock === 0}
                    className={`flex-2 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedVehicle.stock === 0 
                        ? 'bg-surface-container text-outline cursor-not-allowed' 
                        : 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 ev-glow'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>Book Free Test Ride</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX PREVIEW */}
      {fullscreenImage && (
        <div 
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <button 
            onClick={() => setFullscreenImage(null)} 
            className="absolute top-4 right-4 bg-surface-container/60 hover:bg-surface-container p-2 rounded-full border border-outline-variant/40"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-[90vh] object-contain animate-in zoom-in-95" 
          />
        </div>
      )}

      {/* BOOK TEST RIDE FORM DIALOG MODAL */}
      {bookingVehicle && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform scale-95 transition-transform duration-200 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
              <div>
                <h3 className="font-headline-md text-on-surface text-lg">Book Free Test Ride</h3>
                <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Exclusively at Pune Showroom</p>
              </div>
              <button 
                onClick={() => setBookingVehicle(null)} 
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 text-left">
              
              <div>
                <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Selected Ride</label>
                <div className="bg-surface border border-outline-variant/60 rounded-xl px-4 py-3 text-primary-container font-bold text-sm flex items-center justify-between">
                  <span>{bookingVehicle.brand} - {bookingVehicle.name}</span>
                  <span className="text-xs text-on-surface-variant font-medium bg-surface-container-high px-2.5 py-0.5 rounded-full border border-outline-variant/20">{bookingVehicle.category}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Full Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Phone Number *</label>
                <input 
                  type="tel"
                  required
                  placeholder="e.g. +91 99999 88888"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-outline font-semibold uppercase tracking-wider mb-2">Additional Requests / Timings</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Prefer morning slots on Saturday"
                  value={bookingForm.message}
                  onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary-container outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setBookingVehicle(null)} 
                  className="px-5 py-2.5 bg-surface text-on-surface hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-xl text-xs font-bold ev-glow transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingBooking ? (
                    <>
                      <span className="animate-spin h-3 w-3 border-2 border-on-primary-container border-t-transparent rounded-full"></span>
                      <span>Booking Slot...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Confirm Test Ride Slot</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TOAST CONTAINER FOR FEEDBACK NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => (
          <div 
            key={t.id}
            className={`flex items-center w-full p-4 text-xs rounded-xl border pointer-events-auto shadow-lg animate-in slide-in-from-bottom duration-300 ${
              t.type === 'success' 
                ? 'bg-secondary-container/10 border-secondary-container/40 text-secondary-fixed' 
                : t.type === 'error' 
                ? 'bg-error-container/10 border-error-container/40 text-error' 
                : 'bg-primary-container/10 border-primary-container/40 text-primary-container'
            }`}
          >
            <span className="material-symbols-outlined mr-3 text-sm flex-shrink-0">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="font-semibold leading-relaxed">{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
