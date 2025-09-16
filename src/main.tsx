// Initialize CSS polyfill FIRST, before any other imports
import { initializeCSSPolyfill } from './utils/css-polyfill'
initializeCSSPolyfill()

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from './App.tsx'
import './index.css'
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "./components/ui/sonner"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
