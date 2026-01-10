import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStatusAndRole } from '../hooks/useAuthStatusAndRole';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { loggedIn, checkingStatus, isAdmin } = useAuthStatusAndRole();

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    // 1. Si no está logueado -> Login
    if (!loggedIn) {
        return <Navigate to="/login" />;
    }

    // 2. Si es ruta de admin y el usuario no es admin -> Dashboard User
    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard/user" />;
    }

    // [ELIMINADO] Ya no hay chequeo de emailVerified aquí tampoco

    return <Outlet />;
};

export default ProtectedRoute;