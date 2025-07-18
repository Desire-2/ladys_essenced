'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {children}
      {isClient && (
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
          }}
        />
      )}
    </>
  );
}
