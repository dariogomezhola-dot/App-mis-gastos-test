
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { getDoc } from 'firebase/firestore';
import { getDataDocRef, getConfigHistoryDocRef } from '../services/firebaseService';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, GastosData, SavingsGoal } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { EditIcon, CheckIcon, XIcon } from '../components/Icons';

declare const Chart: any;

interface ModuleProps {
    entityId: string;
}

type TimeFilter = '6m' | 'year' | 'last_year' | 'all';

interface MonthlySummary {
    income: number;
    expenses: number;
    savings: number;
    debtPaid: number;
}

interface HistoricalConfig {
    plannedIncome: number;
    plannedExpenses: number;
}

const getYearMonth = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

const SavingsGoalItem: React.FC<{
    goal: SavingsGoal;
    onUpdate: (updatedGoal: SavingsGoal) => void;
}> = ({ goal, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState(goal);

    useEffect(() => {
        setFormState(goal);
    }, [goal]);

    const progress = useMemo(() => {
        if (!formState.targetAmount) return 0;
        return (formState.currentAmount / formState.targetAmount) * 100;
    }, [formState]);
    
    const handleSave = () => {
        onUpdate(formState);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormState(goal);
        setIsEditing(false);
    }
    
    return (
        <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-md font-bold text-white">{goal.name}</h3>
                 {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                ) : (
                    <div className="flex space-x-1">
                        <button onClick={handleSave} className="p-1 text-green-400 hover:text-white"><CheckIcon className="w-4 h-4"/></button>
                        <button onClick={handleCancel} className="p-1 text-red-400 hover:text-white"><XIcon className="w-4 h-4"/></button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full bg-gray-600 p-1 rounded border border-gray-500 text-sm"/>
                    <input type="number" placeholder="Actual" value={formState.currentAmount} onChange={e => setFormState({...formState, currentAmount: Number(e.target.value)})} className="w-full bg-gray-600 p-1 rounded border border-gray-500 text-sm"/>
                    <input type="number" placeholder="Meta" value={formState.targetAmount} onChange={e => setFormState({...formState, targetAmount: Number(e.target.value)})} className="w-full bg-gray-600 p-1 rounded border border-gray-500 text-sm"/>
                </div>
            ) : (
                <>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span className="font-bold text-white">{formatCurrency(formState.currentAmount)}</span>
                        <span className="text-gray-400">{formatCurrency(formState.targetAmount)}</span>
                    </div>
                </>
            )}
        </div>
    );
};

const MetricCard: React.FC<{ title: string; value: string; color?: string; className?: string }> = ({ title, value, color = 'text-white', className = '' }) => (
    <Card className={`text-center ${className}`}>
        <h2 className="text-sm font-bold text-gray-400 uppercase">{title}</h2>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </Card>
);

const TrendsLineChart: React.FC<{ data: Record<string, any>, timeFilter: TimeFilter, title: string, datasetsConfig: any[] }> = ({ data, timeFilter, title, datasetsConfig }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    const filteredData = useMemo(() => {
        const sortedMonths = Object.keys(data).sort();
        const now = new Date();
        
        let monthSlice: string[] = [];

        switch (timeFilter) {
            case '6m':
                monthSlice = sortedMonths.slice(-6);
                break;
            case 'year': {
                const yearStart = new Date(now.getFullYear(), 0, 1);
                monthSlice = sortedMonths.filter(m => new Date(m) >= yearStart);
                break;
            }
            case 'last_year': {
                const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
                const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
                monthSlice = sortedMonths.filter(m => {
                    const d = new Date(m);
                    return d >= lastYearStart && d <= lastYearEnd;
                });
                break;
            }
            case 'all':
            default:
                monthSlice = sortedMonths;
                break;
        }

        return monthSlice.map(month => ({
            month,
            ...data[month]
        }));
    }, [data, timeFilter]);

    useEffect(() => {
        if (!chartRef.current || filteredData.length === 0) return;

        const labels = filteredData.map(d => new Date(d.month + '-02').toLocaleString('es-ES', { month: 'short', year: 'numeric' }));
        
        const datasets = datasetsConfig.map(config => ({
            ...config,
            data: filteredData.map(d => d[config.key])
        }));
        

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        if (chartInstance.current) chartInstance.current.destroy();

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { color: '#8A8A8A' }, grid: { color: '#3C3C3C' } },
                    x: { ticks: { color: '#8A8A8A' }, grid: { color: '#2D2D2D' } }
                },
                plugins: {
                    legend: { labels: { color: '#B3B3B3' } }
                }
            }
        });

    }, [filteredData, datasetsConfig]);
    
    return <div className="h-80 relative"><canvas ref={chartRef}></canvas></div>;
};

const ResumenGeneral: React.FC<ModuleProps> = ({ entityId }) => {
    const { data: configData, loading: configLoading, updateData: updateConfig } = useFirestoreDoc<ConfigData>(entityId, 'resumen', initialConfigData);
    
    const [historicalData, setHistoricalData] = useState<Record<string, MonthlySummary>>({});
    const [historicalConfig, setHistoricalConfig] = useState<Record<string, HistoricalConfig>>({});
    const [historyLoading, setHistoryLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('year');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!entityId) return;
            setHistoryLoading(true);

            const gastosPromises: Promise<void>[] = [];
            const configPromises: Promise<void>[] = [];
            
            const gastosData: Record<string, MonthlySummary> = {};
            const configHistoryData: Record<string, HistoricalConfig> = {};

            for (let i = 0; i < 24; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const yearMonth = getYearMonth(date);
                
                gastosPromises.push((async () => {
                    const docRef = getDataDocRef(entityId, 'gastos', yearMonth);
                    try {
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            const monthData = docSnap.data() as GastosData;
                            const income = (monthData.q1?.ingresos ?? []).reduce((s, item) => s + item.monto, 0) + (monthData.q2?.ingresos ?? []).reduce((s, item) => s + item.monto, 0);
                            const allEgresos = [...(monthData.q1?.egresos ?? []), ...(monthData.q2?.egresos ?? [])];
                            const expenses = allEgresos.reduce((s, item) => s + item.monto, 0);
                            const savings = (monthData.q1?.ahorros ?? 0) + (monthData.q2?.ahorros ?? 0);
                            const debtPaid = allEgresos.filter(e => e.category === 'deudas').reduce((s, item) => s + item.monto, 0);
                            gastosData[yearMonth] = { income, expenses, savings, debtPaid };
                        }
                    } catch (e) { console.error("Error fetching monthly data for", yearMonth, e); }
                })());

                configPromises.push((async () => {
                    const docRef = getConfigHistoryDocRef(entityId, yearMonth);
                    try {
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            const configSnap = docSnap.data() as ConfigData;
                            const plannedIncome = configSnap.budgetVariables.ingresos.reduce((s, item) => s + item.totalAmount, 0);
                            const plannedExpenses = configSnap.budgetVariables.egresos.reduce((s, item) => s + item.totalAmount, 0);
                            configHistoryData[yearMonth] = { plannedIncome, plannedExpenses };
                        }
                    } catch(e) { console.error("Error fetching config history for", yearMonth, e); }
                })());
            }

            await Promise.all([...gastosPromises, ...configPromises]);
            
            setHistoricalData(gastosData);
            setHistoricalConfig(configHistoryData);
            setHistoryLoading(false);
        };

        fetchHistory();
    }, [entityId]);

    const loading = configLoading || historyLoading;
    
    const metrics = useMemo(() => {
        const totalDebts = configData?.debts.reduce((sum, debt) => sum + (debt.totalAmount - debt.paidAmount), 0) ?? 0;
        const totalSavings = configData?.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0) ?? 0;
        return { totalDebts, totalSavings };
    }, [configData]);
    
    const currentMonthSummary = useMemo(() => {
        const currentYm = getYearMonth(new Date());
        if (historicalData && historicalData[currentYm]) {
            const data = historicalData[currentYm];
            return {
                income: data.income,
                net: data.income - data.expenses
            };
        }
        return { income: 0, net: 0 };
    }, [historicalData]);

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    
    const FilterButton: React.FC<{label: string, filter: TimeFilter}> = ({ label, filter }) => (
        <button 
            onClick={() => setTimeFilter(filter)}
            className={`px-3 py-1 text-xs rounded-md ${timeFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Resumen General</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <MetricCard title="Deuda Total Pendiente" value={formatCurrency(metrics.totalDebts)} color="text-red-400" className="lg:col-span-1" />
                <MetricCard title="Ahorro Total Acumulado" value={formatCurrency(metrics.totalSavings)} color="text-blue-400" className="lg:col-span-1" />
                <MetricCard title="Ingresos Mes Actual" value={formatCurrency(currentMonthSummary.income)} color="text-green-400" className="lg:col-span-1" />
                <MetricCard title="Neto Mes Actual" value={formatCurrency(currentMonthSummary.net)} color={currentMonthSummary.net >= 0 ? 'text-green-400' : 'text-red-400'} className="lg:col-span-1" />

                <Card className="lg:col-span-4 md:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                        <h2 className="text-lg font-bold text-white">Tendencias Financieras</h2>
                        <div className="flex space-x-2">
                            <FilterButton label="6M" filter="6m" />
                            <FilterButton label="Este Año" filter="year" />
                            <FilterButton label="Año Pasado" filter="last_year" />
                            <FilterButton label="Total" filter="all" />
                        </div>
                    </div>
                    <TrendsLineChart data={historicalData} timeFilter={timeFilter} title="Tendencias Financieras" datasetsConfig={[
                        { key: 'income', label: 'Ingresos', borderColor: '#10b981', backgroundColor: '#10b98120', tension: 0.1, fill: true },
                        { key: 'expenses', label: 'Gastos', borderColor: '#ef4444', backgroundColor: '#ef444420', tension: 0.1, fill: true },
                        { key: 'savings', label: 'Ahorros', borderColor: '#3b82f6', backgroundColor: '#3b82f620', tension: 0.1, fill: true },
                        { key: 'debtPaid', label: 'Deuda Pagada', borderColor: '#f59e0b', backgroundColor: '#f59e0b20', tension: 0.1, fill: true },
                    ]}/>
                </Card>

                <Card className="lg:col-span-4 md:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                        <h2 className="text-lg font-bold text-white">Evolución del Presupuesto</h2>
                    </div>
                    <TrendsLineChart data={historicalConfig} timeFilter={timeFilter} title="Evolución del Presupuesto" datasetsConfig={[
                        { key: 'plannedIncome', label: 'Ingreso Planeado', borderColor: '#10b981', backgroundColor: '#10b98120', tension: 0.1, fill: true },
                        { key: 'plannedExpenses', label: 'Gasto Planeado', borderColor: '#ef4444', backgroundColor: '#ef444420', tension: 0.1, fill: true },
                    ]}/>
                </Card>

                {configData && (
                    <Card className="lg:col-span-4 md:col-span-2">
                        <h2 className="text-lg font-bold text-white mb-4">Metas de Ahorro</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {configData.savingsGoals.map(goal => (
                                <SavingsGoalItem
                                    key={goal.id}
                                    goal={goal}
                                    onUpdate={(updatedGoal) => {
                                        const updatedGoals = configData.savingsGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
                                        updateConfig({ savingsGoals: updatedGoals });
                                    }}
                                />
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ResumenGeneral;
