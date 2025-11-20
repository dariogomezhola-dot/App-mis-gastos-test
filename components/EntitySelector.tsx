import React, { useState } from 'react';
import { Card } from './common/Card';
import { Spinner } from './common/Spinner';
import { initialConfigData, businessConfigData } from '../data/initialData';
import type { ConfigData } from '../types';
import { HomeIcon, BriefcaseIcon } from './Icons';

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectorProps {
  entities: Entity[];
  onSelectEntity: (id: string) => void;
  onCreateEntity: (name: string, template: ConfigData) => Promise<void>;
  loading: boolean;
}

type Step = 'name' | 'type' | 'budget' | 'creating';
type EntityType = 'personal' | 'business';

export const EntitySelector: React.FC<EntitySelectorProps> = ({ entities, onSelectEntity, onCreateEntity, loading }) => {
  const [step, setStep] = useState<Step>('name');
  const [newEntityName, setNewEntityName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('personal');
  const [initialIncome, setInitialIncome] = useState<string>('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleStartCreation = () => {
    setStep('name');
    setNewEntityName('');
    setInitialIncome('');
    setIsWizardOpen(true);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    setStep('type');
  };

  const handleTypeSelect = (type: EntityType) => {
      setEntityType(type);
      setStep('budget');
  }

  const handleFinish = async (e: React.FormEvent) => {
      e.preventDefault();
      setStep('creating');
      
      const template = entityType === 'business' 
          ? JSON.parse(JSON.stringify(businessConfigData)) 
          : JSON.parse(JSON.stringify(initialConfigData));
      
      // Inject initial income if provided
      const incomeAmount = Number(initialIncome);
      if (!isNaN(incomeAmount) && incomeAmount > 0) {
          if (template.budgetVariables.ingresos.length > 0) {
              template.budgetVariables.ingresos[0].totalAmount = incomeAmount;
          } else {
               template.budgetVariables.ingresos.push({
                   id: 'initial-income', 
                   name: 'Ingreso Base', 
                   totalAmount: incomeAmount
               });
          }
      }

      await onCreateEntity(newEntityName, template);
      // App will switch context automatically, but we reset state just in case
      setIsWizardOpen(false);
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-900">
              <Spinner />
          </div>
      );
  }

  // Wizard View
  if (isWizardOpen) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg">
                  <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                           <h2 className="text-2xl font-bold text-white">
                              {step === 'name' && 'Ponle nombre a tu espacio'}
                              {step === 'type' && '¿Para qué usarás Gastón?'}
                              {step === 'budget' && 'Configuración Inicial'}
                              {step === 'creating' && 'Creando tu espacio...'}
                           </h2>
                           <div className="text-sm text-gray-500">
                               {step === 'name' && 'Paso 1 de 3'}
                               {step === 'type' && 'Paso 2 de 3'}
                               {step === 'budget' && 'Paso 3 de 3'}
                           </div>
                      </div>
                      <div className="w-full bg-gray-700 h-1 rounded-full">
                          <div 
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ 
                                  width: step === 'name' ? '33%' : step === 'type' ? '66%' : '100%' 
                              }}
                          ></div>
                      </div>
                  </div>

                  {step === 'name' && (
                      <form onSubmit={handleNameSubmit} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de la Entidad</label>
                              <input 
                                  autoFocus
                                  type="text" 
                                  value={newEntityName} 
                                  onChange={e => setNewEntityName(e.target.value)}
                                  placeholder="Ej: Mis Finanzas, Startup Inc..."
                                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                          </div>
                          <div className="flex justify-end space-x-3">
                              <button type="button" onClick={() => setIsWizardOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                              <button type="submit" disabled={!newEntityName.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Continuar</button>
                          </div>
                      </form>
                  )}

                  {step === 'type' && (
                      <div className="space-y-4">
                          <p className="text-gray-400 mb-4">Esto nos ayuda a configurar tus categorías y presupuesto base.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <button 
                                  onClick={() => handleTypeSelect('personal')}
                                  className="p-4 bg-gray-800 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-750 transition-all group text-left"
                              >
                                  <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500/30">
                                      <HomeIcon className="text-blue-400" />
                                  </div>
                                  <h3 className="font-bold text-white">Personal</h3>
                                  <p className="text-sm text-gray-500 mt-1">Gastos del hogar, transporte, entretenimiento...</p>
                              </button>

                              <button 
                                  onClick={() => handleTypeSelect('business')}
                                  className="p-4 bg-gray-800 border border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-750 transition-all group text-left"
                              >
                                  <div className="bg-purple-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500/30">
                                      <BriefcaseIcon className="text-purple-400" />
                                  </div>
                                  <h3 className="font-bold text-white">Negocio / Empresa</h3>
                                  <p className="text-sm text-gray-500 mt-1">Nómina, impuestos, costos operativos...</p>
                              </button>
                          </div>
                          <div className="flex justify-start mt-4">
                              <button onClick={() => setStep('name')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                          </div>
                      </div>
                  )}

                  {step === 'budget' && (
                      <form onSubmit={handleFinish} className="space-y-4">
                           <p className="text-gray-400">¿Cuál es tu ingreso mensual base estimado? (Opcional)</p>
                           <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">$</span>
                                </div>
                                <input 
                                  type="number" 
                                  value={initialIncome}
                                  onChange={e => setInitialIncome(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-8 p-3 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                           </div>
                           <p className="text-xs text-gray-500">Podrás cambiar esto más tarde en Configuración.</p>
                           
                           <div className="flex justify-between items-center mt-6">
                              <button type="button" onClick={() => setStep('type')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                                  <span className="mr-2">Crear Espacio</span>
                                  {step === 'creating' && <Spinner />}
                              </button>
                          </div>
                      </form>
                  )}
                  {step === 'creating' && (
                      <div className="flex flex-col items-center justify-center py-8">
                          <Spinner />
                          <p className="text-gray-400 mt-4">Configurando tu base de datos...</p>
                      </div>
                  )}
              </Card>
          </div>
      );
  }

  // Main Selector View (Welcome Screen)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20">
                <span className="text-4xl font-bold text-white">G</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gastón</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Tu asistente financiero minimalista. Gestiona múltiples perfiles, empresas o presupuestos de viaje sin complicaciones.
            </p>
        </div>

        {entities.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-blue-500/30 hover:border-blue-500/60 transition-all">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        <BriefcaseIcon className="mr-2 text-blue-400" />
                        Tus Espacios
                    </h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {entities.map((entity) => (
                            <button
                                key={entity.id}
                                onClick={() => onSelectEntity(entity.id)}
                                className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group border border-gray-700"
                            >
                                <span className="font-medium text-gray-200 group-hover:text-white">{entity.name}</span>
                                <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Entrar →</span>
                            </button>
                        ))}
                    </div>
                </Card>

                <div className="flex flex-col justify-center items-center space-y-6 p-8 bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                         <div className="text-gray-400">+</div>
                    </div>
                    <h3 className="text-xl font-bold text-white">¿Nuevo Proyecto?</h3>
                    <p className="text-gray-400 text-center">Crea un espacio separado para otro negocio, una meta personal o un viaje en grupo.</p>
                    <button 
                        onClick={handleStartCreation}
                        className="px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-colors transform hover:scale-105"
                    >
                        Crear Nuevo Espacio
                    </button>
                </div>
             </div>
        ) : (
            <div className="flex flex-col items-center">
                <button 
                    onClick={handleStartCreation}
                    className="group relative px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-full hover:bg-blue-500 transition-all shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_50px_-5px_rgba(37,99,235,0.7)]"
                >
                    <span className="flex items-center">
                        Empezar Ahora <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                </button>
                <p className="mt-4 text-sm text-gray-500">No requiere registro. Tus datos son tuyos.</p>
            </div>
        )}
      </div>
    </div>
  );
};
