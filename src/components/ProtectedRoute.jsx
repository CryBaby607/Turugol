import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStatusAndRole from '../hooks/useAuthStatusAndRole';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, role, loadingRole } = useAuthStatusAndRole();
    const location = useLocation();

    if (loadingRole) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole === 'admin' && role !== 'admin') {
        return <Navigate to="/dashboard/user" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;