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

        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length > 10) return;
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        const charLimits = {
            firstName: 30, lastName: 30, username: 20, email: 50, password: 30, confirmPassword: 30
        };

        if (charLimits[name] && value.length > charLimits[name]) return;

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password' || name === 'confirmPassword') {
            const valPass = name === 'password' ? value : formData.password;
            const valConfirm = name === 'confirmPassword' ? value : formData.confirmPassword;

            if (valPass && valConfirm) {
                if (valPass === valConfirm) {
                    setPasswordMatch({ isMatch: true, message: 'Las contraseñas coinciden', color: 'text-emerald-600' });
                } else {
                    setPasswordMatch({ isMatch: false, message: 'Las contraseñas no coinciden', color: 'text-red-600' });
                }
            } else {
                setPasswordMatch({ isMatch: false, message: '', color: '' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        
        if (formData.password !== formData.confirmPassword) {
            setServerError("Las contraseñas no coinciden");
            return;
        }

        if (formData.phone.length !== 10) {
            setServerError("El teléfono debe tener 10 dígitos");
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            await setDoc(doc(db, "users", user.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                phone: formData.phone,
                email: formData.email,
                role: 'user',
                createdAt: new Date(), 
                isBlocked: false
            });

            await sendEmailVerification(user);
            setVerificationSent(true); 

            setTimeout(() => {
                const from = location.state?.from?.pathname || "/dashboard/user";
                navigate(from, { replace: true });
            }, 3000); 

        } catch (error) {
            console.error("Error en registro:", error);
            let msg = "Error al registrarse. Intente nuevamente.";
            if (error.code === 'auth/email-already-in-use') msg = "El correo ya está registrado.";
            if (error.code === 'auth/weak-password') msg = "La contraseña es muy débil (mínimo 6 caracteres).";
            if (error.code === 'auth/invalid-email') msg = "El correo electrónico no es válido.";
            setServerError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Hemos enviado un enlace de verificación a <strong>{formData.email}</strong>.
                    </p>
                    <p className="text-xs text-gray-500 animate-pulse">
                        Redirigiendo al panel...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                        Crea tu cuenta
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Únete a la comunidad de Turugol
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                            {serverError}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="sr-only">Nombre</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Nombre"
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="sr-only">Apellido</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Apellido"
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="sr-only">Usuario</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Nombre de usuario"
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="sr-only">Teléfono</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Teléfono (10 dígitos)"
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="sr-only">Correo electrónico</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Correo electrónico"
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Contraseña"
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-10"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer z-10"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">Confirmar contraseña</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirmar contraseña"
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {passwordMatch.message && (
                        <div className={`text-xs text-center font-medium ${passwordMatch.color}`}>
                            {passwordMatch.message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                            ) : null}
                            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes cuenta?{' '}
                            <Link to="/login" state={{ from: location.state?.from }} className="font-medium text-emerald-600 hover:text-emerald-500">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;