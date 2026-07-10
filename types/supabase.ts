export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          phone: string | null
          recipient: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string | null
          recipient?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string | null
          recipient?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_additional_options: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          option_description: string | null
          option_type: string
          price: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          option_description?: string | null
          option_type: string
          price?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          option_description?: string | null
          option_type?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_additional_options_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_bundle_items: {
        Row: {
          booking_id: string
          bundle_id: string
          bundle_price: number | null
          created_at: string | null
          id: string
          quantity: number | null
          subtotal: number | null
        }
        Insert: {
          booking_id: string
          bundle_id: string
          bundle_price?: number | null
          created_at?: string | null
          id?: string
          quantity?: number | null
          subtotal?: number | null
        }
        Update: {
          booking_id?: string
          bundle_id?: string
          bundle_price?: number | null
          created_at?: string | null
          id?: string
          quantity?: number | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          created_at: string | null
          equipment_id: string
          id: string
          inventory_id: string | null
          quantity: number | null
          subtotal: number | null
          unit_price: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          equipment_id: string
          id?: string
          inventory_id?: string | null
          quantity?: number | null
          subtotal?: number | null
          unit_price?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          equipment_id?: string
          id?: string
          inventory_id?: string | null
          quantity?: number | null
          subtotal?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "equipment_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          additional_options_cost: number | null
          created_at: string | null
          customer_note: string | null
          delivery_accessibility_notes: string | null
          delivery_address: string | null
          delivery_cost: number | null
          delivery_distance: number | null
          delivery_duration: string | null
          delivery_gps_lat: number | null
          delivery_gps_lng: number | null
          delivery_instructions: string | null
          delivery_location_type: string | null
          delivery_option: string | null
          delivery_time_preference: string | null
          deposit_amount: number | null
          discount_amount: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          end_date: string
          id: string
          midtrans_order_id: string | null
          notes: string | null
          payment_status: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_date: string | null
          product_id: string | null
          rental_days: number | null
          return_date: string | null
          start_date: string
          status: string | null
          subtotal: number | null
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_options_cost?: number | null
          created_at?: string | null
          customer_note?: string | null
          delivery_accessibility_notes?: string | null
          delivery_address?: string | null
          delivery_cost?: number | null
          delivery_distance?: number | null
          delivery_duration?: string | null
          delivery_gps_lat?: number | null
          delivery_gps_lng?: number | null
          delivery_instructions?: string | null
          delivery_location_type?: string | null
          delivery_option?: string | null
          delivery_time_preference?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          end_date: string
          id?: string
          midtrans_order_id?: string | null
          notes?: string | null
          payment_status?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_date?: string | null
          product_id?: string | null
          rental_days?: number | null
          return_date?: string | null
          start_date: string
          status?: string | null
          subtotal?: number | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_options_cost?: number | null
          created_at?: string | null
          customer_note?: string | null
          delivery_accessibility_notes?: string | null
          delivery_address?: string | null
          delivery_cost?: number | null
          delivery_distance?: number | null
          delivery_duration?: string | null
          delivery_gps_lat?: number | null
          delivery_gps_lng?: number | null
          delivery_instructions?: string | null
          delivery_location_type?: string | null
          delivery_option?: string | null
          delivery_time_preference?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          end_date?: string
          id?: string
          midtrans_order_id?: string | null
          notes?: string | null
          payment_status?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_date?: string | null
          product_id?: string | null
          rental_days?: number | null
          return_date?: string | null
          start_date?: string
          status?: string | null
          subtotal?: number | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_id_mapping: {
        Row: {
          string_id: string
          uuid_id: string | null
        }
        Insert: {
          string_id: string
          uuid_id?: string | null
        }
        Update: {
          string_id?: string
          uuid_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_id_mapping_uuid_id_fkey"
            columns: ["uuid_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string | null
          equipment_id: string
          id: string
          quantity: number | null
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          equipment_id: string
          id?: string
          quantity?: number | null
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          equipment_id?: string
          id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          bundle_price: number
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          excludes: Json | null
          id: string
          image_url: string | null
          includes: Json | null
          is_active: boolean | null
          name: string
          original_price: number | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          bundle_price: number
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          excludes?: Json | null
          id?: string
          image_url?: string | null
          includes?: Json | null
          is_active?: boolean | null
          name: string
          original_price?: number | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          bundle_price?: number
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          excludes?: Json | null
          id?: string
          image_url?: string | null
          includes?: Json | null
          is_active?: boolean | null
          name?: string
          original_price?: number | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_requests: {
        Row: {
          booking_id: string
          contact_point: string | null
          cost: number | null
          created_at: string | null
          delivery_address: string | null
          delivery_date: string | null
          delivery_type: string
          id: string
          notes: string | null
          pickup_address: string | null
          pickup_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          contact_point?: string | null
          cost?: number | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_type: string
          id?: string
          notes?: string | null
          pickup_address?: string | null
          pickup_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          contact_point?: string | null
          cost?: number | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_type?: string
          id?: string
          notes?: string | null
          pickup_address?: string | null
          pickup_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          deduction_amount: number | null
          deduction_reason: string | null
          id: string
          return_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          id?: string
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          id?: string
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          average_rating: number | null
          brand: string | null
          capacity: string | null
          category: string | null
          category_id: string
          created_at: string | null
          description: string | null
          detailed_description: string | null
          dimensions: string | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available: boolean
          material: string | null
          name: string
          price_per_day: number
          price_per_night: number
          rental_count: number | null
          specifications: Json | null
          stock_quantity: number
          updated_at: string | null
          vendor_id: string | null
          weather_rating: string | null
          weight_kg: number | null
        }
        Insert: {
          average_rating?: number | null
          brand?: string | null
          capacity?: string | null
          category?: string | null
          category_id: string
          created_at?: string | null
          description?: string | null
          detailed_description?: string | null
          dimensions?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean
          material?: string | null
          name: string
          price_per_day?: number
          price_per_night: number
          rental_count?: number | null
          specifications?: Json | null
          stock_quantity?: number
          updated_at?: string | null
          vendor_id?: string | null
          weather_rating?: string | null
          weight_kg?: number | null
        }
        Update: {
          average_rating?: number | null
          brand?: string | null
          capacity?: string | null
          category?: string | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          detailed_description?: string | null
          dimensions?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean
          material?: string | null
          name?: string
          price_per_day?: number
          price_per_night?: number
          rental_count?: number | null
          specifications?: Json | null
          stock_quantity?: number
          updated_at?: string | null
          vendor_id?: string | null
          weather_rating?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      equipment_inventory: {
        Row: {
          condition_status: string | null
          cost: number | null
          created_at: string | null
          equipment_id: string
          id: string
          last_maintenance_date: string | null
          next_maintenance_date: string | null
          notes: string | null
          purchase_date: string | null
          serial_number: string
          updated_at: string | null
        }
        Insert: {
          condition_status?: string | null
          cost?: number | null
          created_at?: string | null
          equipment_id: string
          id?: string
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number: string
          updated_at?: string | null
        }
        Update: {
          condition_status?: string | null
          cost?: number | null
          created_at?: string | null
          equipment_id?: string
          id?: string
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_inventory_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json
          notification_type: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json
          notification_type?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json
          notification_type?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_condition_checklists: {
        Row: {
          booking_id: string
          checklist_items: Json
          created_at: string | null
          id: string
          pickup_approved_at: string | null
          pickup_approved_by: string | null
          return_approved_at: string | null
          return_approved_by: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          checklist_items: Json
          created_at?: string | null
          id?: string
          pickup_approved_at?: string | null
          pickup_approved_by?: string | null
          return_approved_at?: string | null
          return_approved_by?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          checklist_items?: Json
          created_at?: string | null
          id?: string
          pickup_approved_at?: string | null
          pickup_approved_by?: string | null
          return_approved_at?: string | null
          return_approved_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_condition_checklists_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_condition_checklists_pickup_approved_by_fkey"
            columns: ["pickup_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_condition_checklists_return_approved_by_fkey"
            columns: ["return_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          condition_on_return: string | null
          created_at: string | null
          equipment_id: string
          id: string
          rating: number | null
          title: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          equipment_id: string
          id?: string
          rating?: number | null
          title?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          equipment_id?: string
          id?: string
          rating?: number | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identity: {
        Row: {
          created_at: string | null
          id: string
          id_number: string
          id_photo_url: string | null
          id_selfie_url: string | null
          id_type: string
          rejection_reason: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_number: string
          id_photo_url?: string | null
          id_selfie_url?: string | null
          id_type: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_number?: string
          id_photo_url?: string | null
          id_selfie_url?: string | null
          id_type?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_identity_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_vendor: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          postal_code: string | null
          profile_image_url: string | null
          updated_at: string | null
          vendor_description: string | null
          vendor_name: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_vendor?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          vendor_description?: string | null
          vendor_name?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_vendor?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          vendor_description?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
