
import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, BudgetVariableIngreso, BudgetVariableEgreso, EgresoCategory, Debt, Project, SavingsGoal } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EditIcon, CheckIcon, XIcon, TrashIcon } from '../components/Icons';
import { getConfigHistoryDocRef } from '../services/firebaseService';
import { setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface ModuleProps {
    entityId: string;
}

const getYearMonth = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

const egresoCategories: EgresoCategory[] = ['servicios', 'mercado', 'transporte', 'comida_calle', 'domicilios', 'regalos', 'deudas', 'otro'];
const categoryLabels: Record<EgresoCategory, string> = {
    servicios: 'Servicios',
    mercado: 'Mercado',
    transporte: 'Transporte',
    comida_calle: 'Comida Calle',
    domicilios: 'Domicilios',
    regalos: 'Regalos',
    deudas: 'Deudas',
    otro: 'Otro'
};

interface EditableFormProps<T> {
    item: T;
    onSave: (item: T) => void;
    onCancel: () => void;
    children: (formState: T, setFormState: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
}
function EditableForm<T extends { id: string, name: string }>({ item, onSave, onCancel, children }: EditableFormProps<T>) {
    const [formState, setFormState] = useState(item);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.name) {
            onSave(formState);
        }
    };

    return (
        <form onSubmit={handleSave}>
             <Card className="my-2 border border-blue-500/50">
                <div className="space-y-2">
                    {children(formState, setFormState)}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
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
                {items.map(item => (
                    editingId === item.id ? (
                        <li key={item.id}>{renderForm(item, handleSave, () => setEditingId(null))}</li>
                    ) : (
                        <li key={item.id} className="flex justify-between items-center py-2 border-b border-gray-700 group">
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

const renderBudgetVariable = (item: BudgetVariableIngreso | BudgetVariableEgreso) => (
    <div>
        <span>{item.name}</span>
        {'category' in item && <span className="text-xs text-gray-500 ml-2">{categoryLabels[item.category as EgresoCategory]}</span>}
        <span className="font-semibold ml-4">{formatCurrency(item.totalAmount)}</span>
    </div>
);

const BudgetVariableForm: React.FC<{ item: any; onSave: (item: any) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => (
    <EditableForm
        item={item}
        onSave={onSave}
        onCancel={onCancel}
        children={(formState, setFormState) => (
             <>
                <input type="text" placeholder="Nombre" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <input type="number" placeholder="Monto Total" value={formState.totalAmount} onChange={e => setFormState({...formState, totalAmount: Number(e.target.value)})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                 {'category' in formState && (
                     <select value={formState.category} onChange={e => setFormState({...formState, category: e.target.value as EgresoCategory})} className="bg-gray-600 text-white rounded px-2 py-1 w-full">
                        {egresoCategories.map(cat => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
                    </select>
                )}
            </>
        )}
    />
);

const renderDebt = (item: Debt) => (
    <div>
        <span className="font-semibold">{item.name}</span>
        <span className="text-sm text-gray-400 ml-4">{formatCurrency(item.totalAmount)}</span>
    </div>
);

const DebtForm: React.FC<{ item: Debt; onSave: (item: Debt) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => (
    <EditableForm
        item={item}
        onSave={onSave}
        onCancel={onCancel}
        children={(formState, setFormState) => (
             <>
                <input type="text" placeholder="Nombre de la Deuda" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <input type="number" placeholder="Monto Total" value={formState.totalAmount} onChange={e => setFormState({...formState, totalAmount: Number(e.target.value)})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <input type="number" placeholder="Monto Pagado" value={formState.paidAmount} onChange={e => setFormState({...formState, paidAmount: Number(e.target.value)})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <input type="number" placeholder="Cuotas" value={formState.installments} onChange={e => setFormState({...formState, installments: Number(e.target.value)})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <textarea placeholder="Notas" value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" rows={2}/>
            </>
        )}
    />
);

const renderProject = (item: Project) => (
    <div>
        <span className="font-semibold">{item.name}</span>
    </div>
);

const ProjectForm: React.FC<{ item: Project; onSave: (item: Project) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => (
     <EditableForm
        item={item}
        onSave={onSave}
        onCancel={onCancel}
        children={(formState, setFormState) => (
            <input type="text" placeholder="Nombre del Proyecto" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
        )}
    />
);

const renderSavingsGoal = (item: SavingsGoal) => (
    <div>
        <span className="font-semibold">{item.name}</span>
        <span className="text-sm text-gray-400 ml-4">{formatCurrency(item.currentAmount)} / {formatCurrency(item.targetAmount)}</span>
    </div>
);

const SavingsGoalForm: React.FC<{ item: SavingsGoal; onSave: (item: SavingsGoal) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => (
    <EditableForm
        item={item}
        onSave={onSave}
        onCancel={onCancel}
        children={(formState, setFormState) => (
             <>
                <input type="text" placeholder="Nombre de la Meta" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <input type="number" placeholder="Monto Actual" value={formState.currentAmount} onChange={e => setFormState({...formState, currentAmount: Number(e.target.value)})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
                <input type="number" placeholder="Monto Meta" value={formState.targetAmount} onChange={e => setFormState({...formState, targetAmount: Number(e.target.value)})} className="bg-gray-600 text-white rounded px-2 py-1 w-full" />
            </>
        )}
    />
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
            console.log("Config history saved for", yearMonth);
        } catch (e) {
            console.error("Failed to save config history:", e);
        }
    }
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (error) return <div className="text-red-500">Error loading data.</div>;
    if (!data) return <div>No data found.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Configuración General</h1>
            <p className="text-gray-400">Este es el centro de control de tu aplicación. Define tus variables, deudas y proyectos aquí.</p>
            
            <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Metas de Ahorro</h2>
            <ItemList
                title="Lista de Metas"
                items={data.savingsGoals}
                defaultNewItem={{ id: 'new', name: '', targetAmount: 0, currentAmount: 0 }}
                onUpdate={(items) => handleUpdate('savingsGoals', items)}
                renderItem={renderSavingsGoal}
                renderForm={(item, onSave, onCancel) => <SavingsGoalForm item={item} onSave={onSave} onCancel={onCancel} />}
            />

            <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Presupuesto Mensual</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ItemList
                    title="Ingresos Mensuales"
                    items={data.budgetVariables.ingresos}
                    defaultNewItem={{ id: 'new', name: '', totalAmount: 0 }}
                    onUpdate={(items) => handleUpdateVariables('ingresos', items)}
                    renderItem={renderBudgetVariable}
                    renderForm={(item, onSave, onCancel) => <BudgetVariableForm item={item} onSave={onSave} onCancel={onCancel} />}
                />
                <ItemList
                    title="Egresos Mensuales Recurrentes"
                    items={data.budgetVariables.egresos}
                    defaultNewItem={{ id: 'new', name: '', totalAmount: 0, category: 'otro' }}
                    onUpdate={(items) => handleUpdateVariables('egresos', items)}
                    renderItem={renderBudgetVariable}
                    renderForm={(item, onSave, onCancel) => <BudgetVariableForm item={item} onSave={onSave} onCancel={onCancel} />}
                />
            </div>

             <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Deudas Configurables</h2>
             <ItemList
                title="Lista de Deudas Grandes"
                items={data.debts}
                defaultNewItem={{ id: 'new', name: '', totalAmount: 0, paidAmount: 0, installments: 0, notes: '' }}
                onUpdate={(items) => handleUpdate('debts', items)}
                renderItem={renderDebt}
                renderForm={(item, onSave, onCancel) => <DebtForm item={item} onSave={onSave} onCancel={onCancel} />}
            />

            <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">Proyectos Configurables</h2>
             <ItemList
                title="Lista de Proyectos"
                items={data.projects}
                defaultNewItem={{ id: 'new', name: '', expenses: [], abono: 0 }}
                onUpdate={(items) => handleUpdate('projects', items)}
                renderItem={renderProject}
                renderForm={(item, onSave, onCancel) => <ProjectForm item={item} onSave={onSave} onCancel={onCancel} />}
            />
        </div>
    );
};

export default Configuracion;
