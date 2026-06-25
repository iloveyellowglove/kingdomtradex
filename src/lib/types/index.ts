// Database row types matching Supabase PostgreSQL schema

export interface User {
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
  bonus_balance: number;
  bonus_locked: boolean;
  minimum_deposit_to_unlock: number;
  bonus_unlocked_at: string | null;
  first_deposit_time: string | null;
  plisio_uid: string | null;
  plisio_btc_address: string | null;
  plisio_eth_address: string | null;
  plisio_usdt_address: string | null;
  created_at: string;
  last_login: string | null;
  status: 'active' | 'suspended' | 'banned';
}

export interface Deposit {
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
}

export interface Withdrawal {
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
}

export interface ReferralCommission {
  id: number;
  user_id: number;
  source_user_id: number;
  level: 1 | 2 | 3 | 4 | 5;
  percentage: number;
  amount: number;
  source_deposit_id: number;
  source_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at: string | null;
}

export interface AITradingProfit {
  id: number;
  user_id: number;
  amount: number;
  percentage: number;
  date: string;
  deposit_lock_id?: string | null;
  created_at: string;
}

export interface WithdrawalLock {
  id: number;
  user_id: number;
  first_deposit_time: string;
  lock_expiry_time: string;
  is_locked: number;
  reason: string | null;
  admin_unlocked_by: number | null;
  unlocked_at: string | null;
}

export interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

export interface AdminLog {
  id: number;
  admin_id: number;
  action: string;
  target_table: string | null;
  target_id: number | null;
  old_value: string | null;
  new_value: string | null;
  ip: string | null;
  created_at: string;
}

export interface Session {
  session_token: string;
  user_id: number;
  user_role: string;
  csrf_token: string;
  flash_data: string | null;
  created_at: string;
  expires_at: string;
}

export interface PasswordReset {
  id: number;
  email: string;
  token: string;
  created_at: string;
  used: boolean;
}

// Session data returned to client
export interface SessionData {
  user_id: number;
  user_role: string;
  csrf_token: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// Downline counts
export interface DownlineCounts {
  level_1: number;
  level_2: number;
  level_3: number;
  level_4: number;
  level_5: number;
}

// Referral tree node
export interface ReferralTreeNode {
  id: number;
  username: string;
  email: string;
  display_balance: number;
  created_at: string;
  level: number;
  children: ReferralTreeNode[];
}

// Waitlist
export interface WaitlistEntry {
  id: number;
  email: string;
  name: string | null;
  role: 'pastor' | 'member';
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'genesis';
  rank: number | null;
  waitlist_position: number | null;
  joined_at: string;
  email_verified: boolean;
}

export interface WaitlistLeaderboardEntry {
  name: string;
  referral_count: number;
  tier: string;
  rank: number;
}

// Plisio
export interface PlisioAddressResult {
  success: boolean;
  error?: string;
  addresses?: Record<string, string>;
}

// Social Share
export interface SocialShare {
  id: string;
  user_id: number;
  testimony_id: string | null;
  platform: string;
  click_count: number;
  created_at: string;
}

// Share Verification
export interface ShareVerification {
  id: string;
  user_id: number;
  withdrawal_id: number;
  share_id: string;
  verified_at: string;
}

// Testimony
export interface Testimony {
  id: string;
  user_id: number;
  withdrawal_id: number;
  amount: number;
  initials: string;
  referral_code: string;
  created_at: string;
}

// NOWPayments Invoice
export interface NowPaymentsInvoice {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id: string;
  expiration_estimate_date: string;
}

// Deposit Lock
export interface DepositLock {
  id: string;
  user_id: number;
  deposit_id: number;
  amount: number;
  tier: string;
  lock_days: number;
  daily_rate: number;
  locked_at: string;
  unlocks_at: string;
  status: 'locked' | 'matured' | 'withdrawn';
  created_at: string;
}
