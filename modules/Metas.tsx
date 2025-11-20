
import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, FinancialGoal, FinancialGoalLog } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { CheckIcon, XIcon, TargetIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';

interface ModuleProps {
    entityId: string;
}

const GoalCard: React.FC<{
    goal: FinancialGoal;
    onUpdate: (updatedGoal: FinancialGoal) => void;
    onDelete: (id: string) => void;
}> = ({ goal, onUpdate, onDelete }) => {
    const [isAddingFunds, setIsAddingFunds] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');
    const [note, setNote] = useState('');

    const progress = (goal.currentAmount / goal.targetAmount) * 100;

    const handleAddFunds = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(amountToAdd);
        if (isNaN(amount) || amount <= 0) return;

        const newLog: FinancialGoalLog = {
            id: uuidv4(),
            date: new Date().toISOString(),
            amount,
            note
        };

        const updatedGoal = {
            ...goal,
            currentAmount: goal.currentAmount + amount,
            logs: [newLog, ...goal.logs] // Newest first
        };

        onUpdate(updatedGoal);
        setIsAddingFunds(false);
        setAmountToAdd('');
        setNote('');
    };

    return (
        <Card className="flex flex-col h-full border border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">{goal.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{goal.notes}</p>
                </div>
                <div className="bg-blue-900/30 p-2 rounded-full">
                    <TargetIcon className="w-6 h-6 text-blue-400" />
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-gray-500">{formatCurrency(goal.targetAmount)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                <p className="text-right text-xs text-blue-400 mt-1">{progress.toFixed(1)}%</p>
            </div>

            {isAddingFunds ? (
                <form onSubmit={handleAddFunds} className="bg-gray-800 p-3 rounded-lg border border-gray-600 mb-4 animate-fadeIn">
                    <h4 className="text-sm font-bold text-white mb-2">Registrar Abono</h4>
                    <div className="space-y-2">
                        <input 
                            type="number" 
                            placeholder="Monto" 
                            value={amountToAdd} 
                            onChange={e => setAmountToAdd(e.target.value)} 
                            className="w-full bg-gray-700 text-white p-2 rounded text-sm"
                            autoFocus
                        />
                        <input 
                            type="text" 
                            placeholder="Nota (Opcional)" 
                            value={note} 
                            onChange={e => setNote(e.target.value)} 
                            className="w-full bg-gray-700 text-white p-2 rounded text-sm"
                        />
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setIsAddingFunds(false)} className="p-1 text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                            <button type="submit" className="p-1 text-green-400 hover:text-white"><CheckIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </form>
            ) : (
                <button 
                    onClick={() => setIsAddingFunds(true)}
                    className="w-full py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-sm font-bold mb-4"
                >
                    + Registrar Abono
                </button>
            )}

            <div className="mt-auto">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Historial Reciente</h4>
                <ul className="space-y-1 max-h-32 overflow-y-auto text-sm">
                    {goal.logs.length === 0 && <li className="text-gray-600 italic text-xs">Sin movimientos</li>}
                    {goal.logs.slice(0, 5).map(log => (
                        <li key={log.id} className="flex justify-between text-gray-400 border-b border-gray-800 pb-1">
                            <span>{new Date(log.date).toLocaleDateString()}</span>
                            <span className="text-green-400">+{formatCurrency(log.amount)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

const Metas: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, updateData } = useFirestoreDoc<ConfigData>(entityId, 'configuracion', initialConfigData); // Metas stored in config
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [newNotes, setNewNotes] = useState('');

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (!data) return <div>No data found.</div>;

    const handleUpdateGoal = (updatedGoal: FinancialGoal) => {
        const updatedGoals = data.financialGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
        updateData({ financialGoals: updatedGoals });
    };

    const handleDeleteGoal = (id: string) => {
        if(window.confirm('¿Eliminar meta?')) {
            const updatedGoals = data.financialGoals.filter(g => g.id !== id);
            updateData({ financialGoals: updatedGoals });
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newTarget) return;
        
        const newGoal: FinancialGoal = {
            id: uuidv4(),
            name: newName,
            targetAmount: parseFloat(newTarget),
            currentAmount: 0,
            notes: newNotes,
            logs: []
        };

        updateData({ financialGoals: [...(data.financialGoals || []), newGoal] });
        setIsCreating(false);
        setNewName('');
        setNewTarget('');
        setNewNotes('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Metas Financieras</h1>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
                >
                    Nueva Meta
                </button>
            </div>

            {isCreating && (
                <Card className="mb-6 border border-blue-500">
                    <h3 className="text-lg font-bold text-white mb-4">Crear Nueva Meta</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Meta</label>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" placeholder="Ej: Vacaciones Europa" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Monto Objetivo</label>
                            <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" placeholder="0" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Notas</label>
                            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" placeholder="Detalles opcionales..." />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white">Cancelar</button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Crear</button>
                        </div>
                    </form>
                </Card>
            )}

            {(!data.financialGoals || data.financialGoals.length === 0) && !isCreating ? (
                <div className="text-center py-12 bg-gray-800 rounded-lg border border-dashed border-gray-700">
                    <TargetIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl text-gray-300 font-bold">No tienes metas activas</h3>
                    <p className="text-gray-500 mb-6">Define un objetivo financiero y comienza a registrar tu progreso.</p>
                    <button onClick={() => setIsCreating(true)} className="text-blue-400 hover:underline">Crear mi primera meta</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.financialGoals?.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Metas;
