
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
import NotFound from "@/pages/NotFound";

const App = () => (
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </CarProvider>
);

export default App;
