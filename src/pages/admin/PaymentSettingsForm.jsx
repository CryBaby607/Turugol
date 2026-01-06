import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

const PaymentSettingsForm = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const [paymentConfig, setPaymentConfig] = useState({
        accountNumber: '',
        phoneNumber: '',
        beneficiaryName: '',
        bankName: ''
    });
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    useEffect(() => {
        const fetchPaymentConfig = async () => {
            try {
                const configSnap = await getDoc(doc(db, 'settings', 'payment'));
                if (configSnap.exists()) {
                    setPaymentConfig(configSnap.data());
                } else {
                    setPaymentConfig({
                        accountNumber: '4152313456789012',
                        phoneNumber: '9611234567',
                        beneficiaryName: 'Administrador TuruGol',
                        bankName: 'Banco Azteca'
                    });
                }
            } catch (error) {
                console.error("Error cargando configuración de pago:", error);
            }
        };
        fetchPaymentConfig();
    }, []);

    const handleSavePaymentConfig = async (e) => {
        e.preventDefault();

        if (paymentConfig.accountNumber.length !== 16) {
            return toast.warning('Datos incompletos', { 
                description: 'El número de tarjeta debe tener 16 dígitos.' 
            });
        }
        if (paymentConfig.phoneNumber.length !== 10) {
            return toast.warning('Datos incompletos', { 
                description: 'El número de celular debe tener 10 dígitos.' 
            });
        }
        if (!paymentConfig.bankName || paymentConfig.bankName.length < 3) {
            return toast.warning('Campo requerido', { 
                description: 'Ingresa un nombre de banco válido.' 
            });
        }

        setIsSavingConfig(true);

        const savePromise = setDoc(doc(db, 'settings', 'payment'), paymentConfig);

        toast.promise(savePromise, {
            loading: 'Guardando configuración de pago...',
            success: () => {
                setIsSavingConfig(false);
                setIsExpanded(false);
                return '¡Configuración actualizada correctamente!';
            },
            error: (err) => {
                setIsSavingConfig(false);
                console.error("Error al guardar config:", err);
                return 'No se pudo actualizar la información.';
            },
        });
    };

    const handleNumberChange = (e, field, maxLength) => {
        const value = e.target.value.replace(/\D/g, ''); 
        if (value.length <= maxLength) {
            setPaymentConfig({ ...paymentConfig, [field]: value });
        }
    };

    const handleTextChange = (e, field, maxLength) => {
        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
        if (value.length <= maxLength) {
            setPaymentConfig({ ...paymentConfig, [field]: value });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-300">
            <div 
                className="flex justify-between items-center cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Contraer" : "Click para modificar datos de pago"}
            >
                <h3 className="font-bold text-gray-800 flex items-center m-0">
                    <i className="fas fa-university mr-2 text-emerald-600"></i>
                    Datos de Pago (Banner)
                </h3>
                <div className="flex items-center gap-3">
                    {!isExpanded && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-black uppercase tracking-wider border border-emerald-100">
                            Modificar
                        </span>
                    )}
                    <button 
                        type="button"
                        className="text-gray-400 hover:text-gray-600 focus:outline-none transition-transform duration-300"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        <i className="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>

            {isExpanded && (
                <form 
                    onSubmit={handleSavePaymentConfig} 
                    className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                Nombre del Beneficiario
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={paymentConfig.beneficiaryName || ''}
                                onChange={(e) => handleTextChange(e, 'beneficiaryName', 45)}
                                placeholder="Nombre completo"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                Banco
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={paymentConfig.bankName || ''}
                                onChange={(e) => handleTextChange(e, 'bankName', 30)}
                                placeholder="Nombre del banco"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                N° Tarjeta (16 dígitos)
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={paymentConfig.accountNumber}
                                onChange={(e) => handleNumberChange(e, 'accountNumber', 16)}
                                placeholder="0000 0000 0000 0000"
                                required
                            />
                            <div className="flex justify-between items-center px-1">
                                <p className="text-[9px] text-gray-400">Solo números</p>
                                <p className={`text-[9px] font-bold ${paymentConfig.accountNumber.length === 16 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    {paymentConfig.accountNumber.length}/16
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                Celular (10 dígitos)
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={paymentConfig.phoneNumber}
                                onChange={(e) => handleNumberChange(e, 'phoneNumber', 10)}
                                placeholder="9611234567"
                                required
                            />
                            <div className="flex justify-between items-center px-1">
                                <p className="text-[9px] text-gray-400">WhatsApp/Contacto</p>
                                <p className={`text-[9px] font-bold ${paymentConfig.phoneNumber.length === 10 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    {paymentConfig.phoneNumber.length}/10
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSavingConfig}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-100"
                        >
                            {isSavingConfig ? (
                                <><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</>
                            ) : 'Actualizar Información'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PaymentSettingsForm;