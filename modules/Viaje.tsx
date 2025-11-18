
import React, { useMemo } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialViajeData } from '../data/initialData';
import type { ViajeData, ExpenseGroup, Participant } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';

interface ModuleProps {
    entityId: string;
}

const ExpenseGroupCard: React.FC<{
    group: ExpenseGroup;
    data: ViajeData;
    updateData: (newData: Partial<ViajeData>) => Promise<void>;
}> = ({ group, data, updateData }) => {
    
    const summary = useMemo(() => {
        const yaPagado = group.participants.filter(p => p.pagado).reduce((sum, p) => sum + p.monto, 0);
        const noPagado = group.participants.filter(p => !p.pagado).reduce((sum, p) => sum + p.monto, 0);
        const totalDeudas = yaPagado + noPagado;
        return { yaPagado, noPagado, totalDeudas };
    }, [group.participants]);

    const togglePagado = (participantId: string) => {
        const updatedData = JSON.parse(JSON.stringify(data));
        const groupToUpdate = updatedData.groups.find((g: ExpenseGroup) => g.id === group.id);
        if (groupToUpdate) {
            const participant = groupToUpdate.participants.find((p: Participant) => p.id === participantId);
            if (participant) {
                participant.pagado = !participant.pagado;
                updateData(updatedData);
            }
        }
    };
    
    return (
        <Card>
            <h3 className="text-xl font-bold text-white mb-4">{group.name}</h3>
            <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {group.participants.map(p => (
                    <li 
                        key={p.id} 
                        onClick={() => togglePagado(p.id)}
                        className="flex justify-between items-center text-sm py-2 px-2 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/50 rounded"
                    >
                        <span>{p.name}</span>
                        <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-300">{formatCurrency(p.monto)}</span>
                             <Badge text={p.pagado ? 'PAGADO' : 'NO PAGO'} color={p.pagado ? 'green' : 'red'} />
                        </div>
                    </li>
                ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-red-400">No Pagado:</span> <span className="font-semibold">{formatCurrency(summary.noPagado)}</span></div>
                <div className="flex justify-between"><span className="text-green-400">Ya Pagado:</span> <span className="font-semibold">{formatCurrency(summary.yaPagado)}</span></div>
                <div className="flex justify-between text-base"><span className="font-bold text-blue-400">Total:</span> <span className="font-bold">{formatCurrency(summary.totalDeudas)}</span></div>
            </div>
        </Card>
    );
};

const AbonosCard: React.FC<{ abonos: ViajeData['abonos'] }> = ({ abonos }) => {
    const totalEliza = useMemo(() => abonos.eliza.reduce((sum, a) => sum + a.monto, 0), [abonos.eliza]);
    const totalCamilo = useMemo(() => abonos.camilo.reduce((sum, a) => sum + a.monto, 0), [abonos.camilo]);
    
    return (
        <Card>
            <h3 className="text-xl font-bold text-white mb-4">Abonos</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-blue-400">Eliza</h4>
                    <ul className="text-sm pl-4 list-disc list-inside">
                        {abonos.eliza.map(a => <li key={a.id}>{formatCurrency(a.monto)}</li>)}
                    </ul>
                    <p className="font-bold text-right mt-1">{formatCurrency(totalEliza)}</p>
                </div>
                <div className="pt-2 border-t border-gray-700">
                    <h4 className="font-semibold text-blue-400">Camilo</h4>
                     <ul className="text-sm pl-4 list-disc list-inside">
                        {abonos.camilo.map(a => <li key={a.id}>{formatCurrency(a.monto)}</li>)}
                    </ul>
                    <p className="font-bold text-right mt-1">{formatCurrency(totalCamilo)}</p>
                </div>
            </div>
        </Card>
    )
}

const Viaje: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, updateData } = useFirestoreDoc<ViajeData>(entityId, 'viaje', initialViajeData);

    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (!data) return <div>No data found.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Viaje Ledger</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.groups.map((group) => (
                        <ExpenseGroupCard key={group.id} group={group} data={data} updateData={updateData} />
                    ))}
                </div>
                <div className="lg:col-span-1">
                    <AbonosCard abonos={data.abonos} />
                </div>
            </div>
        </div>
    );
};

export default Viaje;
