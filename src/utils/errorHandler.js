import { toast } from 'sonner';

export const handleError = (error, contextTitle = 'Error en la operación') => {
    if (import.meta.env.MODE !== 'production' || import.meta.env.VITE_ENABLE_LOGS === 'true') {
        console.error(`[${contextTitle}]`, error);
    }

    let userMessage = contextTitle;
    let description = error?.message || 'Ocurrió un error inesperado.';

    if (error?.code) {
        switch (error.code) {
            case 'permission-denied':
                description = 'No tienes permisos para realizar esta acción.';
                break;
            case 'unavailable':
                description = 'Sin conexión con el servidor. Revisa tu internet.';
                break;
            case 'already-exists':
                description = 'El registro ya existe.';
                break;
            case 'not-found':
                description = 'El documento solicitado no existe.';
                break;
            case 'failed-precondition':
                description = 'Error de validación o índice faltante en la base de datos.';
                break;
            default:
                description = `Error del sistema (${error.code})`;
        }
    }

    toast.error(userMessage, {
        description: description,
        duration: 5000,
    });
    
    return { error, userMessage, description };
};