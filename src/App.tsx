import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import { OverlayPage } from './pages/OverlayPage';
import { PresenterPage } from './pages/PresenterPage';
import { DirectorPage } from './pages/DirectorPage';
import { HubPage } from './pages/HubPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple clean route matching
  const renderPage = () => {
    if (currentPath === '/overlay' || currentPath.startsWith('/overlay/')) {
      return <OverlayPage />;
    }
    if (currentPath === '/presenter' || currentPath.startsWith('/presenter/')) {
      return <PresenterPage />;
    }
    if (currentPath === '/director' || currentPath.startsWith('/director/')) {
      return <DirectorPage />;
    }
    return <HubPage />;
  };

  return (
    <SocketProvider>
      {renderPage()}
    </SocketProvider>
  );
};

