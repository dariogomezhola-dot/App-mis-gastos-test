
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Gastos from './modules/Gastos';
import Metas from './modules/Metas';
import Deudas from './modules/Deudas';
import ResumenGeneral from './modules/ResumenGeneral';
import Configuracion from './modules/Configuracion';
import Login from './components/Login';
import { Spinner } from './components/common/Spinner';
import { db, auth, getDataDocRef } from './services/firebaseService';
import { collection, getDocs, addDoc, setDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import type { Module, ConfigData } from './types';
import { EntitySelector } from './components/EntitySelector';
import { blankGastosData } from './data/initialData';
import { UserProfileModal } from './components/UserProfileModal';

interface Entity {
  id: string;
  name: string;
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    const [entities, setEntities] = useState<Entity[]>([]);
    const [activeEntity, setActiveEntity] = useState<Entity | null>(null);
    const [entitiesLoading, setEntitiesLoading] = useState(false);
    const [activeModule, setActiveModule] = useState<Module>('resumen');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    
    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Load Entities for User
    useEffect(() => {
        const loadEntities = async () => {
            if (!user) {
                setEntities([]);
                setActiveEntity(null);
                return;
            }

            setEntitiesLoading(true);
            try {
                // IMPORTANT: Filter entities by ownerId
                const q = query(collection(db, 'entities'), where('ownerId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                
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
        
        if (!authLoading) {
            loadEntities();
        }
    }, [user, authLoading]);

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

    const handleCreateEntity = async (name: string, template: ConfigData) => {
        if (!user) return;

        try {
            const docRef = await addDoc(collection(db, 'entities'), { 
                name,
                ownerId: user.uid // Secure ownership
            });
            const newEntity = { id: docRef.id, name };
            
            const configDocRef = getDataDocRef(newEntity.id, 'configuracion');
            await setDoc(configDocRef, template);
            
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

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            handleSwitchEntity();
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const renderModule = () => {
        if (!activeEntity) return null;
        switch (activeModule) {
            case 'resumen':
                return <ResumenGeneral entityId={activeEntity.id} />;
            case 'gastos':
                return <Gastos entityId={activeEntity.id} />;
            case 'metas':
                return <Metas entityId={activeEntity.id} />;
            case 'deudas':
                return <Deudas entityId={activeEntity.id} />;
            case 'configuracion':
                return <Configuracion entityId={activeEntity.id} />;
            default:
                return <ResumenGeneral entityId={activeEntity.id} />;
        }
    };
    
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <Spinner />
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }
    
    if (entitiesLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <Spinner />
                    <p className="text-gray-400 mt-4">Cargando tus espacios...</p>
                </div>
            </div>
        );
    }
    
    if (!activeEntity) {
        return <EntitySelector
            entities={entities}
            onSelectEntity={handleSelectEntity}
            onCreateEntity={handleCreateEntity}
            onSignOut={handleSignOut}
            loading={entitiesLoading}
        />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-400">
            <Navigation 
                activeEntityName={activeEntity.name}
                onSwitchEntity={handleSwitchEntity}
                onSignOut={handleSignOut}
                onOpenProfile={() => setProfileOpen(true)}
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

            <UserProfileModal 
                isOpen={isProfileOpen} 
                onClose={() => setProfileOpen(false)}
                userEmail={user.email}
            />
        </div>
    );
};

export default App;
