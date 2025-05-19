
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CarProvider } from '@/contexts/CarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import Index from "@/pages/Index";
import AddCar from "@/pages/AddCar";
import EditCar from "@/pages/EditCar";
import CarDetails from "@/pages/CarDetails";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import RequireAuth from "@/components/auth/RequireAuth";
import CrmPage from "@/pages/CrmPage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage"; // Import new page

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
              <Route path="/auth" element={<Auth />} />
              <Route element={<RequireAuth />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="/add-car" element={<AddCar />} />
                  <Route path="/edit-car/:id" element={<EditCar />} />
                  <Route path="/car/:id" element={<CarDetails />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/crm" element={<CrmPage />} />
                  <Route path="/crm/opportunity/:id" element={<OpportunityDetailPage />} /> {/* Add new route */}
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
