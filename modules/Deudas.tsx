
import React, { useState, useMemo } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, Debt } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EditIcon, CheckIcon, XIcon, TrendingUpIcon } from '../components/Icons';

interface ModuleProps {
    entityId: string;
    setActiveModule?: (module: any) => void; // Optional hack to switch tabs if passed
}

const DebtSimulator: React.FC<{ debt: Debt }> = ({ debt }) => {
    const [extraPayment, setExtraPayment] = useState<string>('');
    
    const interestRateMonthly = (debt.interestRate || 0) / 12 / 100;
    const remainingBalance = debt.totalAmount - debt.paidAmount;
    
    // Simple amortization calc
    const calculateSavings = () => {
        const extra = parseFloat(extraPayment) || 0;
        if (extra <= 0 || remainingBalance <= 0) return null;

        // Current Scenario (Simplified: assuming equal principal payments for estimation if installments missing, else PMT)
        // If we don't have exact amortization schedule, we approximate.
        // Let's assume simple interest savings on the principal reduced.
        
        // Time to pay currently
        const currentMonthlyPayment = debt.installments > 0 ? debt.totalAmount / debt.installments : 0;
        if (currentMonthlyPayment === 0) return null;

        // New time
        const newMonthlyPayment = currentMonthlyPayment + extra;
        
        // Rough estimation of interest saved (Simple Interest model on remaining balance for simplicity in UI)
        // Saving = Extra * (InterestRate * Time) - simplified logic for UX:
        // "If you pay X extra, you finish Y months earlier"
        
        const currentMonthsLeft = remainingBalance / currentMonthlyPayment;
        const newMonthsLeft = remainingBalance / newMonthlyPayment;
        const monthsSaved = currentMonthsLeft - newMonthsLeft;
        
        return {
            monthsSaved: Math.floor(monthsSaved),
            newPayment: newMonthlyPayment
        };
    };

    const result = calculateSavings();

    return (
        <div className="mt-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center mb-2 gap-2">
                <TrendingUpIcon className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-bold text-gray-300">Simular Abono Extra Mensual</h4>
            </div>
            <div className="flex gap-2 mb-2">
                <input 
                    type="number" 
                    placeholder="Monto extra" 
                    value={extraPayment} 
                    onChange={e => setExtraPayment(e.target.value)}
                    className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600"
                />
            </div>
            {result && (
                <p className="text-xs text-green-300">
                    ¡Ahorrarías tiempo! Terminarías <b>{result.monthsSaved} meses antes</b> pagando un total de {formatCurrency(result.newPayment)}/mes.
                </p>
            )}
        </div>
    )
}

const DebtCard: React.FC<{
    debt: Debt;
}> = ({ debt }) => {
    const remaining = debt.totalAmount - debt.paidAmount;
    const progress = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
    
    // Recommendation Logic
    const getRecommendation = () => {
        if ((debt.interestRate || 0) > 20) return { text: "Prioridad Alta: Tasa de interés muy elevada. Considera abonos extra.", color: "text-red-400" };
        if ((debt.interestRate || 0) > 12) return { text: "Prioridad Media: Tasa moderada.", color: "text-yellow-400" };
        return { text: "Deuda controlada. Mantén tus pagos al día.", color: "text-green-400" };
    };
    const rec = getRecommendation();

    return (
        <Card className="border border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">{debt.name}</h3>
                    <p className="text-sm text-gray-500">{debt.notes}</p>
                    {debt.interestRate && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">Tasa: {debt.interestRate}% E.A.</span>}
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-400">{formatCurrency(debt.paidAmount)}</span>
                    <span className="text-sm font-medium text-gray-400">{formatCurrency(debt.totalAmount)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="p-2 bg-gray-800 rounded">
                    <p className="text-xs text-red-400">Restante</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(remaining)}</p>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                    <p className="text-xs text-blue-400">Cuota Estimada</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(debt.installments > 0 ? debt.totalAmount / debt.installments : 0)}</p>
                </div>
            </div>

            <div className={`text-xs p-2 rounded bg-gray-800 border border-gray-700 mb-4 ${rec.color}`}>
                💡 {rec.text}
            </div>

            <DebtSimulator debt={debt} />
        </Card>
    );
};


const Deudas: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, error } = useFirestoreDoc<ConfigData>(entityId, 'deudas', initialConfigData); // Data lives in config

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (error) return <div className="text-red-500">Error loading data.</div>;
    if (!data) return <div>No data found.</div>;

    // Empty State
    if (data.debts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-800 rounded-2xl border border-dashed border-gray-700 p-8 text-center">
                <div className="bg-gray-700 p-4 rounded-full mb-4">
                    <EditIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Estás libre de deudas!</h2>
                <p className="text-gray-400 mb-6 max-w-md">O aún no las has registrado. Ve a configuración para agregar tus obligaciones financieras.</p>
                {/* Note: In a real app with router we would link. Here we rely on user switching tabs */}
                <div className="text-blue-400 text-sm">Ve a la pestaña <b>Configuración</b> &gt; <b>Deudas Grandes</b> para agregarlas.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-white">Deudas</h1>
                 <p className="text-sm text-gray-500 hidden sm:block">Gestiona tus obligaciones y simula pagos.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.debts.map((debt) => (
                    <DebtCard key={debt.id} debt={debt} />
                ))}
            </div>
        </div>
    );
};

export default Deudas;
