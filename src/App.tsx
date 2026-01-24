
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CarProvider } from '@/contexts/CarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import AddCar from "@/pages/AddCar";
import EditCar from "@/pages/EditCar";
import CarDetails from "@/pages/CarDetails";
import Connections from "@/pages/Connections";
import Settings from "@/pages/Settings";
import Atendimentos from "@/pages/Atendimentos";
import Followup from "@/pages/Followup";
import Users from "@/pages/Users";
import PromptEditor from "@/pages/PromptEditor";
import PromptEditorOlx from "@/pages/PromptEditorOlx";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Institucional from "@/pages/Institucional";
import PoliticaPrivacidade from "@/pages/PoliticaPrivacidade";
import TermosCondicoes from "@/pages/TermosCondicoes";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";

// Import React Query components
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Institucional />} />
              <Route path="/institucional" element={<Navigate to="/" replace />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/termos-condicoes" element={<TermosCondicoes />} />
              <Route path="/auth" element={<Auth />} />
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="estoque" element={<Index />} />
                  <Route path="add-car" element={<AddCar />} />
                  <Route path="edit-car/:id" element={<EditCar />} />
                  <Route path="car/:id" element={<CarDetails />} />
                  <Route path="atendimentos" element={<Atendimentos />} />
                  <Route path="followup" element={<Followup />} />
                  <Route path="connections" element={<Connections />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="users" element={
                    <RequireAdmin>
                      <Users />
                    </RequireAdmin>
                  } />
                  <Route path="prompt-editor/:configId" element={
                    <RequireAdmin>
                      <PromptEditor />
                    </RequireAdmin>
                  } />
                  <Route path="prompt-editor-olx/:configId" element={
                    <RequireAdmin>
                      <PromptEditorOlx />
                    </RequireAdmin>
                  } />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </CarProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
