import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import Home from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

import UserDashboardPage from './pages/user/Dashboard';
import AvailableQuinielas from './pages/user/AvailableQuinielas';
import PlayQuiniela from './pages/user/PlayQuiniela';
import UserHistory from './pages/user/UserHistory';
import UserProfile from './pages/user/UserProfile';
import Leaderboard from './pages/user/Leaderboard';

import AdminDashboardPage from './pages/admin/Dashboard';
import CreateQuiniela from './pages/admin/CreateQuiniela';
import ManageQuinielas from './pages/admin/ManageQuinielas';
import UserManagement from './pages/admin/UserManagement';

import QuinielaDetail from './pages/admin/quinielas/QuinielaDetail';
import ResultsManager from './pages/admin/quinielas/ResultsManager';
import ParticipantsManager from './pages/admin/quinielas/ParticipantsManager';

import ProtectedRoute from './components/ProtectedRoute';
import QuinielaGuard from './components/QuinielaGuard';

function App() {
    return (
        <div className="App">

            <Toaster position="top-right" richColors closeButton />

            <Routes>

                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route element={<ProtectedRoute requiredRole="user" />}>
                    <Route element={<UserLayout />}>
                        <Route path="/dashboard/user" element={<UserDashboardPage />} />
                        <Route path="/dashboard/user/available-quinielas" element={<AvailableQuinielas />} />
                        
                        <Route path="/dashboard/user/play/:quinielaId" element={
                            <QuinielaGuard>
                                <PlayQuiniela />
                            </QuinielaGuard>
                        } />

                        <Route path="/dashboard/user/history" element={<UserHistory />} />
                        <Route path="/dashboard/user/profile" element={<UserProfile />} />
                        <Route path="/dashboard/user/leaderboard/:quinielaId" element={<Leaderboard />} />

                    </Route>
                </Route>

                <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
                        <Route path="/dashboard/admin/users" element={<UserManagement />} />
                        <Route path="/dashboard/admin/create" element={<CreateQuiniela />} />
                        <Route path="/dashboard/admin/quinielas" element={<ManageQuinielas />} />
                        <Route path="/dashboard/admin/quinielas/:quinielaId" element={<QuinielaDetail />} />
                        <Route path="/dashboard/admin/quinielas/:quinielaId/results" element={<ResultsManager />} />
                        <Route path="/dashboard/admin/quinielas/:quinielaId/participants" element={<ParticipantsManager />} />
                        <Route path="/dashboard/admin/quinielas/:quinielaId/leaderboard" element={<Leaderboard />} />
                        <Route path="/dashboard/admin/manage" element={<Navigate to="/dashboard/admin/quinielas" replace />} />
                    </Route>
                </Route>

                <Route path="*" element={<Home />} />

            </Routes>
        </div>
    );
}

export default App;