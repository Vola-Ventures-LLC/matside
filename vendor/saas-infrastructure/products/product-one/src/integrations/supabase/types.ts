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
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      affiliate_settings: {
        Row: {
          allow_self_referral: boolean
          attribution_window_days: number
          auto_approve_referrers: boolean
          created_at: string
          default_referrer_tier_id: string | null
          holdback_period_days: number
          id: string
          minimum_payout_cents: number
          updated_at: string
        }
        Insert: {
          allow_self_referral?: boolean
          attribution_window_days?: number
          auto_approve_referrers?: boolean
          created_at?: string
          default_referrer_tier_id?: string | null
          holdback_period_days?: number
          id?: string
          minimum_payout_cents?: number
          updated_at?: string
        }
        Update: {
          allow_self_referral?: boolean
          attribution_window_days?: number
          auto_approve_referrers?: boolean
          created_at?: string
          default_referrer_tier_id?: string | null
          holdback_period_days?: number
          id?: string
          minimum_payout_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_settings_default_referrer_tier_id_fkey"
            columns: ["default_referrer_tier_id"]
            isOneToOne: false
            referencedRelation: "affiliate_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_tiers: {
        Row: {
          commission_percent: number
          created_at: string
          id: string
          is_active: boolean
          max_revenue_cents: number | null
          min_revenue_cents: number
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          commission_percent: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_revenue_cents?: number | null
          min_revenue_cents?: number
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_revenue_cents?: number | null
          min_revenue_cents?: number
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          affiliate_type: Database["public"]["Enums"]["affiliate_type"]
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          created_at: string
          id: string
          notes: string | null
          payout_method: Database["public"]["Enums"]["payout_method"]
          paypal_email: string | null
          status: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_type?: Database["public"]["Enums"]["affiliate_type"]
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payout_method?: Database["public"]["Enums"]["payout_method"]
          paypal_email?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_type?: Database["public"]["Enums"]["affiliate_type"]
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payout_method?: Database["public"]["Enums"]["payout_method"]
          paypal_email?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_prompt_configs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          prompt_key: string
          prompt_template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prompt_key: string
          prompt_template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prompt_key?: string
          prompt_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_email_config: {
        Row: {
          created_at: string
          default_from_name: string
          id: string
          primary_domain: string
          support_inbound_address: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_from_name?: string
          id?: string
          primary_domain: string
          support_inbound_address?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_from_name?: string
          id?: string
          primary_domain?: string
          support_inbound_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_sms_configs: {
        Row: {
          app_id: string
          created_at: string
          daily_limit: number | null
          id: string
          is_enabled: boolean
          rate_limit_per_minute: number | null
          twilio_account_sid_encrypted: string | null
          twilio_auth_token_encrypted: string | null
          twilio_messaging_service_sid: string | null
          twilio_phone_number: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_enabled?: boolean
          rate_limit_per_minute?: number | null
          twilio_account_sid_encrypted?: string | null
          twilio_auth_token_encrypted?: string | null
          twilio_messaging_service_sid?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_enabled?: boolean
          rate_limit_per_minute?: number | null
          twilio_account_sid_encrypted?: string | null
          twilio_auth_token_encrypted?: string | null
          twilio_messaging_service_sid?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_sms_configs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_stripe_configs: {
        Row: {
          app_id: string
          connect_enabled: boolean
          created_at: string
          credits_enabled: boolean
          id: string
          is_configured: boolean
          one_time_enabled: boolean
          platform_fee_percent: number | null
          stripe_publishable_key: string | null
          stripe_secret_key_id: string | null
          stripe_webhook_secret_id: string | null
          subscriptions_enabled: boolean
          updated_at: string
        }
        Insert: {
          app_id: string
          connect_enabled?: boolean
          created_at?: string
          credits_enabled?: boolean
          id?: string
          is_configured?: boolean
          one_time_enabled?: boolean
          platform_fee_percent?: number | null
          stripe_publishable_key?: string | null
          stripe_secret_key_id?: string | null
          stripe_webhook_secret_id?: string | null
          subscriptions_enabled?: boolean
          updated_at?: string
        }
        Update: {
          app_id?: string
          connect_enabled?: boolean
          created_at?: string
          credits_enabled?: boolean
          id?: string
          is_configured?: boolean
          one_time_enabled?: boolean
          platform_fee_percent?: number | null
          stripe_publishable_key?: string | null
          stripe_secret_key_id?: string | null
          stripe_webhook_secret_id?: string | null
          subscriptions_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_stripe_configs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          blog_enabled: boolean
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          orgs_enabled: boolean
          referrals_enabled: boolean
          slug: string
          sms_enabled: boolean
          updated_at: string
        }
        Insert: {
          blog_enabled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          orgs_enabled?: boolean
          referrals_enabled?: boolean
          slug: string
          sms_enabled?: boolean
          updated_at?: string
        }
        Update: {
          blog_enabled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          orgs_enabled?: boolean
          referrals_enabled?: boolean
          slug?: string
          sms_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          action: string
          attempt_count: number
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: string
          window_start: string
        }
        Insert: {
          action: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: string
          window_start?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          window_start?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          notified_at: string | null
          notify_roles: string[] | null
          notify_summary: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_for: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          notified_at?: string | null
          notify_roles?: string[] | null
          notify_summary?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_for?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          notified_at?: string | null
          notify_roles?: string[] | null
          notify_summary?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_for?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      changelog: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          type?: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      chat_rate_limits: {
        Row: {
          created_at: string
          id: string
          message_count: number
          session_id: string | null
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          session_id?: string | null
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          session_id?: string | null
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      commission_events: {
        Row: {
          affiliate_id: string
          commission_cents: number
          commission_percent: number
          created_at: string
          gross_amount_cents: number
          holdback_until: string | null
          id: string
          notes: string | null
          payout_id: string | null
          referral_id: string | null
          source_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["commission_status"]
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_cents: number
          commission_percent: number
          created_at?: string
          gross_amount_cents: number
          holdback_until?: string | null
          id?: string
          notes?: string | null
          payout_id?: string | null
          referral_id?: string | null
          source_id?: string | null
          source_type: string
          status?: Database["public"]["Enums"]["commission_status"]
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_cents?: number
          commission_percent?: number
          created_at?: string
          gross_amount_cents?: number
          holdback_until?: string | null
          id?: string
          notes?: string | null
          payout_id?: string | null
          referral_id?: string | null
          source_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["commission_status"]
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_events_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_events_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "affiliate_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payouts: {
        Row: {
          affiliate_id: string
          amount_cents: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          notes: string | null
          payout_method: Database["public"]["Enums"]["payout_method"]
          paypal_payout_id: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount_cents: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          notes?: string | null
          payout_method: Database["public"]["Enums"]["payout_method"]
          paypal_payout_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount_cents?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          notes?: string | null
          payout_method?: Database["public"]["Enums"]["payout_method"]
          paypal_payout_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          content_item_id: string | null
          created_at: string
          id: string
          idea_text: string
          idea_type: string
          is_used: boolean
          user_id: string
        }
        Insert: {
          content_item_id?: string | null
          created_at?: string
          id?: string
          idea_text: string
          idea_type?: string
          is_used?: boolean
          user_id: string
        }
        Update: {
          content_item_id?: string | null
          created_at?: string
          id?: string
          idea_text?: string
          idea_type?: string
          is_used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          ai_suggestions: Json | null
          content: string | null
          content_type: string
          created_at: string
          excerpt: string | null
          id: string
          meta_data: Json | null
          platform: string | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          content?: string | null
          content_type?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_data?: Json | null
          platform?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          content?: string | null
          content_type?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_data?: Json | null
          platform?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_insights: {
        Row: {
          category: string
          conversation_id: string
          created_at: string
          id: string
          insight_text: string
          merged_into_id: string | null
          notes: string | null
          report_count: number
          sentiment: string
          status: Database["public"]["Enums"]["insight_status"]
          tags: string[] | null
        }
        Insert: {
          category: string
          conversation_id: string
          created_at?: string
          id?: string
          insight_text: string
          merged_into_id?: string | null
          notes?: string | null
          report_count?: number
          sentiment: string
          status?: Database["public"]["Enums"]["insight_status"]
          tags?: string[] | null
        }
        Update: {
          category?: string
          conversation_id?: string
          created_at?: string
          id?: string
          insight_text?: string
          merged_into_id?: string | null
          notes?: string | null
          report_count?: number
          sentiment?: string
          status?: Database["public"]["Enums"]["insight_status"]
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_insights_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_insights_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "conversation_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          credits_awarded: number | null
          discount_amount_cents: number
          id: string
          organization_id: string | null
          original_amount_cents: number
          purchase_id: string
          purchase_type: string
          referral_id: string | null
          referrer_credits_awarded: number | null
          referrer_discount_applied: boolean | null
          stripe_promotion_code_id: string | null
          trial_days_added: number | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          credits_awarded?: number | null
          discount_amount_cents: number
          id?: string
          organization_id?: string | null
          original_amount_cents: number
          purchase_id: string
          purchase_type: string
          referral_id?: string | null
          referrer_credits_awarded?: number | null
          referrer_discount_applied?: boolean | null
          stripe_promotion_code_id?: string | null
          trial_days_added?: number | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          credits_awarded?: number | null
          discount_amount_cents?: number
          id?: string
          organization_id?: string | null
          original_amount_cents?: number
          purchase_id?: string
          purchase_type?: string
          referral_id?: string | null
          referrer_credits_awarded?: number | null
          referrer_discount_applied?: boolean | null
          stripe_promotion_code_id?: string | null
          trial_days_added?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          app_id: string
          applies_to: Database["public"]["Enums"]["coupon_scope"]
          code: string
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at: string
          description: string | null
          duration_months: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_first_purchase_only: boolean
          is_referral_only: boolean
          is_stackable: boolean
          max_per_user: number | null
          max_redemptions: number | null
          min_purchase_cents: number | null
          name: string
          redemption_count: number
          referee_reward_type: Database["public"]["Enums"]["coupon_type"] | null
          referee_reward_value: number | null
          referrer_reward_type:
            | Database["public"]["Enums"]["coupon_type"]
            | null
          referrer_reward_value: number | null
          specific_product_ids: string[] | null
          starts_at: string
          updated_at: string
          upgrade_to_plan_id: string | null
          value: number
        }
        Insert: {
          app_id: string
          applies_to?: Database["public"]["Enums"]["coupon_scope"]
          code: string
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          description?: string | null
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_first_purchase_only?: boolean
          is_referral_only?: boolean
          is_stackable?: boolean
          max_per_user?: number | null
          max_redemptions?: number | null
          min_purchase_cents?: number | null
          name: string
          redemption_count?: number
          referee_reward_type?:
            | Database["public"]["Enums"]["coupon_type"]
            | null
          referee_reward_value?: number | null
          referrer_reward_type?:
            | Database["public"]["Enums"]["coupon_type"]
            | null
          referrer_reward_value?: number | null
          specific_product_ids?: string[] | null
          starts_at?: string
          updated_at?: string
          upgrade_to_plan_id?: string | null
          value: number
        }
        Update: {
          app_id?: string
          applies_to?: Database["public"]["Enums"]["coupon_scope"]
          code?: string
          coupon_type?: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          description?: string | null
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_first_purchase_only?: boolean
          is_referral_only?: boolean
          is_stackable?: boolean
          max_per_user?: number | null
          max_redemptions?: number | null
          min_purchase_cents?: number | null
          name?: string
          redemption_count?: number
          referee_reward_type?:
            | Database["public"]["Enums"]["coupon_type"]
            | null
          referee_reward_value?: number | null
          referrer_reward_type?:
            | Database["public"]["Enums"]["coupon_type"]
            | null
          referrer_reward_value?: number | null
          specific_product_ids?: string[] | null
          starts_at?: string
          updated_at?: string
          upgrade_to_plan_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_upgrade_to_plan_id_fkey"
            columns: ["upgrade_to_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          app_id: string
          created_at: string
          credits_amount: number
          currency: string
          description: string | null
          expiry_days: number | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          credits_amount: number
          currency?: string
          description?: string | null
          expiry_days?: number | null
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          credits_amount?: number
          currency?: string
          description?: string | null
          expiry_days?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_packs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          app_id: string
          balance_after: number
          created_at: string
          credit_pack_id: string | null
          description: string | null
          expires_at: string | null
          id: string
          organization_id: string | null
          stripe_payment_intent_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          app_id: string
          balance_after: number
          created_at?: string
          credit_pack_id?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          app_id?: string
          balance_after?: number
          created_at?: string
          credit_pack_id?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_credit_pack_id_fkey"
            columns: ["credit_pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_sends: {
        Row: {
          created_at: string
          email_message_id: string | null
          evaluation_result: Json | null
          id: string
          sent_at: string
          template_name: string
          trigger_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_message_id?: string | null
          evaluation_result?: Json | null
          id?: string
          sent_at?: string
          template_name: string
          trigger_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_message_id?: string | null
          evaluation_result?: Json | null
          id?: string
          sent_at?: string
          template_name?: string
          trigger_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_sends_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "drip_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_sequence_steps: {
        Row: {
          content: string
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          sequence_id: string
          step_order: number
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          sequence_id: string
          step_order?: number
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          sequence_id?: string
          step_order?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "drip_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drip_trigger_conditions: {
        Row: {
          created_at: string
          duration_hours: number | null
          id: string
          milestone_key: string
          operator: Database["public"]["Enums"]["drip_condition_operator"]
          sort_order: number | null
          trigger_id: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          id?: string
          milestone_key: string
          operator?: Database["public"]["Enums"]["drip_condition_operator"]
          sort_order?: number | null
          trigger_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          id?: string
          milestone_key?: string
          operator?: Database["public"]["Enums"]["drip_condition_operator"]
          sort_order?: number | null
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_trigger_conditions_milestone_key_fkey"
            columns: ["milestone_key"]
            isOneToOne: false
            referencedRelation: "milestone_definitions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "drip_trigger_conditions_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "drip_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_triggers: {
        Row: {
          ai_prompt: string | null
          condition_logic: string
          cooldown_hours: number | null
          created_at: string
          description: string | null
          eval_type: Database["public"]["Enums"]["drip_eval_type"]
          id: string
          max_sends_per_user: number | null
          name: string
          priority: number
          status: Database["public"]["Enums"]["drip_trigger_status"]
          template_name: string
          updated_at: string
        }
        Insert: {
          ai_prompt?: string | null
          condition_logic?: string
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          eval_type?: Database["public"]["Enums"]["drip_eval_type"]
          id?: string
          max_sends_per_user?: number | null
          name: string
          priority?: number
          status?: Database["public"]["Enums"]["drip_trigger_status"]
          template_name: string
          updated_at?: string
        }
        Update: {
          ai_prompt?: string | null
          condition_logic?: string
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          eval_type?: Database["public"]["Enums"]["drip_eval_type"]
          id?: string
          max_sends_per_user?: number | null
          name?: string
          priority?: number
          status?: Database["public"]["Enums"]["drip_trigger_status"]
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_branding: {
        Row: {
          background_color: string | null
          created_at: string
          footer_html: string | null
          header_html: string | null
          id: string
          is_active: boolean | null
          link_color: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          text_color: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_active?: boolean | null
          link_color?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_active?: boolean | null
          link_color?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_domains: {
        Row: {
          category: Database["public"]["Enums"]["email_domain_category"]
          created_at: string
          description: string | null
          display_name: string
          dns_records: Json | null
          from_name: string
          id: string
          inbound_address: string | null
          inbound_enabled: boolean
          is_active: boolean
          is_verified: boolean
          reply_to_address: string | null
          resend_domain_id: string | null
          subdomain: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["email_domain_category"]
          created_at?: string
          description?: string | null
          display_name: string
          dns_records?: Json | null
          from_name?: string
          id?: string
          inbound_address?: string | null
          inbound_enabled?: boolean
          is_active?: boolean
          is_verified?: boolean
          reply_to_address?: string | null
          resend_domain_id?: string | null
          subdomain: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["email_domain_category"]
          created_at?: string
          description?: string | null
          display_name?: string
          dns_records?: Json | null
          from_name?: string
          id?: string
          inbound_address?: string | null
          inbound_enabled?: boolean
          is_active?: boolean
          is_verified?: boolean
          reply_to_address?: string | null
          resend_domain_id?: string | null
          subdomain?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          email_id: string
          event_type: string
          id: string
          metadata: Json | null
          recipient: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          recipient: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient?: string
          subject?: string | null
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          bounce_count: number
          created_at: string
          hard_bounced_at: string | null
          id: string
          is_hard_bounced: boolean
          last_bounce_reason: string | null
          marketing_emails: boolean
          reactivated_at: string | null
          reactivated_by: string | null
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_count?: number
          created_at?: string
          hard_bounced_at?: string | null
          id?: string
          is_hard_bounced?: boolean
          last_bounce_reason?: string | null
          marketing_emails?: boolean
          reactivated_at?: string | null
          reactivated_by?: string | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_count?: number
          created_at?: string
          hard_bounced_at?: string | null
          id?: string
          is_hard_bounced?: boolean
          last_bounce_reason?: string | null
          marketing_emails?: boolean
          reactivated_at?: string | null
          reactivated_by?: string | null
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          created_at: string
          id: string
          last_reset_date: string
          marketing_sent_today: number
          transactional_sent_today: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_date?: string
          marketing_sent_today?: number
          transactional_sent_today?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_date?: string
          marketing_sent_today?: number
          transactional_sent_today?: number
          user_id?: string
        }
        Relationships: []
      }
      feature_unlocks: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string | null
          product_id: string
          stripe_payment_intent_id: string | null
          unlocked_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          product_id: string
          stripe_payment_intent_id?: string | null
          unlocked_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          product_id?: string
          stripe_payment_intent_id?: string | null
          unlocked_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_unlocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_unlocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "one_time_products"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_article_feedback: {
        Row: {
          article_id: string
          created_at: string
          id: string
          is_helpful: boolean
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          is_helpful: boolean
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          is_helpful?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "guide_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_articles: {
        Row: {
          attachments: Json | null
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          section_id: string
          slug: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
          view_count: number | null
          visible_to_roles: string[] | null
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          section_id: string
          slug: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
          visible_to_roles?: string[] | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          section_id?: string
          slug?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_articles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "guide_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      guide_sections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string
          visible_to_roles: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string
          visible_to_roles?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          visible_to_roles?: string[] | null
        }
        Relationships: []
      }
      login_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          created_at: string
          description: string | null
          domain_category:
            | Database["public"]["Enums"]["email_domain_category"]
            | null
          id: string
          is_active: boolean
          name: string
          subject: string | null
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          description?: string | null
          domain_category?:
            | Database["public"]["Enums"]["email_domain_category"]
            | null
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          description?: string | null
          domain_category?:
            | Database["public"]["Enums"]["email_domain_category"]
            | null
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      milestone_definitions: {
        Row: {
          auto_track: boolean
          category: Database["public"]["Enums"]["milestone_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          sort_order: number | null
          tracking_event: string | null
          updated_at: string
        }
        Insert: {
          auto_track?: boolean
          category: Database["public"]["Enums"]["milestone_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          sort_order?: number | null
          tracking_event?: string | null
          updated_at?: string
        }
        Update: {
          auto_track?: boolean
          category?: Database["public"]["Enums"]["milestone_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number | null
          tracking_event?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_confirmed: boolean
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_confirmed?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_confirmed?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          billing_email: boolean
          billing_in_app: boolean
          billing_sms: boolean
          billing_webhook: boolean
          created_at: string
          id: string
          mentions_email: boolean
          mentions_in_app: boolean
          mentions_sms: boolean
          mentions_webhook: boolean
          security_email: boolean
          security_in_app: boolean
          security_sms: boolean
          security_webhook: boolean
          support_email: boolean
          support_in_app: boolean
          support_sms: boolean
          support_webhook: boolean
          updated_at: string
          updates_email: boolean
          updates_in_app: boolean
          updates_sms: boolean
          updates_webhook: boolean
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          billing_email?: boolean
          billing_in_app?: boolean
          billing_sms?: boolean
          billing_webhook?: boolean
          created_at?: string
          id?: string
          mentions_email?: boolean
          mentions_in_app?: boolean
          mentions_sms?: boolean
          mentions_webhook?: boolean
          security_email?: boolean
          security_in_app?: boolean
          security_sms?: boolean
          security_webhook?: boolean
          support_email?: boolean
          support_in_app?: boolean
          support_sms?: boolean
          support_webhook?: boolean
          updated_at?: string
          updates_email?: boolean
          updates_in_app?: boolean
          updates_sms?: boolean
          updates_webhook?: boolean
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          billing_email?: boolean
          billing_in_app?: boolean
          billing_sms?: boolean
          billing_webhook?: boolean
          created_at?: string
          id?: string
          mentions_email?: boolean
          mentions_in_app?: boolean
          mentions_sms?: boolean
          mentions_webhook?: boolean
          security_email?: boolean
          security_in_app?: boolean
          security_sms?: boolean
          security_webhook?: boolean
          support_email?: boolean
          support_in_app?: boolean
          support_sms?: boolean
          support_webhook?: boolean
          updated_at?: string
          updates_email?: boolean
          updates_in_app?: boolean
          updates_sms?: boolean
          updates_webhook?: boolean
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_type: string | null
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_type?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_type?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_conversation_insights: {
        Row: {
          category: string | null
          conversation_id: string
          created_at: string
          id: string
          insight_text: string
          insight_type: string
          merged_into_id: string | null
          report_count: number | null
          sentiment: string | null
          tags: string[] | null
          was_submitted: boolean | null
        }
        Insert: {
          category?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          insight_text: string
          insight_type: string
          merged_into_id?: string | null
          report_count?: number | null
          sentiment?: string | null
          tags?: string[] | null
          was_submitted?: boolean | null
        }
        Update: {
          category?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          insight_text?: string
          insight_type?: string
          merged_into_id?: string | null
          report_count?: number | null
          sentiment?: string | null
          tags?: string[] | null
          was_submitted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_conversation_insights_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "onboarding_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_conversation_insights_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "onboarding_conversation_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_conversations: {
        Row: {
          completed_at: string | null
          context_id: string | null
          context_type: string | null
          created_at: string
          current_step_id: string | null
          dismissed_at: string | null
          id: string
          resume_context: Json | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          current_step_id?: string | null
          dismissed_at?: string | null
          id?: string
          resume_context?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          current_step_id?: string | null
          dismissed_at?: string | null
          id?: string
          resume_context?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_conversations_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          step_completed: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          step_completed?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          step_completed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "onboarding_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_messages_step_completed_fkey"
            columns: ["step_completed"]
            isOneToOne: false
            referencedRelation: "onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_steps: {
        Row: {
          category: string
          completion_type: string
          context_required: boolean | null
          context_type: string | null
          created_at: string
          depends_on: string | null
          description: string | null
          detection_config: Json | null
          id: string
          is_active: boolean
          is_required: boolean
          key: string
          navigation_cta: Json | null
          parent_context_type: string | null
          parent_optional_fields: Json | null
          parent_required_fields: Json | null
          prompt_hint: string | null
          requires_navigation: boolean
          settings_check: Json | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          completion_type?: string
          context_required?: boolean | null
          context_type?: string | null
          created_at?: string
          depends_on?: string | null
          description?: string | null
          detection_config?: Json | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          key: string
          navigation_cta?: Json | null
          parent_context_type?: string | null
          parent_optional_fields?: Json | null
          parent_required_fields?: Json | null
          prompt_hint?: string | null
          requires_navigation?: boolean
          settings_check?: Json | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completion_type?: string
          context_required?: boolean | null
          context_type?: string | null
          created_at?: string
          depends_on?: string | null
          description?: string | null
          detection_config?: Json | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          key?: string
          navigation_cta?: Json | null
          parent_context_type?: string | null
          parent_optional_fields?: Json | null
          parent_required_fields?: Json | null
          prompt_hint?: string | null
          requires_navigation?: boolean
          settings_check?: Json | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "onboarding_steps"
            referencedColumns: ["key"]
          },
        ]
      }
      one_time_products: {
        Row: {
          app_id: string
          created_at: string
          currency: string
          description: string | null
          duration_days: number | null
          feature_key: string
          id: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          feature_key: string
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          feature_key?: string
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_products_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      org_connect_accounts: {
        Row: {
          app_id: string
          charges_enabled: boolean
          created_at: string
          id: string
          onboarding_completed: boolean
          organization_id: string
          payouts_enabled: boolean
          status: Database["public"]["Enums"]["connect_account_status"]
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          charges_enabled?: boolean
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          organization_id: string
          payouts_enabled?: boolean
          status?: Database["public"]["Enums"]["connect_account_status"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          charges_enabled?: boolean
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          organization_id?: string
          payouts_enabled?: boolean
          status?: Database["public"]["Enums"]["connect_account_status"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_connect_accounts_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_connect_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_credit_balances: {
        Row: {
          app_id: string
          balance: number
          id: string
          lifetime_purchased: number
          lifetime_used: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          app_id: string
          balance?: number
          id?: string
          lifetime_purchased?: number
          lifetime_used?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          balance?: number
          id?: string
          lifetime_purchased?: number
          lifetime_used?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_credit_balances_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_credit_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          seat_count: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id: string
          seat_count?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          seat_count?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          can_manage_billing: boolean
          can_manage_content: boolean
          can_manage_members: boolean
          can_view_analytics: boolean
          created_at: string
          id: string
          is_owner: boolean
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          can_manage_billing?: boolean
          can_manage_content?: boolean
          can_manage_members?: boolean
          can_view_analytics?: boolean
          created_at?: string
          id?: string
          is_owner?: boolean
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          can_manage_billing?: boolean
          can_manage_content?: boolean
          can_manage_members?: boolean
          can_view_analytics?: boolean
          created_at?: string
          id?: string
          is_owner?: boolean
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_transactions: {
        Row: {
          connect_account_id: string
          created_at: string
          currency: string
          gross_amount_cents: number
          id: string
          net_amount_cents: number
          platform_fee_cents: number
          status: string
          stripe_charge_id: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          connect_account_id: string
          created_at?: string
          currency?: string
          gross_amount_cents: number
          id?: string
          net_amount_cents: number
          platform_fee_cents: number
          status?: string
          stripe_charge_id?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          connect_account_id?: string
          created_at?: string
          currency?: string
          gross_amount_cents?: number
          id?: string
          net_amount_cents?: number
          platform_fee_cents?: number
          status?: string
          stripe_charge_id?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_transactions_connect_account_id_fkey"
            columns: ["connect_account_id"]
            isOneToOne: false
            referencedRelation: "org_connect_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_login_at: string | null
          locale: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          locale?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          locale?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_alerts: {
        Row: {
          alert_type: string
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          limit_value: number
          metadata: Json | null
          usage_count: number
          usage_percent: number
          user_id: string | null
          window_minutes: number
        }
        Insert: {
          alert_type: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          limit_value: number
          metadata?: Json | null
          usage_count: number
          usage_percent: number
          user_id?: string | null
          window_minutes: number
        }
        Update: {
          alert_type?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          limit_value?: number
          metadata?: Json | null
          usage_count?: number
          usage_percent?: number
          user_id?: string | null
          window_minutes?: number
        }
        Relationships: []
      }
      rate_limit_configs: {
        Row: {
          created_at: string
          description: string | null
          endpoint: string
          id: string
          is_active: boolean
          max_requests: number
          updated_at: string
          window_minutes: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          max_requests: number
          updated_at?: string
          window_minutes: number
        }
        Update: {
          created_at?: string
          description?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          max_requests?: number
          updated_at?: string
          window_minutes?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          affiliate_id: string
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          affiliate_id: string
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          affiliate_id?: string
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          affiliate_id: string
          attributed_at: string
          attribution_expires_at: string | null
          created_at: string
          first_purchase_at: string | null
          id: string
          referral_code_id: string | null
          referred_user_id: string
          total_commission_cents: number
          total_revenue_cents: number
        }
        Insert: {
          affiliate_id: string
          attributed_at?: string
          attribution_expires_at?: string | null
          created_at?: string
          first_purchase_at?: string | null
          id?: string
          referral_code_id?: string | null
          referred_user_id: string
          total_commission_cents?: number
          total_revenue_cents?: number
        }
        Update: {
          affiliate_id?: string
          attributed_at?: string
          attribution_expires_at?: string | null
          created_at?: string
          first_purchase_at?: string | null
          id?: string
          referral_code_id?: string | null
          referred_user_id?: string
          total_commission_cents?: number
          total_revenue_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          app_id: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          message_sid: string | null
          message_type: string
          metadata: Json | null
          phone_number: string
          status: string
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_sid?: string | null
          message_type: string
          metadata?: Json | null
          phone_number: string
          status?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_sid?: string | null
          message_type?: string
          metadata?: Json | null
          phone_number?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sms_preferences: {
        Row: {
          created_at: string
          id: string
          marketing_enabled: boolean
          reminders_enabled: boolean
          transactional_enabled: boolean
          two_factor_enabled: boolean
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marketing_enabled?: boolean
          reminders_enabled?: boolean
          transactional_enabled?: boolean
          two_factor_enabled?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marketing_enabled?: boolean
          reminders_enabled?: boolean
          transactional_enabled?: boolean
          two_factor_enabled?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          app_id: string
          billing_type: Database["public"]["Enums"]["billing_type"]
          created_at: string
          currency: string
          description: string | null
          entity_type: Database["public"]["Enums"]["subscription_entity_type"]
          features: Json | null
          id: string
          interval: string
          is_active: boolean
          name: string
          price_cents: number
          seat_minimum: number | null
          seat_price_cents: number | null
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          app_id: string
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
          currency?: string
          description?: string | null
          entity_type: Database["public"]["Enums"]["subscription_entity_type"]
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          price_cents: number
          seat_minimum?: number | null
          seat_price_cents?: number | null
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
          currency?: string
          description?: string | null
          entity_type?: Database["public"]["Enums"]["subscription_entity_type"]
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          seat_minimum?: number | null
          seat_price_cents?: number | null
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      support_collaborators: {
        Row: {
          added_at: string
          added_by: string | null
          conversation_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          conversation_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          conversation_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_collaborators_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_collaborators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          category: string
          created_at: string
          ended_at: string | null
          guest_email: string | null
          id: string
          message_count: number
          rated_at: string | null
          started_at: string
          status: string
          updated_at: string
          user_feedback: string | null
          user_id: string | null
          user_rating: number | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          ended_at?: string | null
          guest_email?: string | null
          id?: string
          message_count?: number
          rated_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          ended_at?: string | null
          guest_email?: string | null
          id?: string
          message_count?: number
          rated_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_internal_notes: {
        Row: {
          author_id: string
          content: string
          conversation_id: string
          created_at: string
          id: string
          mentions: string[] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_internal_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_responses: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          email_in_reply_to: string | null
          email_message_id: string | null
          id: string
          is_ai_draft: boolean
          is_internal: boolean
          source: string
          ticket_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          email_in_reply_to?: string | null
          email_message_id?: string | null
          id?: string
          is_ai_draft?: boolean
          is_internal?: boolean
          source?: string
          ticket_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          email_in_reply_to?: string | null
          email_message_id?: string | null
          id?: string
          is_ai_draft?: boolean
          is_internal?: boolean
          source?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_by_user: boolean | null
          conversation_id: string | null
          created_at: string
          description: string
          email_thread_id: string | null
          guest_email: string | null
          id: string
          inbound_email: string | null
          priority: string
          resolved_at: string | null
          sentiment: string | null
          sentiment_override: boolean | null
          status: string
          subject: string
          updated_at: string
          urgency: string | null
          urgency_override: boolean | null
          user_closed_at: string | null
          user_feedback: string | null
          user_id: string | null
          user_rating: number | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          closed_by_user?: boolean | null
          conversation_id?: string | null
          created_at?: string
          description: string
          email_thread_id?: string | null
          guest_email?: string | null
          id?: string
          inbound_email?: string | null
          priority?: string
          resolved_at?: string | null
          sentiment?: string | null
          sentiment_override?: boolean | null
          status?: string
          subject: string
          updated_at?: string
          urgency?: string | null
          urgency_override?: boolean | null
          user_closed_at?: string | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_by_user?: boolean | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          email_thread_id?: string | null
          guest_email?: string | null
          id?: string
          inbound_email?: string | null
          priority?: string
          resolved_at?: string | null
          sentiment?: string | null
          sentiment_override?: boolean | null
          status?: string
          subject?: string
          updated_at?: string
          urgency?: string | null
          urgency_override?: boolean | null
          user_closed_at?: string | null
          user_feedback?: string | null
          user_id?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          category: string
          created_at: string
          estimated_cost_cents: number | null
          id: string
          metadata: Json | null
          model: string | null
          organization_id: string | null
          resource_type: string
          tokens_input: number | null
          tokens_output: number | null
          units: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          estimated_cost_cents?: number | null
          id?: string
          metadata?: Json | null
          model?: string | null
          organization_id?: string | null
          resource_type: string
          tokens_input?: number | null
          tokens_output?: number | null
          units?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          estimated_cost_cents?: number | null
          id?: string
          metadata?: Json | null
          model?: string | null
          organization_id?: string | null
          resource_type?: string
          tokens_input?: number | null
          tokens_output?: number | null
          units?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa_challenges: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          method: Database["public"]["Enums"]["two_factor_method"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          method: Database["public"]["Enums"]["two_factor_method"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          method?: Database["public"]["Enums"]["two_factor_method"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_2fa_settings: {
        Row: {
          created_at: string
          email_verified_at: string | null
          id: string
          is_enabled: boolean
          is_required: boolean
          preferred_method:
            | Database["public"]["Enums"]["two_factor_method"]
            | null
          totp_secret: string | null
          totp_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_verified_at?: string | null
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          preferred_method?:
            | Database["public"]["Enums"]["two_factor_method"]
            | null
          totp_secret?: string | null
          totp_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_verified_at?: string | null
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          preferred_method?:
            | Database["public"]["Enums"]["two_factor_method"]
            | null
          totp_secret?: string | null
          totp_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          is_used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          is_used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credit_balances: {
        Row: {
          app_id: string
          balance: number
          id: string
          lifetime_purchased: number
          lifetime_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          balance?: number
          id?: string
          lifetime_purchased?: number
          lifetime_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          balance?: number
          id?: string
          lifetime_purchased?: number
          lifetime_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credit_balances_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          metadata: Json | null
          milestone_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          milestone_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_key_fkey"
            columns: ["milestone_key"]
            isOneToOne: false
            referencedRelation: "milestone_definitions"
            referencedColumns: ["key"]
          },
        ]
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string | null
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          metadata: Json | null
          parent_context_id: string | null
          skipped_at: string | null
          status: string
          step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          parent_context_id?: string | null
          skipped_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          parent_context_id?: string | null
          skipped_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_phone_numbers: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_primary: boolean
          is_verified: boolean
          phone_number: string
          updated_at: string
          user_id: string
          verification_code: string | null
          verification_expires_at: string | null
          verified_at: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_verified?: boolean
          phone_number: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          verification_expires_at?: string | null
          verified_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_verified?: boolean
          phone_number?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          verification_expires_at?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          endpoint_id: string
          error_message: string | null
          event_type: string
          id: string
          max_retries: number
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number
          status: Database["public"]["Enums"]["webhook_delivery_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint_id: string
          error_message?: string | null
          event_type: string
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint_id?: string
          error_message?: string | null
          event_type?: string
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          owner_type: string
          secret: string
          status: Database["public"]["Enums"]["webhook_endpoint_status"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          owner_type?: string
          secret: string
          status?: Database["public"]["Enums"]["webhook_endpoint_status"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          owner_type?: string
          secret?: string
          status?: Database["public"]["Enums"]["webhook_endpoint_status"]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_event_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_name: string
          id: string
          is_active: boolean
          payload_schema: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          event_name: string
          id?: string
          is_active?: boolean
          payload_schema?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_name?: string
          id?: string
          is_active?: boolean
          payload_schema?: Json | null
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          created_at: string
          endpoint_id: string
          event_type_id: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          endpoint_id: string
          event_type_id: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          endpoint_id?: string
          event_type_id?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_subscriptions_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "webhook_event_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_cost_breakdown: {
        Row: {
          category: string | null
          first_usage: string | null
          last_usage: string | null
          organization_id: string | null
          request_count: number | null
          resource_type: string | null
          total_cost_cents: number | null
          total_tokens_input: number | null
          total_tokens_output: number | null
          total_units: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_top_offenders: {
        Row: {
          blocked_count: number | null
          endpoints_affected: string[] | null
          identifier: string | null
          identifier_type: string | null
          ip_address: string | null
          last_alert_at: string | null
          total_alerts: number | null
          user_id: string | null
          warning_count: number | null
        }
        Relationships: []
      }
      rate_limit_usage_summary: {
        Row: {
          alert_count: number | null
          alert_type: string | null
          avg_usage_percent: number | null
          endpoint: string | null
          hour: string | null
          max_usage_percent: number | null
          unique_ips: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      usage_cost_summary: {
        Row: {
          category: string | null
          date: string | null
          organization_id: string | null
          request_count: number | null
          resource_type: string | null
          total_cost_cents: number | null
          total_tokens_input: number | null
          total_tokens_output: number | null
          total_units: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_support_internal_note: {
        Args: {
          p_author_id: string
          p_content: string
          p_conversation_id: string
          p_mentions?: string[]
        }
        Returns: Json
      }
      assign_support_ticket: {
        Args: {
          p_assignee_id: string
          p_assigner_id: string
          p_conversation_id: string
        }
        Returns: Json
      }
      check_auth_rate_limit: {
        Args: {
          p_action: string
          p_block_minutes?: number
          p_ip_address: string
          p_max_attempts: number
          p_window_minutes: number
        }
        Returns: Json
      }
      check_email_rate_limit: {
        Args: { p_daily_limit: number; p_email_type: string; p_user_id: string }
        Returns: Json
      }
      check_onboarding_step_completion: {
        Args: { p_step_key: string; p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: Json
      }
      cleanup_expired_2fa_challenges: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: number }
      create_commission_event: {
        Args: {
          p_gross_amount_cents: number
          p_referred_user_id: string
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      get_entity_onboarding_summary: {
        Args: {
          p_context_id: string
          p_context_type: string
          p_user_id: string
        }
        Returns: {
          completed_steps: number
          percent_complete: number
          required_completed: number
          required_steps: number
          total_steps: number
        }[]
      }
      get_onboarding_summary:
        | {
            Args: { p_user_id: string }
            Returns: {
              completed_steps: number
              percent_complete: number
              required_completed: number
              required_steps: number
              total_steps: number
            }[]
          }
        | {
            Args: {
              p_context_id?: string
              p_context_type?: string
              p_user_id: string
            }
            Returns: {
              completed_steps: number
              percent_complete: number
              required_completed: number
              required_steps: number
              total_steps: number
            }[]
          }
      has_org_permission: {
        Args: { _org_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_entity_onboarding:
        | {
            Args: {
              p_context_id: string
              p_context_type: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_context_id: string
              p_context_type: string
              p_parent_context_id?: string
              p_user_id: string
            }
            Returns: undefined
          }
      initialize_user_onboarding:
        | { Args: { p_user_id: string }; Returns: undefined }
        | {
            Args: {
              p_context_id?: string
              p_context_type?: string
              p_user_id: string
            }
            Returns: undefined
          }
      is_admin: { Args: never; Returns: boolean }
      is_org_member:
        | { Args: { _org_id: string; _user_id: string }; Returns: boolean }
        | { Args: { org_id: string }; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_owner_or_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      reactivate_email: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: boolean
      }
      record_email_bounce: {
        Args: { p_bounce_type: string; p_reason: string; p_user_id: string }
        Returns: boolean
      }
      record_rate_limit_alert: {
        Args: {
          p_alert_type: string
          p_endpoint: string
          p_ip_address: string
          p_limit_value: number
          p_metadata?: Json
          p_usage_count: number
          p_user_id: string
          p_window_minutes: number
        }
        Returns: string
      }
      record_usage: {
        Args: {
          p_category?: string
          p_estimated_cost_cents?: number
          p_metadata?: Json
          p_model?: string
          p_organization_id?: string
          p_resource_type?: string
          p_tokens_input?: number
          p_tokens_output?: number
          p_units?: number
          p_user_id: string
        }
        Returns: string
      }
      record_user_milestone: {
        Args: { p_metadata?: Json; p_milestone_key: string; p_user_id: string }
        Returns: boolean
      }
      reset_user_onboarding: {
        Args: {
          p_admin_user_id: string
          p_reset_conversations?: boolean
          p_reset_progress?: boolean
          p_target_user_id: string
        }
        Returns: Json
      }
      unsubscribe_by_token: { Args: { p_token: string }; Returns: boolean }
      update_insight_with_mentions: {
        Args: {
          p_author_id: string
          p_insight_id: string
          p_mentions?: string[]
          p_notes: string
          p_status: string
        }
        Returns: Json
      }
      user_has_milestone: {
        Args: { p_milestone_key: string; p_user_id: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          p_amount_cents: number
          p_code: string
          p_purchase_id: string
          p_purchase_type: string
          p_user_id: string
        }
        Returns: Json
      }
      validate_parent_context: {
        Args: {
          p_context_type: string
          p_parent_context_id: string
          p_parent_context_type: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      affiliate_status: "pending" | "approved" | "suspended" | "rejected"
      affiliate_type: "referrer" | "affiliate" | "sales_rep"
      app_role: "user" | "admin" | "owner" | "tester"
      billing_type: "seat_based" | "flat_rate"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      connect_account_status: "pending" | "active" | "restricted" | "disabled"
      coupon_scope:
        | "all"
        | "subscriptions"
        | "credit_packs"
        | "one_time_products"
      coupon_type:
        | "credit_bonus"
        | "subscription_percent"
        | "fixed_amount_off"
        | "percent_off"
        | "trial_extension"
        | "free_upgrade"
      drip_condition_operator: "has" | "not_has" | "not_has_for"
      drip_eval_type: "simple" | "ai"
      drip_trigger_status: "active" | "paused" | "draft"
      email_domain_category:
        | "transactional"
        | "support"
        | "outbound"
        | "marketing"
        | "notifications"
        | "billing"
      insight_status:
        | "new"
        | "reviewed"
        | "actionable"
        | "in_progress"
        | "resolved"
        | "dismissed"
      milestone_category: "onboarding" | "engagement" | "billing" | "support"
      payout_method: "platform_credits" | "stripe" | "paypal" | "manual"
      subscription_entity_type: "user" | "organization"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      two_factor_method: "totp" | "email" | "sms"
      webhook_delivery_status: "pending" | "success" | "failed" | "retrying"
      webhook_endpoint_status: "active" | "paused" | "disabled"
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
      affiliate_status: ["pending", "approved", "suspended", "rejected"],
      affiliate_type: ["referrer", "affiliate", "sales_rep"],
      app_role: ["user", "admin", "owner", "tester"],
      billing_type: ["seat_based", "flat_rate"],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      connect_account_status: ["pending", "active", "restricted", "disabled"],
      coupon_scope: [
        "all",
        "subscriptions",
        "credit_packs",
        "one_time_products",
      ],
      coupon_type: [
        "credit_bonus",
        "subscription_percent",
        "fixed_amount_off",
        "percent_off",
        "trial_extension",
        "free_upgrade",
      ],
      drip_condition_operator: ["has", "not_has", "not_has_for"],
      drip_eval_type: ["simple", "ai"],
      drip_trigger_status: ["active", "paused", "draft"],
      email_domain_category: [
        "transactional",
        "support",
        "outbound",
        "marketing",
        "notifications",
        "billing",
      ],
      insight_status: [
        "new",
        "reviewed",
        "actionable",
        "in_progress",
        "resolved",
        "dismissed",
      ],
      milestone_category: ["onboarding", "engagement", "billing", "support"],
      payout_method: ["platform_credits", "stripe", "paypal", "manual"],
      subscription_entity_type: ["user", "organization"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      two_factor_method: ["totp", "email", "sms"],
      webhook_delivery_status: ["pending", "success", "failed", "retrying"],
      webhook_endpoint_status: ["active", "paused", "disabled"],
    },
  },
} as const
