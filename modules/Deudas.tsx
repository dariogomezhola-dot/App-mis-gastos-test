
import React, { useState, useMemo } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, Debt } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EditIcon, CheckIcon, XIcon, TrendingUpIcon, CalculatorIcon } from '../components/Icons';

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

        // Current Scenario
        const currentMonthlyPayment = debt.installments > 0 ? debt.totalAmount / debt.installments : 0;
        if (currentMonthlyPayment === 0) return null;

        // New time
        const newMonthlyPayment = currentMonthlyPayment + extra;
        
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
    const isInArrears = (debt.monthsInArrears || 0) > 0;
    
    // Recommendation Logic
    const getRecommendation = () => {
        if (isInArrears) return { text: `¡URGENTE! Tienes ${debt.monthsInArrears} meses de mora. Contacta al banco.`, color: "text-red-400 bg-red-500/10 border-red-500/50" };
        if ((debt.interestRate || 0) > 20) return { text: "Prioridad Alta: Tasa de interés muy elevada. Considera abonos extra.", color: "text-yellow-400 bg-gray-800 border-gray-700" };
        if ((debt.interestRate || 0) > 12) return { text: "Prioridad Media: Tasa moderada.", color: "text-blue-300 bg-gray-800 border-gray-700" };
        return { text: "Deuda controlada. Mantén tus pagos al día.", color: "text-green-400 bg-gray-800 border-gray-700" };
    };
    const rec = getRecommendation();

    return (
        <Card className={`border ${isInArrears ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-700'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{debt.name}</h3>
                        {isInArrears && <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded animate-pulse">EN MORA</span>}
                    </div>
                    <p className="text-sm text-gray-500">{debt.notes}</p>
                    <div className="flex gap-2 mt-1">
                         {debt.interestRate && <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded inline-block">Tasa: {debt.interestRate}% E.A.</span>}
                         {debt.dueDate && <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded inline-block">Pagar el día {debt.dueDate}</span>}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-400">{formatCurrency(debt.paidAmount)}</span>
                    <span className="text-sm font-medium text-gray-400">{formatCurrency(debt.totalAmount)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${isInArrears ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
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

            <div className={`text-xs p-2 rounded border mb-4 ${rec.color}`}>
                💡 {rec.text}
            </div>

            <DebtSimulator debt={debt} />
        </Card>
    );
};

// --- AMORTIZATION CALCULATOR COMPONENT ---
const AmortizationCalculator: React.FC = () => {
    const [amount, setAmount] = useState<number>(10000000);
    const [rate, setRate] = useState<number>(12); // Annual
    const [months, setMonths] = useState<number>(12);
    const [extraPayment, setExtraPayment] = useState<number>(0);

    const schedule = useMemo(() => {
        if (amount <= 0 || months <= 0) return [];
        
        const monthlyRate = rate / 100 / 12;
        // PMT Formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
        const pmt = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        
        let balance = amount;
        const rows = [];
        let totalInterest = 0;

        for (let i = 1; i <= months * 2; i++) { // Cap at double term to avoid infinite loops on weird inputs
            if (balance <= 0.1) break;

            const interest = balance * monthlyRate;
            let principal = pmt - interest;
            
            let actualPayment = pmt + extraPayment;
            
            // Logic: If extra payment makes principal > balance
            if (balance + interest < actualPayment) {
                actualPayment = balance + interest;
                principal = balance;
            } else {
                principal = actualPayment - interest;
            }

            balance -= principal;
            if (balance < 0) balance = 0;
            totalInterest += interest;

            rows.push({
                month: i,
                payment: actualPayment,
                principal,
                interest,
                balance
            });
        }

        return { rows, pmt, totalInterest };
    }, [amount, rate, months, extraPayment]);

    return (
        <Card className="border-t-4 border-blue-500">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CalculatorIcon className="w-6 h-6 text-blue-500" />
                Calculadora Avanzada de Crédito
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Monto Préstamo</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(Number(e.target.value))} 
                        className="w-full bg-gray-700 text-white p-2 rounded font-mono"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tasa Anual (%)</label>
                    <input 
                        type="number" 
                        value={rate} 
                        onChange={e => setRate(Number(e.target.value))} 
                        className="w-full bg-gray-700 text-white p-2 rounded font-mono"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Plazo (Meses)</label>
                    <input 
                        type="number" 
                        value={months} 
                        onChange={e => setMonths(Number(e.target.value))} 
                        className="w-full bg-gray-700 text-white p-2 rounded font-mono"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Abono Extra Mensual</label>
                    <input 
                        type="number" 
                        value={extraPayment} 
                        onChange={e => setExtraPayment(Number(e.target.value))} 
                        className="w-full bg-gray-700 text-green-400 font-bold p-2 rounded font-mono"
                        placeholder="0"
                    />
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">Cuota Mensual Base</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(schedule.pmt)}</p>
                    </div>
                    <div>
                         <p className="text-xs text-gray-500">Total Intereses</p>
                         <p className="text-lg font-bold text-yellow-500">{formatCurrency(schedule.totalInterest)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Costo Total Crédito</p>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(amount + schedule.totalInterest)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500">Tiempo Total</p>
                        <p className="text-lg font-bold text-white">{schedule.rows.length} Meses</p>
                        {schedule.rows.length < months && (
                            <span className="text-xs text-green-400 font-bold">¡Te ahorras {months - schedule.rows.length} meses!</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Mes</th>
                            <th className="px-4 py-3">Cuota Total</th>
                            <th className="px-4 py-3">Interés</th>
                            <th className="px-4 py-3">A Capital</th>
                            <th className="px-4 py-3 rounded-tr-lg">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.rows.map((row) => (
                            <tr key={row.month} className="border-b border-gray-700 bg-gray-800 hover:bg-gray-700">
                                <td className="px-4 py-3 font-bold">{row.month}</td>
                                <td className="px-4 py-3 text-white">{formatCurrency(row.payment)}</td>
                                <td className="px-4 py-3 text-yellow-500">{formatCurrency(row.interest)}</td>
                                <td className="px-4 py-3 text-blue-400">{formatCurrency(row.principal)}</td>
                                <td className="px-4 py-3 font-mono">{formatCurrency(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

const Deudas: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, error } = useFirestoreDoc<ConfigData>(entityId, 'deudas', initialConfigData);
    const [activeTab, setActiveTab] = useState<'list' | 'calc'>('list');

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (error) return <div className="text-red-500">Error loading data.</div>;
    if (!data) return <div>No data found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-white">Deudas</h1>
                    <p className="text-sm text-gray-500 hidden sm:block">Gestiona tus obligaciones y optimiza tus pagos.</p>
                 </div>
                 <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                     <button 
                        onClick={() => setActiveTab('list')} 
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                     >
                         Mis Deudas
                     </button>
                     <button 
                        onClick={() => setActiveTab('calc')} 
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'calc' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                     >
                         Calculadora
                     </button>
                 </div>
            </div>

            {activeTab === 'list' && (
                <>
                    {data.debts.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-96 bg-gray-800 rounded-2xl border border-dashed border-gray-700 p-8 text-center">
                            <div className="bg-gray-700 p-4 rounded-full mb-4">
                                <EditIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Estás libre de deudas!</h2>
                            <p className="text-gray-400 mb-6 max-w-md">O aún no las has registrado. Ve a configuración para agregar tus obligaciones financieras.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.debts.map((debt) => (
                                <DebtCard key={debt.id} debt={debt} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'calc' && <AmortizationCalculator />}
        </div>
    );
};

export default Deudas;
