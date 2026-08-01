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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number
          client_id: string | null
          created_by: string
          date: string
          id: string
          used: boolean
          used_in_sale_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_by: string
          date?: string
          id?: string
          used?: boolean
          used_in_sale_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_by?: string
          date?: string
          id?: string
          used?: boolean
          used_in_sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_used_in_sale_id_fkey"
            columns: ["used_in_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      day_closures: {
        Row: {
          created_at: string
          date: string
          id: string
          total_general: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_general?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_general?: number
          user_id?: string
        }
        Relationships: []
      }
      employee_roles: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean
          created_at: string
          id: string
          nom: string
          photo_url: string | null
          prenoms: string
          role_id: string | null
          salaire: number
          telephone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          nom: string
          photo_url?: string | null
          prenoms: string
          role_id?: string | null
          salaire?: number
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          nom?: string
          photo_url?: string | null
          prenoms?: string
          role_id?: string | null
          salaire?: number
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "employee_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_types: {
        Row: {
          created_at: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          date: string
          id: string
          invoice_url: string | null
          label: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          date?: string
          id?: string
          invoice_url?: string | null
          label: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          date?: string
          id?: string
          invoice_url?: string | null
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      opening_sale: {
        Row: {
          id: string
          is_open: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_open?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_open?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price_ht: number
          purchase_price: number | null
          stock: number
          stock_threshold: number
          tva_rate: number
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price_ht?: number
          purchase_price?: number | null
          stock?: number
          stock_threshold?: number
          tva_rate?: number
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price_ht?: number
          purchase_price?: number | null
          stock?: number
          stock_threshold?: number
          tva_rate?: number
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_lines: {
        Row: {
          id: string
          price_ht: number
          price_ttc: number
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          total_ttc: number
          tva_rate: number
        }
        Insert: {
          id?: string
          price_ht: number
          price_ttc: number
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          total_ttc: number
          tva_rate: number
        }
        Update: {
          id?: string
          price_ht?: number
          price_ttc?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          total_ttc?: number
          tva_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_received: number
          amount_returned: number
          client_id: string | null
          created_at: string
          credit_note_id: string | null
          date: string
          id: string
          invoice_number: string
          server_employee_id: string | null
          server_name: string | null
          status: string
          total_ht: number
          total_ttc: number
          user_id: string
        }
        Insert: {
          amount_received?: number
          amount_returned?: number
          client_id?: string | null
          created_at?: string
          credit_note_id?: string | null
          date?: string
          id?: string
          invoice_number: string
          server_employee_id?: string | null
          server_name?: string | null
          status?: string
          total_ht?: number
          total_ttc?: number
          user_id: string
        }
        Update: {
          amount_received?: number
          amount_returned?: number
          client_id?: string | null
          created_at?: string
          credit_note_id?: string | null
          date?: string
          id?: string
          invoice_number?: string
          server_employee_id?: string | null
          server_name?: string | null
          status?: string
          total_ht?: number
          total_ttc?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_server_employee_id_fkey"
            columns: ["server_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          address: string
          currency: string
          default_tva_rate: number
          id: string
          logo_url: string | null
          phone: string
          phone2: string
          phone3: string
          restaurant_name: string
        }
        Insert: {
          address?: string
          currency?: string
          default_tva_rate?: number
          id?: string
          logo_url?: string | null
          phone?: string
          phone2?: string
          phone3?: string
          restaurant_name?: string
        }
        Update: {
          address?: string
          currency?: string
          default_tva_rate?: number
          id?: string
          logo_url?: string | null
          phone?: string
          phone2?: string
          phone3?: string
          restaurant_name?: string
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          date: string
          id: string
          invoice_url: string | null
          product_id: string
          product_name: string
          quantity: number
          status: string
          supplier: string
          user_id: string
          validated_by: string | null
        }
        Insert: {
          date?: string
          id?: string
          invoice_url?: string | null
          product_id: string
          product_name: string
          quantity: number
          status?: string
          supplier: string
          user_id: string
          validated_by?: string | null
        }
        Update: {
          date?: string
          id?: string
          invoice_url?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          status?: string
          supplier?: string
          user_id?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_product_stock: {
        Args: { _product_id: string; _qty: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_active_employees: {
        Args: never
        Returns: {
          id: string
          nom: string
          prenoms: string
        }[]
      }
      list_suppliers: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role: "caissiere" | "manager" | "admin"
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
    Enums: {
      app_role: ["caissiere", "manager", "admin"],
    },
  },
} as const
