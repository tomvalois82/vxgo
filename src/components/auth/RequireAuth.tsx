
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RequireAuth = () => {
  const { user, isLoading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (needsProfileCompletion && location.pathname !== '/dashboard/profile') {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
