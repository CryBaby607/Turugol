import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'sonner';

const UserProfile = () => {
    const user = auth.currentUser;
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    let initialData = {
                        displayName: user.displayName || '',
                        email: user.email || '',
                        phone: ''
                    };

                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const firestoreData = userDocSnap.data();
                        initialData.phone = firestoreData.phone || '';
                    }

                    setFormData(prev => ({ ...prev, ...initialData }));
                } catch (error) {
                    console.error(error);
                    toast.error("Error al cargar datos del perfil");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');

            if (numericValue.length <= 10) {
                setFormData(prev => ({
                    ...prev,
                    [name]: numericValue
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setUpdating(true);

        try {
            if (formData.displayName !== user.displayName) {
                await updateProfile(user, { displayName: formData.displayName });
            }

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                phone: formData.phone,
                displayName: formData.displayName
            });

            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmNewPassword) {
                    throw new Error("Las nuevas contraseñas no coinciden");
                }
                
                const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
                await reauthenticateWithCredential(user, credential);
                
                await updatePassword(user, formData.newPassword);
                
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                }));
            }

            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                toast.error("La contraseña actual es incorrecta");
            } else {
                toast.error(error.message || "Error al actualizar el perfil");
            }
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold">
                        {formData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                        <p className="text-gray-500 text-sm">Gestiona tu información personal</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="block w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg sm:text-sm cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 select-none">
                                    <i className="fas fa-phone-alt text-xs"></i>
                                </span>
                                <input
                                    type="text" 
                                    inputMode="numeric"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Ej: 5512345678"
                                    className="block w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">
                                {formData.phone.length}/10 dígitos
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Dejar en blanco para mantener la actual"
                                />
                            </div>

                            {formData.newPassword && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            name="confirmNewPassword"
                                            value={formData.confirmNewPassword}
                                            onChange={handleChange}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                            placeholder="Repite la nueva contraseña"
                                        />
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
                                        <p className="text-sm text-yellow-800 mb-2 font-medium">⚠️ Requerido para guardar cambios de contraseña</p>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="block w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                                            placeholder="Ingresa tu contraseña actual"
                                            required={!!formData.newPassword}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={updating}
                            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-black hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {updating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;