'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import VehicleForm from '@/components/VehicleForm';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
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
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }

  function handleAddVehicle() {
    setEditVehicle(null);
    setShowForm(true);
  }

  function handleEditVehicle(vehicle) {
    setEditVehicle(vehicle);
    setShowForm(true);
  }

  function handleDeleteVehicle(id) {
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

  function handleFormClose() {
    setShowForm(false);
    setEditVehicle(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="font-display-lg text-[32px] font-bold text-on-surface">Vehicle Inventory</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleAddVehicle} className="bg-primary-container text-on-primary-container py-3 px-5 rounded-lg font-bold flex items-center justify-center gap-2 ev-glow transition-all duration-150 active:scale-95">
            <span className="material-symbols-outlined">add</span>
            <span>Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search vehicles..."
          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
        />
        <select
          onChange={(e) => {
            // TODO: Implement filter
          }}
          className="bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary-container outline-none"
        >
          <option value="all">All Vehicles</option>
          <option value="in stock">In Stock</option>
          <option value="low stock">Low Stock</option>
          <option value="out of stock">Out of Stock</option>
        </select>
      </div>

      {/* Vehicle Grid */}
      <div id="full-inventory-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {vehicles.length === 0 ? (
          <p className="col-span-full py-12 text-center text-on-surface-variant/40 border border-dashed border-outline-variant rounded-xl">No vehicles found.</p>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col justify-between h-full">
              <div>
                <div className="h-48 relative overflow-hidden bg-surface-container-low">
                  <img className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" src={vehicle.images?.[0] || ''} alt={vehicle.name} />
                  <div className="absolute top-4 left-4 px-3 py-1 font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider {vehicle.stock > 0 ? 'bg-secondary-container text-on-secondary-container' : vehicle.stock === 0 ? 'bg-error-container/20 text-error border border-error/30' : 'bg-surface-container text-on-surface-variant border border-outline-variant'}">
                    {vehicle.stock > 0 ? 'In Stock' : vehicle.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-headline-md text-[20px] text-on-surface group-hover:text-primary-container transition-colors">{vehicle.name}</h4>
                    <span className="text-xs text-outline font-label-sm">{vehicle.id}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-primary-container text-lg font-bold">{vehicle.price ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(vehicle.price) : '₹0'}</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary-fixed text-sm">{vehicle.battery_icon || 'battery_full'}</span>
                      <span className="text-xs text-on-surface-variant">{vehicle.range}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex gap-2">
                <button onClick={() => handleEditVehicle(vehicle)} className="px-3 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary-container text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                  <span className="material-symbols-outlined text-sm block">edit</span>
                </button>
                <button onClick={() => handleDeleteVehicle(vehicle.id)} className="px-3 bg-surface-container-high hover:bg-error-container/25 hover:text-error text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                  <span className="material-symbols-outlined text-sm block">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="glass-panel w-full max-w-xl rounded-xl overflow-hidden shadow-2xl transform scale-95 transition-transform duration-300 mx-4">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-on-surface text-lg">{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button onClick={handleFormClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-container">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <VehicleForm
              vehicle={editVehicle}
              onSubmit={handleFormClose}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}