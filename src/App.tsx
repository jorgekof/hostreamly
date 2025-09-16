import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage"
import NotFound from "./pages/NotFound"
import PlayerDemo from "./pages/PlayerDemo"
import AuthPage from "./pages/AuthPage"
import DocsPage from "./pages/DocsPage"
import SupportPage from "./pages/SupportPage"
import CheckoutPage from "./pages/CheckoutPage"
import TermsPage from "./pages/TermsPage"
import PrivacyPage from "./pages/PrivacyPage"
import PaymentSuccess from "./pages/PaymentSuccess"
import PaymentCanceled from "./pages/PaymentCanceled"
import QuickStartGuide from "./pages/guides/QuickStartGuide"
import APIIntegrationGuide from "./pages/guides/APIIntegrationGuide"
import SecurityGuide from "./pages/guides/SecurityGuide"
import CDNGuide from "./pages/guides/CDNGuide"
import UsageMonitor from "./components/UsageMonitor"
import VideoEditor from "./components/VideoEditor/VideoEditor"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { useEffect } from "react";
import "./App.css"

// CSS polyfill for older browsers
if (typeof window !== 'undefined' && !window.CSS?.supports?.('color', 'oklch(0.5 0.2 180)')) {
  import('@/lib/css-polyfill').then(({ initCSSPolyfill }) => {
    initCSSPolyfill();
  });
}

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Initialize CSS polyfill for older browsers
    if (typeof window !== 'undefined' && !window.CSS?.supports?.('color', 'oklch(0.5 0.2 180)')) {
      import('@/lib/css-polyfill').then(({ initCSSPolyfill }) => {
        initCSSPolyfill();
      });
    }

    // Initialize debug helpers in development
    if (import.meta.env.DEV) {
      import('@/lib/debug').then(({ initDebugHelpers }) => {
        initDebugHelpers();
      });
    }

    // Cleanup function
    return () => {
      // Cleanup any global event listeners or intervals here
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Navigation />
          <div className="min-h-screen bg-background">
            <main className="pt-20">
              <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/usage" element={
        <ProtectedRoute>
          <UsageMonitor />
        </ProtectedRoute>
      } />
      <Route path="/editor" element={
        <ProtectedRoute>
          <VideoEditor />
        </ProtectedRoute>
      } />
      <Route path="/player-demo" element={<PlayerDemo />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-canceled" element={<PaymentCanceled />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/docs/quick-start" element={<QuickStartGuide />} />
          <Route path="/docs/api-integration" element={<APIIntegrationGuide />} />
          <Route path="/docs/security" element={<SecurityGuide />} />
          <Route path="/docs/cdn" element={<CDNGuide />} />
      <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App
