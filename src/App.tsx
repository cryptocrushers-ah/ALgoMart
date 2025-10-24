import { useState, useEffect } from 'react';
import { WalletProvider } from './context/WalletContext';
import { Header } from './components/Header';
import { Marketplace } from './pages/Marketplace';
import { CreateListing } from './pages/CreateListing';
import { ListingDetail } from './pages/ListingDetail';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  const renderPage = () => {
    if (currentPath === '/create') {
      return <CreateListing />;
    } else if (currentPath.startsWith('/listing/')) {
      const listingId = currentPath.split('/listing/')[1];
      return <ListingDetail listingId={listingId} />;
    } else {
      return <Marketplace />;
    }
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-slate-900">
        <Header />
        {renderPage()}
      </div>
    </WalletProvider>
  );
}

export default App;
