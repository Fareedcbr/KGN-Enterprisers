'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Define Types
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

interface Enquiry {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  message: string;
  status: string;
  created_at: string;
  vehicles?: {
    name: string;
  } | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    soldVehicles: 0,
    featuredVehicles: 0,
    totalEnquiries: 0,
    pendingEnquiries: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Array<{
    type: 'enquiry' | 'vehicle';
    title: string;
    description: string;
    date: string;
    icon: string;
    iconBg: string;
    iconColor: string;
  }>>([]);

  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
    fetchFeaturedVehicles();
    const vehiclesSubscription = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchStats();
        fetchRecentActivities();
        fetchFeaturedVehicles();
      })
      .subscribe();
    const enquiriesSubscription = supabase
      .channel('enquiries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        fetchStats();
        fetchRecentActivities();
        fetchFeaturedVehicles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesSubscription);
      supabase.removeChannel(enquiriesSubscription);
    };
  }, []);

  async function fetchStats() {
    const [
      vehiclesCount,
      availableVehiclesCount,
      soldVehiclesCount,
      featuredVehiclesCount,
      enquiriesCount,
      pendingEnquiriesCount,
    ] = await Promise.all([
      supabase
        .from('vehicles')
        .select<Vehicle>('*', { count: 'exact' }),
      supabase
        .from('vehicles')
        .select<Vehicle>('*', { count: 'exact' })
        .gt('stock', 0),
      supabase
        .from('enquiries')
        .select<Enquiry>('*', { count: 'exact' })
        .eq('status', 'sold'), // Assuming sold enquiries represent sold vehicles
      supabase
        .from('vehicles')
        .select<Vehicle>('*', { count: 'exact' })
        .eq('featured', true),
      supabase
        .from('enquiries')
        .select<Enquiry>('*', { count: 'exact' }),
      supabase
        .from('enquiries')
        .select<Enquiry>('*', { count: 'exact' })
        .in('status', ['new', 'contacted', 'quoted']),
    ]);

    setStats({
      totalVehicles: vehiclesCount.count || 0,
      availableVehicles: availableVehiclesCount.count || 0,
      soldVehicles: soldVehiclesCount.count || 0,
      featuredVehicles: featuredVehiclesCount.count || 0,
      totalEnquiries: enquiriesCount.count || 0,
      pendingEnquiries: pendingEnquiriesCount.count || 0,
    });
  }

  async function fetchRecentActivities() {
    const [recentEnquiries, recentVehicles] = await Promise.all([
      supabase
        .from('enquiries')
        .select<Enquiry>('*, vehicles(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('vehicles')
        .select<Vehicle>('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    let activities: Array<{
      type: 'enquiry' | 'vehicle';
      title: string;
      description: string;
      date: string;
      icon: string;
      iconBg: string;
      iconColor: string;
    }> = [];

    if (recentEnquiries.data) {
      recentEnquiries.data.forEach((enquiry: Enquiry) => {
        activities.push({
          type: 'enquiry',
          title: `New Enquiry: ${enquiry.vehicle_name || enquiry.vehicles?.name || 'Unknown Vehicle'}`,
          description: `From: ${enquiry.customer_name}`,
          date: new Date(enquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: 'person_add',
          iconBg: 'bg-tertiary-container/20',
          iconColor: 'text-on-surface-variant'
        });
      });
    }

    if (recentVehicles.data) {
      recentVehicles.data.forEach((vehicle: Vehicle) => {
        activities.push({
          type: 'vehicle',
          title: `New Vehicle: ${vehicle.name}`,
          description: `Added to inventory`,
          date: new Date(vehicle.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: 'add',
          iconBg: 'bg-primary-container/20',
          iconColor: 'text-primary-container'
        });
      });
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivities(activities.slice(0, 5)); // Keep only 5 most recent
  }

  async function fetchFeaturedVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select<Vehicle>('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured vehicles:', error);
    } else {
      setFeaturedVehicles(data || []);
    }
  }

  function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display-lg text-[32px] font-bold text-on-surface">Showroom Performance</h2>
        <p className="text-on-surface-variant font-body-md">Real-time overview of your electric vehicle enterprise.</p>
      </div>

      {/* Bento Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Total Vehicles */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
              <span className="material-symbols-outlined">dashboard</span>
            </span>
            <span className="text-secondary-fixed text-xs font-bold">+0%</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Vehicles</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-total-vehicles">
            {stats.totalVehicles}
          </h3>
        </div>

        {/* Available Vehicles */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-secondary-container/10 rounded-lg text-secondary-fixed">
              <span className="material-symbols-outlined">electric_bike</span>
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></div>
              <span className="text-on-surface-variant text-xs">Live</span>
            </div>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Available Vehicles</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-available-vehicles">
            {stats.availableVehicles}
          </h3>
        </div>

        {/* Sold Vehicles */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
              <span className="material-symbols-outlined">check_circle</span>
            </span>
            <span className="text-secondary-fixed text-xs font-bold">+0%</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Sold Vehicles</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-sold-vehicles">
            {stats.soldVehicles}
          </h3>
        </div>

        {/* Featured Vehicles */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-secondary-container/10 rounded-lg text-secondary-fixed">
              <span className="material-symbols-outlined">star</span>
            </span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Featured Vehicles</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-featured-vehicles">
            {stats.featuredVehicles}
          </h3>
        </div>

        {/* Total Enquiries */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
              <span className="material-symbols-outlined">forum</span>
            </span>
            <span className="text-secondary-fixed text-xs font-bold">+0%</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Enquiries</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-total-enquiries">
            {stats.totalEnquiries}
          </h3>
        </div>

        {/* Pending Enquiries */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-error-container/10 rounded-lg text-error">
              <span className="material-symbols-outlined">pending_actions</span>
            </span>
            <span className="text-error text-xs font-bold" id="pending-growth">Active</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Pending Enquiries</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-pending-enquiries">
            {String(stats.pendingEnquiries).padStart(2, '0')}
          </h3>
        </div>
      </div>

      {/* Main Dashboard Content (Chart & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Revenue Trend Chart Placeholder */}
        <div className="lg:col-span-2 bg-surface-container rounded-xl p-6 border border-outline-variant relative overflow-hidden h-[400px]">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="font-headline-md text-on-surface">Market Growth</h3>
            <div className="flex gap-2">
              <button id="chart-toggle-monthly" onClick={() => toggleChartMode('monthly')} className="px-3 py-1 bg-surface-container-high rounded text-xs font-bold text-primary-container transition-colors">
                Monthly
              </button>
              <button id="chart-toggle-weekly" onClick={() => toggleChartMode('weekly')} className="px-3 py-1 text-xs font-bold text-on-surface-variant transition-colors">
                Weekly
              </button>
            </div>
          </div>

          <div id="chart-bars-container" className="absolute bottom-0 left-0 w-full h-[70%] flex items-end gap-2 px-6 pb-6">
            {/* Chart bars will be dynamically generated */}
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t from-primary-container to-transparent"></div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant h-[400px] flex flex-col">
          <h3 className="font-headline-md text-on-surface mb-6">Recent Activity</h3>
          <div id="recent-activity-list" className="space-y-6 overflow-y-auto flex-1 pr-2">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-on-surface-variant/40 py-8 text-center">No recent activities.</p>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className={`flex gap-4 items-start group ${index !== recentActivities.length - 1 ? 'border-b border-outline-variant pb-4' : 'pb-2'}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    <span className={`${activity.iconBg} ${activity.iconColor} flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">{activity.icon}</span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-on-surface leading-tight mb-1">{activity.title}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-on-surface-variant">{activity.description}</p>
                      <p className="text-[10px] text-outline font-label-sm">{activity.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Flagship Models Grid */}
      <div className="pt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-md text-on-surface">Flagship Models</h3>
          <button onClick={() => router.push('/admin/vehicles')} className="text-primary-container font-label-sm hover:underline flex items-center gap-1">
            View Full Inventory
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
        <div id="flagship-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {featuredVehicles.length === 0 ? (
            <div className="col-span-full py-8 text-center text-on-surface-variant/40 border border-dashed border-outline-variant rounded-xl">
              No featured vehicles yet.
            </div>
          ) : (
            featuredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col h-full">
                <div className="h-48 relative overflow-hidden bg-surface-container-low">
                  <img className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    src={(vehicle.images && vehicle.images.length > 0 && vehicle.images[0]) ? vehicle.images[0] : ''}
                    alt={vehicle.name}
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 font-label-sm rounded-full text-[10px] uppercase font-bold bg-primary-container text-on-primary-container">
                    Featured
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h5 className="font-headline-md text-[18px] text-on-surface">{vehicle.name}</h5>
                    <p className="text-xs text-outline font-label-sm">{vehicle.brand}</p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-primary-container text-lg font-bold">{vehicle.price ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(vehicle.price) : '₹0'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  let currentChartMode: keyof typeof chartData = 'monthly';

  function toggleChartMode(mode: keyof typeof chartData) {
    currentChartMode = mode;
    const mBtn = document.getElementById('chart-toggle-monthly');
    const wBtn = document.getElementById('chart-toggle-weekly');
    if (mBtn && wBtn) {
      if (mode === 'monthly') {
        mBtn.className = "px-3 py-1 bg-surface-container-high rounded text-xs font-bold text-primary-container";
        wBtn.className = "px-3 py-1 text-xs font-bold text-on-surface-variant";
      } else {
        wBtn.className = "px-3 py-1 bg-surface-container-high rounded text-xs font-bold text-primary-container";
        mBtn.className = "px-3 py-1 text-xs font-bold text_on-surface-variant";
      }
      renderChart();
      setTimeout(animateChart, 50);
    }
  }

  function renderChart() {
    const container = document.getElementById('chart-bars-container');
    if (!container) return;

    const data = chartData[currentChartMode];
    container.innerHTML = data.map((item) => `
      <div class="flex-1 flex flex-col items-center h-full group">
        <div class="w-full flex flex-col items-end justify-center relative">
          <div class="w-8/12 bg-primary-container/20 group-hover:bg-primary-container hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] transition-all rounded-t-lg cursor-pointer chart-bar"
               style="height: 0%;"
               data-target-height="${item.height}">
            <div class="absolute inset-x-0 top-0 h-1 bg-primary-container blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div class="absolute bottom-[calc(${item.height}+8px)] scale-0 group-hover:scale-100 bg-surface-container-highest border border-outline-variant text-[10px] text-primary-container px-2 py-0.5 rounded font-label-sm transition-all duration-150 z-20 whitespace-nowrap">
            ${item.height} Growth
          </div>
        </div>
        <span className="text-[10px] font-label-sm text_on-surface-variant uppercase mt-3 tracking-wider block">${item.label}</span>
      </div>
    `).join('');
  }

  function animateChart() {
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach((bar, index) => {
      const targetHeight = bar.getAttribute('data-target-height');
      if (targetHeight) {
        setTimeout(() => {
          (bar as HTMLElement).style.transition = `height 0.8s cubic-bezier(0.17, 0.67, 0.4, 1)`;
          (bar as HTMLElement).style.height = targetHeight;
        }, index * 60);
      }
    });
  }

  const chartData = {
    monthly: [
      { label: 'Jan', height: '40%' },
      { label: 'Feb', height: '55%' },
      { label: 'Mar', height: '45%' },
      { label: 'Apr', height: '70%' },
      { label: 'May', height: '90%' },
      { label: 'Jun', height: '65%' },
      { label: 'Jul', height: '80%' },
      { label: 'Aug', height: '95%' }
    ],
    weekly: [
      { label: 'Mon', height: '20%' },
      { label: 'Tue', height: '45%' },
      { label: 'Wed', height: '60%' },
      { label: 'Thu', height: '35%' },
      { label: 'Fri', height: '75%' },
      { label: 'Sat', height: '90%' },
      { label: 'Sun', height: '40%' }
    ]
  };
}