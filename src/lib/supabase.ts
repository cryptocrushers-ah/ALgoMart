import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Listing {
  id: string;
  seller_address: string;
  title: string;
  description: string;
  price_algo: number;
  image_ipfs_hash: string;
  status: 'AVAILABLE' | 'SOLD' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  listing_id: string;
  buyer_address: string;
  seller_address: string;
  escrow_app_id?: number;
  amount_algo: number;
  status: 'INITIATED' | 'FUNDED' | 'COMPLETED' | 'REFUNDED';
  txn_id?: string;
  created_at: string;
  updated_at: string;
}
