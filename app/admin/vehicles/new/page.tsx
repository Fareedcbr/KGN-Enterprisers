'use client';

import VehicleForm from '@/components/VehicleForm';
import { useRouter } from 'next/navigation';

export default function NewVehicle() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="font-display-lg text-3xl font-bold text-on-surface">
            Add New Vehicle
          </h1>
          <p className="text-on-surface-variant">
            Enter the details for the new electric vehicle to add to the showroom.
          </p>
        </div>

        <VehicleForm
          vehicle={undefined}
          onSubmit={() => router.push('/admin/vehicles')}
          onCancel={() => router.push('/admin/vehicles')}
        />
      </div>
    </div>
  );
}