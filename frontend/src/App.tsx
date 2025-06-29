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

// Extend Chakra UI theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
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