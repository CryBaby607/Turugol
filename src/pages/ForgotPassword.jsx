import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [serverError, setServerError] = useState("");

    const handleFirebaseError = (error) => {
        const map = {
            "auth/user-not-found": "No existe una cuenta con este email.",
            "auth/invalid-email": "El formato del correo no es válido.",
            "auth/network-request-failed": "Error de conexión. Revisa tu internet.",
            "auth/too-many-requests": "Demasiados intentos. Espera unos minutos."
        };
        setServerError(map[error.code] || "Error al procesar la solicitud. Intenta más tarde.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        setMessage("");

        if (!email) return;
        
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Hemos enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada o spam.");
            setEmail("");
        } catch (error) {
            console.error(error);
            handleFirebaseError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Recuperar Contraseña
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    No te preocupes, ingresa tu correo y te ayudaremos.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-2xl sm:px-10 border border-gray-100">
                    
                    {message && (
                        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r animate-fade-in">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-check-circle text-green-500"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700 font-medium">{message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {serverError && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r animate-pulse">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-circle text-red-500"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">{serverError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Correo Electrónico
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-envelope text-gray-400"></i>
                                </div>
                                <input 
                                    id="email" 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative"
                            >
                                {isLoading && (
                                    <span className="absolute left-4 inset-y-0 flex items-center">
                                        <i className="fas fa-spinner fa-spin"></i>
                                    </span>
                                )}
                                {isLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                            </button>
                        </div>
                        
                        <div className="pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-600">
                                ¿Ya la recordaste? 
                                <Link 
                                    to="/login" 
                                    className="font-bold text-emerald-600 hover:text-emerald-500 ml-1 hover:underline"
                                >
                                    Volver al inicio de sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;