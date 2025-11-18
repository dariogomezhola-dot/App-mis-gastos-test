
import React, { useState, useMemo } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, Debt } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EditIcon, CheckIcon, XIcon } from '../components/Icons';

interface ModuleProps {
    entityId: string;
}

const DebtCard: React.FC<{
    debt: Debt;
    onSave: (updatedDebt: Debt) => void;
}> = ({ debt, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState(debt);

    const remaining = useMemo(() => formState.totalAmount - formState.paidAmount, [formState.totalAmount, formState.paidAmount]);
    const progress = useMemo(() => (formState.totalAmount > 0 ? (formState.paidAmount / formState.totalAmount) * 100 : 0), [formState.totalAmount, formState.paidAmount]);
    const paymentPerInstallment = useMemo(() => {
        if (formState.installments > 0) {
            return formState.totalAmount / formState.installments;
        }
        return 0;
    }, [formState.totalAmount, formState.installments]);

    const handleSave = () => {
        onSave(formState);
        setIsEditing(false);
    }
    
    const handleCancel = () => {
        setFormState(debt);
        setIsEditing(false);
    }

    return (
        <Card>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-blue-400">{debt.name}</h3>
                    <p className="text-sm text-gray-500">{debt.notes}</p>
                </div>
                 <div className="flex items-center space-x-2">
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white"><EditIcon className="w-5 h-5"/></button>
                    ) : (
                        <>
                            <button onClick={handleSave} className="p-2 text-green-400 hover:text-white"><CheckIcon className="w-5 h-5"/></button>
                            <button onClick={handleCancel} className="p-2 text-red-400 hover:text-white"><XIcon className="w-5 h-5"/></button>
                        </>
                    )}
                </div>
            </div>
            
            {isEditing ? (
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div>
                         <label className="text-xs font-bold text-gray-400">MONTO TOTAL</label>
                         <input type="number" value={formState.totalAmount} onChange={e => setFormState({...formState, totalAmount: Number(e.target.value)})} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-white font-semibold"/>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-400">MONTO PAGADO</label>
                         <input type="number" value={formState.paidAmount} onChange={e => setFormState({...formState, paidAmount: Number(e.target.value)})} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-white font-semibold"/>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-400">TOTAL CUOTAS</label>
                         <input type="number" value={formState.installments} onChange={e => setFormState({...formState, installments: Number(e.target.value)})} className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-white font-semibold"/>
                     </div>
                 </div>
            ) : (
                <>
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-400">{formatCurrency(debt.paidAmount)}</span>
                            <span className="text-sm font-medium text-gray-400">{formatCurrency(debt.totalAmount)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-2 bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-green-400">Pagado</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(debt.paidAmount)}</p>
                        </div>
                         <div className="p-2 bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-red-400">Restante</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(remaining)}</p>
                        </div>
                         <div className="p-2 bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-yellow-400">Cuotas</p>
                            <p className="text-lg font-bold text-white">{debt.installments}</p>
                        </div>
                        <div className="p-2 bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-blue-400">Pago / Cuota</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(paymentPerInstallment)}</p>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
};


const Deudas: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, error, updateData } = useFirestoreDoc<ConfigData>(entityId, 'deudas', initialConfigData);

    const handleSaveDebt = (updatedDebt: Debt) => {
        if (!data) return;
        const updatedDebts = data.debts.map(d => d.id === updatedDebt.id ? updatedDebt : d);
        updateData({ debts: updatedDebts });
    }
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (error) return <div className="text-red-500">Error loading data.</div>;
    if (!data) return <div>No data found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-white">Deudas Grandes</h1>
                 <p className="text-sm text-gray-500">Gestiona tus deudas en la pestaña de Configuración.</p>
            </div>
            <div className="space-y-4">
                {data.debts.map((debt) => (
                    <DebtCard key={debt.id} debt={debt} onSave={handleSaveDebt} />
                ))}
            </div>
        </div>
    );
};

export default Deudas;
