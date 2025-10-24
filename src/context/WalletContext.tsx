import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextType {
  wallet: PeraWalletConnect | null;
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallet] = useState(() => new PeraWalletConnect());
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    wallet
      .reconnectSession()
      .then((accounts) => {
        wallet.connector?.on('disconnect', handleDisconnect);
        if (accounts.length) {
          setAccountAddress(accounts[0]);
          setIsConnected(true);
        }
      })
      .catch((e) => {
        console.log('Reconnection failed:', e);
      });

    return () => {
      wallet.connector?.off('disconnect', handleDisconnect);
    };
  }, [wallet]);

  const connectWallet = async () => {
    try {
      const accounts = await wallet.connect();
      wallet.connector?.on('disconnect', handleDisconnect);
      setAccountAddress(accounts[0]);
      setIsConnected(true);
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  };

  const handleDisconnect = () => {
    setAccountAddress(null);
    setIsConnected(false);
  };

  const disconnectWallet = () => {
    wallet.disconnect();
    handleDisconnect();
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        accountAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
