import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    createUserWithEmailAndPassword, 
    updateProfile, 
    sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from "../firebase/config";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [serverError, setServerError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    
    // [CAMBIO 1] Agregado el campo 'phone' al estado inicial
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        phone: '', 
        email: '',
        password: '',
        confirmPassword: '',
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [passwordMatch, setPasswordMatch] = useState({
        isMatch: false,
        message: '',
        color: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password' || name === 'confirmPassword') {
            const valPass = name === 'password' ? value : formData.password;
            const valConfirm = name === 'confirmPassword' ? value : formData.confirmPassword;

            if (valPass && valConfirm) {
                if (valPass === valConfirm) {
                    setPasswordMatch({ isMatch: true, message: 'Las contraseñas coinciden', color: 'text-green-600' });
                } else {
                    setPasswordMatch({ isMatch: false, message: 'Las contraseñas no coinciden', color: 'text-red-500' });
                }
            } else {
                setPasswordMatch({ isMatch: false, message: '', color: '' });
            }
        }
    };

    const handleFirebaseError = (error) => {
        const map = {
            "auth/email-already-in-use": "Este correo ya está registrado.",
            "auth/invalid-email": "El correo no es válido.",
            "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
            "auth/operation-not-allowed": "El registro no está habilitado."
        };
        return map[error.code] || "Error al crear la cuenta. Intenta de nuevo.";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        if (formData.password !== formData.confirmPassword) {
            setServerError("Las contraseñas no coinciden.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Crear usuario en Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );
            const user = userCredential.user;

            // 2. Actualizar perfil
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            await updateProfile(user, {
                displayName: fullName || formData.username
            });

            // 3. Guardar datos en Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                phone: formData.phone, // [CAMBIO 3] Guardando el teléfono real
                role: 'user',
                createdAt: new Date().toISOString(),
            });

            // 4. Enviar verificación
            await sendEmailVerification(user);
            setVerificationSent(true);

        } catch (error) {
            console.error("Registration error:", error);
            setServerError(handleFirebaseError(error));
        } finally {
            setIsLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <i className="fas fa-check text-green-600"></i>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">¡Cuenta creada!</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Hemos enviado un enlace de verificación a <b>{formData.email}</b>.
                            Por favor revisa tu bandeja de entrada para activar tu cuenta.
                        </p>
                        <div className="mt-6">
                            <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-500">
                                Ir al Inicio de Sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform -rotate-3">
                        <i className="fas fa-user-plus"></i>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Crea tu cuenta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Únete a la comunidad de <span className="font-bold text-emerald-600">Turugol</span>
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
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input name="firstName" type="text" required value={formData.firstName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Juan" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                                <input name="lastName" type="text" required value={formData.lastName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Pérez" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de Usuario (Alias)</label>
                            <input name="username" type="text" required value={formData.username} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="juanperez99" />
                        </div>

                        {/* [CAMBIO 2] Nuevo Input para Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-phone text-gray-400"></i>
                                </div>
                                <input 
                                    name="phone" 
                                    type="tel" 
                                    required 
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                    className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" 
                                    placeholder="55 1234 5678" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-envelope text-gray-400"></i>
                                </div>
                                <input name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange} className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="tu@correo.com" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-lock text-gray-400"></i>
                                </div>
                                <input 
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    className="block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" 
                                    placeholder="Mínimo 6 caracteres" 
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-lock text-gray-400"></i>
                                </div>
                                <input 
                                    name="confirmPassword" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={formData.confirmPassword} 
                                    onChange={handleInputChange} 
                                    className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" 
                                    placeholder="Repite tu contraseña" 
                                />
                            </div>
                            {passwordMatch.message && (
                                <p className={`mt-1 text-xs ${passwordMatch.color}`}>
                                    {passwordMatch.message}
                                </p>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i> Creando cuenta...
                                    </>
                                ) : (
                                    'Registrarse'
                                )}
                            </button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-600">
                                ¿Ya tienes cuenta? 
                                <Link 
                                    to="/login" 
                                    state={{ from: location.state?.from }}
                                    className="font-bold text-emerald-600 hover:text-emerald-500 ml-1 hover:underline"
                                >
                                    Inicia sesión aquí
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;