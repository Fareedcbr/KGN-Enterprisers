'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Enquiry {
  id: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  vehicles: { name: string } | null;
  vehicle_name: string | null;
  message: string;
  status: 'new' | 'contacted' | 'quoted' | 'sold' | 'lost';
  created_at: string;
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const router = useRouter();

  function exportEnquiriesToCSV() {
    if (!enquiries.length) {
      alert('No enquiries to export');
      return;
    }

    // Define CSV headers
    const headers = ['ID', 'Customer Name', 'Email', 'Phone', 'Vehicle Name', 'Message', 'Status', 'Created At'];

    // Map enquiries to CSV rows
    const rows = enquiries.map(enquiry => {
      const vehicleName = enquiry.vehicles?.name || enquiry.vehicle_name || 'N/A';
      return [
        enquiry.id,
        enquiry.customer_name,
        enquiry.email || '',
        enquiry.phone || '',
        vehicleName,
        enquiry.message.replace(/"/g, '""'), // Escape double quotes
        enquiry.status,
        enquiry.created_at
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => {
        // Escape fields with commas and quotes
        return row.map(field => {
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        }).join(',')
      })
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `enquiries_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    fetchEnquiries();
    const subscription = supabase
      .channel('enquiries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        fetchEnquiries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchEnquiries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('enquiries')
      .select('*, vehicles(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enquiries:', error);
    } else {
      setEnquiries(data || []);
    }
    setLoading(false);
  }

  function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function viewEnquiry(enquiry: Enquiry) {
    setSelectedEnquiry(enquiry);
    setShowDetails(true);
  }

  function closeDetails() {
    setShowDetails(false);
    setSelectedEnquiry(null);
  }

  function updateStatus(enquiryId: string, status: Enquiry['status']) {
    supabase
      .from('enquiries')
      .update({ status })
      .eq('id', enquiryId)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating enquiry status:', error);
        } else {
          // Refetch to update the list
          fetchEnquiries();
          // Close detail panel if open
          if (selectedEnquiry?.id === enquiryId) {
            closeDetails();
          }
        }
      });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <h2 className="font-display-lg text-[32px] font-bold text-on-surface">Customer Enquiries</h2>
          <button
            onClick={exportEnquiriesToCSV}
            className="px-4 py-2 bg-secondary-container text-on-surface-secondary hover:bg-secondary-container/80 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* No add button for enquiries as they come from customers */}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search enquiries..."
          className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container outline-none"
        />
        <select
          onChange={(e) => {
            // TODO: Implement filter
          }}
          className="bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary-container outline-none"
        >
          <option value="all">All Enquiries</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="quoted">Quoted</option>
          <option value="sold">Sold</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Enquiries Table */}
      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="p-4 font-label-sm text-outline uppercase tracking-wider text-xs">ID</th>
                <th className="p-4 font-label-sm text-outline uppercase tracking-wider text-xs">Customer</th>
                <th className="p-4 font-label-sm text-outline uppercase tracking-wider text-xs">Vehicle</th>
                <th className="p-4 font-label-sm text-outline uppercase tracking-wider text-xs">Message</th>
                <th className="p-4 font-label-sm text-outline uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-label-sm text-outline uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-body-md text-sm">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant/40">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="p-4 font-label-sm font-bold text-primary-container">{enquiry.id}</td>
                    <td className="p-4 text-on-surface font-semibold">{enquiry.customer_name}</td>
                    <td className="p-4 text-on-surface-variant">{enquiry.vehicles?.name || enquiry.vehicle_name || 'N/A'}</td>
                    <td className="p-4 text-on-surface-variant">{enquiry.message}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        enquiry.status === 'new'
                          ? 'bg-secondary-container/20 text-secondary-fixed'
                          : enquiry.status === 'contacted'
                          ? 'bg-surface-container-high text-on-surface-variant'
                          : enquiry.status === 'quoted'
                          ? 'bg-primary-container/20 text-primary-container'
                          : enquiry.status === 'sold'
                          ? 'bg-secondary-container/20 text-secondary-fixed'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewEnquiry(enquiry)}
                          className="text-on-surface-variant hover:text-primary-container transition-colors p-1"
                          title="View details"
                        >
                          <span className="material-symbols-outlined text-sm block">visibility</span>
                        </button>
                        <button
                          onClick={() => {
                            // Quick status update example
                            const newStatus =
                              enquiry.status === 'new' ? 'contacted' : enquiry.status === 'contacted' ? 'quoted' : enquiry.status;
                            updateStatus(enquiry.id, newStatus);
                          }}
                          className="text-on-surface-variant hover:text-primary-container transition-colors p-1"
                          title="Update status"
                        >
                          <span className="material-symbols-outlined text-sm block">refresh</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiry Details Sidebar */}
      {showDetails && selectedEnquiry && (
        <div className="fixed inset-0 z-[100] flex items-start">
          <div className="glass-panel w-full max-w-2xl max-h-screen overflow-y-auto shadow-2xl transform translate-x-full transition-transform duration-300 bg-background/80 backdrop-blur-sm">
            <div className="flex-1 flex flex-col p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline-md text-on-surface text-lg">Enquiry Details</h3>
                <button onClick={closeDetails} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-md hover:bg-surface-container">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-headline-md text-[20px] text-on-surface mb-2">Customer Information</h4>
                  <div className="space-y-2">
                    <p className="text-on-surface-variant"><span className="font-semibold">Name:</span> {selectedEnquiry.customer_name}</p>
                    <p className="text-on-surface-variant"><span className="font-semibold">Email:</span> {selectedEnquiry.email || 'N/A'}</p>
                    <p className="text-on-surface-variant"><span className="font-semibold">Phone:</span> {selectedEnquiry.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-headline-md text-[20px] text-on-surface mb-2">Enquiry Details</h4>
                  <div className="space-y-2">
                    <p className="text-on-surface-variant"><span className="font-semibold">Vehicle:</span> {selectedEnquiry.vehicles?.name || selectedEnquiry.vehicle_name || 'N/A'}</p>
                    <p className="text-on-surface-variant"><span className="font-semibold">Message:</span> {selectedEnquiry.message}</p>
                    <p className="text-on-surface-variant"><span className="font-semibold">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedEnquiry.status === 'new'
                          ? 'bg-secondary-container/20 text-secondary-fixed'
                          : selectedEnquiry.status === 'contacted'
                          ? 'bg-surface-container-high text-on-surface-variant'
                          : selectedEnquiry.status === 'quoted'
                          ? 'bg-primary-container/20 text-primary-container'
                          : selectedEnquiry.status === 'sold'
                          ? 'bg-secondary-container/20 text-secondary-fixed'
                          : 'bg-error-container/20 text-error'
                      }`}>
                        {selectedEnquiry.status.charAt(0).toUpperCase() + selectedEnquiry.status.slice(1)}
                      </span>
                    </p>
                    <p className="text-on-surface-variant"><span className="font-semibold">Received:</span> {new Date(selectedEnquiry.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-headline-md text-[20px] text-on-surface mb-2">Update Status</h4>
                  <div className="space-y-3">
                    {['new', 'contacted', 'quoted', 'sold', 'lost'].map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value={status}
                            checked={selectedEnquiry.status === status}
                            onChange={(e) => {
                              updateStatus(selectedEnquiry.id, e.target.value as Enquiry['status']);
                            }}
                            className="h-4 w-4 text-primary-container focus:ring-primary-container border-offset-2"
                          />
                          <span className="text-xs text-on-surface-variant font-label-sm capitalize">{status}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}