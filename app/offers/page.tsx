'use client';

// File reviewed and JSX errors fixed as of 2026-07-15
// Addressed: nav/header structure, offers count display, heading tag closures
// Fixed: Template literal syntax errors in className attributes

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Main } from 'next/document';

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

export default function OffersPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [offerVehicles, setOfferVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Vehicle | null>(null);
  const [detailImageIdx, setDetailImageIdx] = useState<number>(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setVehicles(data || []);

      // Filter for vehicles with offers
      const offers = (data || []).filter(
        (v) => v.offer_price !== null && v.offer_price !== undefined && v.offer_price < v.price
      );

      console.log("Offer Vehicles:", offers);
      
      setOfferVehicles(offers);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.message || 'Failed to load offers.');
    } finally {
      setLoading(false);
    }
  };

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

  // Open vehicle details modal
  const openDetails = (vehicle: Vehicle) => {
    setSelectedOffer(vehicle);
    setDetailImageIdx(0);
  };

  // Close vehicle details modal
  const closeDetails = () => {
    setSelectedOffer(null);
  };

  // Open fullscreen image
  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  // Close fullscreen image
  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  // Change thumbnail image in detail view
  const changeDetailImage = (index: number) => {
    setDetailImageIdx(index);
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center py-12">
          <div className="animate-pulse h-48 w-48 rounded-full bg-surface-container-low mb-4"></div>
          <h3 className="text-lg font-bold text-on-surface">Loading Special Offers...</h3>
          <p className="text-on-surface-variant">Please wait while we load our latest deals and discounts.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-outline-variant/60 mb-4">error</span>
          <h3 className="text-lg font-bold text-on-surface">Failed to Load Offers</h3>
          <p className="text-on-surface-variant">{error}</p>
          <button
            onClick={fetchVehicles}
            className="mt-6 px-6 py-3 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg font-bold transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
        {/* OFFERS SECTION */}
        {offerVehicles.length > 0 ? (
          <>
            {/* Header */}
            <section className="py-16 bg-surface-container-lowest/20">
              <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="mb-12 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container font-label-sm text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-xs">local_offer</span>
                    <span>Special Offers</span>
                  </div>
                  <h2 className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight text-center">
                    Exclusive Deals & Discounts
                  </h2>
                  <p className="text-on-surface-variant font-body-lg text-base md:text-lg max-w-2xl mx-auto">
                    Limited-time offers on select electric vehicles. Save big on your eco-friendly ride!
                  </p>
                </div>
              </div>
            </section>

            {/* Offers Grid */}
            <section className="py-20 border-t border-outline-variant/20 bg-surface">
              <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="mb-8">
                  <h3 className="font-display-lg text-3xl font-bold tracking-tight text-center">
                    {offerVehicles.length} Special Offers Available
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 gap-6">

                  {offerVehicles.map((vehicle) => {
                  const savings = vehicle.price - (vehicle.offer_price ?? 0);
                  const discountPct = calculateSavings(vehicle);

                  return (
                    <div
                      key={vehicle.id}
                      className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/60 group hover:border-primary-container/80 transition-all duration-300 flex flex-col justify-between h-full relative"
                    >
                      {/* Discount badge */}
                      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full shadow-md">
                        -{discountPct}%
                      </div>

                      <div>
                        {/* Image */}
                        <div className="h-48 relative overflow-hidden bg-surface-container-low/40 flex items-center justify-center p-4 border-b border-outline-variant/20">
                          {vehicle.images?.[0] ? (
                            <img
                              className="max-h-40 object-contain group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              src={vehicle.images[0]}
                              alt={vehicle.name}
                              onClick={() => openDetails(vehicle)}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-4xl text-outline-variant">electric_scooter</span>
                          )}

                          {/* Stock badge */}
                          {vehicle.stock === 0 && (
                            <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-error-container/20 text-error border border-error/30 text-[10px] uppercase font-bold rounded-full backdrop-blur-md">
                              Sold Out
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-4">
                          <div>
                            <span className="text-[10px] uppercase font-semibold tracking-widest text-outline">{vehicle.brand}</span>
                            <h4 className="font-display-lg text-xl font-bold text-on-surface mt-1">{vehicle.name}</h4>
                          </div>

                          {/* Pricing */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">Offer Price</span>
                              <span className="text-2xl font-bold text-secondary-fixed">{formatPrice(vehicle.offer_price ?? 0)}</span>
                            </div>
                            {vehicle.offer_price && (
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-outline font-semibold uppercase tracking-wider line-through">Original Price</span>
                                <span className="text-xl font-bold text-on-surface-variant line-through">{formatPrice(vehicle.price)}</span>
                              </div>
                            )}
                          </div>

                          {/* Savings */}
                          <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                            <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">You Save</span>
                            <span className="text-lg font-bold text-primary-container">{formatPrice(savings)} ({discountPct}%)</span>
                          </div>

                          {/* Quick specs */}
                          <div className="mt-4 text-center text-xs text-on-surface-variant">
                            <div className="flex justify-center gap-4">
                              <span>
                                <span className="material-symbols-outlined text-xs text-secondary-fixed">battery_charging_full</span>
                                {vehicle.range}
                              </span>
                              <span className="mx-2">|</span>
                              <span>
                                <span className="material-symbols-outlined text-xs text-primary-container">speed</span>
                                {vehicle.top_speed}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="p-6 pt-0 flex gap-3">
                          <button
                            onClick={() => openDetails(vehicle)}
                            disabled={vehicle.stock === 0}
                            className={`flex-1 bg-surface-container-high hover:bg-surface-container-highest py-2.5 rounded-lg text-xs font-bold border border-outline-variant/50 transition-all text-center ${vehicle.stock === 0 ? 'cursor-not-allowed' : ''}`}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              // In a real app, this would open a booking/test ride modal
                              alert('Test ride booking feature would open here!');
                            }}
                            disabled={vehicle.stock === 0}
                            className={`flex-1 bg-primary-container hover:bg-primary-container/90 text-on-primary-container py-2.5 rounded-lg text-xs font-bold transition-all ${vehicle.stock === 0 ? 'cursor-not-allowed' : ''}`}
                          >
                            Book Test Ride
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Special Promotion Banner */}
                <div className="lg:col-span-12 mt-8">
                  <div className="bg-gradient-to-r from-primary-container/10 to-secondary-container/10 rounded-2xl p-6 border border-outline-variant/40 text-center">
                    <h4 className="font-bold text-on-surface mb-2">Limited Time Offer!</h4>
                    <p className="text-on-surface-variant">
                      Free helmet and lock with every electric scooter purchase this month!
                    </p>
                    <button className="mt-4 px-6 py-3 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg font-bold transition-all">
                      Claim Your Free Accessories
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </section>
          </>
        ) : (
        <>
          {/* No offers available */}
          <section className="py-20 bg-surface-container-lowest/20">
            <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/60">local_offer</span>
                </div>
                <h3 className="font-display-lg text-3xl font-bold tracking-tight">No Active Offers</h3>
                <p className="text-on-surface-variant">
                  Check back soon for our latest deals and discounts on electric vehicles.
                </p>
                <div className="mt-6">
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg font-bold transition-all"
                  >
                    <span className="material-symbols-outlined">home</span>
                    Browse All Vehicles
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
        )}
          {/* Vehicle Details Modal */}
          {selectedOffer && (
            <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8">
                {/* Header */}
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-base">info</span>
                    <span className="text-xs text-outline font-label-sm font-bold uppercase tracking-wider">Vehicle Details</span>
                  </div>
                  <button
                    onClick={closeDetails}
                    className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Image Gallery */}
                    <div className="md:col-span-6 p-6 border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col justify-between">
                      {/* Main Image */}
                      <div className="flex-1 mb-4">
                        <div
                          className="h-64 w-full bg-surface-container-low rounded-xl flex items-center justify-center p-4 border border-outline-variant/40 relative cursor-pointer"
                          onClick={() => {
                            if (selectedOffer.images?.[detailImageIdx]) {
                              openFullscreen(selectedOffer.images[detailImageIdx]);
                            }
                          }}
                        >
                          {selectedOffer.images?.[detailImageIdx] ? (
                            <img
                              src={selectedOffer.images[detailImageIdx]}
                              alt={selectedOffer.name}
                              className="max-h-48 object-contain"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-4xl text-outline-variant">electric_scooter</span>
                          )}
                          <span className="absolute bottom-3 right-3 bg-surface-container-high/70 backdrop-blur-sm text-[10px] font-semibold text-on-surface px-2.5 py-1 rounded flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-xs">zoom_in</span>
                            <span>Zoom</span>
                          </span>
                        </div>
                      </div>

                      {/* Thumbnails */}
                      {selectedOffer.images && selectedOffer.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto py-2">
                          {selectedOffer.images.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => changeDetailImage(i)}
                              className={`w-10 h-10 rounded-lg border overflow-hidden p-1 flex-shrink-0 transition-all ${
                                i === detailImageIdx
                                  ? 'border-primary-container bg-primary-container/10'
                                  : 'border-outline-variant/40'
                              }`}
                            >
                              <img src={img} alt={`${selectedOffer.name} ${i + 1}`} className="w-full h-full object-contain" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Color Options */}
                      {selectedOffer.colors && selectedOffer.colors.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[10px] text-outline font-semibold uppercase tracking-wider block mb-2">Available Colors:</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedOffer.colors.map((colorName, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-full border border-outline-variant/30 text-xs">
                                <span
                                  className="w-3 h-3 rounded-full border border-outline-variant/50 flex-shrink-0"
                                  style={{ backgroundColor: getColorHex(colorName) }}
                                ></span>
                                <span className="font-semibold text-on-surface-variant capitalize">{colorName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="md:col-span-6 p-6 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div>
                          <span className="text-[10px] text-primary-container font-semibold tracking-wider uppercase">{selectedOffer.brand}</span>
                          <h3 className="font-display-lg text-2xl font-bold text-on-surface mt-1">{selectedOffer.name}</h3>
                          <div className="mt-2 flex items-baseline gap-3">
                            <span className="text-2xl font-bold text-primary-container">
                              {formatPrice(selectedOffer.offer_price ?? selectedOffer.price)}
                            </span>
                            {selectedOffer.offer_price && (
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-outline font-semibold uppercase tracking-wider line-through">Original Price</span>
                                <span className="text-xl font-bold text-on-surface-variant line-through">{formatPrice(selectedOffer.price)}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <h5 className="text-xs uppercase font-bold tracking-wider text-outline mb-2">Description</h5>
                            <p className="text-on-surface-variant leading-relaxed">
                              {selectedOffer.description || 'Experience premium electric mobility with cutting-edge technology.'}
                            </p>
                          </div>

                          {/* Specifications */}
                          <div>
                            <h5 className="text-xs uppercase font-bold tracking-wider text-outline mb-3">Specifications</h5>
                            <div className="bg-surface rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/20 overflow-hidden text-xs">
                              <div className="grid grid-cols-2 p-2.5">
                                <span className="font-medium text-on-surface-variant">Battery</span>
                                <span className="font-bold text-on-surface">{selectedOffer.battery || 'Lithium-ion'}</span>
                              </div>

                              <div className="grid grid-cols-2 p-2.5">
                                <span className="font-medium text-on-surface-variant">Range</span>
                                <span className="font-bold text-secondary-fixed">{selectedOffer.range || 'N/A'}</span>
                              </div>

                              <div className="grid grid-cols-2 p-2.5">
                                <span className="font-medium text-on-surface-variant">Top Speed</span>
                                <span className="font-bold text-primary-container">{selectedOffer.top_speed || 'N/A'}</span>
                              </div>

                              <div className="grid grid-cols-2 p-2.5">
                                <span className="font-medium text-on-surface-variant">Charging Time</span>
                                <span className="font-bold text-primary-container">{selectedOffer.charging_time || 'N/A'}</span>
                              </div>

                              <div className="grid grid-cols-2 p-2.5">
                                <span className="font-medium text-on-surface-variant">Motor Power</span>
                                <span className="font-bold text-on-surface">{selectedOffer.motor_power || 'N/A'}</span>
                              </div>

                              <div className="grid grid-cols-2 p-2.5">
                                <span className="font-medium text-on-surface-variant">Availability</span>
                                <span className="font-bold text-secondary-fixed">
                                  {selectedOffer.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="mt-4">
                            <h5 className="text-xs uppercase font-bold tracking-wider text-outline mb-2">Key Features</h5>
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
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 pt-0 border-t border-outline-variant/20 flex gap-3">
                      <button
                        onClick={closeDetails}
                        className="flex-1 bg-surface-container-high hover:bg-surface-container-highest py-2.5 rounded-lg text-xs font-bold border border-outline-variant/50 transition-all text-center"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          // Test ride booking would go here
                          alert('Test ride booking feature would open here!');
                        }}
                        disabled={selectedOffer.stock === 0}
                        className={`flex-1 bg-primary-container hover:bg-primary-container/90 text-on-primary-container py-2.5 rounded-lg text-xs font-bold transition-all ${selectedOffer.stock === 0 ? 'cursor-not-allowed' : ''}`}
                      >
                        {selectedOffer.stock === 0 ? (
                          <span>Notify When Available</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>Book Test Ride</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              {offerVehicles.length > 0 ? (
                <>
                  <div className="mb-2">
                    <span className="text-[10px] text-outline font-semibold uppercase tracking-wider block">Featured Offer</span>
                    <h4 className="font-bold text-on-surface">{offerVehicles[0].brand} {offerVehicles[0].name}</h4>
                    <p className="text-on-surface-variant text-sm">
                      Save {calculateSavings(offerVehicles[0])}% - Only {formatPrice(offerVehicles[0].offer_price ?? 0)}
                    </p>
                  </div>
                  <button
                    className="w-full px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg font-bold transition-all"
                  >
                    View Offer Details
                  </button>
                </>
              ) : (
                <p className="text-on-surface-variant text-xs">
                  Check back for special offers!
                </p>
              )}
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
      </main>
    </div>
    );
}

// &#x2F;/\/ Helper function for color hex (same as in main page)
// Helper function for color hex (same as in main page)
// TEST EDIT - THIS IS A TEST
function getColorHex(colorName: string): string {
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
}  // END OF FILE MARKER