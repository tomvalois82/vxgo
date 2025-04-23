
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CarProvider } from '@/contexts/CarContext';
import Layout from '@/components/layout/Layout';
import Index from "@/pages/Index";
import AddCar from "@/pages/AddCar";
import EditCar from "@/pages/EditCar";
import CarDetails from "@/pages/CarDetails";
import Settings from "@/pages/Settings";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

// Import React Query components
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CarProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="/add-car" element={<AddCar />} />
              <Route path="/edit-car/:id" element={<EditCar />} />
              <Route path="/car/:id" element={<CarDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CarProvider>
  </QueryClientProvider>
);

export default App;
