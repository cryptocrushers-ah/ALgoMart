import { Listing } from '../lib/supabase';
import { formatAddress } from '../lib/algorand';
import { Package } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  const imageUrl = `https://gateway.pinata.cloud/ipfs/${listing.image_ipfs_hash}`;

  return (
    <a
      href={`/listing/${listing.id}`}
      className="block bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all hover:transform hover:scale-105"
    >
      <div className="aspect-square bg-slate-700 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '';
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center">
          <Package className="w-16 h-16 text-slate-600" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 truncate">{listing.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-400">{listing.price_algo} ALGO</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Seller</p>
            <p className="text-sm text-gray-300">{formatAddress(listing.seller_address)}</p>
          </div>
        </div>
      </div>
    </a>
  );
};
