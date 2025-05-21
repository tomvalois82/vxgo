
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import Layout from './components/layout/Layout';
import './App.css';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import Auth from './pages/Auth';
import About from './pages/About';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import CrmPage from './pages/CrmPage';
import Profile from './pages/Profile';
import CarDetails from './pages/CarDetails';
import AddCar from './pages/AddCar';
import EditCar from './pages/EditCar';
import { CarProvider } from './contexts/CarContext';
import Settings from './pages/Settings';
import OpportunityDetailPage from './pages/OpportunityDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CarProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/crm" element={<CrmPage />} />
                <Route path="/opportunity/:id" element={<OpportunityDetailPage />} />
                <Route path="/car/:id" element={<CarDetails />} />
                <Route path="/car/add" element={<AddCar />} />
                <Route path="/car/edit/:id" element={<EditCar />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CarProvider>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
