"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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
  Trash2, 
  Calendar,
  Users,
  Package,
  DollarSign,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  user_profile: any;
  id: string;
  user_id: string | null;
  status: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  total_cost: number;
  deposit_amount: number;
  created_at: string;
  notes?: string;
  booking_items: Array<{
    id: string;
    equipment_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    equipment: {
      id: string;
      name: string;
      image_url?: string;
    };
  }>;
}

export default function BookingManagement() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, statusFilter, userTypeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Use service role client if available, fallback to regular client
      const clientToUse = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'dummy-key' 
        ? supabaseAdmin 
        : supabase;
      
      let query = clientToUse
        .from("bookings")
        .select("*", { count: "exact" });

      // Apply filters
      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (userTypeFilter === "anonymous") {
        query = query.is("user_id", "null");
      } else if (userTypeFilter === "registered") {
        query = query.not("user_id", "is", null);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Bookings query error:", error);
        
        // If RLS error, show empty data
        if (error.code === '42501') {
          toast.warning('RLS permissions issue. Please check RLS policies.');
          setBookings([]);
          setTotalCount(0);
          setTotalPages(0);
          return;
        }
        
        throw error;
      }

      setBookings(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setBookings([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookings();
      
      if (showDetailModal) {
        setShowDetailModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete booking items first
      const { error: itemsError } = await supabase
        .from("booking_items")
        .delete()
        .eq("booking_id", bookingId);

      if (itemsError) throw itemsError;

      // Delete booking
      const { error: bookingError } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      toast.success("Booking deleted successfully");
      fetchBookings();
      setShowDetailModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  const exportBookings = async () => {
    try {
      const clientToUse = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'dummy-key' 
        ? supabaseAdmin 
        : supabase;
        
      const { data, error } = await clientToUse
        .from("bookings")
        .select(`
          id,
          status,
          start_date,
          end_date,
          total_cost,
          created_at,
          user_id
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csv = [
        "Booking ID,Customer,Status,Start Date,End Date,Total,Created At",
        ...(data || []).map(booking => {
          return [
            booking.id.slice(0, 8),
            booking.user_id ? "Registered User" : "Guest",
            booking.status,
            booking.start_date,
            booking.end_date,
            formatCurrency(booking.total_cost),
            new Date(booking.created_at).toLocaleDateString('id-ID')
          ].join(',');
        })
      ].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Bookings exported successfully");
    } catch (error) {
      console.error("Error exporting bookings:", error);
      toast.error("Failed to export bookings");
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading && bookings.length === 0) {
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
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportBookings}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={fetchBookings}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
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
                  placeholder="Search by ID, email, name..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-type-filter" className="text-sm font-medium">User Type</Label>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger id="user-type-filter">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="registered">Registered Users</SelectItem>
                    <SelectItem value="anonymous">Guest Users</SelectItem>
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
                    setUserTypeFilter("all");
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

        {/* Bookings Table */}
        <Card className="p-4">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No bookings found</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.id}</p>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(booking.total_cost)}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Customer: {booking.user_profile?.email || 'Guest User'}</p>
                      <p>Items: {booking.booking_items?.length || 0} items</p>
                      <p>Dates: {booking.start_date} - {booking.end_date}</p>
                      <p>Created: {new Date(booking.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailModal(true);
                      }}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedBooking(booking);
                        setShowEditModal(true);
                      }}>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Dates</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">#{booking.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {booking.user_id ? (
                          <>
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-emerald-600" />
                            </div>
                            <div className="text-sm">Registered User</div>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-amber-600" />
                            </div>
                            <div className="text-sm">Guest User</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {booking.booking_items?.[0]?.equipment?.name || 'Unknown'}
                        {booking.booking_items && booking.booking_items.length > 1 && (
                          <span className="text-gray-500"> +{booking.booking_items.length - 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{formatDate(booking.start_date)}</div>
                        <div className="text-gray-500">→ {formatDate(booking.end_date)}</div>
                        <div className="text-xs text-gray-400">{booking.rental_days} days</div>
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
                        <div>{formatDate(booking.created_at)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {bookings.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No bookings found</p>
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          <div className="lg:hidden mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} bookings
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium">
                {currentPage} / {totalPages}
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
          
          {/* Desktop Pagination */}
          <div className="hidden lg:flex mt-6 justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} bookings
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="px-3 py-1 text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Booking Info */}
                <div>
                  <h3 className="font-semibold mb-3">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <p className="font-mono">#{selectedBooking.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p>{selectedBooking.user_id ? "Registered User" : "Guest User"}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p>{formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Rental Period */}
                <div>
                  <h3 className="font-semibold mb-3">Rental Period</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p>{formatDate(selectedBooking.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">End Date:</span>
                      <p>{formatDate(selectedBooking.end_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p>{selectedBooking.rental_days} days</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <p className="font-semibold">{formatCurrency(selectedBooking.total_cost)}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-3">Rented Items</h3>
                  <div className="space-y-2">
                    {selectedBooking.booking_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.equipment.name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Select onValueChange={(value) => updateBookingStatus(selectedBooking.id, value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteBooking(selectedBooking.id)}
                    disabled={updating}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
