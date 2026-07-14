'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFiles } from '@/lib/storage';
import { Vehicle } from '@/types/vehicle';

interface VehicleFormProps {
  vehicle?: Vehicle; // The vehicle object for editing, undefined for creating
  onSubmit: () => void;
  onCancel: () => void;
}

export default function VehicleForm({ vehicle, onSubmit, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: 0,
    offer_price: 0,
    battery: '',
    range: '',
    charging_time: '',
    top_speed: '',
    motor_power: '',
    description: '',
    specifications: '',
    colors: '',
    featured: false,
    availability: 'available',
    stock: 0,
    hidden: false,
    images: [] as string[],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form with vehicle data if editing
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        brand: vehicle.brand || '',
        category: vehicle.category || '',
        price: vehicle.price || 0,
        offer_price: vehicle.offer_price || 0,
        battery: vehicle.battery || '',
        range: vehicle.range || '',
        charging_time: vehicle.charging_time || '',
        top_speed: vehicle.top_speed || '',
        motor_power: vehicle.motor_power || '',
        description: vehicle.description || '',
        specifications: vehicle.specifications ? JSON.stringify(vehicle.specifications, null, 2) : '',
        colors: vehicle.colors ? vehicle.colors.join(', ') : '',
        featured: vehicle.featured || false,
        availability: vehicle.availability || 'available',
        stock: vehicle.stock || 0,
        hidden: vehicle.hidden ?? false,
        images: vehicle.images || [],
      });
      // Set preview URLs to existing images
      setPreviewUrls(vehicle.images || []);
    } else {
      // Reset form for new vehicle
      setFormData({
        name: '',
        brand: '',
        category: '',
        price: 0,
        offer_price: 0,
        battery: '',
        range: '',
        charging_time: '',
        top_speed: '',
        motor_power: '',
        description: '',
        specifications: '',
        colors: '',
        featured: false,
        availability: 'available',
        stock: 0,
        hidden: false,
        images: [],
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;

    // Handle file input separately
    if (target instanceof HTMLInputElement && target.type === 'file' && target.name === 'images') {
      if (target.files) {
        const files = Array.from(target.files);
        setSelectedFiles(files);
        const previewURLs = files.map((file: File) => URL.createObjectURL(file));
        setPreviewUrls(previewURLs);
      }
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const checked = target.checked;
      setFormData(prev => ({ ...prev, [target.name]: checked }));
    } else if (target instanceof HTMLInputElement && (target.type === 'number' || target.type === 'range')) {
      setFormData(prev => ({ ...prev, [target.name]: target.value ? parseFloat(target.value) : 0 }));
    } else if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      setFormData(prev => ({ ...prev, [target.name]: target.value }));
    } else if (target instanceof HTMLSelectElement) {
      setFormData(prev => ({ ...prev, [target.name]: target.value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload images if there are new files
      let imageUrls = formData.images; // Start with existing images
      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadFiles(selectedFiles, 'vehicle-images');
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      // Prepare vehicle data
      const vehicleData = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        price: formData.price,
        offer_price: formData.offer_price > 0 ? formData.offer_price : null,
        battery: formData.battery,
        range: formData.range,
        charging_time: formData.charging_time,
        top_speed: formData.top_speed,
        motor_power: formData.motor_power,
        description: formData.description,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : null,
        colors: formData.colors ? formData.colors.split(',').map((c: string) => c.trim()) : [],
        featured: formData.featured,
        availability: formData.availability,
        stock: formData.stock,
        hidden: formData.hidden,
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      if (vehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);

        if (error) throw error;
        setSuccess('Vehicle updated successfully!');
      } else {
        // Insert new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (error) throw error;
        setSuccess('Vehicle added successfully!');
      }

      // Reset form after success
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    // Revoke object URLs to prevent memory leaks (only those created with URL.createObjectURL)
    previewUrls.forEach(url => {
      try {
        // Only revoke object URLs (those starting with blob:)
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        // Ignore errors if URL was already revoked
      }
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Model Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Brand</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            required
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Category</label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Price (₹)</label>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Offer Price (₹)</label>
          <input
            name="offer_price"
            type="number"
            value={formData.offer_price}
            onChange={handleChange}
            min="0"
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Battery</label>
          <input
            name="battery"
            value={formData.battery}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Range</label>
          <input
            name="range"
            value={formData.range}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Charging Time</label>
          <input
            name="charging_time"
            value={formData.charging_time}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Top Speed</label>
          <input
            name="top_speed"
            value={formData.top_speed}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Motor Power</label>
          <input
            name="motor_power"
            value={formData.motor_power}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
      </div>

      {/* Description and Specifications */}
      <div className="space-y-4">
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Specifications (JSON)</label>
          <textarea
            name="specifications"
            value={formData.specifications}
            onChange={handleChange}
            rows={4}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
            placeholder='{"battery_capacity": "60 kWh", "motor_type": "PMSM", "charging_type": "CCS"}'
          />
        </div>
      </div>

      {/* Colors and Availability */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Colors (comma separated)</label>
          <input
            name="colors"
            value={formData.colors}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
            placeholder="Red, Blue, Black, White"
          />
        </div>
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Availability</label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary-container outline-none"
          >
            <option value="available">Available</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Featured, Hidden, and Stock */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={handleChange}
            className="h-4 w-4 text-primary-container focus:ring-primary-container border-offset-2"
          />
          <label className="text-xs text-on-surface-variant font-label-sm">Featured Vehicle</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="hidden"
            checked={formData.hidden}
            onChange={handleChange}
            className="h-4 w-4 text-primary-container focus:ring-primary-container border-offset-2"
          />
          <label className="text-xs text-on-surface-variant font-label-sm">Hide from Public</label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-on-surface-variant font-label-sm">Stock</label>
          <input
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className="w-20 bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface text-center focus:border-primary-container outline-none"
          />
        </div>
      </div>

      {/* Image Management */}
      <div className="space-y-4">
        <div>
          <label className="block font-label-sm text-xs text-outline uppercase tracking-wider mb-2">Vehicle Images</label>
          <div className="space-y-4">
            {/* Existing Images Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-on-surface-variant">Current Images ({formData.images.length})</span>
                <button
                  onClick={() => {
                    const confirmRemove = window.confirm('Are you sure you want to remove all images?');
                    if (confirmRemove) {
                      setFormData(prev => ({ ...prev, images: [] }));
                    }
                  }}
                  className="text-xs text-error hover:text-error/70"
                >
                  Remove All
                </button>
              </div>

              {formData.images.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {formData.images.map((imageUrl, index) => (
                    <div key={imageUrl} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Vehicle image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-outline-variant/40 hover:border-primary-container transition-colors"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => {
                            const newImages = [...prev.images];
                            newImages.splice(index, 1);
                            return { ...prev, images: newImages };
                          });
                        }}
                        className="absolute top-2 right-2 -z-10 flex h-6 w-6 items-center justify-center rounded-full bg-error/90 text-xs font-medium text-error hover:bg-error/100"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/50 text-center py-4">No images uploaded yet</p>
              )}
            </div>

            {/* New Images Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-on-surface-variant">Add New Images</span>
                <button
                  onClick={() => {
                    // Trigger file input click
                    const fileInput = document.getElementById('vehicle-image-upload');
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                  className="text-xs text-primary-container hover:text-primary-container/70"
                >
                  Add More
                </button>
              </div>
              <input
                id="vehicle-image-upload"
                type="file"
                name="images"
                multiple
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
              {selectedFiles.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {selectedFiles.map((file, index) => (
                    <div key={file.name + index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-outline-variant/40 hover:border-primary-container transition-colors"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Revoke the object URL for this file
                          URL.revokeObjectURL(previewUrls[index]);
                          setSelectedFiles(prev => {
                            const newFiles = [...prev];
                            newFiles.splice(index, 1);
                            return newFiles;
                          });
                          setPreviewUrls(prev => {
                            const newUrls = [...prev];
                            newUrls.splice(index, 1);
                            return newUrls;
                          });
                        }}
                        className="absolute top-2 right-2 -z-10 flex h-6 w-6 items-center justify-center rounded-full bg-error/90 text-xs font-medium text-error hover:bg-error/100"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-on-surface-variant">
          {formData.images.length} existing + {selectedFiles.length} new = {formData.images.length + selectedFiles.length} total images
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-5 py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-lg text-sm font-bold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-lg text-sm font-bold ev-glow ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 mb-4 bg-error-container/20 text-error rounded-lg">
          <span className="material-symbols-outlined mr-2">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mb-4 bg-secondary-container/20 text-secondary-fixed rounded-lg">
          <span className="material-symbols-outlined mr-2">check_circle</span>
          {success}
        </div>
      )}
    </form>
  );
}