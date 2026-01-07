import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let destination = "/dashboard/user";

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.role === 'admin') {
                    destination = "/dashboard/admin";
                }
            }

            const finalDestination = location.state?.from?.pathname || destination;
            navigate(finalDestination, { replace: true });

        } catch (error) {
            console.error("Error login:", error);
            setServerError(handleFirebaseError(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-6">
                    <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Bienvenido a <span className="text-emerald-600">Turugol</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Inicia sesión para gestionar tus quinielas
                    </p>
                </div>

                <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100/50 sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {serverError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
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

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fas fa-envelope text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 sm:text-sm"
                                    placeholder="tu@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ml-1">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fas fa-lock text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900 sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 cursor-pointer transition-colors focus:outline-none"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <Link 
                                    to="/forgot-password"
                                    className="text-xs font-medium text-emerald-600 hover:text-emerald-500 hover:underline mt-1"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        <div className="pt-2">
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
                        
                        <div className="pt-6 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-600">
                                ¿Nuevo Fichaje? 
                                <Link 
                                    to="/register" 
                                    state={{ from: location.state?.from }}
                                    className="font-bold text-emerald-600 hover:text-emerald-500 ml-1 hover:underline transition-colors"
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