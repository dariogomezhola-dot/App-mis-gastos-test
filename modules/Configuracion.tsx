
import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, BudgetVariableIngreso, BudgetVariableEgreso, Debt, FinancialGoal } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EditIcon, CheckIcon, XIcon, TrashIcon } from '../components/Icons';
import { getConfigHistoryDocRef } from '../services/firebaseService';
import { setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { CurrencyInput } from '../components/common/CurrencyInput';

interface ModuleProps {
    entityId: string;
}

const getYearMonth = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

interface EditableFormProps<T> {
    item: T;
    onSave: (item: T) => void;
    onCancel: () => void;
    children: (formState: T, setFormState: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
}
function EditableForm<T extends { id: string, name?: string }>({ item, onSave, onCancel, children }: EditableFormProps<T>) {
    const [formState, setFormState] = useState(item);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <form onSubmit={handleSave}>
             <Card className="my-2 border border-blue-500/50">
                <div className="space-y-4">
                    {children(formState, setFormState)}
                </div>
                <div className="flex justify-end space-x-2 mt-4 border-t border-gray-700 pt-2">
                    <button type="submit" className="p-2 text-green-400 hover:text-white"><CheckIcon className="w-5 h-5" /></button>
                    <button type="button" onClick={onCancel} className="p-2 text-red-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </div>
            </Card>
        </form>
    );
}

interface ItemListProps<T> {
    title: string;
    items: T[];
    defaultNewItem: T;
    onUpdate: (updatedItems: T[]) => void;
    renderItem: (item: T) => React.ReactNode;
    renderForm: (item: T, onSave: (item: T) => void, onCancel: () => void) => React.ReactNode;
}
function ItemList<T extends { id: string }>({ title, items, defaultNewItem, onUpdate, renderItem, renderForm }: ItemListProps<T>) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleSave = (itemToSave: T) => {
        onUpdate(items.map(item => item.id === itemToSave.id ? itemToSave : item));
        setEditingId(null);
    }
    
    const handleAdd = (itemToAdd: T) => {
        onUpdate([...items, { ...itemToAdd, id: uuidv4() }]);
        setIsAdding(false);
    }
    
    const handleDelete = (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar este item?")) {
            onUpdate(items.filter(item => item.id !== id));
        }
    }

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <button onClick={() => setIsAdding(true)} className="bg-blue-500/20 text-blue-400 px-2 py-1 text-xs rounded hover:bg-blue-500/40">+ AÑADIR</button>
            </div>
            <ul>
                {items?.map(item => (
                    editingId === item.id ? (
                        <li key={item.id}>{renderForm(item, handleSave, () => setEditingId(null))}</li>
                    ) : (
                        <li key={item.id} className="flex justify-between items-center py-3 border-b border-gray-700 group">
                            {renderItem(item)}
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setEditingId(item.id)} className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"><EditIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </li>
                    )
                ))}
                {isAdding && <li>{renderForm(defaultNewItem, handleAdd, () => setIsAdding(false))}</li>}
            </ul>
        </Card>
    );
}

const BudgetVariableForm: React.FC<{ item: any; onSave: (item: any) => void; onCancel: () => void; categories: string[] }> = ({ item, onSave, onCancel, categories }) => (
    <EditableForm
        item={item}
        onSave={onSave}
        onCancel={onCancel}
        children={(formState, setFormState) => (
             <>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre</label>
                    <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 w-full border border-gray-600 focus:border-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Monto Mensual</label>
                    <CurrencyInput value={formState.totalAmount} onChange={val => setFormState({...formState, totalAmount: val})} className="bg-gray-700 text-white rounded px-3 py-2 w-full border border-gray-600 focus:border-blue-500 outline-none" />
                </div>
                 {'category' in formState && (
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Categoría</label>
                            <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 w-full border border-gray-600 focus:border-blue-500 outline-none">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Día Pago (Tentativo)</label>
                             <input type="number" min="1" max="31" value={formState.paymentDay || ''} onChange={e => setFormState({...formState, paymentDay: parseInt(e.target.value)})} placeholder="Ej: 5" className="bg-gray-700 text-white rounded px-3 py-2 w-full border border-gray-600 focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                )}
            </>
        )}
    />
);

const CategoryList: React.FC<{ categories: string[], onUpdate: (cats: string[]) => void }> = ({ categories, onUpdate }) => {
    const [newCat, setNewCat] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCat && !categories.includes(newCat)) {
            onUpdate([...categories, newCat]);
            setNewCat('');
        }
    };

    const handleDelete = (catToDelete: string) => {
        if (window.confirm(`¿Eliminar categoría "${catToDelete}"?`)) {
            onUpdate(categories.filter(c => c !== catToDelete));
        }
    };

    return (
        <Card>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Categorías de Gastos</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                    <span key={cat} className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2 border border-gray-600">
                        {cat}
                        <button onClick={() => handleDelete(cat)} className="text-gray-500 hover:text-red-400"><XIcon className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <form onSubmit={handleAdd} className="flex gap-2">
                <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nueva categoría..." className="bg-gray-700 text-white px-3 py-2 rounded w-full border border-gray-600" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Agregar</button>
            </form>
        </Card>
    );
};

// Render Helpers
const renderBudgetVariable = (item: BudgetVariableIngreso | BudgetVariableEgreso) => (
    <div>
        <span className="font-medium text-white">{item.name}</span>
        <div className="flex gap-2 mt-1">
             {'category' in item && <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded">{item.category}</span>}
             {'paymentDay' in item && item.paymentDay && <span className="text-xs text-blue-400 bg-blue-900/20 border border-blue-800 px-1.5 py-0.5 rounded">Día {item.paymentDay}</span>}
        </div>
        <span className="block text-sm text-gray-400 font-mono mt-1">{formatCurrency(item.totalAmount)}</span>
    </div>
);

const renderDebt = (item: Debt) => (
    <div>
        <span className="font-bold text-white block">{item.name}</span>
        <span className="text-sm text-gray-400">Total: {formatCurrency(item.totalAmount)}</span>
        <div className="flex gap-2 mt-1">
            {item.interestRate > 0 && <span className="text-xs text-yellow-500">({item.interestRate}% EA)</span>}
            {item.monthsInArrears && item.monthsInArrears > 0 ? (
                <span className="text-xs text-red-500 font-bold">Mora: {item.monthsInArrears} meses</span>
            ) : null}
        </div>
    </div>
);
const DebtForm = ({ item, onSave, onCancel }: any) => (
    <EditableForm item={item} onSave={onSave} onCancel={onCancel} children={(formState, setFormState) => (
        <>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre Entidad / Persona</label>
                <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Deuda Total</label>
                     <CurrencyInput value={formState.totalAmount} onChange={val => setFormState({...formState, totalAmount: val})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ya Pagado</label>
                     <CurrencyInput value={formState.paidAmount} onChange={val => setFormState({...formState, paidAmount: val})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Total Cuotas</label>
                     <input type="number" value={formState.installments} onChange={e => setFormState({...formState, installments: Number(e.target.value)})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tasa Interés Anual (%)</label>
                     <input type="number" value={formState.interestRate} onChange={e => setFormState({...formState, interestRate: Number(e.target.value)})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" placeholder="Ej: 12.5" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Día Pago Mensual</label>
                     <input type="number" min="1" max="31" value={formState.dueDate || ''} onChange={e => setFormState({...formState, dueDate: parseInt(e.target.value)})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" placeholder="Ej: 15" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Meses en Mora</label>
                     <input type="number" min="0" value={formState.monthsInArrears || 0} onChange={e => setFormState({...formState, monthsInArrears: parseInt(e.target.value)})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Notas</label>
                <textarea value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white h-20" />
            </div>
        </>
    )} />
);

const renderFinancialGoal = (item: FinancialGoal) => (
    <div>
        <span className="font-bold text-white">{item.name}</span>
        <span className="text-sm text-gray-400 block">Meta: {formatCurrency(item.targetAmount)}</span>
    </div>
);
const FinancialGoalForm = ({ item, onSave, onCancel }: any) => (
    <EditableForm item={item} onSave={onSave} onCancel={onCancel} children={(formState, setFormState) => (
        <>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre de la Meta</label>
                <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
            </div>
            <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Monto Objetivo</label>
                 <CurrencyInput value={formState.targetAmount} onChange={val => setFormState({...formState, targetAmount: val})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
            </div>
            <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Notas</label>
                 <input type="text" value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="bg-gray-700 w-full p-2 rounded border border-gray-600 text-white" />
            </div>
        </>
    )} />
);


const Configuracion: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, error, updateData } = useFirestoreDoc<ConfigData>(entityId, 'configuracion', initialConfigData);

    const handleUpdate = async (key: keyof ConfigData, updatedItems: any) => {
        if (!data) return;
        const newData = { ...data, [key]: updatedItems };
        await updateData(newData);
        await saveHistory(newData);
    }

    const handleUpdateVariables = async (type: 'ingresos' | 'egresos', updatedItems: any[]) => {
        if (!data) return;
        const newData = { ...data, budgetVariables: { ...data.budgetVariables, [type]: updatedItems } };
        await updateData(newData);
        await saveHistory(newData);
    }

    const saveHistory = async (configToSave: ConfigData) => {
        const yearMonth = getYearMonth(new Date());
        const historyDocRef = getConfigHistoryDocRef(entityId, yearMonth);
        try {
            await setDoc(historyDocRef, configToSave);
        } catch (e) {
            console.error("Failed to save config history:", e);
        }
    }
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (error) return <div className="text-red-500">Error loading data.</div>;
    if (!data) return <div>No data found.</div>;

    const categories = data.categories || ['otro'];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Configuración General</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Personalización</h2>
                    <CategoryList categories={categories} onUpdate={(cats) => handleUpdate('categories', cats)} />
                </div>
                
                <div className="space-y-6">
                     <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Presupuesto Mensual</h2>
                     <ItemList
                        title="Ingresos Mensuales Fijos"
                        items={data.budgetVariables.ingresos}
                        defaultNewItem={{ id: 'new', name: '', totalAmount: 0 }}
                        onUpdate={(items) => handleUpdateVariables('ingresos', items)}
                        renderItem={renderBudgetVariable}
                        renderForm={(item, onSave, onCancel) => <BudgetVariableForm item={item} onSave={onSave} onCancel={onCancel} categories={categories} />}
                    />
                    <ItemList
                        title="Egresos Recurrentes"
                        items={data.budgetVariables.egresos}
                        defaultNewItem={{ id: 'new', name: '', totalAmount: 0, category: categories[0] }}
                        onUpdate={(items) => handleUpdateVariables('egresos', items)}
                        renderItem={renderBudgetVariable}
                        renderForm={(item, onSave, onCancel) => <BudgetVariableForm item={item} onSave={onSave} onCancel={onCancel} categories={categories} />}
                    />
                </div>
            </div>
            
             <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Configuración Avanzada</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ItemList
                    title="Deudas Grandes"
                    items={data.debts}
                    defaultNewItem={{ id: 'new', name: '', totalAmount: 0, paidAmount: 0, installments: 0, interestRate: 0, notes: '' }}
                    onUpdate={(items) => handleUpdate('debts', items)}
                    renderItem={renderDebt}
                    renderForm={(item, onSave, onCancel) => <DebtForm item={item} onSave={onSave} onCancel={onCancel} />}
                />

                <ItemList
                    title="Metas Financieras"
                    items={data.financialGoals || []}
                    defaultNewItem={{ id: 'new', name: '', targetAmount: 0, currentAmount: 0, notes: '', logs: [] }}
                    onUpdate={(items) => handleUpdate('financialGoals', items)}
                    renderItem={renderFinancialGoal}
                    renderForm={(item, onSave, onCancel) => <FinancialGoalForm item={item} onSave={onSave} onCancel={onCancel} />}
                />
            </div>
        </div>
    );
};

export default Configuracion;
