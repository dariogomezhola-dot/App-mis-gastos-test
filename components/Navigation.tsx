import React from 'react';
import type { Module } from '../types';
import { HomeIcon, DollarSignIcon, BriefcaseIcon, PlaneIcon, CreditCardIcon, MenuIcon, XIcon, SettingsIcon } from './Icons';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-4">{label}</span>
    </button>
);

interface NavigationProps {
    activeEntityName: string;
    onSwitchEntity: () => void;
    activeModule: Module;
    setActiveModule: (module: Module) => void;
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeEntityName, onSwitchEntity, activeModule, setActiveModule, isSidebarOpen, setSidebarOpen }) => {

    const navItems: { id: Module; label: string; icon: React.ReactNode }[] = [
        { id: 'resumen', label: 'Resumen General', icon: <HomeIcon className="w-5 h-5" /> },
        { id: 'gastos', label: 'Gastos', icon: <DollarSignIcon className="w-5 h-5" /> },
        { id: 'proyectos', label: 'Proyectos', icon: <BriefcaseIcon className="w-5 h-5" /> },
        { id: 'viaje', label: 'Viaje', icon: <PlaneIcon className="w-5 h-5" /> },
        { id: 'deudas', label: 'Deudas', icon: <CreditCardIcon className="w-5 h-5" /> },
        { id: 'configuracion', label: 'Configuración', icon: <SettingsIcon className="w-5 h-5" /> },
    ];
    
    const handleNavItemClick = (module: Module) => {
        setActiveModule(module);
        if (isSidebarOpen) {
            setSidebarOpen(false);
        }
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">Gastón</h1>
                </div>
                 <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeModule === item.id}
                        onClick={() => handleNavItemClick(item.id)}
                    />
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 truncate mb-2">Entidad: <span className="font-bold text-white">{activeEntityName}</span></div>
                <button 
                    onClick={onSwitchEntity}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 rounded-lg"
                >
                    Cambiar Entidad
                </button>
            </div>
        </div>
    );
    
    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">Gastón</h1>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </header>
            
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-30 w-64 h-full bg-gray-800 border-r border-gray-700 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0`}>
                {sidebarContent}
            </aside>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </>
    );
};

export default Navigation;