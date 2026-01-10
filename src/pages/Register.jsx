import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validatePhone, validateName } from '../utils/validators';
import { handleError } from '../utils/errorHandler';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        agreeTerms: false
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!validateName(formData.fullName)) newErrors.fullName = "Ingresa tu nombre completo";
        if (!validateEmail(formData.email)) newErrors.email = "Correo inválido";
        if (!validatePhone(formData.phoneNumber)) newErrors.phoneNumber = "Teléfono inválido (10 dígitos)";
        if (!validatePassword(formData.password)) newErrors.password = "Mínimo 6 caracteres";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
        if (!formData.agreeTerms) newErrors.agreeTerms = "Debes aceptar los términos";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // 1. Crear usuario en Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Actualizar perfil básico (displayName)
            await updateProfile(user, { displayName: formData.fullName });

            // 3. Guardar datos en Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                role: 'user', // Rol por defecto
                createdAt: serverTimestamp(),
                balance: 0,
                status: 'active'
            });

            // [ELIMINADO] Ya no enviamos el correo de verificación
            // await sendEmailVerification(user);

            toast.success("¡Registro exitoso! Bienvenido a TuruGol.");
            
            // Redirigir directamente al dashboard
            navigate('/dashboard/user');

        } catch (error) {
            handleError(error, "Error en el registro");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Crea tu cuenta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                        Inicia sesión
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleRegister}>
                        
                        {/* Nombre Completo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <div className="mt-1">
                                <input
                                    name="fullName"
                                    type="text"
                                    required
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <div className="mt-1">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
                            <div className="mt-1">
                                <input
                                    name="phoneNumber"
                                    type="tel"
                                    required
                                    maxLength="10"
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.phoneNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <div className="mt-1">
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                            </div>
                        </div>

                        {/* Confirmar Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                            <div className="mt-1">
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="agreeTerms"
                                name="agreeTerms"
                                type="checkbox"
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                checked={formData.agreeTerms}
                                onChange={handleChange}
                            />
                            <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                                Acepto los <span className="text-emerald-600 cursor-pointer">Términos y Condiciones</span>
                            </label>
                        </div>
                        {errors.agreeTerms && <p className="text-xs text-red-600 mt-0">{errors.agreeTerms}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                            >
                                {loading ? 'Registrando...' : 'Registrarse'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;