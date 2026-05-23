export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          username: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'pastor' | 'member';
          referral_code: string;
          referred_by: number | null;
          display_balance: number;
          total_deposited_real: number;
          total_withdrawn_real: number;
          pending_withdrawal_amount: number;
          first_deposit_time: string | null;
          plisio_uid: string | null;
          plisio_btc_address: string | null;
          plisio_eth_address: string | null;
          plisio_usdt_address: string | null;
          created_at: string;
          last_login: string | null;
          status: 'active' | 'suspended' | 'banned';
        };
        Insert: {
          id?: number;
          username: string;
          email: string;
          password_hash: string;
          role?: 'admin' | 'pastor' | 'member';
          referral_code: string;
          referred_by?: number | null;
          display_balance?: number;
          total_deposited_real?: number;
          total_withdrawn_real?: number;
          pending_withdrawal_amount?: number;
          first_deposit_time?: string | null;
          plisio_uid?: string | null;
          plisio_btc_address?: string | null;
          plisio_eth_address?: string | null;
          plisio_usdt_address?: string | null;
          created_at?: string;
          last_login?: string | null;
          status?: 'active' | 'suspended' | 'banned';
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      deposits: {
        Row: {
          id: number;
          user_id: number;
          txn_id: string | null;
          txid: string | null;
          currency: string;
          amount: number;
          address: string | null;
          status: 'pending' | 'completed' | 'rejected';
          created_at: string;
          confirmed_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          txn_id?: string | null;
          txid?: string | null;
          currency?: string;
          amount: number;
          address?: string | null;
          status?: 'pending' | 'completed' | 'rejected';
          created_at?: string;
          confirmed_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['deposits']['Insert']>;
      };
      withdrawals: {
        Row: {
          id: number;
          user_id: number;
          txn_id: string | null;
          amount: number;
          currency: string;
          address: string;
          fee: number;
          request_time: string;
          eligible_time: string;
          processed_time: string | null;
          status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
          block_reason: string | null;
          admin_override: number;
        };
        Insert: {
          id?: number;
          user_id: number;
          txn_id?: string | null;
          amount: number;
          currency?: string;
          address: string;
          fee?: number;
          request_time?: string;
          eligible_time: string;
          processed_time?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
          block_reason?: string | null;
          admin_override?: number;
        };
        Update: Partial<Database['public']['Tables']['withdrawals']['Insert']>;
      };
      referral_commissions: {
        Row: {
          id: number;
          user_id: number;
          source_user_id: number;
          level: number;
          percentage: number;
          amount: number;
          source_deposit_id: number;
          source_amount: number;
          status: 'pending' | 'paid' | 'cancelled';
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          source_user_id: number;
          level: number;
          percentage: number;
          amount: number;
          source_deposit_id: number;
          source_amount: number;
          status?: 'pending' | 'paid' | 'cancelled';
          created_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['referral_commissions']['Insert']>;
      };
      ai_trading_profits: {
        Row: {
          id: number;
          user_id: number;
          amount: number;
          percentage: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: number;
          amount: number;
          percentage: number;
          date: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ai_trading_profits']['Insert']>;
      };
      withdrawal_locks: {
        Row: {
          id: number;
          user_id: number;
          first_deposit_time: string;
          lock_expiry_time: string;
          is_locked: number;
          reason: string | null;
          admin_unlocked_by: number | null;
          unlocked_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          first_deposit_time: string;
          lock_expiry_time: string;
          is_locked?: number;
          reason?: string | null;
          admin_unlocked_by?: number | null;
          unlocked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['withdrawal_locks']['Insert']>;
      };
      settings: {
        Row: {
          id: number;
          setting_key: string;
          setting_value: string;
          description: string | null;
        };
        Insert: {
          id?: number;
          setting_key: string;
          setting_value: string;
          description?: string | null;
        };
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      admin_logs: {
        Row: {
          id: number;
          admin_id: number;
          action: string;
          target_table: string | null;
          target_id: number | null;
          old_value: string | null;
          new_value: string | null;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          admin_id: number;
          action: string;
          target_table?: string | null;
          target_id?: number | null;
          old_value?: string | null;
          new_value?: string | null;
          ip?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_logs']['Insert']>;
      };
      sessions: {
        Row: {
          session_token: string;
          user_id: number;
          user_role: string;
          csrf_token: string;
          flash_data: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          session_token: string;
          user_id: number;
          user_role: string;
          csrf_token: string;
          flash_data?: string | null;
          created_at?: string;
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      password_resets: {
        Row: {
          id: number;
          email: string;
          token: string;
          created_at: string;
          used: boolean;
        };
        Insert: {
          id?: number;
          email: string;
          token: string;
          created_at?: string;
          used?: boolean;
        };
        Update: Partial<Database['public']['Tables']['password_resets']['Insert']>;
      };
    };
  };
}
