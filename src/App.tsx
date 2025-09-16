import { Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import Index from "./pages/Index"
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
import Header from "./components/Header"
import { performanceMonitoring } from "./services/performanceMonitoring"
import "./App.css"

function App() {
  useEffect(() => {
    // Inicializar el monitoreo de rendimiento
    performanceMonitoring.initialize({
      enableCoreWebVitals: true,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableCustomMetrics: true,
      enableUserContext: true,
      sampleRate: 1.0, // 100% de muestreo en desarrollo
      endpoint: '/api/performance-metrics',
      batchSize: 10,
      flushInterval: 30000, // 30 segundos
    });

    // Limpiar al desmontar
    return () => {
      performanceMonitoring.cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
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
  )
}

export default App
