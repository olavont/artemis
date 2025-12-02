import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import KeycloakCallback from "./pages/KeycloakCallback";
import Viaturas from "./pages/Viaturas";
import Itens from "./pages/Itens";
import Protocolos from "./pages/Protocolos";
import ProtocoloDetalhes from "./pages/ProtocoloDetalhes";
import Checkin from "./pages/Checkin";
import CheckinForm from "./pages/CheckinForm";
import Checkout from "./pages/Checkout";
import CheckoutForm from "./pages/CheckoutForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<KeycloakCallback />} />
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/viaturas"
            element={
              <Layout>
                <Viaturas />
              </Layout>
            }
          />
          <Route
            path="/itens"
            element={
              <Layout>
                <Itens />
              </Layout>
            }
          />
          <Route
            path="/protocolos"
            element={
              <Layout>
                <Protocolos />
              </Layout>
            }
          />
          <Route
            path="/protocolos/:id"
            element={
              <Layout>
                <ProtocoloDetalhes />
              </Layout>
            }
          />
          <Route
            path="/checkin"
            element={
              <Layout>
                <Checkin />
              </Layout>
            }
          />
          <Route
            path="/checkin/:id"
            element={
              <Layout>
                <CheckinForm />
              </Layout>
            }
          />
          <Route
            path="/checkout"
            element={
              <Layout>
                <Checkout />
              </Layout>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <Layout>
                <CheckoutForm />
              </Layout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
