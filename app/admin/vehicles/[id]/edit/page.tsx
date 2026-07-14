'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import VehicleForm from '@/components/VehicleForm';
import { useRouter, useParams } from 'next/navigation';

export default function EditVehicle() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  async function fetchVehicle() {
    if (!id) {
      setError('Vehicle ID is required');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }
    setVehicle(data);
    setLoading(false);
  }

  // Function to handle vehicle duplication
  async function handleDuplicate() {
    if (!vehicle) return;

    setDuplicating(true);
    try {
      // Create a new vehicle object based on the current one
      // but with a modified name and cleared ID (so it will be inserted as new)
      const duplicatedVehicle = {
        ...vehicle,
        name: `${vehicle.name} Copy`,
        id: undefined, // This will make it a new record when submitted
        // Optionally reset other fields that should be unique
        // For example, if there's a slug or other unique field
      };

      // Update the vehicle state to the duplicated version
      // This will cause the form to populate with the duplicated data
      setVehicle(duplicatedVehicle);
    } catch (err) {
      console.error('Error duplicating vehicle:', err);
      setError('Failed to duplicate vehicle');
    } finally {
      setDuplicating(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen py-12">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error-container to-error-container/20">
        <div className="p-6 text-center">
          <h2 className="font-display-lg text-2xl font-bold text-error">Error</h2>
          <p className="text-on-surface-variant">{error}</p>
          <button onClick={() => router.push('/admin/vehicles')} className="mt-4 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return <div className="flex items-center justify-center min-h-screen py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <h2 className="font-display-lg text-3xl font-bold text-on-surface">Edit Vehicle</h2>
            <p className="text-on-surface-variant">
              Update the details for {vehicle.name}.
            </p>
          </div>
          <div>
            {duplicating ? (
              <button disabled className="px-4 py-2 bg-secondary-container text-on-surface-secondary rounded-lg">
                Duplicating...
              </button>
            ) : (
              <button
                onClick={handleDuplicate}
                className="px-4 py-2 bg-secondary-container text-on-surface-secondary hover:bg-secondary-container/80 rounded-lg transition-colors"
              >
                Duplicate Vehicle
              </button>
            )}
          </div>
        </div>

        <VehicleForm
          vehicle={vehicle}
          onSubmit={() => router.push(`/admin/vehicles`)}
          onCancel={() => router.push(`/admin/vehicles`)}
        />
      </div>
    </div>
  );
}