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
                    console.error("Error cargando perfil:", error);
                    toast.error("Error al cargar tu información.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            
            if (formData.displayName !== user.displayName) {
                await updateProfile(user, { displayName: formData.displayName });
            }

            await updateDoc(userDocRef, {
                phone: formData.phone,
                updatedAt: new Date().toISOString()
            });

            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmNewPassword) {
                    throw new Error("Las nuevas contraseñas no coinciden.");
                }
                if (!formData.currentPassword) {
                    throw new Error("Ingresa tu contraseña actual para confirmar el cambio.");
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
                toast.success("¡Contraseña actualizada!");
            }

            toast.success("Perfil actualizado correctamente");
        } catch (error) {
            console.error(error);
            const errorMsg = error.code === 'auth/wrong-password' 
                ? 'La contraseña actual es incorrecta.' 
                : error.message;
            toast.error(errorMsg);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Cargando perfil...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-600 border-4 border-white shadow-md">
                        {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{formData.displayName || 'Usuario'}</h3>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100">
                            Jugador
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                            Información Personal
                        </h4>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <i className="fas fa-user"></i>
                                </span>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
                                    placeholder="Tu Nombre"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <i className="fas fa-phone"></i>
                                </span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
                                    placeholder="55 1234 5678"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Este número se usará para contactarte en caso de ganar.</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                            Seguridad
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Dejar en blanco para no cambiar"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva</label>
                                <input
                                    type="password"
                                    name="confirmNewPassword"
                                    value={formData.confirmNewPassword}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Repite la contraseña"
                                />
                            </div>
                        </div>

                        {(formData.newPassword || formData.email !== user.email) && (
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 animate-fade-in">
                                <label className="block text-sm font-bold text-yellow-800 mb-1">
                                    <i className="fas fa-lock mr-2"></i>Contraseña Actual
                                </label>
                                <p className="text-xs text-yellow-600 mb-2">Necesaria para guardar cambios sensibles.</p>
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
                        )}
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