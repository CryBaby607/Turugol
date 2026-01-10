import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, updateProfile, deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validatePhone, validateName } from '../utils/validators';
import { handleError } from '../utils/errorHandler';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!validateName(formData.firstName)) newErrors.firstName = "Ingresa tu nombre";
        if (!validateName(formData.lastName)) newErrors.lastName = "Ingresa tu apellido";
        if (!validateEmail(formData.email)) newErrors.email = "Correo inválido";
        if (!validatePhone(formData.phoneNumber)) newErrors.phoneNumber = "Teléfono inválido (10 dígitos)";
        if (!validatePassword(formData.password)) newErrors.password = "Mínimo 6 caracteres";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        let userCreated = null;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            userCreated = userCredential.user;

            const usersRef = collection(db, "users");
            const qPhone = query(usersRef, where("phoneNumber", "==", formData.phoneNumber));
            const phoneSnapshot = await getDocs(qPhone);

            if (!phoneSnapshot.empty) {
                await deleteUser(userCreated);
                setErrors(prev => ({ ...prev, phoneNumber: "Este número ya está registrado." }));
                toast.error("El número de teléfono ya está asociado a otra cuenta.");
                setLoading(false);
                return;
            }

            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            await updateProfile(userCreated, { displayName: fullName });

            await setDoc(doc(db, "users", userCreated.uid), {
                uid: userCreated.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                fullName: fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                role: 'user',
                createdAt: serverTimestamp(),
                balance: 0,
                status: 'active'
            });

            toast.success("¡Registro exitoso! Bienvenido a TuruGol.");
            navigate('/dashboard/user');

        } catch (error) {
            console.error("Error registro:", error);
            
            if (error.code === 'auth/email-already-in-use') {
                setErrors(prev => ({ ...prev, email: "Este correo ya está registrado." }));
                toast.error("El correo ya está en uso.");
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error("Por seguridad, intenta registrarte de nuevo.");
            } else {
                handleError(error, "Error en el registro");
            }
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
                        
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <div className="mt-1">
                                    <input
                                        name="firstName"
                                        type="text"
                                        required
                                        className={`appearance-none block w-full px-3 py-2 border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                                <div className="mt-1">
                                    <input
                                        name="lastName"
                                        type="text"
                                        required
                                        className={`appearance-none block w-full px-3 py-2 border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                                </div>
                            </div>
                        </div>

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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <div className="mt-1 relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-10`}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
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
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                            <div className="mt-1 relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-10`}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
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
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                            </div>
                        </div>

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