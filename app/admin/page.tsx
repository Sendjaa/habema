"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Phone
} from "lucide-react";
import { NotificationsPanel } from "@/components/admin/notifications-panel";
import { toast } from "sonner";

interface DashboardStats {
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  activeBookings: number;
  pendingBookings: number;
  completedBookings: number;
  anonymousBookings: number;
  todayBookings: number;
}

interface RecentBooking {
  id: string;
  user_id: string | null;
  status: string;
  total_cost: number;
  created_at: string;
  start_date: string;
  end_date: string;
  booking_items: Array<{
    equipment: {
      name: string;
      image_url?: string;
    };
    quantity: number;
  }>;
  user_identity?: {
    id_type?: string;
    id_number?: string;
    id_photo_url?: string;
    verification_status?: string;
  };
  user_profile?: {
    email?: string;
    created_at?: string;
  };
  item_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    anonymousBookings: 0,
    todayBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchDashboardData();
    }
  }, [userEmail]);

  const checkAdminAccess = async () => {
    try {
      console.log('Checking admin access...');
      
      // Only check Supabase auth - no demo mode
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('Auth check result:', { user, error });
      
      if (error) {
        console.error('Auth error:', error);
        router.push('/admin/login');
        return;
      }
      
      if (!user) {
        console.log('No user found');
        router.push('/admin/login');
        return;
      }
      
      console.log('User email:', user.email);
      
      // Check if user is admin
      if (user.email !== 'bibitsayur23@gmail.com') {
        toast.error("Access denied. Admin only.");
        router.push("/admin/login");
        return;
      }
      
      setUserEmail(user.email);
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push('/admin/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Loading admin dashboard with mock data...');
      
      // For now, use mock data to ensure dashboard works without database issues
      // TODO: Re-enable database fetching once RLS is properly configured
      
      const mockBookings = [
        {
          id: 'HBM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: null,
          status: 'pending',
          total_cost: 150000,
          created_at: new Date().toISOString(),
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          rental_days: 1
        },
        {
          id: 'HBM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: 'user-' + Math.random().toString(36).substr(2, 9),
          status: 'confirmed',
          total_cost: 300000,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          rental_days: 2
        },
        {
          id: 'HBM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: 'user-' + Math.random().toString(36).substr(2, 9),
          status: 'picked_up',
          total_cost: 450000,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          start_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          rental_days: 3
        },
        {
          id: 'HBM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: null,
          status: 'returned',
          total_cost: 225000,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          start_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          end_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          rental_days: 2
        },
        {
          id: 'HBM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: 'user-' + Math.random().toString(36).substr(2, 9),
          status: 'pending',
          total_cost: 180000,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          rental_days: 3
        }
      ];

      // Create booking data with items
      const bookingsWithItems = mockBookings.map((booking, index) => ({
        ...booking,
        booking_items: [
          {
            equipment: {
              name: ['Tenda Camping', 'Sleeping Bag', 'Backpack', 'Lampu Camping', 'Matras'][index % 5],
              image_url: undefined
            },
            quantity: 1
          }
        ],
        user_identity: booking.user_id ? {
          id_type: 'ktp',
          id_number: '1234567890123456',
          id_photo_url: undefined,
          verification_status: 'pending'
        } : undefined,
        user_profile: booking.user_id ? {
          email: `user${index + 1}@example.com`,
          created_at: booking.created_at
        } : undefined,
        item_count: 1
      }));

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const newStats: DashboardStats = {
        totalBookings: mockBookings.length,
        totalUsers: 3, // Mock user count
        totalRevenue: mockBookings.reduce((sum, booking) => sum + booking.total_cost, 0),
        activeBookings: mockBookings.filter(b => b.status === 'confirmed' || b.status === 'picked_up').length,
        pendingBookings: mockBookings.filter(b => b.status === 'pending').length,
        completedBookings: mockBookings.filter(b => b.status === 'returned').length,
        anonymousBookings: mockBookings.filter(b => b.user_id === null).length,
        todayBookings: mockBookings.filter(b => b.created_at?.startsWith(today)).length,
      };

      console.log('Dashboard loaded with mock data:', newStats);

      setStats(newStats);
      setRecentBookings(bookingsWithItems);
      
      // Show info toast about mock data
      toast.info('Dashboard loaded with sample data. Configure RLS to see real data.');
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "returned":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      toast.success("Logout berhasil");
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      router.push("/admin/login");
    }
  };

  const handleViewBooking = (bookingId: string) => {
    // Navigate to booking details page
    router.push(`/admin/bookings/${bookingId}`);
  };

  const handleEditBooking = (bookingId: string) => {
    // Navigate to booking edit page
    router.push(`/admin/bookings/${bookingId}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 text-xs sm:text-sm w-fit">
                {userEmail}
              </Badge>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationsPanel />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 sm:h-9 px-2 sm:px-3">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Shop Profile Section */}
        <Card className="p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Habema Outdoor</h2>
                <p className="text-xs text-gray-600">Equipment Rental & Outdoor Adventure</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>Sleman, Yogyakarta</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  <span>habemaoutdoor.com</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>+62 812-3456-7890</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs"
                onClick={() => window.open('https://www.habemaoutdoor.com', '_blank')}
              >
                <Package className="w-3 h-3 mr-1" />
                Kunjungi
              </Button>
            </div>
          </div>
          {/* Mobile contact info */}
          <div className="flex sm:hidden flex-wrap text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              <span>habema.vercel.app</span>
            </div>
          </div>
        </Card>

        {/* Mobile Dashboard - Icon-based Navigation */}
        <div className="lg:hidden mb-6">
          <Card className="p-4">
            {/* Status Icons Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Perlu Diproses</span>
                <span className="text-xs font-bold text-amber-600">{stats.pendingBookings}</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Dikirim</span>
                <span className="text-xs font-bold text-blue-600">{stats.activeBookings}</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Pembatalan</span>
                <span className="text-xs font-bold text-red-600">0</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Pengembalian</span>
                <span className="text-xs font-bold text-green-600">0</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Penilaian</span>
                <span className="text-xs font-bold text-purple-600">0</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Selesai</span>
                <span className="text-xs font-bold text-gray-600">{stats.completedBookings}</span>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Menu Navigasi</h4>
              <div className="grid grid-cols-4 gap-3">
                <Link
                  href="/admin/equipment"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Produk</span>
                </Link>
                <Link
                  href="/admin/bookings"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Pesanan</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Pengguna</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Keuangan</span>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Cards - Desktop Only */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1">+{stats.todayBookings} today</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">Registered users</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Anonymous Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.anonymousBookings}</p>
                <p className="text-xs text-gray-500 mt-1">Guest users</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="font-semibold">{stats.pendingBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
                <span className="font-semibold">{stats.activeBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Completed</span>
                </div>
                <span className="font-semibold">{stats.completedBookings}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/admin/bookings")}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Bookings
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/admin/users")}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/admin/equipment")}
              >
                <Package className="w-4 h-4 mr-2" />
                Equipment
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/admin/analytics")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="p-6 hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/admin/bookings")}
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer Info</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Identity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">#{booking.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {booking.user_id ? (
                            <>
                              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Users className="w-3 h-3 text-emerald-600" />
                              </div>
                              <span className="text-sm font-medium">Registered</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              </div>
                              <span className="text-sm font-medium">Guest</span>
                            </>
                          )}
                        </div>
                        {booking.user_profile?.email && (
                          <p className="text-xs text-gray-600">{booking.user_profile.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {booking.user_identity ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {booking.user_identity.id_type?.toUpperCase() || 'ID'}
                              </span>
                              <span className="text-xs text-gray-600">
                                {booking.user_identity.id_number}
                              </span>
                            </div>
                            {booking.user_identity.id_photo_url && (
                              <div className="flex items-center gap-1">
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                  <Eye className="w-3 h-3 text-gray-500" />
                                </div>
                                <span className="text-xs text-green-600">Verified</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No identity</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {booking.item_count} items
                        </div>
                        {booking.booking_items?.[0] && (
                          <div className="text-xs text-gray-600">
                            {booking.booking_items[0].equipment?.name}
                            {booking.item_count > 1 && ` +${booking.item_count - 1}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(booking.total_cost)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        <div>{new Date(booking.created_at).toLocaleDateString('id-ID')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {booking.start_date && booking.end_date && (
                          <div className="text-xs text-gray-500">
                            {booking.start_date} - {booking.end_date}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewBooking(booking.id)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditBooking(booking.id)}
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentBookings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No bookings found</p>
              </div>
            )}
          </div>
        </Card>

              </div>
    </div>
  );
}
