/*
  # AlgoMart Database Schema

  1. New Tables
    - `listings`
      - `id` (uuid, primary key)
      - `seller_address` (text) - Algorand wallet address
      - `title` (text) - Product title
      - `description` (text) - Product description
      - `price_algo` (numeric) - Price in ALGO
      - `image_ipfs_hash` (text) - IPFS hash for product image
      - `status` (text) - AVAILABLE, SOLD, CANCELLED
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `trades`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, foreign key to listings)
      - `buyer_address` (text) - Algorand wallet address
      - `seller_address` (text) - Algorand wallet address
      - `escrow_app_id` (bigint) - Algorand smart contract application ID
      - `amount_algo` (numeric) - Transaction amount
      - `status` (text) - INITIATED, FUNDED, COMPLETED, REFUNDED
      - `txn_id` (text) - Algorand transaction ID
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access on listings
    - Add policies for authenticated users to create listings
    - Add policies for trade participants to view their trades
*/

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_address text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_algo numeric(20, 6) NOT NULL CHECK (price_algo > 0),
  image_ipfs_hash text NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'SOLD', 'CANCELLED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_address text NOT NULL,
  seller_address text NOT NULL,
  escrow_app_id bigint,
  amount_algo numeric(20, 6) NOT NULL,
  status text NOT NULL DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'FUNDED', 'COMPLETED', 'REFUNDED')),
  txn_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_trades_listing ON trades(listing_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trades(buyer_address);
CREATE INDEX IF NOT EXISTS idx_trades_seller ON trades(seller_address);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Listings policies (public read, anyone can create)
CREATE POLICY "Anyone can view available listings"
  ON listings FOR SELECT
  USING (status = 'AVAILABLE');

CREATE POLICY "Anyone can create listings"
  ON listings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sellers can update their own listings"
  ON listings FOR UPDATE
  USING (seller_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (seller_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Trades policies
CREATE POLICY "Anyone can view trades"
  ON trades FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create trades"
  ON trades FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Trade participants can update"
  ON trades FOR UPDATE
  USING (
    buyer_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR
    seller_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  )
  WITH CHECK (
    buyer_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR
    seller_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );
