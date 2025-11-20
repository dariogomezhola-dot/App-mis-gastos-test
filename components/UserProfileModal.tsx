
import React, { useState } from 'react';
import { Card } from './common/Card';
import { XIcon, UserIcon, TrashIcon } from './Icons';
import { auth, deleteUser } from '../services/firebaseService';
import { Spinner } from './common/Spinner';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, userEmail }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDeleteAccount = async () => {
        if (!auth.currentUser) return;
        
        const confirmed = window.confirm(
            "⚠️ ¿ESTÁS SEGURO? \n\nEsta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer."
        );

        if (confirmed) {
            const doubleCheck = window.prompt('Para confirmar, escribe "ELIMINAR" en mayúsculas:');
            if (doubleCheck === 'ELIMINAR') {
                setIsDeleting(true);
                try {
                    await deleteUser(auth.currentUser);
                    alert("Tu cuenta ha sido eliminada.");
                    window.location.reload();
                } catch (error: any) {
                    console.error("Error deleting user:", error);
                    if (error.code === 'auth/requires-recent-login') {
                        alert("Por seguridad, necesitas haber iniciado sesión recientemente para eliminar tu cuenta. Por favor cierra sesión, vuelve a entrar e inténtalo de nuevo.");
                    } else {
                        alert("Hubo un error al eliminar la cuenta: " + error.message);
                    }
                } finally {
                    setIsDeleting(false);
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md relative border border-gray-700 animate-fadeIn">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Perfil de Usuario</h2>
                    <p className="text-gray-400 mt-1">{userEmail}</p>
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-red-400 font-bold text-sm uppercase mb-4">Zona de Peligro</h3>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Eliminar Cuenta</h4>
                        <p className="text-gray-400 text-xs mb-4">
                            Una vez que elimines tu cuenta, no hay vuelta atrás. Todos tus espacios, presupuestos y datos serán borrados permanentemente.
                        </p>
                        <button 
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                        >
                            {isDeleting ? <Spinner /> : <><TrashIcon className="w-4 h-4" /> Eliminar mi cuenta permanentemente</>}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
