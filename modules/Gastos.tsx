
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { blankGastosData, initialConfigData } from '../data/initialData';
import type { GastosData, Quincena, Ingreso, Egreso, EgresoCategory, Debt, ConfigData, BudgetVariableIngreso, BudgetVariableEgreso, Project } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { MonthSelector } from '../components/MonthSelector';
import { EditIcon, CheckIcon, XIcon, TrashIcon, CopyIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';
import { writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../services/firebaseService';

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

interface EditableItemProps {
    item: Ingreso | Egreso;
    isEditing: boolean;
    onToggleEdit: (item: Ingreso | Egreso | null) => void;
    onSave: (item: Ingreso | Egreso) => void;
    onDelete: (id: string) => void;
    extraContent?: React.ReactNode;
    configData: ConfigData;
}

function EditableListItem({ item, isEditing, onToggleEdit, onSave, onDelete, extraContent, configData }: EditableItemProps) {
    const [editForm, setEditForm] = useState(item);
    const { debts, projects } = configData;

    const handleSave = () => {
        const monto = Number(editForm.monto);
        if (isNaN(monto) || !editForm.desc) {
            alert("Por favor, introduce una descripción y un monto válidos.");
            return;
        }

        const newFormState = { ...editForm, monto };
        
        if ('category' in newFormState && (newFormState as Egreso).category !== 'deudas') {
            delete (newFormState as Partial<Egreso>).debtId;
        }

        onSave(newFormState);
        onToggleEdit(null);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value as EgresoCategory;
        
        setEditForm(prevForm => {
            const newFormState = { ...prevForm, category: newCategory };
            if (newCategory !== 'deudas' && 'debtId' in newFormState) {
                delete (newFormState as Partial<Egreso>).debtId;
            }
            return newFormState;
        });
    };
    
    const isEgreso = 'category' in editForm;
    const egresoForm = editForm as Egreso;
    const ingresoForm = editForm as Ingreso;

    if (isEditing) {
        return (
            <li className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-gray-700 bg-gray-700/50 p-2 rounded-md space-y-2 sm:space-y-0">
                <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:space-x-2">
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
                            {egresoCategories.map(cat => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
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
                    <input 
                        type="number" 
                        value={editForm.monto} 
                        onChange={(e) => setEditForm({...editForm, monto: Number(e.target.value)})}
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
        
    const projectName = !isEgreso && ingresoForm.projectId
        ? projects.find(p => p.id === ingresoForm.projectId)?.name
        : null;

    return (
         <li className="flex justify-between items-center py-2 border-b border-gray-700 group">
            <div className="flex flex-col">
                <span>{item.desc}</span>
                <div className="flex items-center space-x-2">
                     { 'category' in item && <span className="text-xs text-gray-500">{categoryLabels[item.category as EgresoCategory]}</span> }
                     {debtName && <span className="text-xs text-blue-400 bg-blue-500/10 px-1 rounded-sm">{debtName}</span>}
                     {projectName && <span className="text-xs text-green-400 bg-green-500/10 px-1 rounded-sm">{projectName}</span>}
                </div>
            </div>
            <div className="flex items-center space-x-4">
               <span className="font-semibold">{formatCurrency(item.monto)}</span>
               {extraContent}
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
}> = ({ type, onClose, data, updateData, configData, updateConfigData, quincenaKey }) => {
    const [desc, setDesc] = useState('');
    const [monto, setMonto] = useState(0);
    const [category, setCategory] = useState<EgresoCategory>('otro');
    const [debtId, setDebtId] = useState<string>('');
    const [projectId, setProjectId] = useState<string>('');

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || monto <= 0) return;

        const updatedData = JSON.parse(JSON.stringify(data));
        
        if (type === 'ingreso') {
            const newItem: Ingreso = { id: uuidv4(), desc, monto };
            if (projectId) { // If it's a project abono
                newItem.projectId = projectId;
                const updatedConfig = JSON.parse(JSON.stringify(configData));
                const project = updatedConfig.projects.find((p: Project) => p.id === projectId);
                if (project) {
                    project.abono += monto;
                    updateConfigData(updatedConfig);
                }
            }
            updatedData[quincenaKey].ingresos.push(newItem);
        } else { // type is 'egreso'
            const newEgreso: Egreso = {
                id: uuidv4(), desc, monto, pagado: false, category,
            };
            if (category === 'deudas' && debtId) {
                newEgreso.debtId = debtId;
            } else {
                 delete (newEgreso as Partial<Egreso>).debtId;
            }
            updatedData[quincenaKey].egresos.push(newEgreso);
        }
        
        updateData(updatedData);
        onClose();
    }

    const handleBudgetAdd = (variable: BudgetVariableIngreso | BudgetVariableEgreso, split: boolean) => {
        const updatedData = JSON.parse(JSON.stringify(data));
        const amount = split ? variable.totalAmount / 2 : variable.totalAmount;
        
        if ('category' in variable) { // Egreso
             const newEgreso: Egreso = { id: uuidv4(), desc: variable.name, monto: amount, category: variable.category, pagado: false };
             if (split) {
                 updatedData.q1.egresos.push(newEgreso);
                 updatedData.q2.egresos.push({...newEgreso, id: uuidv4()});
             } else {
                 updatedData[quincenaKey].egresos.push(newEgreso);
             }
        } else { // Ingreso
            const newIngreso: Ingreso = { id: uuidv4(), desc: variable.name, monto: amount };
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
        <Card className="my-4">
             <>
                <h4 className="font-bold text-white mb-2">Añadir desde Presupuesto</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                    {(type === 'ingreso' ? configData.budgetVariables.ingresos : configData.budgetVariables.egresos).map(variable => (
                        <div key={variable.id} className="bg-gray-700 p-2 rounded flex items-center gap-2">
                            <span>{variable.name} ({formatCurrency(variable.totalAmount)})</span>
                            <button onClick={() => handleBudgetAdd(variable, false)} className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500">Completo</button>
                            <button onClick={() => handleBudgetAdd(variable, true)} className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-500">Dividir</button>
                        </div>
                    ))}
                </div>
                <hr className="border-gray-600 my-4" />
            </>

            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                <h4 className="font-bold text-white mb-2 sm:mb-0 w-full sm:w-auto">Nuevo {type} (Manual):</h4>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción" className="bg-gray-700 p-2 rounded flex-grow"/>
                <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} placeholder="Monto" className="bg-gray-700 p-2 rounded w-full sm:w-32"/>
                {type === 'ingreso' && (
                    <select value={projectId} onChange={e => setProjectId(e.target.value)} className="bg-gray-700 p-2 rounded">
                        <option value="">Ingreso General</option>
                        {configData.projects.map(proj => <option key={proj.id} value={proj.id}>Abono: {proj.name}</option>)}
                    </select>
                )}
                {type === 'egreso' && (
                    <>
                     <select value={category} onChange={e => setCategory(e.target.value as EgresoCategory)} className="bg-gray-700 p-2 rounded">
                        {egresoCategories.map(cat => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
                    </select>
                    {category === 'deudas' && (
                         <select value={debtId} onChange={e => setDebtId(e.target.value)} className="bg-gray-700 p-2 rounded">
                            <option value="">Seleccionar Deuda</option>
                            {configData.debts.map(debt => <option key={debt.id} value={debt.id}>{debt.name}</option>)}
                        </select>
                    )}
                    </>
                )}
                <div className="flex space-x-2 self-end sm:self-center">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Agregar</button>
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">Cerrar</button>
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
                        <button onClick={() => setShowAddForm('ingreso')} className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded hover:bg-green-500/40">+</button>
                    </div>
                    {showAddForm === 'ingreso' && <AddTransactionForm type="ingreso" onClose={() => setShowAddForm(null)} data={data} updateData={updateData} configData={configData} updateConfigData={updateConfigData} quincenaKey={quincenaKey} />}
                    <ul>
                        {quincena.ingresos.map((item) => (
                            <EditableListItem
                                key={item.id}
                                item={item}
                                isEditing={editingItemId === item.id}
                                onToggleEdit={(i) => setEditingItemId(i?.id ?? null)}
                                onSave={(editedItem) => handleSave(editedItem, 'ingresos')}
                                onDelete={(id) => handleDelete(id, 'ingresos')}
                                configData={configData}
                            />
                        ))}
                    </ul>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-red-400">Egresos</h3>
                         <button onClick={() => setShowAddForm('egreso')} className="bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded hover:bg-red-500/40">+</button>
                    </div>
                    {showAddForm === 'egreso' && <AddTransactionForm type="egreso" onClose={() => setShowAddForm(null)} data={data} updateData={updateData} configData={configData} updateConfigData={updateConfigData} quincenaKey={quincenaKey} />}
                    <ul>
                        {quincena.egresos.map((item) => (
                             <EditableListItem
                                key={item.id}
                                item={item}
                                isEditing={editingItemId === item.id}
                                onToggleEdit={(i) => setEditingItemId(i?.id ?? null)}
                                onSave={(editedItem) => handleSave(editedItem as Egreso, 'egresos')}
                                onDelete={(id) => handleDelete(id, 'egresos')}
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
                    <input type="number" value={data.q1?.ahorros ?? 0} onBlur={(e) => handleAhorrosChange('q1', Number(e.target.value))} onChange={(e) => handleAhorrosChange('q1', Number(e.target.value))} placeholder="Ahorros Q1" className="bg-gray-700 p-2 rounded w-full"/>
                </div>
                <div className="flex items-center space-x-2">
                    <label className="font-semibold text-gray-400">Ahorros Q2:</label>
                    <input type="number" value={data.q2?.ahorros ?? 0} onBlur={(e) => handleAhorrosChange('q2', Number(e.target.value))} onChange={(e) => handleAhorrosChange('q2', Number(e.target.value))} placeholder="Ahorros Q2" className="bg-gray-700 p-2 rounded w-full"/>
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

const IntegratedSummary: React.FC<{ configData: ConfigData | null }> = ({ configData }) => {
    const totalMonthlyDebtPayment = configData?.debts.reduce((sum, debt) => {
        const remaining = debt.totalAmount - debt.paidAmount;
        if (remaining > 0 && debt.installments > 0) {
            return sum + (debt.totalAmount / debt.installments);
        }
        return sum;
    }, 0) ?? 0;

    const totalProjectIncomePending = configData?.projects.reduce((sum, project) => {
        const total = project.expenses.reduce((s, e) => s + e.monto, 0);
        const pending = total - project.abono;
        return sum + (pending > 0 ? pending : 0);
    }, 0) ?? 0;

    return (
        <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div className="p-2">
                    <p className="text-sm text-yellow-400">Pago Deudas (Estimado Mensual)</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalMonthlyDebtPayment)}</p>
                </div>
                <div className="p-2">
                    <p className="text-sm text-green-400">Ingreso Proyectos (Pendiente)</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalProjectIncomePending)}</p>
                </div>
            </div>
        </Card>
    )
}

const Gastos: React.FC<ModuleProps> = ({ entityId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const yearMonth = useMemo(() => getYearMonth(currentDate), [currentDate]);
    
    const { data, loading: gastosLoading, updateData } = useFirestoreDoc<GastosData>(entityId, 'gastos', blankGastosData, yearMonth);
    const { data: configData, loading: configLoading, updateData: updateConfigData } = useFirestoreDoc<ConfigData>(entityId, 'configuracion', initialConfigData);

    const [activeTab, setActiveTab] = useState<'q1' | 'q2'>('q1');
    const [isCopyModalOpen, setCopyModalOpen] = useState(false);
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
        
        budget.ingresos.forEach(ing => {
            newGastosData.q1.ingresos.push({ id: uuidv4(), desc: ing.name, monto: ing.totalAmount / 2 });
            newGastosData.q2.ingresos.push({ id: uuidv4(), desc: ing.name, monto: ing.totalAmount / 2 });
        });
        
        budget.egresos.forEach(egr => {
            newGastosData.q1.egresos.push({ id: uuidv4(), desc: egr.name, monto: egr.totalAmount / 2, category: egr.category, pagado: false });
            newGastosData.q2.egresos.push({ id: uuidv4(), desc: egr.name, monto: egr.totalAmount / 2, category: egr.category, pagado: false });
        });

        handleUpdateData(newGastosData, { merge: false });
    }
    
    useEffect(() => {
       return () => {
           if(saveTimeoutRef.current) {
               clearTimeout(saveTimeoutRef.current);
           }
       };
    }, []);

    const loading = gastosLoading || configLoading;

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
        
        const statusConfig = {
            saving: { text: 'Guardando...', bg: 'bg-yellow-500/80' },
            saved: { text: 'Guardado ✓', bg: 'bg-green-500/80' }
        };

        const config = statusConfig[saveStatus];

        return (
             <div className={`fixed top-20 right-8 z-50 px-4 py-2 rounded-md text-white text-sm ${config.bg} transition-opacity duration-300`}>
                {config.text}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <SaveStatusIndicator />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Gastos Personales</h1>
                <MonthSelector currentDate={currentDate} setCurrentDate={setCurrentDate} />
            </div>
             <div className="flex flex-wrap gap-2">
                <button onClick={handleApplyBudget} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm rounded-md">Aplicar Presupuesto</button>
                <button onClick={() => setCopyModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-md"><CopyIcon className="w-4 h-4" /> Copiar Mes</button>
                <button onClick={handleClearMonth} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm rounded-md"><TrashIcon className="w-4 h-4" /> Limpiar Mes</button>
             </div>
            
            {loading && <div className="flex justify-center items-center h-full pt-16"><Spinner /></div>}
            
            {!loading && data && configData && (
                <>
                    <IntegratedSummary configData={configData} />
                    <Resumen data={data} updateData={handleUpdateData} />
                    <div className="mt-8">
                        <div className="flex justify-between items-end border-b border-gray-700">
                           <div className="flex">
                                <TabButton tabKey="q1" label="Quincena 1" />
                                <TabButton tabKey="q2" label="Quincena 2" />
                            </div>
                             {activeTab === 'q2' && <button onClick={handleCopyQuincena} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 mb-1"><CopyIcon className="w-3 h-3"/> Copiar de Q1</button>}
                        </div>
                        <div className="p-4 sm:p-6 bg-gray-800 rounded-b-lg rounded-r-lg">
                            <div className="flex justify-end mb-4">
                               <button onClick={() => handleClearQuincena(activeTab)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1"><TrashIcon className="w-3 h-3"/> Limpiar Quincena</button>
                            </div>
                            {activeTab === 'q1' && data.q1 && <QuincenaView quincena={data.q1} quincenaKey="q1" data={data} updateData={handleUpdateData} configData={configData} updateConfigData={handleUpdateConfigData} />}
                            {activeTab === 'q2' && data.q2 && <QuincenaView quincena={data.q2} quincenaKey="q2" data={data} updateData={handleUpdateData} configData={configData} updateConfigData={handleUpdateConfigData} />}
                        </div>
                    </div>
                </>
            )}

            {!loading && !data && (
                 <div>No data found for this month.</div>
            )}
            {isCopyModalOpen && <CopyMonthModal onCopy={handleCopyMonth} onClose={() => setCopyModalOpen(false)} currentDate={currentDate} />}
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
