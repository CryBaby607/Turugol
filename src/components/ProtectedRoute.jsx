import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStatusAndRole } from '../hooks/useAuthStatusAndRole';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { loggedIn, checkingStatus, isAdmin } = useAuthStatusAndRole();
    const location = useLocation();

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!loggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard/user" />;
    }

    return <Outlet />;
};

export default ProtectedRoute;