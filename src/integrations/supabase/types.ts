export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audio_files: {
        Row: {
          content_type: string | null
          created_at: string
          duration: number | null
          file_name: string
          file_path: string
          id: string
          size: number | null
          transcription: string | null
          user_id: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          duration?: number | null
          file_name: string
          file_path: string
          id?: string
          size?: number | null
          transcription?: string | null
          user_id?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          duration?: number | null
          file_name?: string
          file_path?: string
          id?: string
          size?: number | null
          transcription?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bets: {
        Row: {
          amount: number | null
          bet_time: string | null
          epoch: number | null
          id: number
          participant_id: number | null
          position: string | null
        }
        Insert: {
          amount?: number | null
          bet_time?: string | null
          epoch?: number | null
          id?: number
          participant_id?: number | null
          position?: string | null
        }
        Update: {
          amount?: number | null
          bet_time?: string | null
          epoch?: number | null
          id?: number
          participant_id?: number | null
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_epoch_fkey"
            columns: ["epoch"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["epoch"]
          },
          {
            foreignKeyName: "bets_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_wallet_address: string
          content: string
          created_at: string
          credit_cost: number
          excerpt: string
          id: string
          is_restricted: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author_wallet_address: string
          content: string
          created_at?: string
          credit_cost?: number
          excerpt: string
          id?: string
          is_restricted?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_wallet_address?: string
          content?: string
          created_at?: string
          credit_cost?: number
          excerpt?: string
          id?: string
          is_restricted?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          audio_file_id: string | null
          content: string
          created_at: string
          id: string
          playback_position: number | null
          sender: string
          user_id: string | null
        }
        Insert: {
          audio_file_id?: string | null
          content: string
          created_at?: string
          id?: string
          playback_position?: number | null
          sender: string
          user_id?: string | null
        }
        Update: {
          audio_file_id?: string | null
          content?: string
          created_at?: string
          id?: string
          playback_position?: number | null
          sender?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          post_id: string | null
          sol_amount: number | null
          transaction_hash: string | null
          transaction_type: Database["public"]["Enums"]["credit_transaction_type"]
          user_wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          post_id?: string | null
          sol_amount?: number | null
          transaction_hash?: string | null
          transaction_type: Database["public"]["Enums"]["credit_transaction_type"]
          user_wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          post_id?: string | null
          sol_amount?: number | null
          transaction_hash?: string | null
          transaction_type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_wallet_address?: string
        }
        Relationships: []
      }
      historical_tweets: {
        Row: {
          author_name: string | null
          author_profile_picture: string | null
          author_username: string
          classification: Json | null
          created_at: string
          entities: Json | null
          extended_entities: Json | null
          fetched_at: string | null
          id: string
          in_reply_to_id: string | null
          is_quote: boolean | null
          is_reply: boolean | null
          quoted_tweet_author: string | null
          quoted_tweet_id: string | null
          quoted_tweet_text: string | null
          text: string
        }
        Insert: {
          author_name?: string | null
          author_profile_picture?: string | null
          author_username: string
          classification?: Json | null
          created_at: string
          entities?: Json | null
          extended_entities?: Json | null
          fetched_at?: string | null
          id: string
          in_reply_to_id?: string | null
          is_quote?: boolean | null
          is_reply?: boolean | null
          quoted_tweet_author?: string | null
          quoted_tweet_id?: string | null
          quoted_tweet_text?: string | null
          text: string
        }
        Update: {
          author_name?: string | null
          author_profile_picture?: string | null
          author_username?: string
          classification?: Json | null
          created_at?: string
          entities?: Json | null
          extended_entities?: Json | null
          fetched_at?: string | null
          id?: string
          in_reply_to_id?: string | null
          is_quote?: boolean | null
          is_reply?: boolean | null
          quoted_tweet_author?: string | null
          quoted_tweet_id?: string | null
          quoted_tweet_text?: string | null
          text?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          address: string
          id: number
        }
        Insert: {
          address: string
          id?: number
        }
        Update: {
          address?: string
          id?: number
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number | null
          claim_time: string | null
          epoch: number | null
          id: number
          participant_id: number | null
        }
        Insert: {
          amount?: number | null
          claim_time?: string | null
          epoch?: number | null
          id?: number
          participant_id?: number | null
        }
        Update: {
          amount?: number | null
          claim_time?: string | null
          epoch?: number | null
          id?: number
          participant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_epoch_fkey"
            columns: ["epoch"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["epoch"]
          },
          {
            foreignKeyName: "payouts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_questions: {
        Row: {
          created_at: string
          id: number
          passage: string
          question: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          passage: string
          question: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          passage?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          bear_amount: number | null
          bull_amount: number | null
          close_price: number | null
          close_timestamp: string | null
          epoch: number
          lock_price: number | null
          lock_timestamp: string | null
          oracle_called: boolean | null
          reward_amount: number | null
          reward_base_cal_amount: number | null
          start_timestamp: string | null
          total_amount: number | null
          treasury_amount: number | null
        }
        Insert: {
          bear_amount?: number | null
          bull_amount?: number | null
          close_price?: number | null
          close_timestamp?: string | null
          epoch: number
          lock_price?: number | null
          lock_timestamp?: string | null
          oracle_called?: boolean | null
          reward_amount?: number | null
          reward_base_cal_amount?: number | null
          start_timestamp?: string | null
          total_amount?: number | null
          treasury_amount?: number | null
        }
        Update: {
          bear_amount?: number | null
          bull_amount?: number | null
          close_price?: number | null
          close_timestamp?: string | null
          epoch?: number
          lock_price?: number | null
          lock_timestamp?: string | null
          oracle_called?: boolean | null
          reward_amount?: number | null
          reward_base_cal_amount?: number | null
          start_timestamp?: string | null
          total_amount?: number | null
          treasury_amount?: number | null
        }
        Relationships: []
      }
      trading_calls: {
        Row: {
          call_end_date: string | null
          call_start_date: string
          created_at: string
          default_call_timeframe: number | null
          direction: string
          exchange: string
          id: string
          market: string
          market_id: string | null
          marketcap_category: string | null
          notes: string | null
          number_of_calls_in_timeframe: number | null
          score: number
          score_delta: number
          text: string
          trader_name: string
          tweet_url: string
          use_default_timeframe: string | null
        }
        Insert: {
          call_end_date?: string | null
          call_start_date: string
          created_at: string
          default_call_timeframe?: number | null
          direction: string
          exchange: string
          id?: string
          market: string
          market_id?: string | null
          marketcap_category?: string | null
          notes?: string | null
          number_of_calls_in_timeframe?: number | null
          score: number
          score_delta: number
          text: string
          trader_name: string
          tweet_url: string
          use_default_timeframe?: string | null
        }
        Update: {
          call_end_date?: string | null
          call_start_date?: string
          created_at?: string
          default_call_timeframe?: number | null
          direction?: string
          exchange?: string
          id?: string
          market?: string
          market_id?: string | null
          marketcap_category?: string | null
          notes?: string | null
          number_of_calls_in_timeframe?: number | null
          score?: number
          score_delta?: number
          text?: string
          trader_name?: string
          tweet_url?: string
          use_default_timeframe?: string | null
        }
        Relationships: []
      }
      twitter_cursors: {
        Row: {
          created_at: string
          cursor_type: string
          cursor_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cursor_type: string
          cursor_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cursor_type?: string
          cursor_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credit_balances: {
        Row: {
          created_at: string
          credit_balance: number
          id: string
          updated_at: string
          user_wallet_address: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          id?: string
          updated_at?: string
          user_wallet_address: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          id?: string
          updated_at?: string
          user_wallet_address?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          average_score: number | null
          completed_questions: number | null
          created_at: string
          id: string
          recent_answers: Json | null
          total_questions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_score?: number | null
          completed_questions?: number | null
          created_at?: string
          id?: string
          recent_answers?: Json | null
          total_questions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_score?: number | null
          completed_questions?: number | null
          created_at?: string
          id?: string
          recent_answers?: Json | null
          total_questions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_auth: {
        Row: {
          created_at: string
          id: string
          last_verification: string | null
          nft_verified: boolean | null
          status: Database["public"]["Enums"]["wallet_status"] | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_verification?: string | null
          nft_verified?: boolean | null
          status?: Database["public"]["Enums"]["wallet_status"] | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          last_verification?: string | null
          nft_verified?: boolean | null
          status?: Database["public"]["Enums"]["wallet_status"] | null
          updated_at?: string
          wallet_address?: string
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
      credit_transaction_type: "purchase" | "unlock" | "refund"
      wallet_status: "active" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
