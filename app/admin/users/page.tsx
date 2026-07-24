"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Mail, 
  Calendar,
  Users,
  MapPin,
  Phone,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  CheckCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: any;
  addresses?: Array<{
    id: string;
    label: string;
    address_details: string;
    is_primary: boolean;
  }>;
  booking_count?: number;
  total_spent?: number;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, searchTerm, statusFilter, dateFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users data...');
      
      // Use simpler query first to avoid relationship issues
      let query = supabase
        .from("users")
        .select("*", { count: "exact" });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`
          email.ilike.%${searchTerm}%, 
          full_name.ilike.%${searchTerm}%
        `);
      }

      // Apply date filter
      if (dateFilter === "today") {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte("created_at", today);
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("created_at", weekAgo.toISOString());
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("created_at", monthAgo.toISOString());
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      console.log('Users query result:', { data, error, count });

      if (error) {
        console.error('Users query error:', JSON.stringify(error, null, 2));
        
        // If RLS error, show empty data
        if (error.code === '42501') {
          toast.warning('RLS permissions issue. Please check RLS policies for users table.');
          setUsers([]);
          setTotalPages(0);
          return;
        }
        
        throw error;
      }

      // Fetch booking stats for each user (with error handling)
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          try {
            const { data: bookings, count: bookingCount } = await supabase
              .from("bookings")
              .select("total_cost", { count: "exact" })
              .eq("user_id", user.id);

            const totalSpent = bookings?.reduce((sum, booking) => sum + (booking.total_cost || 0), 0) || 0;

            return {
              ...user,
              booking_count: bookingCount || 0,
              total_spent: totalSpent,
            };
          } catch (bookingError) {
            console.error('Error fetching booking stats for user:', user.id, bookingError);
            return {
              ...user,
              booking_count: 0,
              total_spent: 0,
            };
          }
        })
      );

      setUsers(usersWithStats);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error("Error fetching users:", JSON.stringify(error, null, 2));
      toast.error("Failed to load users");
      setUsers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Get active users (signed in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("last_sign_in_at", thirtyDaysAgo.toISOString());

      // Get new users this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newUsersThisMonth } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth.toISOString());

      // Get total bookings and revenue from all users
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("total_cost")
        .not("user_id", "is", null);

      const totalBookings = allBookings?.length || 0;
      const totalRevenue = allBookings?.reduce((sum, booking) => sum + (booking.total_cost || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalBookings,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const exportUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          email,
          full_name,
          phone,
          created_at,
          last_sign_in_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csv = [
        "Email,Full Name,Phone,Created At,Last Sign In",
        ...(data || []).map(user => [
          user.email,
          user.full_name || "",
          user.phone || "",
          user.created_at,
          user.last_sign_in_at || ""
        ].join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Users exported successfully");
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error("Failed to export users");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const isActiveUser = (user: User) => {
    if (!user.last_sign_in_at) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(user.last_sign_in_at) > thirtyDaysAgo;
  };

  if (loading && users.length === 0) {
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
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/admin")}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportUsers}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6">
        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6 mb-6">
          <Card className="p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-xl lg:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-2 lg:p-3 rounded-lg">
                <Users className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-xl lg:text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
              <div className="bg-green-100 p-2 lg:p-3 rounded-lg">
                <CheckCircle className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 mb-1">New Users</p>
                <p className="text-xl lg:text-3xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
              </div>
              <div className="bg-amber-100 p-2 lg:p-3 rounded-lg">
                <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-3 lg:p-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="space-y-4">
            {/* Search Bar - Full Width on Mobile */}
            <div>
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filter Row - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-filter" className="text-sm font-medium">Join Date</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-4">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              users
                .filter(user => {
                  if (statusFilter === "active") return isActiveUser(user);
                  if (statusFilter === "inactive") return !isActiveUser(user);
                  return true;
                })
                .map((user) => (
                <Card key={user.id} className="p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name || "No Name"}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge className={isActiveUser(user) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {isActiveUser(user) ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Phone: {user.phone || "Not provided"}</p>
                      <p>Bookings: {user.bookingStats?.totalBookings || 0}</p>
                      <p>Revenue: {formatCurrency(user.bookingStats?.totalRevenue || 0)}</p>
                      <p>Joined: {new Date(user.created_at).toLocaleDateString('id-ID')}</p>
                      <p>Last Active: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID') : "Never"}</p>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button size="sm" variant="outline" onClick={() => viewUser(user.id)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editUser(user.id)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Activity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Bookings</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(user => {
                    if (statusFilter === "active") return isActiveUser(user);
                    if (statusFilter === "inactive") return !isActiveUser(user);
                    return true;
                  })
                  .map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name || "No Name"}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                        {user.addresses && user.addresses.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {user.addresses.length} address(es)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isActiveUser(user) ? (
                          <>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-emerald-700">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-500">Inactive</span>
                          </>
                        )}
                      </div>
                      {user.last_sign_in_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {formatDate(user.last_sign_in_at)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="font-semibold">{user.booking_count || 0}</div>
                        <div className="text-xs text-gray-500">bookings</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(user.total_spent || 0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, users.length)} of {totalPages * itemsPerPage} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">User Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold mb-3">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedUser.full_name || "No Name"}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p>{selectedUser.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {isActiveUser(selectedUser) ? (
                          <>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-emerald-700">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-500">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Joined:</span>
                      <p>{formatDateTime(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Sign In:</span>
                      <p>{selectedUser.last_sign_in_at ? formatDateTime(selectedUser.last_sign_in_at) : "Never"}</p>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Addresses</h3>
                    <div className="space-y-2">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{address.label}</p>
                              <p className="text-sm text-gray-600">{address.address_details}</p>
                            </div>
                            {address.is_primary && (
                              <Badge variant="outline">Primary</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Booking Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-700">{selectedUser.booking_count || 0}</div>
                      <div className="text-sm text-blue-600">Total Bookings</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-700">{formatCurrency(selectedUser.total_spent || 0)}</div>
                      <div className="text-sm text-green-600">Total Spent</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
