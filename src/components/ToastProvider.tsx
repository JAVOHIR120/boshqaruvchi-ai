"use client";

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(17, 24, 39, 0.9)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.1)',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '0.95rem',
          fontWeight: '500',
          fontFamily: 'var(--font-sans)',
          maxWidth: '400px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
          style: {
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.1)',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.1)',
          },
        },
        duration: 5000,
      }}
    />
  );
}
