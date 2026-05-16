import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireSupplier?: boolean;
  requireCustomer?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSupplier,
  requireCustomer,
}) => {
  const isAuthed = authService.isAuthenticated();
  const user = authService.getUser();
  const userType = (user?.userType || '').toLowerCase();

  if (!isAuthed) {
    return <Navigate to="/" replace />;
  }

  if (requireSupplier && userType !== 'supplier' && userType !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireCustomer && userType !== 'customer') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;


