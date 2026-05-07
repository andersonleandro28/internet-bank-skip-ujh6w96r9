import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'

// Pages
import Index from './pages/Index'
import Extrato from './pages/Extrato'
import Transfer from './pages/Transfer'
import Boleto from './pages/Boleto'
import Carregar from './pages/Carregar'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import NotFound from './pages/NotFound'
import ConfiguracoesTaxas from './pages/admin/ConfiguracoesTaxas'

import { AuthProvider } from '@/hooks/use-auth'
import { BankProvider } from '@/hooks/use-bank'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <BankProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="bottom-right" />
          <Routes>
            {/* Auth Routes without main Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Main App Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/extrato" element={<Extrato />} />
              <Route path="/transferir" element={<Transfer />} />
              <Route path="/pagar-boleto" element={<Boleto />} />
              <Route path="/carregar" element={<Carregar />} />
              <Route path="/admin/configuracoes-taxas" element={<ConfiguracoesTaxas />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BankProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
