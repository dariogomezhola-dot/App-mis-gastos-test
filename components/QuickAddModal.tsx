import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, appId, getDataDocRef } from '../services/firebaseService';
import { blankGastosData, initialConfigData } from '../data/initialData';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import type { GastosData, Egreso, ConfigData } from '../types';
import { ZapIcon } from './Icons';
import { Spinner } from './common/Spinner';
import { CurrencyInput } from './common/CurrencyInput';

interface QuickAddModalProps {
    onClose: () => void;
    entityId: string;
}

const getYearMonth = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose, entityId }) => {
    const [desc, setDesc] = useState('');
    const [monto, setMonto] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<string>('otro');
    const [saving, setSaving] = useState(false);

    // Fetch config internally to get categories
    const { data: configData } = useFirestoreDoc<ConfigData>(entityId, 'configuracion', initialConfigData);

    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || monto <= 0 || !configData) return;
        setSaving(true);

        try {
            const inputDate = new Date(date);
            const yearMonth = getYearMonth(inputDate);
            
            const day = inputDate.getDate();
            const isMonthly = configData.paymentFrequency === 'monthly';
            const quincenaKey = isMonthly ? 'q1' : (day <= 15 ? 'q1' : 'q2');

            const docRef = getDataDocRef(entityId, 'gastos', yearMonth);
            const docSnap = await getDoc(docRef);
            
            let monthData = blankGastosData;
            if (docSnap.exists()) {
                monthData = docSnap.data() as GastosData;
            }

            const newEgreso: Egreso = {
                id: uuidv4(),
                desc: `⚡ ${desc}`,
                monto,
                pagado: false,
                category,
                date
            };
            
            // Ensure structure exists
            if (!monthData[quincenaKey]) {
                monthData[quincenaKey] = { ingresos: [], egresos: [], ahorros: 0 };
            }
            
            monthData[quincenaKey].egresos.push(newEgreso);

            await setDoc(docRef, monthData);
            onClose();
        } catch (error) {
            console.error("Quick add failed", error);
            alert("Error al guardar el gasto rápido.");
        } finally {
            setSaving(false);
        }
    };

    const categories = configData?.categories || ['otro'];

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
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={saving || !configData} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">
                            {saving ? <Spinner /> : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};