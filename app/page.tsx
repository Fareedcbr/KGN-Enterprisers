'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import SkeletonCard from '@/components/SkeletonCard';
import emailjs from '@emailjs/browser';

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

  async function fetchVehicles() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select('*')
        .eq('hidden', false)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setVehicles(data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  // Handle brand change
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBrand(e.target.value);
  };

  // Handle stock toggle
  const handleStockToggle = () => {
    setStockOnly(!stockOnly);
  };

  // Handle price sort change
  const handlePriceSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriceSort(e.target.value);
  };

  // Handle booking vehicle selection
  const handleSelectBookingVehicle = (vehicle: Vehicle) => {
    setBookingVehicle(vehicle);
  };

  // Handle booking form change
  const handleBookingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  // Handle contact form change
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  // Handle booking form submission
 async function handleBookingSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!bookingVehicle) return;

  if (!bookingForm.name || !bookingForm.phone) {
    showToast('Name and phone number are required to book a ride.', 'error');
    return;
  }

  setIsSubmittingBooking(true);

  try {
    const bookingMessage = bookingForm.message
      ? `[Test Ride Booking Request] ${bookingForm.message}`
      : `Requested a test ride for model: ${bookingVehicle.name}`;

    // 1. Save test ride request to Supabase
    const { error: insertErr } = await supabase.from('enquiries').insert({
      customer_name: bookingForm.name,
      email: bookingForm.email || null,
      phone: bookingForm.phone,
      vehicle_id: bookingVehicle.id,
      vehicle_name: bookingVehicle.name,
      message: bookingMessage,
      status: 'new'
    });

    if (insertErr) throw insertErr;

    // 2. Send test ride request to owner's email
    const submissionTime = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      {
        name: bookingForm.name,
        email: bookingForm.email || 'Not provided',
        phone: bookingForm.phone,
        subject: `Test Ride Request - ${bookingVehicle.name}`,
        message: bookingMessage,
        time: submissionTime
      },
      {
        publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      }
    );

    // 3. Show success message
    showToast(
      `Test ride successfully requested for ${bookingVehicle.name}! We will call you soon.`,
      'success'
    );

    // 4. Reset form and close modal
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      message: ''
    });

    setBookingVehicle(null);

  } catch (err: any) {
    console.error('Error booking test ride:', err);

    showToast(
      err?.text ||
      err?.message ||
      'Failed to request test ride. Please try again.',
      'error'
    );

   } finally {
    setIsSubmittingBooking(false);
   }
  }

  // Handle contact form submission
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

  // Calculate savings percentage
  function calculateSavings(vehicle: Vehicle): number {
    if (!vehicle.offer_price || vehicle.offer_price >= vehicle.price) return 0;
    const savings = vehicle.price - vehicle.offer_price;
    return Math.round((savings / vehicle.price) * 100);
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

  // Navigation click helper - UPDATED TO USE ACTUAL PAGES INSTEAD OF SCROLL TO SECTION
  function navigateToPage(page: string) {
    window.location.href = `/${page}`;
  }

  // Open Details panel and reset image preview index
  function openDetails(veh: Vehicle) {
    setSelectedVehicle(veh);
    setDetailImageIdx(0);
  }

  // Close Details panel
  function closeDetails() {
    setSelectedVehicle(null);
  }

  // Open Fullscreen image
  function openFullscreen(imageUrl: string) {
    setFullscreenImage(imageUrl);
  }

  // Close Fullscreen image
  function closeFullscreen() {
    setFullscreenImage(null);
  }

  // Toast helper
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

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
            <button onClick={() => navigateToPage('offers')} className="hover:text-primary-container transition-colors font-medium">Offers</button>
            <button onClick={() => navigateToPage('about')} className="hover:text-primary-container transition-colors font-medium">About</button>
            <button onClick={() => navigateToPage('contact')} className="hover:text-primary-container transition-colors font-medium text-primary-container">Contact</button>
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
        {/* HERO SECTION */}
        <section className="h-[60vh] bg-gradient-to-b from-background to-background/50 relative overflow-hidden">
          {/* Animated Background Circles */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary-fixed/10 rounded-full blur-2xl"></div>
          </div>

          <div className="relative z-10 flex h-[60vh] flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-xs">electric_bike</span>
              <span>Latest Electric Vehicles</span>
            </div>
            <h1 className="font-display-lg text-5xl md:text-6xl font-bold tracking-tight text-center mb-4">
              Discover the Future of Electric Mobility
            </h1>
            <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-3xl mx-auto">
              Explore our curated collection of premium electric scooters and motorcycles. Experience zero-emission riding with cutting-edge technology and superior performance.
            </p>

            {/* Featured Vehicles Carousel */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {loading ? (
                <>
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 flex flex-col items-center transition-all duration-300">
                      <div className="w-32 h-32 bg-surface-container/50 rounded mb-4 animate-pulse" />
                      <h3 className="font-display-md text-xl font-bold text-on-surface mb-2 h-6 w-full bg-surface-container/50 rounded animate-pulse" />
                      <p className="text-on-surface-variant text-sm text-center h-4 w-full bg-surface-container/50 rounded animate-pulse my-2" />
                      <div className="flex items-center gap-2">
                        <span className="line-through text-on-surface-variant/50 mx-1 h-4 w-16 bg-surface-container/50 rounded animate-pulse" />
                        <span className="text-error h-4 w-16 bg-surface-container/50 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                featuredVehicles.slice(0, 3).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 flex flex-col items-center transition-all duration-300 hover:bg-primary-container/5 hover:border-primary-container/20"
                    onClick={() => openDetails(vehicle)}
                  >
                    <img
                      src={vehicle.images?.[0] || ''}
                      alt={vehicle.name}
                      className="w-32 h-32 object-contain mb-4"
                    />
                    <h3 className="font-display-md text-xl font-bold text-on-surface mb-2">
                      {vehicle.name}
                    </h3>
                    <p className="text-on-surface-variant text-sm text-center">
                      {formatPrice(vehicle.offer_price || vehicle.price)}
                      {vehicle.offer_price && (
                        <>
                          <span className="line-through text-on-surface-variant/50 mx-1">
                            {formatPrice(vehicle.price)}
                          </span>
                          <span className="text-error">{calculateSavings(vehicle)}% OFF</span>
                        </>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* FEATURED VEHICLES SECTION */}
        <section className="py-20 bg-surface-container-lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">electric_bike</span>
                <span>Featured Collection</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight text-center">
                Featured Electric Vehicles
              </h2>
              <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-2xl mx-auto">
                Carefully selected premium electric vehicles that represent the pinnacle of innovation and performance.
              </p>
            </div>

            {/* Vehicle Grid */}
            <div id="featured-vehicles-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {loading ? (
                <>
                  {Array(3).fill(0).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </>
              ) : (
                featuredVehicles.length > 0 ? (
                  featuredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col justify-between h-full">
                      <div>
                        <div className="h-48 relative overflow-hidden bg-surface-container-low">
                          <img
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            src={vehicle.images?.[0] || ''}
                            alt={vehicle.name}
                          />
                          {vehicle.stock > 0 ? (
                            <span className={`absolute top-4 left-4 px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                              In Stock
                            </span>
                          ) : vehicle.stock === 0 ? (
                            <span className={`absolute top-4 left-4 px-3 py-1 bg-error-container/20 text-error border border-error/30 font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                              Out of Stock
                            </span>
                          ) : (
                            <span className={`absolute top-4 left-4 px-3 py-1 bg-surface-container text-on-surface-variant border border-outline-variant font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-headline-md text-[20px] text-on-surface group-hover:text-primary-container transition-colors">{vehicle.name}</h4>
                            <span className="text-xs text-outline font-label-sm">{vehicle.id}</span>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-primary-container text-lg font-bold">{formatPrice(vehicle.price)}</span>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary-fixed text-sm">battery</span>
                              <span className="text-xs text-on-surface-variant">{vehicle.range}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex gap-2">
                        <button onClick={() => openDetails(vehicle)} className="px-3 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary-container text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                          <span className="material-symbols-outlined text-sm block">info</span>
                        </button>
                        <button
                          onClick={() => {
                            setBookingVehicle(vehicle);
                            setBookingForm({ name: '', email: '', phone: '', message: '' });
                          }}
                          className="px-3 bg-surface-container-high hover:bg-secondary-container/20 hover:text-secondary-fixed text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all"
                        >
                          <span className="material-symbols-outlined text-sm block">ride</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full py-12 text-center text-on-surface-variant/40 border border-dashed border-outline-variant rounded-xl">No featured vehicles available.</p>
                )
              )}
            </div>
          </div>
        </section>

        {/* LATEST VEHICLES SECTION */}
        <section className="py-20 bg-surface-container-lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">electric_bike</span>
                <span>New Arrivals</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight text-center">
                Latest Electric Vehicles
              </h2>
              <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-2xl mx-auto">
                Stay ahead with our newest additions to the electric vehicle lineup.
              </p>
            </div>

            {/* Vehicle Grid */}
            <div id="latest-vehicles-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {latestVehicles.length > 0 ? (
                latestVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col justify-between h-full">
                    <div>
                      <div className="h-48 relative overflow-hidden bg-surface-container-low">
                        <img
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          src={vehicle.images?.[0] || ''}
                          alt={vehicle.name}
                        />
                        {vehicle.stock > 0 ? (
                          <span className={`absolute top-4 left-4 px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                            In Stock
                          </span>
                        ) : vehicle.stock === 0 ? (
                          <span className={`absolute top-4 left-4 px-3 py-1 bg-error-container/20 text-error border border-error/30 font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                            Out of Stock
                          </span>
                        ) : (
                          <span className={`absolute top-4 left-4 px-3 py-1 bg-surface-container text_on-surface-variant border border-outline-variant font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-headline-md text-[20px] text-on-surface group-hover:text-primary-container transition-colors">{vehicle.name}</h4>
                          <span className="text-xs text-outline font-label-sm">{vehicle.id}</span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-primary-container text-lg font-bold">{formatPrice(vehicle.price)}</span>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary-fixed text-sm">battery</span>
                            <span className="text-xs text-on-surface-variant">{vehicle.range}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex gap-2">
                      <button onClick={() => openDetails(vehicle)} className="px-3 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary-container text-xs text_on-surface-variant hover:text_on-surface py-2 rounded transition-all">
                        <span className="material-symbols-outlined text-sm block">info</span>
                      </button>
                      <button
                        onClick={() => {
                          setBookingVehicle(vehicle);
                          setBookingForm({ name: '', email: '', phone: '', message: '' });
                        }}
                        className="px-3 bg-surface-container-high hover:bg-secondary-container/20 hover:text_secondary-fixed text-xs text_on-surface-variant hover:text_on-surface py-2 rounded transition-all"
                      >
                        <span className="material-symbols-outlined text-sm block">ride</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full py-12 text-center text_on-surface-variant/40 border border-dashed border-outline-variant rounded-xl">No latest vehicles available.</p>
              )}
            </div>
          </div>
        </section>

        {/* OFFERS SECTION */}
        <section className="py-20 bg-surface_container-lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary_container/10 border border-primary_container/20 rounded-full text_primary_container font_label-sm text-xs uppercase tracking_wider">
                <span className="material-symbols-outlined text-xs">local_offer</span>
                <span>Special Offers</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-5xl font-bold tracking_tight text-center">
                Special Electric Vehicle Offers
              </h2>
              <p className="text_on-surface_variant font_body-lg text_base md:text_lg max_w-2xl mx-auto">
                Limited-time offers on select electric vehicles. Save big on your eco-friendly ride.
              </p>
            </div>

            {/* Offer Vehicles Grid */}
            <div id="offer-vehicles-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap_gutter">
              {offerVehicles.length > 0 ? (
                offerVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg_surface_container rounded-xl overflow-hidden border border_outline_variant group hover:border_primary_container transition_all flex flex_col justify-between h-full">
                    <div>
                      <div className="h-48 relative overflow-hidden bg_surface_container_low">
                        <img
                          className="w-full h-full object_contain group_hover:scale-105 transition-transform duration-500"
                          src={vehicle.images?.[0] || ''}
                          alt={vehicle.name}
                        />
                        {vehicle.stock > 0 ? (
                          <span className={`absolute top-4 left-4 px-3 py-1 bg_secondary_container text_on_secondary_container font_label_sm rounded_full text-[10px] uppercase font_bold tracking_wider`}>
                            In Stock
                          </span>
                        ) : vehicle.stock === 0 ? (
                          <span className={`absolute top-4 left-4 px-3 py-1 bg_error_container/20 text_error border border_error/30 font_label_sm rounded_full text-[10px] uppercase font_bold tracking_wider`}>
                            Out of Stock
                          </span>
                        ) : (
                          <span className={`absolute top-4 left-4 px-3 py-1 bg_surface_container text_on_surface_variant border border_outline_variant font_label_sm rounded_full text-[10px] uppercase font_bold tracking_wider`}>
                            Low Stock
                          </span>
                        )}
                        {/* Offer Badge */}
                        {vehicle.offer_price && (
                          <div className="absolute top-4 right-4 bg_error_container text_on_error font_label_sm text-xs px-2 py-1 rounded">
                            SPECIAL OFFER
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font_headline_md text-[20px] text_on_surface group_hover:text_primary_container transition_colors">{vehicle.name}</h4>
                          <span className="text_xs text_outline font_label_sm">{vehicle.id}</span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <div className="space-x-2">
                            <span className="line-through text_on_surface_variant/50">
                              {formatPrice(vehicle.price)}
                            </span>
                            <span className="text_primary_container text_lg font_bold">{formatPrice(vehicle.offer_price ?? 0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols_outlined text_secondary_fixed text_sm">battery</span>
                            <span className="text_xs text_on_surface_variant">{vehicle.range}</span>
                          </div>
                        </div>
                        {/* Savings Badge */}
                        {vehicle.offer_price && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-1 bg_primary_container/20 text_primary_container rounded">
                            <span className="material-symbols_outlined text_xs">Discount</span>
                            <span className="font_label_sm text_xs">{calculateSavings(vehicle)}% SAVINGS</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-6 pb-6 border-t border-outline_variant/20 pt-4 flex gap-2">
                      <button onClick={() => openDetails(vehicle)} className="px-3 bg_surface_container_high hover:bg_primary_container/20 hover:text_primary_container text_xs text_on_surface_variant hover:text_on_surface py_2 rounded transition_all">
                        <span className="material-symbols_outlined text_sm block">info</span>
                      </button>
                      <button
                        onClick={() => {
                          setBookingVehicle(vehicle);
                          setBookingForm({ name: '', email: '', phone: '', message: '' });
                        }}
                        className="px-3 bg_surface_container_high hover:bg_secondary_container/20 hover:text_secondary-fixed text_xs text_on_surface_variant hover:text_on_surface py_2 rounded transition_all"
                      >
                        <span className="material-symbols_outlined text_sm block">ride</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full py-12 text-center text_on_surface_variant/40 border border-dashed border-outline_variant rounded-xl">No special offers available at the moment.</p>
              )}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="py-20 bg_surface_container_lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <h2 className="font_display-lg text-3xl font_bold tracking_tight mb-6">
              Ready to Ride Electric?
            </h2>
            <p className="text_on_surface_variant font_body-lg text_base md:text_lg max_w-3xl mx-auto">
              Experience the future of transportation today. Visit our showroom or schedule a test ride to feel the power of electric mobility.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigateToPage('contact')}
                className="py-3 px-6 bg_primary_container text_on_primary_container hover:bg_primary_container/90 rounded-lg font_bold transition_all duration-200"
              >
                <span className="material-symbols_outlined mr-2">contact_support</span>
                Contact Us
              </button>
              <button
                onClick={() => navigateToPage('offers')}
                className="py-3 px-6 bg_surface_container border border_outline_variant/30 text_on_surface hover:border_primary_container/50 rounded-lg transition_all duration-200"
              >
                <span className="material-symbols_outlined mr-2">local_offer</span>
                View Offers
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Reused from main layout */}
      <footer className="bg_surface border_t border-outline_variant/60 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">

          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary_container to-secondary-fixed flex_items_center justify_center shadow-md">
                <span className="material-symbols_outlined text_surface text-lg font_bold">electric_bike</span>
              </div>
              <h2 className="font_display-lg text_base font_bold text_on_surface">KGN Enterprises</h2>
            </div>
            <p className="text_xs text_on_surface_variant/80 max-w-sm leading-relaxed">
              Official electric showroom manager bringing you the finest lithium batteries and connectibile EV scooters. Switch over to clean green energy commuting today.
            </p>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font_bold text_xs uppercase tracking_wider text_outline">Showroom Navigation</h5>
            <ul className="space-y-2 text_xs text_on_surface_variant font_medium">
              <li><button onClick={() => navigateToPage('')} className="hover:text_primary_container">Home Dashboard</button></li>
              <li><button onClick={() => navigateToPage('featured')} className="hover:text_primary_container">Featured Flagships</button></li>
              <li><button onClick={() => navigateToPage('showroom')} className="hover:text_primary_container">All EV Listings</button></li>
              <li><button onClick={() => navigateToPage('offers')} className="hover:text_primary_container">Special Deals</button></li>
            </ul>
          </div>

          {/* Core tech specs */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font_bold text_xs uppercase tracking_wider text_outline">Legal & Administration</h5>
            <p className="text_xs text_on_surface_variant leading-relaxed">
              Authorized dealership systems under regional regulations. All price listings are ex-showroom approximations.
            </p>
            <a
              href="/admin/login"
              className="inline-flex items-center gap-1 text_xs text_primary_container hover:underline font_semibold"
            >
              <span>Authorized Employee Login</span>
              <span className="material-symbols_outlined text-[14px]">arrow_right_alt</span>
            </a>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 pt-6 border-t border-outline_variant/20 flex flex-col sm:flex_row justify-between items-center gap-4 text-[10px] text_outline font_medium">
          <p>© 2026 KGN Enterprises Showrooms. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text_on_surface">Privacy Agreement</span>
            <span className="cursor-pointer hover:text_on_surface">Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg_background/85 backdrop-blur-md flex_items_center justify_center p-4 overflow-y-auto animate-in fade_in duration-200">

          {/* Main Modal panel */}
          <div className="bg_surface_container border border_outline_variant rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">

            {/* Header/Close button */}
            <div className="p-4 border-b border-outline_variant/30 flex justify-between items-center bg_surface_container_high">
              <div className="flex items-center gap-2">
                <span className="material-symbols_outlined text_primary_container text_base">info</span>
                <span className="text_xs text_outline font_label_sm font_bold uppercase tracking_wider">Specifications Detail</span>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text_on_surface_variant hover:text_on_surface p-1 rounded-md hover:bg_surface_container"
              >
                <span className="material-symbols_outlined">close</span>
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selectedVehicle.images?.[detailImageIdx] || ''}
                    alt={selectedVehicle.name}
                    className="w-full h-64 object_contain rounded-lg border border_outline_variant/40"
                  />
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg_surface_container/50 text_on_surface_variant/80 text-xs px-2 py-1 rounded">
                    {detailImageIdx + 1}/{selectedVehicle.images?.length || 0}
                  </div>
                  {/* Navigation Arrows */}
                  <div className="absolute top-1/2 left-2 -translate_y-1/2 flex_items_center">
                    <button
                      onClick={() => {
                        setDetailImageIdx((prev) => (prev > 0 ? prev - 1 : selectedVehicle.images?.length ? selectedVehicle.images.length - 1 : 0));
                      }}
                      className="p-2 bg_surface_container/50 rounded-full hover:bg_surface_container/70 transition-colors"
                    >
                      <span className="material-symbols_outlined text-[18px]">left</span>
                    </button>
                  </div>
                  <div className="absolute top-1/2 right-2 -translate_y-1/2 flex_items_center">
                    <button
                      onClick={() => {
                        setDetailImageIdx((prev) => (prev < (selectedVehicle.images?.length || 0) - 1 ? prev + 1 : 0));
                      }}
                      className="p-2 bg_surface_container/50 rounded-full hover:bg_surface_container/70 transition-colors"
                    >
                      <span className="material-symbols_outlined text-[18px]">right</span>
                    </button>
                  </div>
                </div>

                {/* Thumbnails */}
                {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedVehicle.images.map((img, index) => (
                      <div
                        key={img}
                        className={`w-10 h-10 object_contain rounded border border_outline_variant/30 ${detailImageIdx === index ? 'border_primary_container/50' : ''} cursor-pointer hover:border_primary_container/50 transition-colors`}
                        onClick={() => setDetailImageIdx(index)}
                      >
                        <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object_contain rounded" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font_display-lg text-2xl font_bold text_on_surface">{selectedVehicle.name}</h3>
                  <p className="text_on_surface_variant">
                    <span className="font_semibold">{selectedVehicle.brand}</span> |
                    <span className="text_outline">{selectedVehicle.category}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font_bold text_on_surface">Pricing</h4>
                  <div className="space-y-1">
                    {selectedVehicle.offer_price && selectedVehicle.offer_price < selectedVehicle.price ? (
                      <>
                        <p className="flex items-center gap-2">
                          <span className="material-symbols_outlined text_primary_container">price</span>
                          <span className="text_primary_container text-xl font_bold">{formatPrice(selectedVehicle.offer_price)}</span>
                        </p>
                        <p className="flex items-center gap-2 text_on_surface_variant/50">
                          <span className="material-symbols_outlined text-xs">price_check</span>
                          <span className="line-through">{formatPrice(selectedVehicle.price)}</span>
                        </p>
                        <p className="flex items-center gap-2 text_primary_container">
                          <span className="material-symbols_outlined text-xs">discount</span>
                          <span className="font_bold">{calculateSavings(selectedVehicle)}% OFF</span>
                        </p>
                      </>
                    ) : (
                      <p className="flex items-center gap-2">
                        <span className="material-symbols_outlined text_primary_container">price</span>
                        <span className="text_primary_container text-xl font_bold">{formatPrice(selectedVehicle.price)}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font_bold text_on_surface">Specifications</h4>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">battery</span>
                      <span>{selectedVehicle.battery}</span>
                    </p>
                    <p className="fx items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">Range</span>
                      <span>{selectedVehicle.range}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">charging_time</span>
                      <span>{selectedVehicle.charging_time}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">speed</span>
                      <span>{selectedVehicle.top_speed}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">Motor</span>
                      <span>{selectedVehicle.motor_power}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font_bold text_on_surface">Availability</h4>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">inventory_2</span>
                      <span>{selectedVehicle.stock > 0 ? 'In Stock' : selectedVehicle.stock === 0 ? 'Out of Stock' : 'Low Stock'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols_outlined text_secondary_fixed">local_shipping</span>
                      <span>{selectedVehicle.availability}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font_bold text_on_surface">Description</h4>
                  <p className="text_on_surface_variant whitespace_pre_line">{selectedVehicle.description}</p>
                </div>

                {selectedVehicle.specifications && (
                  <div className="space-y-2">
                    <h4 className="font_bold text_on_surface">Technical Specifications</h4>
                    <pre className="bg_surface_container_low p-3 rounded text_on_surface_variant text-xs overflow-auto whitespace_pre_wrap">{JSON.stringify(selectedVehicle.specifications, null, 2)}</pre>
                  </div>
                )}

                {/* Color Selector */}
                {selectedVehicle.colors && selectedVehicle.colors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font_bold text_on_surface">Available Colors</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVehicle.colors.map((color) => (
                        <div
                          key={color}
                          className={`w-10 h-10 rounded-full border border_outline_variant/30 cursor-pointer hover:border_primary_container/50 transition_colors`}
                          style={{ backgroundColor: getColorHex(color) }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex_row gap-3">
                  <button
                    onClick={() => {
                      setBookingVehicle(selectedVehicle);
                      setBookingForm({ name: '', email: '', phone: '', message: '' });
                    }}
                    className="flex-1 py-3 bg_primary_container text_on_primary_container hover:bg_primary_container/90 rounded-lg font_bold transition_all"
                  >
                    <span className="material-symbols_outlined mr-2">ride</span>
                    Book Test Ride
                  </button>
                  <button
                    onClick={() => {
                      setContactForm({
                        ...contactForm,
                        vehicleId: selectedVehicle.id
                      });
                      setSelectedVehicle(null);
                      // Scroll to contact section would go here in a real app
                    }}
                    className="flex-1 py-3 bg_surface_container border border_outline_variant/30 text_on_surface hover:border_primary_container/50 rounded-lg transition_all"
                  >
                    <span className="material-symbols_outlined mr-2">contact_support</span>
                    Contact About This Vehicle
                  </button>
                </div>
              </div>
            </div>

            {/* Fullscreen Image Modal */}
            {fullscreenImage && (
              <div className="fixed inset-0 z-50 bg_background/95 backdrop-blur-md flex_items_center justify_center">
                <div className="relative w-full max-w-xl">
                  <button
                    onClick={closeFullscreen}
                    className="absolute top-2 right-2 text_on_surface_variant hover:text_on_surface p-1 rounded-md hover:bg_surface_container"
                  >
                    <span className="material-symbols_outlined">close</span>
                  </button>
                  <img
                    src={fullscreenImage}
                    alt="Fullscreen"
                    className="w-full h-96 object_contain rounded-lg border border_outline_variant/30"
                  />
                  <div className="absolute bottom-2 left-2 right-2 text-center text_on_surface_variant/80 text-xs">
                    Click to close
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingVehicle && (
        <div className="fixed inset-0 z-50 bg_background/85 backdrop-blur-md flex_items_center justify_center p-4 overflow-y-auto animate-in fade_in duration-200">

          {/* Booking Modal panel */}
          <div className="bg_surface_container border border_outline_variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">

            {/* Header/Close button */}
            <div className="p-4 border-b border-outline_variant/30 flex justify-between items-center bg_surface_container_high">
              <div className="flex items-center gap-2">
                <span className="material-symbols_outlined text_primary_container text_base">ride</span>
                <span className="text_xs text_outline font_label_sm font_bold uppercase tracking_wider">Book Test Ride</span>
              </div>
              <button
                onClick={() => {
                  setBookingVehicle(null);
                  setBookingForm({ name: '', email: '', phone: '', message: '' });
                }}
                className="text_on_surface_variant hover:text_on_surface p-1 rounded-md hover:bg_surface_container"
              >
                <span className="material-symbols_outlined">close</span>
              </button>
            </div>

            {/* Booking Form */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font_display-lg text-2xl font_bold text_on_surface">{bookingVehicle.name}</h3>
                <p className="text_on_surface_variant">
                  <span className="font_semibold">{bookingVehicle.brand}</span> |
                  <span className="text_outline">{bookingVehicle.category}</span>
                </p>
                <img
                  src={bookingVehicle.images?.[0] || ''}
                  alt={bookingVehicle.name}
                  className="w-full h-48 object_contain rounded-lg border border_outline_variant/30"
                />
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text_outline font_semibold uppercase tracking_wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={bookingForm.name}
                    onChange={handleBookingFormChange}
                    required
                    className="w-full bg_surface border border_outline_variant rounded-xl px-4 py-2.5 text-sm text_on_surface placeholder:text_on_surface_variant/30 focus:border_primary_container outline-none transition_colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text_outline font_semibold uppercase tracking_wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={bookingForm.email}
                    onChange={handleBookingFormChange}
                    className="w-full bg_surface border border_outline_variant rounded-xl px-4 py-2.5 text-sm text_on_surface placeholder:text_on_surface_variant/30 focus:border_primary_container outline-none transition_colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text_outline font_semibold uppercase tracking_wider mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingForm.phone}
                    onChange={handleBookingFormChange}
                    required
                    className="w-full bg_surface border border_outline_variant rounded-xl px-4 py-2.5 text_sm text_on_surface placeholder:text_on_surface_variant/30 focus:border_primary_container outline-none transition_colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text_outline font_semibold uppercase tracking_wider mb-2">Message (Optional)</label>
                  <textarea
                    rows={4}
                    name="message"
                    value={bookingForm.message}
                    onChange={handleBookingFormChange}
                    placeholder="Any specific questions or requirements for your test ride?"
                    className="w-full bg_surface border border_outline_variant rounded-xl px-4 py-2.5 text_sm text_on_surface placeholder:text_on_surface_variant/30 focus:border_primary_container outline-none transition_colors resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full py-3 bg_primary_container text_on_primary_container hover:bg_primary_container/90 rounded-xl text-sm font_bold flex_items_center justify_center gap-2 transition_all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmittingBooking ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border_on_primary_container border-t-transparent rounded-full"></span>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols_outlined text-[18px]">ride</span>
                        <span>Request Test Ride</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-3 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg_secondary_container/90 text_secondary_fixed'
                : toast.type === 'error'
                ? 'bg_error_container/90 text_error'
                : 'bg_primary_container/90 text_on_primary_container'
            }`}
          >
            <span className="material-symbols_outlined mr-3 w-5 h-5 flex_shrink-0">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <div className="flex-1">
              <p className="text-sm font_medium">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}