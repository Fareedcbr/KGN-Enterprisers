'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  updated_at: string;
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Format price in Indian Rupees
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate savings percentage
  const calculateSavings = (vehicle: Vehicle) => {
    if (!vehicle.offer_price) return 0;
    const savings = vehicle.price - vehicle.offer_price;
    return Math.round((savings / vehicle.price) * 100);
  };

  // Open fullscreen image
  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  // Close fullscreen image
  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  // Change thumbnail image
  const changeImage = (index: number) => {
    setActiveImageIndex(index);
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    if (!id) {
      setError('Vehicle ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;
      if (!data) {
        setError('Vehicle not found');
        setLoading(false);
        return;
      }

      setVehicle(data as Vehicle);
    } catch (err: any) {
      console.error('Error fetching vehicle:', err);
      setError(err.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center py-12">
          <div className="animate-pulse h-48 w-48 rounded-full bg-surface-container-low mb-4"></div>
          <h3 className="text-lg font-bold text-on-surface">Loading Vehicle Details...</h3>
          <p className="text-on-surface-variant">Please wait while we load the vehicle information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-outline-variant/60 mb-4">error</span>
          <h3 className="text-lg font-bold text-on-surface">Vehicle Not Found</h3>
          <p className="text-on-surface-variant">{error}</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg font-bold transition-all"
            >
              <span className="material-symbols-outlined">home</span>
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    // Should not happen, but fallback
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center py-12">
          <h3 className="text-lg font-bold text-on-surface">Vehicle Not Available</h3>
          <p className="text-on-surface-variant">The requested vehicle could not be found.</p>
        </div>
      </div>
    );
  }

  const savings = vehicle.offer_price ? vehicle.price - vehicle.offer_price : 0;
  const discountPct = vehicle.offer_price ? calculateSavings(vehicle) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Header - Reused from main layout */}
      <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
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
            <button onClick={() => window.location.href = '/'} className="hover:text-primary-container transition-colors font-medium">Home</button>
            <button onClick={() => window.location.href = '/about'} className="hover:text-primary-container transition-colors font-medium">About</button>
            <button className="hover:text-primary-container transition-colors font-medium text-primary-container">Offers</button>
            <button onClick={() => window.location.href = '/contact'} className="hover:text-primary-container transition-colors font-medium">Contact</button>
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
        {/* Vehicle Details */}
        <section className="py-16 bg-surface-container-lowest/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Back to Home Link */}
            <div className="mb-8">
              <a href="/" className="text-on-surface-variant hover:text-primary-container transition-colors text-sm font-label-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-xs">arrow_back</span>
                Back to Home
              </a>
            </div>

            {/* Image Gallery */}
            <div className="mb-8">
              {/* Main Image */}
              <div
                className="h-96 w-full bg-surface-container-low rounded-xl flex items-center justify-center p-4 border border-outline-variant/40 relative cursor-pointer"
                onClick={() => {
                  if (vehicle.images?.[activeImageIndex]) {
                    openFullscreen(vehicle.images[activeImageIndex]);
                  }
                }}
              >
                {vehicle.images?.[activeImageIndex] ? (
                  <img
                    src={vehicle.images[activeImageIndex]}
                    alt={vehicle.name}
                    className="max-h-full object-contain"
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-outline-variant">electric_scooter</span>
                )}
                <span className="absolute bottom-3 right-3 bg-surface-container-high/70 backdrop-blur-sm text-[10px] font-semibold text-on-surface px-2.5 py-1 rounded flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-xs">zoom_in</span>
                  <span>Zoom</span>
                </span>
              </div>

              {/* Thumbnails */}
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {vehicle.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => changeImage(i)}
                      className={`w-10 h-10 rounded-lg border overflow-hidden p-1 flex-shrink-0 transition-all ${
                        i === activeImageIndex
                          ? 'border-primary-container bg-primary-container/10'
                          : 'border-outline-variant/40'
                      }`}
                    >
                      <img src={img} alt={`${vehicle.name} ${i + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <div className="space-y-6">
              <div>
                <span className="text-xs text-primary-container font-semibold tracking-wider uppercase">{vehicle.brand}</span>
                <h2 className="font-display-lg text-3xl font-bold text-on-surface mt-1">{vehicle.name}</h2>
                <div className="mt-2 flex items-baseline gap-3">
                  {vehicle.offer_price ? (
                    <>
                      <span className="text-2xl font-bold text-primary-container">
                        {formatPrice(vehicle.offer_price)}
                      </span>
                      <span className="text-sm text-outline line-through">
                        {formatPrice(vehicle.price)}
                      </span>
                      <span className="text-[10px] text-outline bg-surface-container-high px-2 py-0.5 rounded uppercase font-bold border border-outline-variant/30">
                        Ex-Showroom Price
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-primary-container">
                        {formatPrice(vehicle.price)}
                      </span>
                    </>
                  )}
                </div>
                {vehicle.offer_price && (
                  <div className="mt-2 flex justify-between items-center pt-2 border-t border-outline-variant/20">
                    <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">You Save</span>
                    <span className="text-lg font-bold text-primary-container">{formatPrice(savings)} ({discountPct}%)</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-outline mb-2">Description</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {vehicle.description || 'Experience premium electric mobility with cutting-edge technology.'}
                </p>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-outline mb-3">Specifications</h3>
                <div className="bg-surface rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/20 overflow-hidden text-xs">
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-medium text-on-surface-variant">Battery</span>
                    <span className="font-bold text-on-surface">{vehicle.battery || 'Lithium-ion'}</span>
                  </div>

                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-medium text-on-surface-variant">Range</span>
                    <span className="font-bold text-secondary-fixed">{vehicle.range || 'N/A'}</span>
                  </div>

                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-medium text-on-surface-variant">Top Speed</span>
                    <span className="font-bold text-primary-container">{vehicle.top_speed || 'N/A'}</span>
                  </div>

                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-medium text-on-surface-variant">Charging Time</span>
                    <span className="font-bold text-primary-container">{vehicle.charging_time || 'N/A'}</span>
                  </div>

                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-medium text-on-surface-variant">Motor Power</span>
                    <span className="font-bold text-on-surface">{vehicle.motor_power || 'N/A'}</span>
                  </div>

                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-medium text-on-surface-variant">Availability</span>
                    <span className="font-bold text-secondary-fixed">
                      {vehicle.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-outline mb-2">Key Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-primary-container">eco</span>
                    <span className="text-on-surface-variant">Zero Emissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-secondary-fixed">battery_charging_full</span>
                    <span className="text-on-surface-variant">Low Operating Cost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-primary-container">speed</span>
                    <span className="text-on-surface-variant">Instant Torque</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-secondary-fixed">wheelchair_pickup</span>
                    <span className="text-on-surface-variant">Easy to Ride</span>
                  </div>
                </div>
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
              Official electric showroom manager bringing you the finest lithium batteries and connectible EV scooters. Switch over to clean green energy commuting today.
            </p>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Navigate</h5>
            <ul className="space-y-2 text-xs text-on-surface-variant font-medium">
              <li><button onClick={() => window.location.href = '/'} className="hover:text-primary-container">Home</button></li>
              <li><button onClick={() => window.location.href = '/about'} className="hover:text-primary-container">About</button></li>
              <li><button onClick={() => window.location.href = '/contact'} className="hover:text-primary-container">Contact</button></li>
            </ul>
          </div>

          {/* Special Offers Highlight */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-outline">Today's Deal</h5>
            {/* We could fetch offers here, but for simplicity we'll show a placeholder */}
            <p className="text-on-surface-variant text-xs">
              Check back for special offers!
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