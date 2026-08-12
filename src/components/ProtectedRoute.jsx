import React, { useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useContext(ShopContext);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(requireAdmin);

  useEffect(() => {
    if (requireAdmin) {
      const checkAdmin = async () => {
        try {
          const res = await fetch('/api/admin/session', { credentials: 'same-origin' });
          if (res.ok) {
            setIsAdminAuth(true);
          } else {
            setIsAdminAuth(false);
          }
        } catch (e) {
          setIsAdminAuth(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      };
      checkAdmin();
    }
  }, [requireAdmin]);

  if (loading || (requireAdmin && isCheckingAdmin)) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (requireAdmin) {
    if (!isAdminAuth) {
      return <Navigate to="/admin" replace />;
    }
    return children;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
