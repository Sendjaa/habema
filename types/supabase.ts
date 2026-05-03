export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          user_id: string | null
          total_amount: number
          status: string
          created_at: string
          updated_at: string
          start_date: string
          end_date: string
          delivery_address: string | null
          phone: string | null
          email: string | null
          rental_days: number
          subtotal: number
          total_cost: number
          deposit_amount: number
          delivery_option: "pickup" | "delivery"
          delivery_cost: number
          delivery_distance: number
          delivery_duration: string | null
          delivery_location_type: string | null
          delivery_gps_lat: number | null
          delivery_gps_lng: number | null
          delivery_time_preference: string | null
          delivery_instructions: string | null
          delivery_accessibility_notes: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          customer_note: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          total_amount: number
          status?: string
          created_at?: string
          updated_at?: string
          start_date: string
          end_date: string
          delivery_address?: string | null
          phone?: string | null
          email?: string | null
          rental_days: number
          subtotal: number
          total_cost: number
          deposit_amount: number
          delivery_option: "pickup" | "delivery"
          delivery_cost?: number
          delivery_distance?: number
          delivery_duration?: string | null
          delivery_location_type?: string | null
          delivery_gps_lat?: number | null
          delivery_gps_lng?: number | null
          delivery_time_preference?: string | null
          delivery_instructions?: string | null
          delivery_accessibility_notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          customer_note?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          total_amount?: number
          status?: string
          created_at?: string
          updated_at?: string
          start_date?: string
          end_date?: string
          delivery_address?: string | null
          phone?: string | null
          email?: string | null
          rental_days?: number
          subtotal?: number
          total_cost?: number
          deposit_amount?: number
          delivery_option?: "pickup" | "delivery"
          delivery_cost?: number
          delivery_distance?: number
          delivery_duration?: string | null
          delivery_location_type?: string | null
          delivery_gps_lat?: number | null
          delivery_gps_lng?: number | null
          delivery_time_preference?: string | null
          delivery_instructions?: string | null
          delivery_accessibility_notes?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          customer_note?: string | null
        }
      }
      booking_items: {
        Row: {
          id: string
          booking_id: string
          equipment_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          equipment_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          equipment_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
          created_at?: string
        }
      }
      equipment: {
        Row: {
          id: string
          name: string
          description: string
          price_per_day: number
          price_per_night: number
          category_id: string
          image_url: string | null
          is_available: boolean
          created_at: string
          updated_at: string
          specifications: Record<string, any> | null
          weight_kg: number | null
          dimensions: string | null
          capacity: string | null
          material: string | null
          weather_rating: string | null
          brand: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price_per_day: number
          price_per_night: number
          category_id: string
          image_url?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
          specifications?: Record<string, any> | null
          weight_kg?: number | null
          dimensions?: string | null
          capacity?: string | null
          material?: string | null
          weather_rating?: string | null
          brand?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price_per_day?: number
          price_per_night?: number
          category_id?: string
          image_url?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
          specifications?: Record<string, any> | null
          weight_kg?: number | null
          dimensions?: string | null
          capacity?: string | null
          material?: string | null
          weather_rating?: string | null
          brand?: string | null
        }
      }
      equipment_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      bundles: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          equipment_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      user_identity: {
        Row: {
          id: string
          user_id: string
          id_type: string
          id_number: string
          id_photo_url: string | null
          verification_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          id_type: string
          id_number: string
          id_photo_url?: string | null
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          id_type?: string
          id_number?: string
          id_photo_url?: string | null
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: string
          is_read: boolean
          booking_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          booking_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          booking_id?: string | null
          created_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          street: string
          city: string
          province: string
          postal_code: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          street: string
          city: string
          province: string
          postal_code: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          street?: string
          city?: string
          province?: string
          postal_code?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      // Add your view types here
    }
    Functions: {
      // Add your function types here
    }
    Enums: {
      // Add your enum types here
    }
  }
}