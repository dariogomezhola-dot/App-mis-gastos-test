
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Gastos from './modules/Gastos';
import Proyectos from './modules/Proyectos';
import Viaje from './modules/Viaje';
import Deudas from './modules/Deudas';
import ResumenGeneral from './modules/ResumenGeneral';
import Configuracion from './modules/Configuracion';
import { Spinner } from './components/common/Spinner';
import { db } from './services/firebaseService';
import { collection, getDocs, addDoc, setDoc } from 'firebase/firestore';
import type { Module } from './types';
import { EntitySelector } from './components/EntitySelector';
import { initialConfigData, blankGastosData } from './data/initialData';
import { getDataDocRef } from './services/firebaseService';

interface Entity {
  id: string;
  name: string;
}

const App: React.FC = () => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [activeEntity, setActiveEntity] = useState<Entity | null>(null);
    const [entitiesLoading, setEntitiesLoading] = useState(true);
    const [activeModule, setActiveModule] = useState<Module>('resumen');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    useEffect(() => {
        const loadEntities = async () => {
            setEntitiesLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'entities'));
                const fetchedEntities: Entity[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedEntities.push({ id: doc.id, name: doc.data().name as string });
                });
                setEntities(fetchedEntities);

                const savedEntityId = localStorage.getItem('activeEntityId');
                if (savedEntityId) {
                    const savedEntity = fetchedEntities.find(e => e.id === savedEntityId);
                    if (savedEntity) {
                        setActiveEntity(savedEntity);
                    }
                }
            } catch (error) {
                console.error("Error fetching entities:", error);
            } finally {
                setEntitiesLoading(false);
            }
        };
        loadEntities();
    }, []);

    useEffect(() => {
        if (typeof (window as any).feather !== 'undefined') {
            (window as any).feather.replace();
        }
    }, [activeModule, isSidebarOpen, activeEntity]);

    const handleSelectEntity = (entityId: string) => {
        const entity = entities.find(e => e.id === entityId);
        if (entity) {
            localStorage.setItem('activeEntityId', entity.id);
            setActiveEntity(entity);
        }
    };

    const handleCreateEntity = async (name: string) => {
        try {
            const docRef = await addDoc(collection(db, 'entities'), { name });
            const newEntity = { id: docRef.id, name };
            
            const configDocRef = getDataDocRef(newEntity.id, 'configuracion');
            await setDoc(configDocRef, initialConfigData);
            
            const currentDate = new Date();
            const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
            const gastosDocRef = getDataDocRef(newEntity.id, 'gastos', yearMonth);
            await setDoc(gastosDocRef, blankGastosData);

            setEntities([...entities, newEntity]);
            handleSelectEntity(newEntity.id);
        } catch (error) {
            console.error("Error creating entity:", error);
        }
    };

    const handleSwitchEntity = () => {
        localStorage.removeItem('activeEntityId');
        setActiveEntity(null);
    };

    const renderModule = () => {
        if (!activeEntity) return null;
        switch (activeModule) {
            case 'resumen':
                return <ResumenGeneral entityId={activeEntity.id} />;
            case 'gastos':
                return <Gastos entityId={activeEntity.id} />;
            case 'proyectos':
                return <Proyectos entityId={activeEntity.id} />;
            case 'viaje':
                return <Viaje entityId={activeEntity.id} />;
            case 'deudas':
                return <Deudas entityId={activeEntity.id} />;
            case 'configuracion':
                return <Configuracion entityId={activeEntity.id} />;
            default:
                return <ResumenGeneral entityId={activeEntity.id} />;
        }
    };
    
    if (entitiesLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <Spinner />
            </div>
        );
    }
    
    if (!activeEntity) {
        return <EntitySelector
            entities={entities}
            onSelectEntity={handleSelectEntity}
            onCreateEntity={handleCreateEntity}
            loading={entitiesLoading}
        />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-400">
            <Navigation 
                activeEntityName={activeEntity.name}
                onSwitchEntity={handleSwitchEntity}
                activeModule={activeModule} 
                setActiveModule={setActiveModule} 
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="md:pl-64 pt-16 md:pt-0">
                    {renderModule()}
                </div>
            </main>
        </div>
    );
};

export default App;
