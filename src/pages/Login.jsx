import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // [NUEVO] Importaciones necesarias
import { auth, db } from "../firebase/config"; 

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Estado del Formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Estado de UI
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);

    // Detectamos si venía de una ruta protegida
    const from = location.state?.from?.pathname;

    const handleFirebaseError = (error) => {
        const map = {
            "auth/user-not-found": "No existe una cuenta con este email.",
            "auth/wrong-password": "La contraseña es incorrecta.",
            "auth/invalid-email": "El correo electrónico no es válido.",
            "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
            "auth/user-disabled": "Esta cuenta ha sido deshabilitada."
        };
        return map[error.code] || "Error al iniciar sesión. Verifica tus datos.";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setServerError("");
        setIsLoading(true);

        try {
            // 1. Autenticación en Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. [SOLUCIÓN] Consultar el Rol en Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            let role = 'user'; // Rol por defecto
            if (userDocSnap.exists()) {
                role = userDocSnap.data().role;
            }

            // 3. Decidir Redirección
            if (from) {
                // Si el usuario intentó entrar a una ruta específica, lo devolvemos ahí
                navigate(from, { replace: true });
            } else {
                // Si entra directo al Login, redirigimos según su rol
                if (role === 'admin') {
                    navigate('/dashboard/admin', { replace: true });
                } else {
                    navigate('/dashboard/user', { replace: true });
                }
            }

        } catch (error) {
            console.error("Login error:", error);
            setServerError(handleFirebaseError(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!auth.currentUser) return;
        try {
            await sendEmailVerification(auth.currentUser);
            setVerificationSent(true);
        } catch (error) {
            console.error("Error reenviando verificación:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform rotate-3">
                        <i className="fas fa-futbol"></i>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Inicia Sesión
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Bienvenido de vuelta a <span className="font-bold text-emerald-600">Turugol</span>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-2xl sm:px-10 border border-gray-100">
                    
                    {serverError && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-circle text-red-500"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">{serverError}</p>
                                    {serverError.includes("verificar") && !verificationSent && (
                                        <button 
                                            onClick={handleResendVerification}
                                            className="mt-2 text-xs font-bold text-red-600 hover:text-red-800 underline"
                                        >
                                            Reenviar correo de verificación
                                        </button>
                                    )}
                                    {verificationSent && (
                                        <p className="mt-2 text-xs text-green-600 font-bold">¡Correo enviado!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {/* Email Input */}
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
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-lock text-gray-400"></i>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Row */}
                        <div className="flex items-center justify-end">
                            <div className="text-sm">
                                <Link 
                                    to="/forgot-password" 
                                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
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
                                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                            </button>
                        </div>
                        
                        {/* Register Link */}
                        <div className="pt-6 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-600">
                                ¿Nuevo Fichaje? 
                                <Link 
                                    to="/register" 
                                    state={{ from: location.state?.from }}
                                    className="font-bold text-emerald-600 hover:text-emerald-500 ml-1 hover:underline"
                                >
                                    Crea una cuenta nueva
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;