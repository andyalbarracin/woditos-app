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
      coach_invites: {
        Row: {
          id: string
          token: string
          created_by: string
          used_by: string | null
          email_hint: string | null
          status: string
          expires_at: string
          created_at: string | null
          used_at: string | null
        }
        Insert: {
          id?: string
          token?: string
          created_by: string
          used_by?: string | null
          email_hint?: string | null
          status?: string
          expires_at?: string
          created_at?: string | null
          used_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          created_by?: string
          used_by?: string | null
          email_hint?: string | null
          status?: string
          expires_at?: string
          created_at?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          achievement_type: string
          description: string | null
          earned_at: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_status: string
          checkin_time: string | null
          id: string
          notes: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          attendance_status: string
          checkin_time?: string | null
          id?: string
          notes?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          attendance_status?: string
          checkin_time?: string | null
          id?: string
          notes?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          coach_id: string
          created_at: string | null
          group_id: string | null
          id: string
          member_user_id: string
          note_text: string
          visibility_private: boolean | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          member_user_id: string
          note_text: string
          visibility_private?: boolean | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          member_user_id?: string
          note_text?: string
          visibility_private?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_member_user_id_fkey"
            columns: ["member_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_user_id: string
          content_text: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_user_id: string
          content_text: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_user_id?: string
          content_text?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_wiki: {
        Row: {
          category: string
          common_mistakes: string | null
          contraindications: string | null
          created_at: string | null
          description: string
          difficulty_level: string
          goal: string | null
          id: string
          media_url: string | null
          muscle_group: string | null
          name: string
          tags: string[] | null
          technique: string | null
        }
        Insert: {
          category: string
          common_mistakes?: string | null
          contraindications?: string | null
          created_at?: string | null
          description: string
          difficulty_level: string
          goal?: string | null
          id?: string
          media_url?: string | null
          muscle_group?: string | null
          name: string
          tags?: string[] | null
          technique?: string | null
        }
        Update: {
          category?: string
          common_mistakes?: string | null
          contraindications?: string | null
          created_at?: string | null
          description?: string
          difficulty_level?: string
          goal?: string | null
          id?: string
          media_url?: string | null
          muscle_group?: string | null
          name?: string
          tags?: string[] | null
          technique?: string | null
        }
        Relationships: []
      }
      food_wiki: {
        Row: {
          benefits: string
          best_time_to_consume: string | null
          category: string
          created_at: string | null
          examples: string | null
          id: string
          name: string
          notes: string | null
          performance_relation: string | null
        }
        Insert: {
          benefits: string
          best_time_to_consume?: string | null
          category: string
          created_at?: string | null
          examples?: string | null
          id?: string
          name: string
          notes?: string | null
          performance_relation?: string | null
        }
        Update: {
          benefits?: string
          best_time_to_consume?: string | null
          category?: string
          created_at?: string | null
          examples?: string | null
          id?: string
          name?: string
          notes?: string | null
          performance_relation?: string | null
        }
        Relationships: []
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          membership_status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          membership_status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          membership_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          capacity: number
          coach_id: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          group_type: string
          id: string
          location: string | null
          name: string
          status: string
        }
        Insert: {
          capacity?: number
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          group_type: string
          id?: string
          location?: string | null
          name: string
          status?: string
        }
        Update: {
          capacity?: number
          coach_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          group_type?: string
          id?: string
          location?: string | null
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_user_id: string
          content_text: string | null
          created_at: string | null
          group_id: string | null
          id: string
          media_url: string | null
          post_type: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          content_text?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          media_url?: string | null
          post_type?: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          content_text?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          media_url?: string | null
          post_type?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          emergency_contact: string | null
          experience_level: string | null
          full_name: string
          goals: string | null
          id: string
          join_date: string | null
          private_health_notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          emergency_contact?: string | null
          experience_level?: string | null
          full_name: string
          goals?: string | null
          id?: string
          join_date?: string | null
          private_health_notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          emergency_contact?: string | null
          experience_level?: string | null
          full_name?: string
          goals?: string | null
          id?: string
          join_date?: string | null
          private_health_notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          id: string
          reservation_status: string
          session_id: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          reservation_status?: string
          session_id: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          reservation_status?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          capacity: number
          coach_id: string | null
          created_at: string | null
          end_time: string
          group_id: string
          id: string
          location: string | null
          notes: string | null
          session_type: string
          start_time: string
          status: string
          title: string
        }
        Insert: {
          capacity?: number
          coach_id?: string | null
          created_at?: string | null
          end_time: string
          group_id: string
          id?: string
          location?: string | null
          notes?: string | null
          session_type: string
          start_time: string
          status?: string
          title: string
        }
        Update: {
          capacity?: number
          coach_id?: string | null
          created_at?: string | null
          end_time?: string
          group_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          session_type?: string
          start_time?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_user_id: string
          created_at: string | null
          expires_at: string
          group_id: string | null
          id: string
          media_url: string
        }
        Insert: {
          author_user_id: string
          created_at?: string | null
          expires_at?: string
          group_id?: string | null
          id?: string
          media_url: string
        }
        Update: {
          author_user_id?: string
          created_at?: string | null
          expires_at?: string
          group_id?: string | null
          id?: string
          media_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          phone: string | null
          role: string
          status: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          phone?: string | null
          role?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          role?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_group_stats: { Args: { p_group_id: string }; Returns: Json }
      get_member_stats: { Args: { p_user_id: string }; Returns: Json }
      get_my_role: { Args: never; Returns: string }
      is_member_of_group: { Args: { p_group_id: string }; Returns: boolean }
      use_coach_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
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
