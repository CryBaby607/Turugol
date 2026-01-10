import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { isExpired } from '../utils/dateHelpers'; // [!code ++]

const QuinielaGuard = ({ children }) => {
    const { quinielaId } = useParams();
    const [status, setStatus] = useState('loading'); // loading, valid, expired, not-found

    useEffect(() => {
        const checkQuiniela = async () => {
            if (!quinielaId) {
                setStatus('not-found');
                return;
            }

            try {
                const qRef = doc(db, 'quinielas', quinielaId);
                const qSnap = await getDoc(qRef);

                if (!qSnap.exists()) {
                    setStatus('not-found');
                    return;
                }

                const data = qSnap.data();
                
                // [!code warning] ANTES: Lógica manual propensa a errores
                // [!code success] AHORA: Uso de utilidad centralizada
                if (isExpired(data.metadata?.deadline)) {
                    setStatus('expired');
                    return;
                }
                
                setStatus('valid');
            } catch (error) {
                console.error("Error verificando quiniela:", error);
                setStatus('not-found');
            }
        };

        checkQuiniela();
    }, [quinielaId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (status === 'expired') {
        setTimeout(() => toast.error("Esta quiniela ha expirado y ya no acepta respuestas."), 0);
        return <Navigate to="/dashboard/user/available-quinielas" replace />;
    }

    if (status === 'not-found') {
        setTimeout(() => toast.error("La quiniela que buscas no existe."), 0);
        return <Navigate to="/dashboard/user" replace />;
    }

    return children;
};

export default QuinielaGuard;