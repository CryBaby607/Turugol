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
                    setPasswordMatch({ isMatch: true, message: '¡Las contraseñas coinciden!', color: 'text-emerald-500' });
                } else {
                    setPasswordMatch({ isMatch: false, message: 'Las contraseñas no coinciden', color: 'text-red-500' });
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
                // --- CORRECCIÓN AQUÍ: Se guarda como Date para que Firestore cree un Timestamp ---
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
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <i className="fas fa-check text-green-600 text-xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta creada con éxito!</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Hemos enviado un enlace de verificación a <strong>{formData.email}</strong>.
                            Por favor revisa tu bandeja de entrada (y spam).
                        </p>
                        <p className="text-xs text-gray-500">
                            Redirigiendo al panel... <i className="fas fa-spinner fa-spin ml-1"></i>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
                        <i className="fas fa-futbol text-4xl text-white"></i>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Crea tu cuenta en <span className="text-emerald-600">Turugol</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Únete a la comunidad y demuestra tus conocimientos deportivos
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {serverError && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
                                    <div className="flex">
                                        <div className="flex-shrink-0"><i className="fas fa-exclamation-circle text-red-500"></i></div>
                                        <div className="ml-3"><p className="text-sm text-red-700 font-medium">{serverError}</p></div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-user text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                    <input type="text" name="firstName" placeholder="Nombre" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.firstName} onChange={handleInputChange} required />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-user text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                    <input type="text" name="lastName" placeholder="Apellido" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.lastName} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-at text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                <input type="text" name="username" placeholder="Nombre de usuario" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.username} onChange={handleInputChange} required />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-phone text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                <input type="tel" name="phone" placeholder="Teléfono (10 dígitos)" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.phone} onChange={handleInputChange} required />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-envelope text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                <input type="email" name="email" placeholder="Correo electrónico" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.email} onChange={handleInputChange} required />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-lock text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                <input type={showPassword ? "text" : "password"} name="password" placeholder="Contraseña" className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.password} onChange={handleInputChange} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"><i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fas fa-lock text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i></div>
                                <input type="password" name="confirmPassword" placeholder="Confirmar contraseña" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.confirmPassword} onChange={handleInputChange} required />
                            </div>
                            {passwordMatch.message && <p className={`text-xs text-center font-bold ${passwordMatch.color} bg-gray-50 py-1 rounded-md`}>{passwordMatch.message}</p>}
                            <div>
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Creando cuenta...</> : 'Registrarse'}
                                </button>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-center text-sm text-gray-600">¿Ya tienes cuenta? <Link to="/login" state={{ from: location.state?.from }} className="font-bold text-emerald-600 hover:text-emerald-500 ml-1 hover:underline">Inicia sesión aquí</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;