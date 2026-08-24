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
  hidden: boolean;
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
  const [chartMode, setChartMode] = useState<'monthly' | 'weekly'>('monthly');
  const [chartData, setChartData] = useState<Array<{ label: string; value: number }>>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const toggleChartMode = (mode: 'monthly' | 'weekly') => {
    setChartMode(mode);
    fetchChartData();
  };
  const router = useRouter();

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
    fetchFeaturedVehicles();
    fetchChartData();
    const vehiclesSubscription = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchStats();
        fetchRecentActivities();
        fetchFeaturedVehicles();
        fetchChartData();
      })
      .subscribe();
    const enquiriesSubscription = supabase
      .channel('enquiries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => {
        fetchStats();
        fetchRecentActivities();
        fetchFeaturedVehicles();
        fetchChartData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesSubscription);
      supabase.removeChannel(enquiriesSubscription);
    };
  }, []);

  async function fetchStats() {
    const [
      vehiclesCountResult,
      availableVehiclesCountResult,
      soldVehiclesCountResult,
      featuredVehiclesCountResult,
      enquiriesCountResult,
      pendingEnquiriesCountResult,
    ] = await Promise.allSettled([
      supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .gt('stock', 0),
      supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sold'), // Assuming sold enquiries represent sold vehicles
      supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true),
      supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'contacted', 'quoted']),
    ]);

    console.log("Vehicles Query Result:", vehiclesCountResult);

    const vehiclesCount =
      vehiclesCountResult.status === "fulfilled"
        ? vehiclesCountResult.value.count
        : 0;
    if (vehiclesCountResult.status === 'rejected') {
      console.error('Error fetching total vehicles count:', vehiclesCountResult.reason);
    }

    console.log("Available Vehicles Result:", availableVehiclesCountResult);

    const availableVehiclesCount =
      availableVehiclesCountResult.status === "fulfilled"
        ? availableVehiclesCountResult.value.count
        : 0;
    if (availableVehiclesCountResult.status === 'rejected') {
      console.error('Error fetching available vehicles count:', availableVehiclesCountResult.reason);
    }

    const soldVehiclesCount = soldVehiclesCountResult.status === 'fulfilled' ? soldVehiclesCountResult.value.count : 0;
    if (soldVehiclesCountResult.status === 'rejected') {
      console.error('Error fetching sold vehicles count:', soldVehiclesCountResult.reason);
    }

    const featuredVehiclesCount = featuredVehiclesCountResult.status === 'fulfilled' ? featuredVehiclesCountResult.value.count : 0;
    if (featuredVehiclesCountResult.status === 'rejected') {
      console.error('Error fetching featured vehicles count:', featuredVehiclesCountResult.reason);
    }

    const enquiriesCount = enquiriesCountResult.status === 'fulfilled' ? enquiriesCountResult.value.count : 0;
    if (enquiriesCountResult.status === 'rejected') {
      console.error('Error fetching total enquiries count:', enquiriesCountResult.reason);
    }

    const pendingEnquiriesCount = pendingEnquiriesCountResult.status === 'fulfilled' ? pendingEnquiriesCountResult.value.count : 0;
    if (pendingEnquiriesCountResult.status === 'rejected') {
      console.error('Error fetching pending enquiries count:', pendingEnquiriesCountResult.reason);
    }

    setStats({
      totalVehicles: vehiclesCount ?? 0,
      availableVehicles: availableVehiclesCount ?? 0,
      soldVehicles: soldVehiclesCount ?? 0,
      featuredVehicles: featuredVehiclesCount ?? 0,
      totalEnquiries: enquiriesCount ?? 0,
      pendingEnquiries: pendingEnquiriesCount ?? 0,
    });
    console.log("Stats being set:", {
      totalVehicles: vehiclesCount ?? 0,
      availableVehicles: availableVehiclesCount ?? 0,
      soldVehicles: soldVehiclesCount ?? 0,
      featuredVehicles: featuredVehiclesCount ?? 0,
      totalEnquiries: enquiriesCount ?? 0,
      pendingEnquiries: pendingEnquiriesCount ?? 0,
    });
  }

  async function fetchRecentActivities() {
    const [recentEnquiriesResult, recentVehiclesResult] = await Promise.allSettled([
      supabase
        .from('enquiries')
        .select('*, vehicles(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const recentEnquiries = recentEnquiriesResult.status === 'fulfilled' ? (recentEnquiriesResult.value.data || []) : [];
    if (recentEnquiriesResult.status === 'rejected') {
      console.error('Error fetching recent enquiries:', recentEnquiriesResult.reason);
    }

    const recentVehicles = recentVehiclesResult.status === 'fulfilled' ? (recentVehiclesResult.value.data || []) : [];
    if (recentVehiclesResult.status === 'rejected') {
      console.error('Error fetching recent vehicles:', recentVehiclesResult.reason);
    }

    let activities: Array<{
      type: 'enquiry' | 'vehicle';
      title: string;
      description: string;
      date: string;
      icon: string;
      iconBg: string;
      iconColor: string;
    }> = [];

    if (Array.isArray(recentEnquiries)) {
      recentEnquiries.forEach((enquiry) => {
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

    if (Array.isArray(recentVehicles)) {
      recentVehicles.forEach((vehicle) => {
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
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured vehicles:', error);
    } else {
      setFeaturedVehicles(data as Vehicle[] || []);
    }
  }

  async function fetchChartData() {
    setChartLoading(true);
    try {
      if (chartMode === 'monthly') {
        // Get last 6 months of vehicle data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data, error } = await supabase
          .from('vehicles')
          .select('created_at')
          .gte('created_at', sixMonthsAgo.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by month
        const monthlyData: Record<string, number> = {};

        data.forEach((vehicle) => {
          const date = new Date(vehicle.created_at);
          const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        });

        // Generate labels for last 6 months (Feb, Mar, etc.) in chronological order
        const chartDataArray: Array<{ label: string; value: number }> = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const yearMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
          const label = date.toLocaleString('default', { month: 'short' }); // Just month abbreviation like "Feb"
          chartDataArray.push({
            label,
            value: monthlyData[yearMonth] || 0,
          });
        }

        setChartData(chartDataArray);
      } else {
        // Weekly: last 7 days (keeping existing enquiry-based implementation for now)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('enquiries')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by day
        const dailyData: Record<string, number> = {};

        data.forEach((enquiry) => {
          const date = new Date(enquiry.created_at);
          const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
        });

        // Create array for last 7 days (including zero days)
        const chartDataArray: Array<{ label: string; value: number }> = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i)); // Start from 6 days ago to today
          const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          chartDataArray.push({
            label,
            value: dailyData[dayKey] || 0,
          });
        }

        setChartData(chartDataArray);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display-lg text-[32px] font-bold text-on-surface">Showroom Performance</h2>
        <p className="text-on-surface-variant font-body-md">Real-time overview of your electric vehicle enterprise.</p>
      </div>

      {/* Bento Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Inventory */}
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
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Inventory</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-inventory">
            {stats.availableVehicles}
          </h3>
        </div>

        {/* Sales Records */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
              <span className="material-symbols-outlined">receipt_long</span>
            </span>
            <span className="text-secondary-fixed text-xs font-bold">+0%</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Sales Records</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-sales-records">
            {stats.soldVehicles}
          </h3>
        </div>

        {/* Customers/Visitors */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
              <span className="material-symbols-outlined">group</span>
            </span>
            <span className="text-secondary-fixed text-xs font-bold">+0%</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Customers/Visitors</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-customers-visitors">
            {stats.totalEnquiries}
          </h3>
        </div>

        {/* Dashboard Overview */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant group hover:border-primary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-container/10 rounded-lg text-primary-component">
              <span className="material-symbols-outlined">dashboard</span>
            </span>
            <span className="text-secondary-fixed text-xs font-bold">+0%</span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Dashboard</p>
          <h3 className="font-display-lg text-[28px] font-bold text-on-surface" id="metric-dashboard">
            {stats.totalVehicles}
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
            {chartLoading ? (
              <div className="text-center w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container mx-auto mb-2"></div>
                <p className="text-xs text-on-surface-variant">Loading chart data...</p>
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-xs text-on-surface-variant/40 text-center w-full">
                No chart data available
              </p>
            ) : (
              <>
                {chartData.map((data, index) => {
                  const maxValue = Math.max(...chartData.map(d => d.value), 1);
                  const heightPercentage = (data.value / maxValue) * 100;
                  const barHeight = `${heightPercentage}%`;
                  const delay = index * 50; // Staggered animation delay

                  return (
                    <div key={index} className="relative flex-1 flex flex-col items-center">
                      <div
                        className={`relative w-[20px] bg-primary-container/20 rounded-t-lg overflow-hidden`}
                        style={{
                          height: barHeight,
                          animationDelay: `${delay}ms`,
                          animation: chartData.length > 0 ? 'barGrow 0.7s ease-out forwards' : 'none'
                        }}
                      >
                        <div className="absolute bottom-0 left-0 w-full h-full bg-primary-container"></div>
                      </div>
                      <div className="flex flex-col items-center mt-2 text-xs">
                        <p className="font-label-sm text-on-surface-variant">{data.label}</p>
                        <p className="font-label-sm text-on-surface">{data.value}</p>
                      </div>
                    </div>
                  );
                })}
                <style jsx>{`
                  @keyframes barGrow {
                    from { transform: scaleY(0); transform-origin: bottom; }
                    to { transform: scaleY(1); transform-origin: bottom; }
                  }
                `}</style>
              </>
            )}
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
            <div key="flagship-none" className="col-span-full py-8 text-center text-on-surface-variant/40 border border-dashed border-outline-variant rounded-xl">
              No featured vehicles yet.
            </div>
          ) : (
            featuredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant group hover:border-primary-container transition-all flex flex-col h-full">
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
                  {vehicle.hidden && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-primary-container text_on-primary-container font-label-sm rounded-full text-[10px] uppercase font-bold tracking-wider">
                      Hidden
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-headline-md text-[20px] text_on-surface group-hover:text_primary_container transition_colors">{vehicle.name}</h4>
                    <span className="text_xs text_outline font_label_sm">{vehicle.id}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text_primary_container text_lg font_bold">{vehicle.price ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(vehicle.price) : '₹0'}</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary-fixed text-sm">{vehicle.battery || 'battery_full'}</span>
                      <span className="text_xs text_on-surface-variant">{vehicle.range}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex gap-2">
                  <button onClick={() => handleEditVehicle(vehicle)} className="px-3 bg-surface-container-high hover:bg-primary-container/20 hover:text-primary-container text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={() => handleDeleteVehicle(vehicle.id)} className="px-3 bg-surface-container-high hover:bg-error-container/25 hover:text-error text-xs text-on-surface-variant hover:text-on-surface py-2 rounded transition-all">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function handleEditVehicle(vehicle: Vehicle) {
  // Navigate to edit vehicle page
  // Note: In a real implementation, this would use useRouter()
  // For now, we'll just log the action
  console.log('Edit vehicle:', vehicle.id);
}

function handleDeleteVehicle(id: string) {
  // Delete vehicle with confirmation
  // Note: In a real implementation, this would use supabase from '@/lib/supabase'
  // For now, we'll just log the action
  if (window.confirm('Are you sure you want to delete this vehicle?')) {
    console.log('Delete vehicle ID:', id);
  }
}