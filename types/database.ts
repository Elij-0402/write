export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          ai_model_preference: string
          theme: string
          created_at: string
        }
        Insert: { id: string; ai_model_preference?: string; theme?: string }
        Update: { ai_model_preference?: string; theme?: string }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: { user_id: string; title: string; description?: string }
        Update: { title?: string; description?: string }
      }
      chapters: {
        Row: {
          id: string
          project_id: string
          title: string
          content: Json | null
          word_count: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: { project_id: string; title: string; content?: Json; sort_order?: number }
        Update: { title?: string; content?: Json; word_count?: number; sort_order?: number }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
