import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../lib/algorand';
import { Wallet, LogOut } from 'lucide-react';

export const Header = () => {
  const { accountAddress, isConnected, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AM</span>
            </div>
            <h1 className="text-xl font-bold text-white">AlgoMart</h1>
          </div>

          <nav className="flex items-center space-x-6">
            <a href="/" className="text-gray-300 hover:text-white transition-colors">
              Marketplace
            </a>
            <a href="/create" className="text-gray-300 hover:text-white transition-colors">
              Sell Item
            </a>
          </nav>

          <div>
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="bg-slate-700 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-300">{formatAddress(accountAddress!)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
