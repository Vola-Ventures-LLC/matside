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
      consent_audit: {
        Row: {
          action: string
          changed_by: string
          created_at: string
          id: string
          team_id: string
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string
          id?: string
          team_id: string
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_audit_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          invitation_type: Database["public"]["Enums"]["invitation_type"]
          league_id: string
          max_uses: number | null
          use_count: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          expires_at: string
          id?: string
          invitation_type: Database["public"]["Enums"]["invitation_type"]
          league_id: string
          max_uses?: number | null
          use_count?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          invitation_type?: Database["public"]["Enums"]["invitation_type"]
          league_id?: string
          max_uses?: number | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          created_at: string
          id: string
          league_id: string
          role: Database["public"]["Enums"]["league_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          role?: Database["public"]["Enums"]["league_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          role?: Database["public"]["Enums"]["league_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_teams: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          league_id: string
          status: Database["public"]["Enums"]["league_team_status"]
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          league_id: string
          status?: Database["public"]["Enums"]["league_team_status"]
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          league_id?: string
          status?: Database["public"]["Enums"]["league_team_status"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          abbreviation: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          abbreviation: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          abbreviation?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      mat_rules: {
        Row: {
          color: string
          created_at: string
          id: string
          mat_number: number
          max_age: number
          max_experience: number
          max_matches: number
          max_skill: number
          min_age: number
          min_experience: number
          min_skill: number
          team_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          mat_number: number
          max_age?: number
          max_experience?: number
          max_matches?: number
          max_skill?: number
          min_age?: number
          min_experience?: number
          min_skill?: number
          team_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          mat_number?: number
          max_age?: number
          max_experience?: number
          max_matches?: number
          max_skill?: number
          min_age?: number
          min_experience?: number
          min_skill?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mat_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          mat_number: number | null
          match_order: number | null
          meet_id: string
          scratched_wrestler_id: string | null
          status: string
          winner_id: string | null
          wrestler_a_id: string
          wrestler_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mat_number?: number | null
          match_order?: number | null
          meet_id: string
          scratched_wrestler_id?: string | null
          status?: string
          winner_id?: string | null
          wrestler_a_id: string
          wrestler_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mat_number?: number | null
          match_order?: number | null
          meet_id?: string
          scratched_wrestler_id?: string | null
          status?: string
          winner_id?: string | null
          wrestler_a_id?: string
          wrestler_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_scratched_wrestler_id_fkey"
            columns: ["scratched_wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_wrestler_a_id_fkey"
            columns: ["wrestler_a_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_wrestler_b_id_fkey"
            columns: ["wrestler_b_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_attendance: {
        Row: {
          created_at: string
          id: string
          meet_id: string
          notes: string | null
          status: string
          team_id: string
          updated_at: string
          wrestler_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meet_id: string
          notes?: string | null
          status?: string
          team_id: string
          updated_at?: string
          wrestler_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meet_id?: string
          notes?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          wrestler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_attendance_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_attendance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_attendance_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_mat_rules: {
        Row: {
          created_at: string
          id: string
          mat_number: number
          max_age: number
          max_experience: number
          max_matches: number
          max_skill: number
          meet_id: string
          min_age: number
          min_experience: number
          min_skill: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mat_number: number
          max_age?: number
          max_experience?: number
          max_matches?: number
          max_skill?: number
          meet_id: string
          min_age?: number
          min_experience?: number
          min_skill?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mat_number?: number
          max_age?: number
          max_experience?: number
          max_matches?: number
          max_skill?: number
          meet_id?: string
          min_age?: number
          min_experience?: number
          min_skill?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_mat_rules_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_registrations: {
        Row: {
          created_at: string
          id: string
          meet_id: string
          status: string
          weigh_in_weight: number | null
          wrestler_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meet_id: string
          status?: string
          weigh_in_weight?: number | null
          wrestler_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meet_id?: string
          status?: string
          weigh_in_weight?: number | null
          wrestler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_registrations_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_registrations_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_rules: {
        Row: {
          conflict_min_gap: number
          created_at: string
          id: string
          match_priority_age: number
          match_priority_experience: number
          match_priority_skill: number
          match_priority_weight: number
          max_age_diff: number
          max_matches_per_wrestler: number
          meet_id: string
          teammates_can_wrestle: boolean
          updated_at: string
        }
        Insert: {
          conflict_min_gap?: number
          created_at?: string
          id?: string
          match_priority_age?: number
          match_priority_experience?: number
          match_priority_skill?: number
          match_priority_weight?: number
          max_age_diff?: number
          max_matches_per_wrestler?: number
          meet_id: string
          teammates_can_wrestle?: boolean
          updated_at?: string
        }
        Update: {
          conflict_min_gap?: number
          created_at?: string
          id?: string
          match_priority_age?: number
          match_priority_experience?: number
          match_priority_skill?: number
          match_priority_weight?: number
          max_age_diff?: number
          max_matches_per_wrestler?: number
          meet_id?: string
          teammates_can_wrestle?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_rules_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: true
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_teams: {
        Row: {
          created_at: string
          id: string
          meet_id: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meet_id: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meet_id?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_teams_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      meets: {
        Row: {
          created_at: string
          host_team_id: string
          id: string
          league_id: string | null
          location_address: string | null
          location_notes: string | null
          meet_date: string
          meet_time: string | null
          name: string
          notes: string | null
          pairing_status: Database["public"]["Enums"]["pairing_status"]
          season_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          host_team_id: string
          id?: string
          league_id?: string | null
          location_address?: string | null
          location_notes?: string | null
          meet_date: string
          meet_time?: string | null
          name: string
          notes?: string | null
          pairing_status?: Database["public"]["Enums"]["pairing_status"]
          season_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          host_team_id?: string
          id?: string
          league_id?: string | null
          location_address?: string | null
          location_notes?: string | null
          meet_date?: string
          meet_time?: string | null
          name?: string
          notes?: string | null
          pairing_status?: Database["public"]["Enums"]["pairing_status"]
          season_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meets_host_team_id_fkey"
            columns: ["host_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meets_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meets_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      pairing_audit: {
        Row: {
          action: string
          changed_by: string
          created_at: string
          description: string
          id: string
          match_id: string | null
          meet_id: string
          new_value: Json | null
          old_value: Json | null
          team_id: string
          wrestler_id: string | null
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string
          description: string
          id?: string
          match_id?: string | null
          meet_id: string
          new_value?: Json | null
          old_value?: Json | null
          team_id: string
          wrestler_id?: string | null
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string
          description?: string
          id?: string
          match_id?: string | null
          meet_id?: string
          new_value?: Json | null
          old_value?: Json | null
          team_id?: string
          wrestler_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairing_audit_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_audit_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_audit_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_audit_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_team_id: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_team_id?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_team_id?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      public_meet_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          meet_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          meet_id: string
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          meet_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_meet_tokens_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: true
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_suggestions: {
        Row: {
          created_at: string
          id: string
          meet_id: string
          notes: string | null
          original_match_id: string
          remaining_wrestler_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          scratched_wrestler_id: string
          status: string
          suggested_by: string
          suggested_opponent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meet_id: string
          notes?: string | null
          original_match_id: string
          remaining_wrestler_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scratched_wrestler_id: string
          status?: string
          suggested_by: string
          suggested_opponent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meet_id?: string
          notes?: string | null
          original_match_id?: string
          remaining_wrestler_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scratched_wrestler_id?: string
          status?: string
          suggested_by?: string
          suggested_opponent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scratch_suggestions_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_suggestions_original_match_id_fkey"
            columns: ["original_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_suggestions_remaining_wrestler_id_fkey"
            columns: ["remaining_wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_suggestions_scratched_wrestler_id_fkey"
            columns: ["scratched_wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scratch_suggestions_suggested_opponent_id_fkey"
            columns: ["suggested_opponent_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          league_id: string | null
          name: string
          start_date: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          league_id?: string | null
          name: string
          start_date: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          league_id?: string | null
          name?: string
          start_date?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          max_uses: number | null
          team_id: string
          use_count: number | null
        }
        Insert: {
          code?: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          max_uses?: number | null
          team_id: string
          use_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          max_uses?: number | null
          team_id?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          role: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          role?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          role?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          abbreviation: string
          conflict_max_matches: number
          conflict_min_gap: number
          conflict_min_matches: number
          created_at: string
          data_sharing_consent: boolean
          data_sharing_consent_at: string | null
          home_meet_address: string | null
          home_meet_notes: string | null
          id: string
          logo_url: string | null
          match_priority_age: number
          match_priority_experience: number
          match_priority_skill: number
          match_priority_weight: number
          max_age_diff: number
          max_matches_per_wrestler: number
          name: string
          primary_color: string | null
          secondary_color: string | null
          teammates_can_wrestle: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          abbreviation: string
          conflict_max_matches?: number
          conflict_min_gap?: number
          conflict_min_matches?: number
          created_at?: string
          data_sharing_consent?: boolean
          data_sharing_consent_at?: string | null
          home_meet_address?: string | null
          home_meet_notes?: string | null
          id?: string
          logo_url?: string | null
          match_priority_age?: number
          match_priority_experience?: number
          match_priority_skill?: number
          match_priority_weight?: number
          max_age_diff?: number
          max_matches_per_wrestler?: number
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          teammates_can_wrestle?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          abbreviation?: string
          conflict_max_matches?: number
          conflict_min_gap?: number
          conflict_min_matches?: number
          created_at?: string
          data_sharing_consent?: boolean
          data_sharing_consent_at?: string | null
          home_meet_address?: string | null
          home_meet_notes?: string | null
          id?: string
          logo_url?: string | null
          match_priority_age?: number
          match_priority_experience?: number
          match_priority_skill?: number
          match_priority_weight?: number
          max_age_diff?: number
          max_matches_per_wrestler?: number
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          teammates_can_wrestle?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wrestler_changes: {
        Row: {
          changed_by: string
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          team_id: string
          wrestler_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          team_id: string
          wrestler_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          team_id?: string
          wrestler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wrestler_changes_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      wrestler_flags: {
        Row: {
          created_at: string
          id: string
          meet_id: string
          note: string | null
          team_id: string
          updated_at: string
          wrestler_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meet_id: string
          note?: string | null
          team_id: string
          updated_at?: string
          wrestler_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meet_id?: string
          note?: string | null
          team_id?: string
          updated_at?: string
          wrestler_id?: string
        }
        Relationships: []
      }
      wrestler_seasons: {
        Row: {
          created_at: string
          id: string
          season_id: string
          status: string
          wrestler_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          season_id: string
          status?: string
          wrestler_id: string
        }
        Update: {
          created_at?: string
          id?: string
          season_id?: string
          status?: string
          wrestler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wrestler_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wrestler_seasons_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      wrestlers: {
        Row: {
          created_at: string
          date_of_birth: string
          experience: number
          first_name: string
          id: string
          last_name: string
          last_weigh_in_date: string | null
          skill: number
          status: string
          team_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          experience?: number
          first_name: string
          id?: string
          last_name: string
          last_weigh_in_date?: string | null
          skill?: number
          status?: string
          team_id: string
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          experience?: number
          first_name?: string
          id?: string
          last_name?: string
          last_weigh_in_date?: string | null
          skill?: number
          status?: string
          team_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "wrestlers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_team: {
        Args: {
          p_abbreviation: string
          p_logo_url?: string
          p_name: string
          p_primary_color?: string
          p_secondary_color?: string
        }
        Returns: Json
      }
      get_league_from_invite_code: {
        Args: { invite_code: string }
        Returns: {
          league_color: string
          league_id: string
          league_name: string
        }[]
      }
      get_public_meet_by_token: {
        Args: { _token: string }
        Returns: {
          host_team_color: string
          host_team_name: string
          meet_date: string
          meet_id: string
          meet_name: string
        }[]
      }
      get_team_from_invite_code: {
        Args: { invite_code: string }
        Returns: {
          team_color: string
          team_id: string
          team_name: string
        }[]
      }
      is_league_member: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
      is_league_organizer: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
      is_meet_published: { Args: { _meet_id: string }; Returns: boolean }
      is_team_in_published_meet: {
        Args: { _team_id: string }
        Returns: boolean
      }
      is_team_in_user_league: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_manager: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_team_in_meet: {
        Args: { _meet_id: string; _user_id: string }
        Returns: boolean
      }
      is_wrestler_in_published_meet: {
        Args: { _wrestler_id: string }
        Returns: boolean
      }
      redeem_invite_code: { Args: { invite_code: string }; Returns: string }
      redeem_team_invite_code: {
        Args: { invite_code: string }
        Returns: string
      }
      shares_meet_with_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      invitation_type: "email" | "code"
      league_role: "organizer" | "admin"
      league_team_status: "pending" | "active" | "declined" | "removed"
      pairing_status: "draft" | "planned" | "published"
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
      invitation_type: ["email", "code"],
      league_role: ["organizer", "admin"],
      league_team_status: ["pending", "active", "declined", "removed"],
      pairing_status: ["draft", "planned", "published"],
    },
  },
} as const
