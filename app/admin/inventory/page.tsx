'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Define types for our vehicles
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

export default function Inventory() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'in stock' | 'low stock' | 'out of stock'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchVehicles();
    const subscription = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchVehicles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [filter, searchQuery]);

  async function fetchVehicles() {
    setLoading(true);
    let query = supabase.from('vehicles').select('*');

    // Apply stock filter
    if (filter === 'in stock') {
      query = query.gt('stock', 0);
    } else if (filter === 'low stock') {
      query = query.gt('stock', 0).lte('stock', 5); // Low stock: 1-5 items
    } else if (filter === 'out of stock') {
      query = query.eq('stock', 0);
    }
    // For 'all', no additional stock filter

    // Apply search filter
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,range.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  function setFilterStatus(status: 'all' | 'in stock' | 'low stock' | 'out of stock') {
    setFilter(status);
  }

  function formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function openEditVehicleModal(vehicle: Vehicle) {
    // Navigate to edit vehicle page
    router.push(`/admin/vehicles/${vehicle.id}/edit`);
  }

  function deleteVehicle(id: string) {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      supabase.from('vehicles').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error('Error deleting vehicle:', error);
        } else {
          // The subscription will trigger a refetch
        }
      });
    }
  }

  function recordSaleForVehicle(vehicleId: string) {
    // Decrement stock by 1
    supabase
      .from('vehicles')
      .update({ stock: () => 'stock - 1' })
      .eq('id', vehicleId)
      .then(({ error }) => {
        if (error) {
          console.error('Error recording sale:', error);
        } else {
          // The subscription will trigger a refetch
          console.log('Sale recorded successfully');
        }
      });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen py-12">Loading...</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-[32px] font-bold text-on-surface">Vehicle Inventory</h2>
          <p className="text-on-surface-variant font-body-md">Manage and track your fleet of premium electric vehicles.</p>
        </div>
        <button onClick={() => router.push('/admin/vehicles/new')} className="bg-primary-container text-on-primary-container py-3 px-5 rounded-lg font-bold flex items-center justify-center gap-2 ev-glow transition-all duration-150 self-start sm:self-auto active:scale-95">
          <span className="material-symbols-outlined">add</span>
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-outline-variant">
        <button
          onClick={() => setFilterStatus('all')}
          className={`${filter === 'all' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'} px-4 py-2 rounded-lg text-xs font-bold transition-all`}
        >
          All Vehicles
        </button>
        <button
          onClick={() => setFilterStatus('in stock')}
          className={`${filter === 'in stock' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'} px-4 py-2 rounded-lg text-xs font-bold transition-all`}
        >
          In Stock
        </button>
        <button
          onClick={() => setFilterStatus('low stock')}
          className={`${filter === 'low stock' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'} px-4 py-2 rounded-lg text-xs font-bold transition-all`}
        >
          Low Stock
        </button>
        <button
          onClick={() => setFilterStatus('out of stock')}
          className={`${filter === 'out of stock' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'} px-4 py-2 rounded-lg text-xs font-bold transition-all`}
        >
          Out of Stock
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search vehicles..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
        />
        <button onClick={() => searchInputRef.current?.focus()} className="text-on-surface-variant hover:text-on-surface p-2">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {/* Inventory Grid */}
      <div id="full-inventory-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {vehicles.length === 0 ? (
          <p className="col-span-full py-12 text-center text-on-surface-variant/40 border border-dashed border-outline-variant rounded-xl">No vehicles found.</p>
        ) : (
          vehicles.map((bike) => (
            <div key={bike.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col justify-between h-full">
              <div>
                <div className="h-48 relative overflow-hidden bg-surface-container-low">
                  <img className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" src={bike.images?.[0] || ''} alt={bike.name} />
                  {bike.stock > 0 ? (
                    <span className={`absolute top-4 left-4 px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider`}>
                      In Stock
                    </span>
                  ) : bike.stock === 0 ? (
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
                    <h4 className="font-headline-md text-[20px] text-on-surface group-hover:text-primary-container transition-colors">{bike.name}</h4>
                    <span className="text-xs text-outline font-label-sm">{bike.id}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-primary-container text-lg font-bold">{formatINR(bike.price)}</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary-fixed text-sm">battery</span>
                      <span className="text-xs text-on-surface-variant">{bike.range}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex gap-2">
                <button onClick={() => openEditVehicleModal(bike)} className="px-3 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary-container text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                  <span className="material-symbols-outlined text-sm block">edit</span>
                </button>
                <button onClick={() => deleteVehicle(bike.id)} className="px-3 bg-surface-container-high hover:bg-error-container/25 hover:text-error text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                  <span className="material-symbols-outlined text-sm block">delete</span>
                </button>
                <button onClick={() => recordSaleForVehicle(bike.id)} className="px-3 bg-surface-container-high hover:bg-secondary-container/20 hover:text-secondary-fixed text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                  <span className="material-symbols-outlined text-sm block">sale</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}