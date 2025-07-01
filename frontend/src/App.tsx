import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import * as Sentry from '@sentry/react';

// Components
import Layout from './components/Layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LinguaLivePage from './pages/LinguaLivePage';
import LinguaLiveMeetPage from './pages/LinguaLiveMeetPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import TranscriptHistoryPage from './pages/TranscriptHistoryPage';

// Hooks
import { useAuthStore } from './store/authStore';

// Utils
import './utils/sentry';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Futuristic theme with neon colors and glassmorphism
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80c9ff',
      300: '#4db2ff',
      400: '#1a9bff',
      500: '#00E0FF', // Electric Blue
      600: '#00b3cc',
      700: '#008699',
      800: '#005966',
      900: '#002c33',
    },
    accent: {
      50: '#ffe6f7',
      100: '#ffb3e0',
      200: '#ff80c9',
      300: '#ff4db2',
      400: '#ff1a9b',
      500: '#FF00C8', // Neon Pink
      600: '#cc00a0',
      700: '#990078',
      800: '#660050',
      900: '#330028',
    },
    dark: {
      50: '#f7f7f8',
      100: '#eeeef0',
      200: '#d1d1d6',
      300: '#b0b0b8',
      400: '#8e8e9a',
      500: '#6c6c7c',
      600: '#565664',
      700: '#40404c',
      800: '#2a2a34',
      900: '#0f0f1c', // Very dark background
    },
  },
  fonts: {
    heading: '"Orbitron", "Space Grotesk", system-ui, sans-serif',
    body: '"Poppins", "Inter", system-ui, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(135deg, #0f0f1c 0%, #1c1c3a 100%)',
        color: 'white',
        fontFamily: 'body',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        _focus: {
          boxShadow: '0 0 0 3px rgba(0, 224, 255, 0.3)',
        },
      },
      variants: {
        solid: {
          bg: 'linear-gradient(135deg, #00E0FF 0%, #FF00C8 100%)',
          color: 'white',
          _hover: {
            bg: 'linear-gradient(135deg, #00b3cc 0%, #cc00a0 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 224, 255, 0.4)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        outline: {
          border: '2px solid',
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'rgba(0, 224, 255, 0.1)',
            borderColor: 'brand.400',
            color: 'brand.400',
            boxShadow: '0 0 20px rgba(0, 224, 255, 0.3)',
          },
        },
        ghost: {
          color: 'white',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.1)',
            color: 'brand.400',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        bg: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'xl',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route component (redirects if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Router>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/lingualive" element={<LinguaLivePage />} />
                <Route path="/meet" element={<LinguaLiveMeetPage />} />
                <Route path="/meet/:meetingId" element={<MeetingRoomPage />} />
                
                {/* Auth routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } 
                />
                
                {/* Protected routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/transcripts" 
                  element={
                    <ProtectedRoute>
                      <TranscriptHistoryPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
            
            {/* Toast notifications */}
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
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </Router>
        </ChakraProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App; 