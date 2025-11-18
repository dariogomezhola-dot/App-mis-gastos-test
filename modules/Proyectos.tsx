
import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { initialConfigData } from '../data/initialData';
import type { ConfigData, Project } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';

interface ModuleProps {
    entityId: string;
}

const ProjectCard: React.FC<{
    project: Project;
    data: ConfigData;
    updateData: (newData: Partial<ConfigData>) => Promise<void>;
}> = ({ project, data, updateData }) => {
    const [abono, setAbono] = useState(project.abono);
    
    useEffect(() => {
        setAbono(project.abono);
    }, [project.abono]);

    const total = useMemo(() => project.expenses.reduce((sum, exp) => sum + exp.monto, 0), [project.expenses]);
    const restante = total - abono;

    const handleAbonoChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAbono(Number(e.target.value));
    };

    const handleAbonoBlur = () => {
        if (abono === project.abono) return;
        
        const updatedProjects = data.projects.map(p => 
            p.id === project.id ? { ...p, abono: abono } : p
        );
        updateData({ projects: updatedProjects });
    };

    return (
        <Card className="flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4">{project.name}</h3>
            <div className="flex-grow">
                <ul className="space-y-2 mb-4">
                    {project.expenses.map(expense => (
                        <li key={expense.id} className="flex justify-between text-sm py-1 border-b border-gray-700/50">
                            <span>{expense.desc}</span>
                            <span className="font-medium text-gray-300">{formatCurrency(expense.monto)}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-lg text-blue-400">Total:</span>
                    <span className="font-bold text-lg text-blue-400">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                    <label htmlFor={`abono-${project.id}`} className="font-semibold text-gray-400">Abono:</label>
                    <input
                        type="number"
                        id={`abono-${project.id}`}
                        value={abono}
                        onChange={handleAbonoChange}
                        onBlur={handleAbonoBlur}
                        className="w-full bg-gray-700 text-white font-semibold p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                    />
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span className="font-bold text-lg text-red-400">Restante:</span>
                    <span className="font-bold text-lg text-red-400">{formatCurrency(restante)}</span>
                </div>
            </div>
        </Card>
    );
};


const Proyectos: React.FC<ModuleProps> = ({ entityId }) => {
    const { data, loading, updateData } = useFirestoreDoc<ConfigData>(entityId, 'proyectos', initialConfigData);
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (!data) return <div>No data found.</div>;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Proyectos</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} data={data} updateData={updateData} />
                ))}
            </div>
        </div>
    );
};

export default Proyectos;
