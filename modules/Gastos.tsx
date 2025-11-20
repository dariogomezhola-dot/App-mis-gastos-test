
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { blankGastosData, initialConfigData } from '../data/initialData';
import type { GastosData, Quincena, Ingreso, Egreso, EgresoCategory, Debt, ConfigData, BudgetVariableIngreso, BudgetVariableEgreso, FinancialGoal, FinancialGoalLog } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { MonthSelector } from '../components/MonthSelector';
import { EditIcon, CheckIcon, XIcon, TrashIcon, CopyIcon, DownloadIcon, RepeatIcon, ZapIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';
import { writeBatch, doc } from 'firebase/firestore';
import { db, appId, getDataDocRef } from '../services/firebaseService';
import { CurrencyInput } from '../components/common/CurrencyInput';

interface ModuleProps {
    entityId: string;
}

const getYearMonth = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

interface EditableItemProps {
    item: Ingreso | Egreso;
    isEditing: boolean;
    onToggleEdit: (item: Ingreso | Egreso | null) => void;
    onSave: (item: Ingreso | Egreso) => void;
    onDelete: (id: string) => void;
    onMakeRecurring: (item: Ingreso | Egreso) => void;
    extraContent?: React.ReactNode;
    configData: ConfigData;
}

const EditableListItem: React.FC<EditableItemProps> = ({ item, isEditing, onToggleEdit, onSave, onDelete, onMakeRecurring, extraContent, configData }) => {
    const [editForm, setEditForm] = useState(item);
    const { debts, categories } = configData;

    const handleSave = () => {
        const monto = Number(editForm.monto);
        if (isNaN(monto) || !editForm.desc) {
            alert("Por favor, introduce una descripción y un monto válidos.");
            return;
        }

        const newFormState = { ...editForm, monto };
        
        if ('category' in newFormState) {
            const egreso = newFormState as Egreso;
             if (egreso.category !== 'deudas') delete (egreso as Partial<Egreso>).debtId;
             if (egreso.category !== 'abono_meta') delete (egreso as Partial<Egreso>).goalId;
        }

        onSave(newFormState);
        onToggleEdit(null);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        setEditForm(prevForm => {
            const newFormState = { ...prevForm, category: newCategory };
            if (newCategory !== 'deudas' && 'debtId' in newFormState) delete (newFormState as Partial<Egreso>).debtId;
            if (newCategory !== 'abono_meta' && 'goalId' in newFormState) delete (newFormState as Partial<Egreso>).goalId;
            return newFormState;
        });
    };
    
    const isEgreso = 'category' in editForm;
    const egresoForm = editForm as Egreso;

    if (isEditing) {
        return (
            <li className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-gray-700 bg-gray-700/50 p-2 rounded-md space-y-2 sm:space-y-0">
                <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                    <input 
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                        className="bg-gray-600 text-white rounded px-2 py-1 text-xs w-24"
                    />
                    <input 
                        type="text" 
                        value={editForm.desc} 
                        onChange={(e) => setEditForm({...editForm, desc: e.target.value})}
                        className="bg-gray-600 text-white rounded px-2 py-1 w-full sm:w-auto flex-grow"
                    />
                     {isEgreso && (
                        <select 
                            value={egresoForm.category} 
                            onChange={handleCategoryChange}
                            className="bg-gray-600 text-white rounded px-2 py-1"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="deudas">Deudas</option>
                            <option value="abono_meta">Abono a Meta</option>
                        </select>
                    )}
                    {isEgreso && egresoForm.category === 'deudas' && (
                         <select 
                            value={egresoForm.debtId || ''} 
                            onChange={(e) => setEditForm({...editForm, debtId: e.target.value})}
                            className="bg-gray-600 text-white rounded px-2 py-1"
                        >
                            <option value="">Seleccionar Deuda</option>
                            {debts.map(debt => <option key={debt.id} value={debt.id}>{debt.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                    <CurrencyInput 
                        value={editForm.monto} 
                        onChange={(val) => setEditForm({...editForm, monto: val})}
                        className="bg-gray-600 text-white rounded px-2 py-1 w-32 text-right"
                    />
                    {extraContent}
                     <button onClick={handleSave} className="p-1 text-green-400 hover:text-green-300"><CheckIcon className="w-5 h-5" /></button>
                     <button onClick={() => onToggleEdit(null)} className="p-1 text-yellow-400 hover:text-yellow-300"><XIcon className="w-5 h-5" /></button>
                </div>
            </li>
        );
    }

    const debtName = isEgreso && egresoForm.category === 'deudas' && egresoForm.debtId
        ? debts.find(d => d.id === egresoForm.debtId)?.name
        : null;
    
    const goalName = isEgreso && egresoForm.category === 'abono_meta' && egresoForm.goalId
        ? configData.financialGoals?.find(g => g.id === egresoForm.goalId)?.name
        : null;

    return (
         <li className="flex justify-between items-center py-2 border-b border-gray-700 group">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    {item.date && <span className="text-[10px] text-gray-500 font-mono">{new Date(item.date).getDate()}/{new Date(item.date).getMonth()+1}</span>}
                    <span>{item.desc}</span>
                </div>
                <div className="flex items-center space-x-2 ml-8 sm:ml-0">
                     { 'category' in item && <span className="text-xs text-gray-500 capitalize">{item.category}</span> }
                     {debtName && <span className="text-xs text-blue-400 bg-blue-500/10 px-1 rounded-sm">{debtName}</span>}
                     {goalName && <span className="text-xs text-purple-400 bg-purple-500/10 px-1 rounded-sm">Meta: {goalName}</span>}
                </div>
            </div>
            <div className="flex items-center space-x-4">
               <span className="font-semibold">{formatCurrency(item.monto)}</span>
               {extraContent}
               <button title="Hacer Recurrente" onClick={() => onMakeRecurring(item)} className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-400"><RepeatIcon className="w-4 h-4" /></button>
               <button onClick={() => onToggleEdit(item)} className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"><EditIcon className="w-4 h-4" /></button>
               <button onClick={() => onDelete(item.id)} className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </li>
    );
}

const AddTransactionForm: React.FC<{
    type: 'ingreso' | 'egreso';
    onClose: () => void;
    data: GastosData;
    updateData: (newData: Partial<GastosData>, options?: { merge?: boolean }) => Promise<void>;
    configData: ConfigData;
    updateConfigData: (newData: Partial<ConfigData>) => Promise<void>;
    quincenaKey: 'q1' | 'q2';
    defaultDate?: string; // To support Quick Add
    defaultDesc?: string;
    defaultMonto?: number;
}> = ({ type, onClose, data, updateData, configData, updateConfigData, quincenaKey, defaultDate, defaultDesc, defaultMonto }) => {
    const [desc, setDesc] = useState(defaultDesc || '');
    const [monto, setMonto] = useState(defaultMonto || 0);
    const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<string>('otro');
    const [debtId, setDebtId] = useState<string>('');
    const [goalId, setGoalId] = useState<string>('');

    const { categories } = configData;

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || monto <= 0) return;

        // If date provided, determine correct Quincena and Month document
        // Note: This generic form operates on the "current view" data props. 
        // Quick Add logic handles cross-month updates separately. This form assumes we are in context.
        
        const updatedData = JSON.parse(JSON.stringify(data));
        
        if (type === 'ingreso') {
            const newItem: Ingreso = { id: uuidv4(), desc, monto, date };
            updatedData[quincenaKey].ingresos.push(newItem);
        } else {
            const newEgreso: Egreso = {
                id: uuidv4(), desc, monto, pagado: false, category, date
            };
            
            if (category === 'deudas' && debtId) newEgreso.debtId = debtId;
            if (category === 'abono_meta' && goalId) {
                 newEgreso.goalId = goalId;
                 // Update Goal Balance
                 const updatedConfig = JSON.parse(JSON.stringify(configData));
                 const goal = updatedConfig.financialGoals?.find((g: FinancialGoal) => g.id === goalId);
                 if (goal) {
                     goal.currentAmount += monto;
                     goal.logs.unshift({
                         id: uuidv4(),
                         date: date,
                         amount: monto,
                         note: `Abono desde Gastos: ${desc}`
                     });
                     await updateConfigData(updatedConfig);
                 }
            }
            
            updatedData[quincenaKey].egresos.push(newEgreso);
        }
        
        await updateData(updatedData);
        onClose();
    }

    const handleBudgetAdd = (variable: BudgetVariableIngreso | BudgetVariableEgreso, split: boolean) => {
        const updatedData = JSON.parse(JSON.stringify(data));
        const amount = split ? variable.totalAmount / 2 : variable.totalAmount;
        const itemDate = date; // Use current selected date
        
        if ('category' in variable) {
             const newEgreso: Egreso = { id: uuidv4(), desc: variable.name, monto: amount, category: variable.category, pagado: false, date: itemDate };
             if (split) {
                 updatedData.q1.egresos.push(newEgreso);
                 updatedData.q2.egresos.push({...newEgreso, id: uuidv4()});
             } else {
                 updatedData[quincenaKey].egresos.push(newEgreso);
             }
        } else {
            const newIngreso: Ingreso = { id: uuidv4(), desc: variable.name, monto: amount, date: itemDate };
            if (split) {
                 updatedData.q1.ingresos.push(newIngreso);
                 updatedData.q2.ingresos.push({...newIngreso, id: uuidv4()});
            } else {
                updatedData[quincenaKey].ingresos.push(newIngreso);
            }
        }
        
        updateData(updatedData);
        onClose();
    };
    
    return (
        <Card className="my-4 border border-gray-600">
             <>
                <h4 className="font-bold text-white mb-2">Añadir desde Presupuesto</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                    {(type === 'ingreso' ? configData.budgetVariables.ingresos : configData.budgetVariables.egresos).map(variable => (
                        <div key={variable.id} className="bg-gray-700 p-2 rounded flex items-center gap-2">
                            <span className="text-sm">{variable.name} ({formatCurrency(variable.totalAmount)})</span>
                            <button onClick={() => handleBudgetAdd(variable, false)} className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">100%</button>
                            <button onClick={() => handleBudgetAdd(variable, true)} className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-500">50%</button>
                        </div>
                    ))}
                </div>
                <hr className="border-gray-600 my-4" />
            </>

            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-2">
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fecha</label>
                     <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-gray-700 p-2 rounded w-full text-white text-sm"/>
                </div>
                <div className="sm:col-span-4">
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Descripción</label>
                     <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Compras" className="bg-gray-700 p-2 rounded w-full text-white"/>
                </div>
                <div className="sm:col-span-3">
                     <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Monto</label>
                     <CurrencyInput value={monto} onChange={setMonto} placeholder="0" className="bg-gray-700 p-2 rounded w-full text-white"/>
                </div>

                {type === 'egreso' && (
                    <div className="sm:col-span-3">
                         <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Categoría</label>
                         <select value={category} onChange={e => setCategory(e.target.value)} className="bg-gray-700 p-2 rounded w-full text-white">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="deudas">Deuda</option>
                            <option value="abono_meta">Abono a Meta</option>
                        </select>
                        {category === 'deudas' && (
                             <select value={debtId} onChange={e => setDebtId(e.target.value)} className="bg-gray-700 p-2 rounded w-full text-white mt-2">
                                <option value="">Seleccionar Deuda</option>
                                {configData.debts.map(debt => <option key={debt.id} value={debt.id}>{debt.name}</option>)}
                            </select>
                        )}
                        {category === 'abono_meta' && (
                             <select value={goalId} onChange={e => setGoalId(e.target.value)} className="bg-gray-700 p-2 rounded w-full text-white mt-2">
                                <option value="">Seleccionar Meta</option>
                                {configData.financialGoals?.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
                            </select>
                        )}
                    </div>
                )}
                
                <div className="sm:col-span-2 flex space-x-2">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full">Agregar</button>
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-2 rounded"><XIcon className="w-5 h-5" /></button>
                </div>
            </form>
        </Card>
    );
}

const QuincenaView: React.FC<{
    quincena: Quincena;
    quincenaKey: 'q1' | 'q2';
    data: GastosData;
    updateData: (newData: Partial<GastosData>, options?: { merge?: boolean }) => Promise<void>;
    configData: ConfigData;
    updateConfigData: (newData: Partial<ConfigData>) => Promise<void>;
}> = ({ quincena, quincenaKey, data, updateData, configData, updateConfigData }) => {
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<'ingreso' | 'egreso' | null>(null);

    const summary = useMemo(() => {
        if (!quincena) return { totalIngresos: 0, totalEgresosPagados: 0, disponible: 0 };
        const totalIngresos = quincena.ingresos.reduce((sum, i) => sum + i.monto, 0);
        const totalEgresosPagados = quincena.egresos.filter(e => e.pagado).reduce((sum, e) => sum + e.monto, 0);
        const disponible = totalIngresos - totalEgresosPagados;
        return { totalIngresos, totalEgresosPagados, disponible };
    }, [quincena]);

    const togglePagado = (egreso: Egreso) => {
        if (editingItemId) return;
        
        const wasPaid = egreso.pagado;
        const newPaidStatus = !wasPaid;
        
        const updatedGastosData = JSON.parse(JSON.stringify(data));
        const egresoToUpdate = updatedGastosData[quincenaKey].egresos.find((e: Egreso) => e.id === egreso.id);
        if (egresoToUpdate) {
            egresoToUpdate.pagado = newPaidStatus;
            updateData(updatedGastosData);
        }

        if (egreso.category === 'deudas' && egreso.debtId && configData) {
            const updatedConfigData = JSON.parse(JSON.stringify(configData));
            const debtToUpdate = updatedConfigData.debts.find((d: Debt) => d.id === egreso.debtId);
            if (debtToUpdate) {
                const amount = egreso.monto;
                debtToUpdate.paidAmount += newPaidStatus ? amount : -amount;
                updateConfigData(updatedConfigData);
            }
        }
    };
    
    const handleSave = (item: Ingreso | Egreso, type: 'ingresos' | 'egresos') => {
        const updatedData = JSON.parse(JSON.stringify(data));
        const itemIndex = updatedData[quincenaKey][type].findIndex((i: Ingreso | Egreso) => i.id === item.id);
        if (itemIndex > -1) {
            updatedData[quincenaKey][type][itemIndex] = item;
            updateData(updatedData);
        }
    };
    
    const handleDelete = (id: string, type: 'ingresos' | 'egresos') => {
        if (window.confirm("¿Seguro que quieres eliminar este item?")) {
            const updatedData = JSON.parse(JSON.stringify(data));
            updatedData[quincenaKey][type] = updatedData[quincenaKey][type].filter((i: Ingreso | Egreso) => i.id !== id);
            updateData(updatedData);
        }
    };

    const handleMakeRecurring = (item: Ingreso | Egreso) => {
        if(!window.confirm(`¿Agregar "${item.desc}" a tu presupuesto recurrente en Configuración?`)) return;

        const updatedConfig = JSON.parse(JSON.stringify(configData));
        
        if ('category' in item) {
            updatedConfig.budgetVariables.egresos.push({
                id: uuidv4(),
                name: item.desc,
                totalAmount: item.monto, 
                category: item.category,
                paymentDay: item.date ? new Date(item.date).getDate() : undefined
            });
        } else {
            updatedConfig.budgetVariables.ingresos.push({
                id: uuidv4(),
                name: item.desc,
                totalAmount: item.monto
            });
        }
        updateConfigData(updatedConfig);
    };
    
    return (
        <div>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-xs text-green-400 uppercase font-semibold">Ingresos</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(summary.totalIngresos)}</p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-xs text-red-400 uppercase font-semibold">Gastado</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(summary.totalEgresosPagados)}</p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg">
                    <p className="text-xs text-blue-400 uppercase font-semibold">Disponible</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(summary.disponible)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-green-400">Ingresos</h3>
                        <button onClick={() => setShowAddForm('ingreso')} className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded hover:bg-green-500/40">+ AÑADIR</button>
                    </div>
                    {showAddForm === 'ingreso' && <AddTransactionForm type="ingreso" onClose={() => setShowAddForm(null)} data={data} updateData={updateData} configData={configData} updateConfigData={updateConfigData} quincenaKey={quincenaKey} />}
                    {quincena.ingresos.length === 0 && !showAddForm && (
                         <div className="text-center py-4 text-gray-600 text-sm italic">No hay ingresos registrados.</div>
                    )}
                    <ul>
                        {quincena.ingresos.map((item) => (
                            <EditableListItem
                                key={item.id}
                                item={item}
                                isEditing={editingItemId === item.id}
                                onToggleEdit={(i) => setEditingItemId(i?.id ?? null)}
                                onSave={(editedItem) => handleSave(editedItem, 'ingresos')}
                                onDelete={(id) => handleDelete(id, 'ingresos')}
                                onMakeRecurring={handleMakeRecurring}
                                configData={configData}
                            />
                        ))}
                    </ul>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-red-400">Egresos</h3>
                         <button onClick={() => setShowAddForm('egreso')} className="bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded hover:bg-red-500/40">+ AÑADIR</button>
                    </div>
                    {showAddForm === 'egreso' && <AddTransactionForm type="egreso" onClose={() => setShowAddForm(null)} data={data} updateData={updateData} configData={configData} updateConfigData={updateConfigData} quincenaKey={quincenaKey} />}
                    {quincena.egresos.length === 0 && !showAddForm && (
                         <div className="text-center py-4 text-gray-600 text-sm italic">No hay gastos registrados.</div>
                    )}
                    <ul>
                        {quincena.egresos.map((item) => (
                             <EditableListItem
                                key={item.id}
                                item={item}
                                isEditing={editingItemId === item.id}
                                onToggleEdit={(i) => setEditingItemId(i?.id ?? null)}
                                onSave={(editedItem) => handleSave(editedItem as Egreso, 'egresos')}
                                onDelete={(id) => handleDelete(id, 'egresos')}
                                onMakeRecurring={handleMakeRecurring}
                                 extraContent={
                                    <div onClick={() => togglePagado(item)} className="cursor-pointer">
                                        <Badge text={item.pagado ? 'PAGADO' : 'NO PAGO'} color={item.pagado ? 'green' : 'red'} />
                                    </div>
                                }
                                configData={configData}
                            />
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

const Resumen: React.FC<{
    data: GastosData;
    updateData: (newData: Partial<GastosData>, options?: { merge?: boolean }) => Promise<void>;
}> = ({ data, updateData }) => {
    const handleAhorrosChange = (quincenaKey: 'q1' | 'q2', amount: number) => {
        const updatedData = JSON.parse(JSON.stringify(data));
        updatedData[quincenaKey].ahorros = amount;
        updateData(updatedData);
    };

    const totals = useMemo(() => {
        const totalIngresosQ1 = (data.q1?.ingresos ?? []).reduce((sum, i) => sum + i.monto, 0);
        const totalEgresosQ1 = (data.q1?.egresos ?? []).reduce((sum, e) => sum + e.monto, 0);
        const totalPagadoQ1 = (data.q1?.egresos ?? []).filter(e => e.pagado).reduce((sum, e) => sum + e.monto, 0);

        const totalIngresosQ2 = (data.q2?.ingresos ?? []).reduce((sum, i) => sum + i.monto, 0);
        const totalEgresosQ2 = (data.q2?.egresos ?? []).reduce((sum, e) => sum + e.monto, 0);
        const totalPagadoQ2 = (data.q2?.egresos ?? []).filter(e => e.pagado).reduce((sum, e) => sum + e.monto, 0);

        const totalIngresos = totalIngresosQ1 + totalIngresosQ2;
        const totalEgresos = totalEgresosQ1 + totalEgresosQ2;
        const totalPagado = totalPagadoQ1 + totalPagadoQ2;
        const deudaPendiente = totalEgresos - totalPagado;
        const ahorros = (data.q1?.ahorros ?? 0) + (data.q2?.ahorros ?? 0);
        const totalFinal = totalIngresos - totalPagado - ahorros;
        
        return { totalIngresos, totalPagado, deudaPendiente, ahorros, totalFinal, totalEgresos };

    }, [data]);

    return (
        <Card className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">Resumen del Mes</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                     <label className="font-semibold text-gray-400">Ahorros Q1:</label>
                     <CurrencyInput value={data.q1?.ahorros ?? 0} onChange={val => handleAhorrosChange('q1', val)} placeholder="Ahorros Q1" className="bg-gray-700 p-2 rounded w-full text-white"/>
                </div>
                <div className="flex items-center space-x-2">
                    <label className="font-semibold text-gray-400">Ahorros Q2:</label>
                    <CurrencyInput value={data.q2?.ahorros ?? 0} onChange={val => handleAhorrosChange('q2', val)} placeholder="Ahorros Q2" className="bg-gray-700 p-2 rounded w-full text-white"/>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-green-400">Total Ingresos</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totals.totalIngresos)}</p>
                </div>
                 <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-yellow-400">Total Egresos</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totals.totalEgresos)}</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-green-400">Total Pagado</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totals.totalPagado)}</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm text-red-400">Deuda Pendiente</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totals.deudaPendiente)}</p>
                </div>
                <div className="p-4 bg-blue-600/50 rounded-lg col-span-2 lg:col-span-1">
                    <p className="text-sm text-blue-300">Total Final</p>
                    <p className="text-2xl font-extrabold text-white">{formatCurrency(totals.totalFinal)}</p>
                </div>
            </div>
        </Card>
    )
}

const QuickAddModal: React.FC<{
    onClose: () => void;
    entityId: string;
    configData: ConfigData;
    updateConfigData: (d: Partial<ConfigData>) => Promise<void>;
}> = ({ onClose, entityId, configData, updateConfigData }) => {
    const [desc, setDesc] = useState('');
    const [monto, setMonto] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<string>('otro');
    const [saving, setSaving] = useState(false);

    // Reusing logic similar to AddTransaction but simplified for "Quick Add"
    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || monto <= 0) return;
        setSaving(true);

        try {
            const inputDate = new Date(date);
            // 1. Determine Month Document
            const yearMonth = getYearMonth(inputDate);
            
            // 2. Determine Quincena
            const day = inputDate.getDate();
            const isMonthly = configData.paymentFrequency === 'monthly';
            const quincenaKey = isMonthly ? 'q1' : (day <= 15 ? 'q1' : 'q2');

            // 3. Fetch existing doc for that month (might be different from current view)
            const docRef = getDataDocRef(entityId, 'gastos', yearMonth);
            const { getDoc, setDoc } = await import('firebase/firestore');
            const docSnap = await getDoc(docRef);
            
            let monthData = blankGastosData;
            if (docSnap.exists()) {
                monthData = docSnap.data() as GastosData;
            }

            // 4. Add Item
            const newEgreso: Egreso = {
                id: uuidv4(),
                desc: `⚡ ${desc}`, // Mark as quick add
                monto,
                pagado: false,
                category,
                date
            };
            monthData[quincenaKey].egresos.push(newEgreso);

            // 5. Save
            await setDoc(docRef, monthData);
            onClose();
        } catch (error) {
            console.error("Quick add failed", error);
            alert("Error al guardar el gasto rápido.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20 p-6 animate-slideUp sm:animate-fadeIn">
                <div className="flex items-center gap-2 mb-4 text-yellow-400">
                    <ZapIcon className="w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">Gasto Rápido</h3>
                </div>
                
                <form onSubmit={handleQuickSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Descripción</label>
                        <input autoFocus type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Taxi, Café, Antojo..." className="w-full bg-gray-700 text-white p-3 rounded-lg mt-1" />
                    </div>
                    <div>
                         <label className="text-xs text-gray-500 uppercase font-bold">Monto</label>
                         <CurrencyInput value={monto} onChange={setMonto} placeholder="0" className="w-full bg-gray-700 text-white p-3 rounded-lg mt-1 font-mono text-lg" />
                    </div>
                    <div>
                         <label className="text-xs text-gray-500 uppercase font-bold">Categoría</label>
                         <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg mt-1">
                            {configData.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={saving} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">
                            {saving ? <Spinner /> : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Gastos: React.FC<ModuleProps> = ({ entityId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const yearMonth = useMemo(() => getYearMonth(currentDate), [currentDate]);
    
    const { data, loading: gastosLoading, updateData } = useFirestoreDoc<GastosData>(entityId, 'gastos', blankGastosData, yearMonth);
    const { data: configData, loading: configLoading, updateData: updateConfigData } = useFirestoreDoc<ConfigData>(entityId, 'configuracion', initialConfigData);

    const [activeTab, setActiveTab] = useState<'q1' | 'q2'>('q1');
    const [isCopyModalOpen, setCopyModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    
    const saveTimeoutRef = useRef<number | null>(null);

    const handleUpdateData = async (newData: Partial<GastosData>, options?: { merge?: boolean }) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('saving');
        await updateData(newData, options);
        setSaveStatus('saved');
        saveTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleUpdateConfigData = async (newData: Partial<ConfigData>) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('saving');
        await updateConfigData(newData);
        setSaveStatus('saved');
        saveTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleCopyQuincena = () => {
        if (!data || !window.confirm("¿Copiar todos los items de Q1 a Q2? Esto sobreescribirá los datos de Q2.")) return;
        
        const updatedData = JSON.parse(JSON.stringify(data));
        updatedData.q2.ingresos = updatedData.q1.ingresos.map((item: Ingreso) => ({...item, id: uuidv4()}));
        updatedData.q2.egresos = updatedData.q1.egresos.map((item: Egreso) => ({...item, id: uuidv4(), pagado: false}));
        handleUpdateData(updatedData);
    }
    
    const handleClearQuincena = (quincenaKey: 'q1' | 'q2') => {
        if (!data || !window.confirm(`¿Seguro que quieres eliminar todos los datos de la ${quincenaKey === 'q1' ? 'primera' : 'segunda'} quincena?`)) return;

        const updatedData = JSON.parse(JSON.stringify(data));
        updatedData[quincenaKey] = { ingresos: [], egresos: [], ahorros: 0 };
        handleUpdateData(updatedData);
    }

     const handleClearMonth = () => {
        if (!window.confirm("¿Seguro que quieres eliminar TODOS los datos de este mes?")) return;
        handleUpdateData(blankGastosData, { merge: false });
    };

    const handleCopyMonth = async (targetMonths: string[]) => {
        if (!data || !entityId || targetMonths.length === 0) return;
        
        const templateData = JSON.parse(JSON.stringify(data));
        
        templateData.q1.ingresos = templateData.q1.ingresos.map((i: Ingreso) => ({...i, id: uuidv4()}));
        templateData.q1.egresos = templateData.q1.egresos.map((e: Egreso) => ({...e, id: uuidv4(), pagado: false}));
        templateData.q2.ingresos = templateData.q2.ingresos.map((i: Ingreso) => ({...i, id: uuidv4()}));
        templateData.q2.egresos = templateData.q2.egresos.map((e: Egreso) => ({...e, id: uuidv4(), pagado: false}));
        
        templateData.q1.ahorros = 0;
        templateData.q2.ahorros = 0;

        const batch = writeBatch(db);

        targetMonths.forEach(ym => {
            const docRef = doc(db, 'artifacts', appId, 'entities', entityId, 'gastos', ym);
            batch.set(docRef, templateData);
        });

        try {
            await batch.commit();
            alert(`Configuración copiada a ${targetMonths.length} mes(es).`);
        } catch (error) {
            console.error("Error copying month data:", error);
            alert("Hubo un error al copiar los datos.");
        }
        setCopyModalOpen(false);
    };

    const handleApplyBudget = () => {
        if (!configData || !data || !window.confirm("Esto reemplazará los ingresos y egresos existentes con su presupuesto. ¿Continuar?")) return;

        const budget = configData.budgetVariables;
        const newGastosData: GastosData = {
            q1: { ingresos: [], egresos: [], ahorros: 0 },
            q2: { ingresos: [], egresos: [], ahorros: 0 },
        };
        
        const isMonthly = configData.paymentFrequency === 'monthly';
        
        // Helper to guess date for budget items
        const getTentativeDate = (day?: number, quincena: 'q1' | 'q2' = 'q1') => {
            const y = currentDate.getFullYear();
            const m = currentDate.getMonth();
            let d = day || 1;
            if (quincena === 'q2' && d < 16) d = 16; // fallback
            return new Date(y, m, d).toISOString().split('T')[0];
        }

        // If monthly, put everything in Q1. If biweekly, split by 2.
        budget.ingresos.forEach(ing => {
            const amount = isMonthly ? ing.totalAmount : ing.totalAmount / 2;
            newGastosData.q1.ingresos.push({ id: uuidv4(), desc: ing.name, monto: amount, date: getTentativeDate(1) });
            if (!isMonthly) {
                newGastosData.q2.ingresos.push({ id: uuidv4(), desc: ing.name, monto: amount, date: getTentativeDate(16, 'q2') });
            }
        });
        
        budget.egresos.forEach(egr => {
            const amount = isMonthly ? egr.totalAmount : egr.totalAmount / 2;
            const pDay = egr.paymentDay;
            
            // Logic to place in Q1 or Q2 based on payment day
            if (isMonthly) {
                 newGastosData.q1.egresos.push({ id: uuidv4(), desc: egr.name, monto: amount, category: egr.category, pagado: false, date: getTentativeDate(pDay) });
            } else {
                // Biweekly logic: Split amount? Or place in specific quincena based on date?
                // Prompt requested simple logic previously, sticking to split for safety unless user configured dates rigidly.
                // Let's just split for now to avoid confusion, but use the payment day if it falls in the range.
                newGastosData.q1.egresos.push({ id: uuidv4(), desc: egr.name, monto: amount, category: egr.category, pagado: false, date: getTentativeDate(pDay && pDay <= 15 ? pDay : 1) });
                newGastosData.q2.egresos.push({ id: uuidv4(), desc: egr.name, monto: amount, category: egr.category, pagado: false, date: getTentativeDate(pDay && pDay > 15 ? pDay : 16, 'q2') });
            }
        });

        handleUpdateData(newGastosData, { merge: false });
    }

    const handleExportCSV = () => {
        if (!data) return;

        const rows = [
            ['Fecha', 'Quincena', 'Tipo', 'Descripción', 'Categoría', 'Monto', 'Estado'],
        ];

        const processItems = (items: any[], type: 'Ingreso' | 'Egreso', q: string) => {
            items.forEach(item => {
                rows.push([
                    item.date || yearMonth,
                    q,
                    type,
                    `"${item.desc}"`,
                    item.category || 'General',
                    item.monto.toString(),
                    item.pagado !== undefined ? (item.pagado ? 'Pagado' : 'Pendiente') : '-'
                ]);
            });
        };

        processItems(data.q1.ingresos, 'Ingreso', 'Q1');
        processItems(data.q1.egresos, 'Egreso', 'Q1');
        processItems(data.q2.ingresos, 'Ingreso', 'Q2');
        processItems(data.q2.egresos, 'Egreso', 'Q2');

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `gastos_${yearMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    useEffect(() => {
       return () => {
           if(saveTimeoutRef.current) {
               clearTimeout(saveTimeoutRef.current);
           }
       };
    }, []);

    const loading = gastosLoading || configLoading;
    const isMonthly = configData?.paymentFrequency === 'monthly';

    // Floating Action Button for Quick Add
    const FAB = () => (
        <button 
            onClick={() => setIsQuickAddOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-40"
            title="Gasto Rápido (Hormiga)"
        >
            <ZapIcon className="w-8 h-8" />
        </button>
    );

    const TabButton: React.FC<{ tabKey: 'q1' | 'q2', label: string }> = ({ tabKey, label }) => (
        <button
            onClick={() => setActiveTab(tabKey)}
            className={`px-4 py-2 text-sm sm:text-lg font-semibold rounded-t-lg transition-colors ${
                activeTab === tabKey ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );

    const SaveStatusIndicator = () => {
        if (saveStatus === 'idle') return null;
        const config = saveStatus === 'saving' ? { text: 'Guardando...', bg: 'bg-yellow-500/80' } : { text: 'Guardado ✓', bg: 'bg-green-500/80' };
        return <div className={`fixed top-20 right-8 z-50 px-4 py-2 rounded-md text-white text-sm ${config.bg} transition-opacity duration-300`}>{config.text}</div>
    }
    
    return (
        <div className="space-y-6 pb-16 relative">
            <SaveStatusIndicator />
            
            {/* Floating Action Button */}
            {configData && <FAB />}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Gastos</h1>
                <MonthSelector currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </div>
             <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button onClick={handleApplyBudget} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm rounded-md">Aplicar Presupuesto</button>
                <button onClick={() => setCopyModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-md"><CopyIcon className="w-4 h-4" /> Copiar Mes</button>
                <button onClick={handleExportCSV} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 text-sm rounded-md"><DownloadIcon className="w-4 h-4" /> Exportar CSV</button>
                <button onClick={handleClearMonth} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm rounded-md"><TrashIcon className="w-4 h-4" /> Limpiar Mes</button>
             </div>
            
            {loading && <div className="flex justify-center items-center h-full pt-16"><Spinner /></div>}
            
            {!loading && data && configData && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <div className="lg:col-span-2">
                             <Resumen data={data} updateData={handleUpdateData} />
                         </div>
                         <div className="lg:col-span-1 space-y-4">
                             {/* Additional mini-stats or summary could go here if needed, currently empty space utilization */}
                             <Card className="h-full flex flex-col justify-center items-center border border-gray-700">
                                 <p className="text-sm text-gray-400 mb-2">Presupuesto Diario Sugerido (Restante)</p>
                                 {/* Simple calc: (Income - Fixed) / Days left. Placeholder logic for now */}
                                 <p className="text-3xl font-bold text-blue-400">
                                     {formatCurrency((data.q1.ingresos.reduce((s,i)=>s+i.monto,0) + data.q2.ingresos.reduce((s,i)=>s+i.monto,0) - data.q1.egresos.reduce((s,e)=>s+e.monto,0) - data.q2.egresos.reduce((s,e)=>s+e.monto,0)) / 30)}
                                 </p>
                                 <p className="text-xs text-gray-600 mt-1">Promedio por día</p>
                             </Card>
                         </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-end border-b border-gray-700">
                           <div className="flex">
                                {!isMonthly ? (
                                    <>
                                        <TabButton tabKey="q1" label="Quincena 1" />
                                        <TabButton tabKey="q2" label="Quincena 2" />
                                    </>
                                ) : (
                                     <div className="px-4 py-2 text-sm sm:text-lg font-semibold rounded-t-lg bg-gray-800 text-white">
                                         Movimientos del Mes
                                     </div>
                                )}
                            </div>
                             {!isMonthly && activeTab === 'q2' && <button onClick={handleCopyQuincena} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 mb-1"><CopyIcon className="w-3 h-3"/> Copiar de Q1</button>}
                        </div>
                        <div className="p-4 sm:p-6 bg-gray-800 rounded-b-lg rounded-r-lg">
                            <div className="flex justify-end mb-4">
                               <button onClick={() => handleClearQuincena(isMonthly ? 'q1' : activeTab)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1"><TrashIcon className="w-3 h-3"/> Limpiar {isMonthly ? 'Mes' : 'Quincena'}</button>
                            </div>
                            {isMonthly && data.q1 && <QuincenaView quincena={data.q1} quincenaKey="q1" data={data} updateData={handleUpdateData} configData={configData} updateConfigData={handleUpdateConfigData} />}
                            {!isMonthly && activeTab === 'q1' && data.q1 && <QuincenaView quincena={data.q1} quincenaKey="q1" data={data} updateData={handleUpdateData} configData={configData} updateConfigData={handleUpdateConfigData} />}
                            {!isMonthly && activeTab === 'q2' && data.q2 && <QuincenaView quincena={data.q2} quincenaKey="q2" data={data} updateData={handleUpdateData} configData={configData} updateConfigData={handleUpdateConfigData} />}
                        </div>
                    </div>
                </>
            )}

            {!loading && !data && (
                 <div>No data found for this month.</div>
            )}
            
            {isCopyModalOpen && <CopyMonthModal onCopy={handleCopyMonth} onClose={() => setCopyModalOpen(false)} currentDate={currentDate} />}
            
            {isQuickAddOpen && configData && (
                <QuickAddModal 
                    onClose={() => setIsQuickAddOpen(false)} 
                    entityId={entityId} 
                    configData={configData}
                    updateConfigData={handleUpdateConfigData}
                />
            )}
        </div>
    );
};

const CopyMonthModal: React.FC<{
    onClose: () => void;
    onCopy: (targetMonths: string[]) => void;
    currentDate: Date;
}> = ({ onClose, onCopy, currentDate }) => {
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    
    const availableMonths = useMemo(() => {
        const months = [];
        const uniqueMonths = new Set<string>();
        for (let i = -12; i <= 12; i++) {
            if (i === 0) continue; 
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const yearMonth = getYearMonth(date);
            if (!uniqueMonths.has(yearMonth)) {
                 months.push({
                    yearMonth: yearMonth,
                    label: date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
                });
                uniqueMonths.add(yearMonth);
            }
        }
        return months;
    }, [currentDate]);

    const handleToggleMonth = (yearMonth: string) => {
        setSelectedMonths(prev => 
            prev.includes(yearMonth) 
            ? prev.filter(m => m !== yearMonth) 
            : [...prev, yearMonth]
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
                 <h2 className="text-xl font-bold text-white mb-4">Copiar Configuración del Mes</h2>
                 <p className="text-sm text-gray-400 mb-4">Selecciona los meses a los que quieres copiar los items de ingresos y egresos de este mes. Los gastos se marcarán como 'No Pago' y los ahorros se reiniciarán a cero.</p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                    {availableMonths.map(({ yearMonth, label }) => (
                        <label key={yearMonth} className="flex items-center space-x-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={selectedMonths.includes(yearMonth)}
                                onChange={() => handleToggleMonth(yearMonth)}
                                className="form-checkbox bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500/50"
                            />
                            <span className="capitalize">{label}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button onClick={() => onCopy(selectedMonths)} disabled={selectedMonths.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Copiar</button>
                </div>
            </Card>
        </div>
    )
}

export default Gastos;
