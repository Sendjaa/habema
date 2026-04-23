"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  user_id: string | null;
  status: string;
  start_date: string;
  end_date: string;
  total_cost: number;
  created_at: string;
  rental_days: number;
  notes?: string;
}

interface BookingItem {
  id: string;
  booking_id: string;
  equipment_id: string;
  quantity: number;
  unit_price: number;
  equipment?: {
    name: string;
    description?: string;
    image_url?: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching booking details for ID:', bookingId);

      // Validate if bookingId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(bookingId);

      console.log('Is valid UUID:', isValidUUID, 'for ID:', bookingId);

      // If not a valid UUID, use mock data immediately
      if (!isValidUUID) {
        console.log('Using mock data - booking ID is not a valid UUID');
        const mockBooking: Booking = {
          id: bookingId,
          user_id: null,
          status: 'pending',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          total_cost: 150000,
          created_at: new Date().toISOString(),
          rental_days: 1,
          notes: 'Sample booking for demonstration - Mock ID format'
        };
        setBooking(mockBooking);
        setBookingItems([]);
        toast.info('Showing sample data - booking ID is not a database UUID');
        return;
      }

      // Use service role client if available, fallback to regular client
      const clientToUse = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'dummy-key' 
        ? supabaseAdmin 
        : supabase;

      // Fetch booking details only for valid UUIDs
      const { data: bookingData, error: bookingError } = await clientToUse
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      console.log('Booking query result:', { bookingData, bookingError });

      if (bookingError) {
        console.error("Booking fetch error:", JSON.stringify(bookingError, null, 2));
        
        // If UUID format error or RLS error, use mock data
        if (bookingError.code === '22P02' || bookingError.code === 'PGRST116' || bookingError.code === '42501') {
          console.log('Using mock data due to UUID format or RLS issues');
          const mockBooking: Booking = {
            id: bookingId,
            user_id: null,
            status: 'pending',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            total_cost: 150000,
            created_at: new Date().toISOString(),
            rental_days: 1,
            notes: 'Sample booking for demonstration - ID format not compatible with database UUID'
          };
          setBooking(mockBooking);
          setBookingItems([]);
          toast.info('Showing sample data - booking ID format not compatible with database');
          return;
        }
        
        throw bookingError;
      }

      setBooking(bookingData);

      // Fetch booking items if relationship exists
      try {
        const { data: itemsData, error: itemsError } = await clientToUse
          .from("booking_items")
          .select(`
            *,
            equipment (
              name,
              description,
              image_url
            )
          `)
          .eq("booking_id", bookingId);

        if (itemsError) {
          console.log("Booking items not available:", itemsError);
          setBookingItems([]);
        } else {
          setBookingItems(itemsData || []);
        }
      } catch (error) {
        console.log("Could not fetch booking items:", error);
        setBookingItems([]);
      }

    } catch (error) {
      console.error("Error fetching booking details:", JSON.stringify(error, null, 2));
      
      // Use mock data as fallback
      const mockBooking: Booking = {
        id: bookingId,
        user_id: null,
        status: 'pending',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        total_cost: 150000,
        created_at: new Date().toISOString(),
        rental_days: 1,
        notes: 'Sample booking for demonstration'
      };
      setBooking(mockBooking);
      setBookingItems([]);
      toast.info('Showing sample data due to database error');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (newStatus: string) => {
    try {
      const clientToUse = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'dummy-key' 
        ? supabaseAdmin 
        : supabase;

      const { error } = await clientToUse
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      setBooking(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const deleteBooking = async () => {
    if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    try {
      const clientToUse = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'dummy-key' 
        ? supabaseAdmin 
        : supabase;

      const { error } = await clientToUse
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking deleted successfully");
      router.push("/admin/bookings");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/bookings")}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/admin/bookings")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={deleteBooking}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Booking Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Booking ID</span>
                  <p className="font-mono text-sm">#{booking.id.slice(0, 8)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="mt-1">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Start Date</span>
                  <p className="font-medium">{booking.start_date}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">End Date</span>
                  <p className="font-medium">{booking.end_date}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Rental Days</span>
                  <p className="font-medium">{booking.rental_days} days</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created At</span>
                  <p className="font-medium">
                    {new Date(booking.created_at).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.created_at).toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              {booking.notes && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Notes</span>
                  <p className="mt-1 text-gray-800">{booking.notes}</p>
                </div>
              )}
            </Card>

            {/* Booking Items */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Booking Items</h2>
              {bookingItems.length > 0 ? (
                <div className="space-y-4">
                  {bookingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {item.equipment?.image_url ? (
                          <img 
                            src={item.equipment.image_url} 
                            alt={item.equipment.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{item.equipment?.name || 'Unknown Item'}</h3>
                          {item.equipment?.description && (
                            <p className="text-sm text-gray-600">{item.equipment.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity}x</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No booking items found</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {booking.user_id ? (
                    <>
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">Registered User</p>
                        <p className="text-sm text-gray-600">ID: {booking.user_id.slice(0, 8)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">Guest User</p>
                        <p className="text-sm text-gray-600">Anonymous booking</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Pricing Summary */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Pricing Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(booking.total_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">Rp 0</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">{formatCurrency(booking.total_cost)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Status Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Status Actions</h2>
              <div className="space-y-2">
                {booking.status === 'pending' && (
                  <Button 
                    className="w-full" 
                    onClick={() => updateBookingStatus('confirmed')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button 
                    className="w-full" 
                    onClick={() => updateBookingStatus('picked_up')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Mark as Picked Up
                  </Button>
                )}
                {booking.status === 'picked_up' && (
                  <Button 
                    className="w-full" 
                    onClick={() => updateBookingStatus('returned')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Returned
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
