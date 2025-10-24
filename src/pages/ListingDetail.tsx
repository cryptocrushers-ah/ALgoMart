import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { supabase, Listing, Trade } from '../lib/supabase';
import { algodClient, waitForConfirmation, algosToMicroAlgos } from '../lib/algorand';
import { Loader2, Package, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import algosdk from 'algosdk';

interface ListingDetailProps {
  listingId: string;
}

export const ListingDetail = ({ listingId }: ListingDetailProps) => {
  const { accountAddress, isConnected, wallet } = useWallet();
  const [listing, setListing] = useState<Listing | null>(null);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadListing();
  }, [listingId, accountAddress]);

  const loadListing = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();

      if (listingError) throw listingError;
      if (!listingData) throw new Error('Listing not found');

      setListing(listingData);

      if (accountAddress) {
        const { data: tradeData } = await supabase
          .from('trades')
          .select('*')
          .eq('listing_id', listingId)
          .eq('buyer_address', accountAddress)
          .maybeSingle();

        if (tradeData) {
          setTrade(tradeData);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isConnected || !accountAddress || !listing || !wallet) {
      setError('Please connect your wallet');
      return;
    }

    if (accountAddress === listing.seller_address) {
      setError('You cannot buy your own listing');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const params = await algodClient.getTransactionParams().do();
      const amountMicroAlgos = algosToMicroAlgos(listing.price_algo);

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: accountAddress,
        to: listing.seller_address,
        amount: amountMicroAlgos,
        note: new Uint8Array(Buffer.from(`AlgoMart Purchase: ${listing.id}`)),
        suggestedParams: params,
      });

      const singleTxnGroups = [{ txn, signers: [accountAddress] }];
      const signedTxn = await wallet.signTransaction([singleTxnGroups]);

      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      await waitForConfirmation(txId);

      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          listing_id: listing.id,
          buyer_address: accountAddress,
          seller_address: listing.seller_address,
          amount_algo: listing.price_algo,
          status: 'COMPLETED',
          txn_id: txId,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      await supabase
        .from('listings')
        .update({ status: 'SOLD' })
        .eq('id', listing.id);

      setTrade(tradeData);
      setSuccess('Purchase successful! Transaction confirmed on blockchain.');

      setTimeout(() => {
        loadListing();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Listing Not Found</h2>
          <p className="text-gray-400 mb-6">The listing you're looking for doesn't exist.</p>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Marketplace
          </a>
        </div>
      </div>
    );
  }

  const imageUrl = `https://gateway.pinata.cloud/ipfs/${listing.image_ipfs_hash}`;
  const isSeller = accountAddress === listing.seller_address;
  const isAvailable = listing.status === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden relative">
              <img
                src={imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 flex items-center justify-center">
                <Package className="w-24 h-24 text-slate-600" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-4">{listing.title}</h1>

                <div className="bg-slate-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Price</p>
                  <p className="text-4xl font-bold text-blue-400">{listing.price_algo} ALGO</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
                  <p className="text-gray-400 leading-relaxed">{listing.description}</p>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Seller</p>
                  <p className="text-white font-mono text-sm break-all">{listing.seller_address}</p>
                </div>

                {listing.status !== 'AVAILABLE' && (
                  <div className="bg-amber-500/10 border border-amber-500 text-amber-500 rounded-lg p-4 mb-6">
                    This item is no longer available
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 mb-6">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-lg p-4 mb-6 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{success}</p>
                      {trade?.txn_id && (
                        <p className="text-sm mt-1">
                          Transaction ID: {trade.txn_id.substring(0, 20)}...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {trade && (
                  <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-lg p-4 mb-6">
                    <p className="font-semibold flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>You have purchased this item</span>
                    </p>
                    <p className="text-sm mt-2">Status: {trade.status}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {!isConnected ? (
                  <button
                    disabled
                    className="w-full bg-slate-600 text-white font-medium py-4 rounded-lg cursor-not-allowed"
                  >
                    Connect Wallet to Buy
                  </button>
                ) : isSeller ? (
                  <button
                    disabled
                    className="w-full bg-slate-600 text-white font-medium py-4 rounded-lg cursor-not-allowed"
                  >
                    This is Your Listing
                  </button>
                ) : !isAvailable ? (
                  <button
                    disabled
                    className="w-full bg-slate-600 text-white font-medium py-4 rounded-lg cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                ) : trade ? (
                  <button
                    disabled
                    className="w-full bg-green-600 text-white font-medium py-4 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Already Purchased</span>
                  </button>
                ) : (
                  <button
                    onClick={handleBuyNow}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Buy Now</span>
                      </>
                    )}
                  </button>
                )}

                <a
                  href="/"
                  className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-white font-medium py-4 rounded-lg transition-colors"
                >
                  Back to Marketplace
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
