export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: any }
  | any[]

export interface Database {
  public: {
    Tables: {
      badges: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          description: string
          icon_url: string
          id: string
          name: string
          quantity: number
          slot: Database["public"]["Enums"]["equipment_slot"]
        }
        Insert: {
          description: string
          icon_url: string
          id?: string
          name: string
          quantity: number
          slot: Database["public"]["Enums"]["equipment_slot"]
        }
        Update: {
          description?: string
          icon_url?: string
          id?: string
          name?: string
          quantity?: number
          slot?: Database["public"]["Enums"]["equipment_slot"]
        }
        Relationships: []
      }
      inventory_variants: {
        Row: {
          id: string
          item_id: string
          size: string
          quantity: number
        }
        Insert: {
          id?: string
          item_id: string
          size: string
          quantity: number
        }
        Update: {
          id?: string
          item_id?: string
          size?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          }
        ]
      }
      mission_milestones: {
        Row: {
          id: string
          mission_id: string
          user_id: string
          description: string
          image_url: string | null
          created_at: string
          is_solution: boolean
        }
        Insert: {
          id?: string
          mission_id: string
          user_id: string
          description: string
          image_url?: string | null
          created_at?: string
          is_solution?: boolean
        }
        Update: {
          id?: string
          mission_id?: string
          user_id?: string
          description?: string
          image_url?: string | null
          created_at?: string
          is_solution?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mission_milestones_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      missions: {
        Row: {
          assigned_to: string[] | null
          bonus_xp: number | null
          bonus_monetario: number | null
          completed_date: string | null
          created_at: string
          deadline: string
          description: string
          difficulty: Database["public"]["Enums"]["mission_difficulty"]
          id: string
          progress_photo_url: string | null
          required_skills: string[]
          start_date: string
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          xp: number
          visible_to: string[] | null
        }
        Insert: {
          assigned_to?: string[] | null
          bonus_xp?: number | null
          bonus_monetario?: number | null
          completed_date?: string | null
          created_at?: string
          deadline: string
          description: string
          difficulty: Database["public"]["Enums"]["mission_difficulty"]
          id?: string
          progress_photo_url?: string | null
          required_skills: string[]
          start_date: string
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          xp: number
          visible_to?: string[] | null
        }
        Update: {
          assigned_to?: string[] | null
          bonus_xp?: number | null
          bonus_monetario?: number | null
          completed_date?: string | null
          created_at?: string
          deadline?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["mission_difficulty"]
          id?: string
          progress_photo_url?: string | null
          required_skills?: string[]
          start_date?: string
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          xp?: number
          visible_to?: string[] | null
        }
        Relationships: []
      }
      mission_supplies: {
        Row: {
          id: string
          created_at: string
          mission_id: string
          supply_id: string
          quantity_assigned: number
          quantity_used: number
        }
        Insert: {
          id?: string
          created_at?: string
          mission_id: string
          supply_id: string
          quantity_assigned: number
          quantity_used?: number
        }
        Update: {
          id?: string
          created_at?: string
          mission_id?: string
          supply_id?: string
          quantity_assigned?: number
          quantity_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_supplies_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_supplies_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          }
        ]
      }
      supplies: {
        Row: {
          id: string
          created_at: string
          general_category: string
          specific_category: string
          type: string
          model: string
          details: string | null
          stock_quantity: number
          photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          general_category: string
          specific_category: string
          type: string
          model: string
          details?: string | null
          stock_quantity?: number
          photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          general_category?: string
          specific_category?: string
          type?: string
          model?: string
          details?: string | null
          stock_quantity?: number
          photo_url?: string | null
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          level: number
          skill_id: string
          user_id: string
        }
        Insert: {
          level: number
          skill_id: string
          user_id: string
        }
        Update: {
          level?: number
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string
          id: string
          is_active: boolean
          lat: number | null
          level: number
          lng: number | null
          location_last_update: string | null
          name: string
          push_subscription: Json | null
          role: Database["public"]["Enums"]["role"]
          xp: number
        }
        Insert: {
          avatar: string
          id: string
          is_active?: boolean
          lat?: number | null
          level?: number
          lng?: number | null
          location_last_update?: string | null
          name: string
          push_subscription?: Json | null
          role: Database["public"]["Enums"]["role"]
          xp?: number
        }
        Update: {
          avatar?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          level?: number
          lng?: number | null
          location_last_update?: string | null
          name?: string
          push_subscription?: Json | null
          role?: Database["public"]["Enums"]["role"]
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          user_id: string
        }
        Update: {
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          assigned_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salarios: {
        Row: {
          id: string
          user_id: string
          monto_base_quincenal: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          monto_base_quincenal: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          monto_base_quincenal?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      eventos_nomina: {
        Row: {
          id: string
          user_id: string
          tipo: Database["public"]["Enums"]["tipo_evento_nomina"]
          descripcion: string
          monto: number
          fecha_evento: string
          periodo_pago_id: string | null
          mission_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: Database["public"]["Enums"]["tipo_evento_nomina"]
          descripcion: string
          monto: number
          fecha_evento: string
          periodo_pago_id?: string | null
          mission_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo?: Database["public"]["Enums"]["tipo_evento_nomina"]
          descripcion?: string
          monto?: number
          fecha_evento?: string
          periodo_pago_id?: string | null
          mission_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_nomina_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_nomina_periodo_pago_id_fkey"
            columns: ["periodo_pago_id"]
            isOneToOne: false
            referencedRelation: "periodos_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_nomina_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          }
        ]
      }
      periodos_pago: {
        Row: {
          id: string
          user_id: string
          fecha_inicio_periodo: string
          fecha_fin_periodo: string
          fecha_pago: string
          salario_base_calculado: number
          total_adiciones: number
          total_deducciones: number
          monto_final_a_pagar: number
          estado: Database["public"]["Enums"]["estado_pago"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          fecha_inicio_periodo: string
          fecha_fin_periodo: string
          fecha_pago: string
          salario_base_calculado: number
          total_adiciones?: number
          total_deducciones?: number
          monto_final_a_pagar: number
          estado?: Database["public"]["Enums"]["estado_pago"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          fecha_inicio_periodo?: string
          fecha_fin_periodo?: string
          fecha_pago?: string
          salario_base_calculado?: number
          total_adiciones?: number
          total_deducciones?: number
          monto_final_a_pagar?: number
          estado?: Database["public"]["Enums"]["estado_pago"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodos_pago_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dispose_inventory_item: {
        Args: {
          p_user_inventory_id: string
          p_item_id: string
        }
        Returns: undefined
      }
      update_supply_stock_from_mission: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      equipment_slot:
      | "head"
      | "face"
      | "ears"
      | "outerwear"
      | "shirt"
      | "hands"
      | "belt"
      | "pants"
      | "feet"
      | "accessory"
      mission_difficulty: "Bajo" | "Medio" | "Alto"
      mission_status: "Solicitada" | "Pendiente" | "En Progreso" | "Completada"
      role: "tecnico" | "administrador"
      tipo_evento_nomina: "HORA_EXTRA" | "BONO" | "FALTA" | "TARDANZA" | "APERCIBIMIENTO"
      estado_pago: "CALCULADO" | "PAGADO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}