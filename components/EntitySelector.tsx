
import React, { useState } from 'react';
import { Card } from './common/Card';
import { Spinner } from './common/Spinner';
import { initialConfigData, businessConfigData } from '../data/initialData';
import type { ConfigData, BudgetVariableEgreso, SavingsGoal } from '../types';
import { HomeIcon, BriefcaseIcon, TrashIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectorProps {
  entities: Entity[];
  onSelectEntity: (id: string) => void;
  onCreateEntity: (name: string, template: ConfigData) => Promise<void>;
  onSignOut: () => void;
  loading: boolean;
}

type Step = 'name' | 'currency' | 'profile' | 'income' | 'fixed_expenses' | 'goals' | 'creating';
type EntityType = 'personal' | 'business';
type Currency = 'COP' | 'USD' | 'EUR' | 'MXN';

// Simple currency formatter helper
const formatCurrencyInput = (value: number, currency: Currency) => {
    return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(value);
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({ entities, onSelectEntity, onCreateEntity, onSignOut, loading }) => {
  const [step, setStep] = useState<Step>('name');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Wizard State
  const [newEntityName, setNewEntityName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('personal');
  const [currency, setCurrency] = useState<Currency>('COP');
  
  // Profile State
  const [employmentType, setEmploymentType] = useState<'employee' | 'independent'>('employee');
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'biweekly'>('monthly');

  // Financial State
  const [initialIncome, setInitialIncome] = useState<number>(0);
  const [incomeDisplay, setIncomeDisplay] = useState(''); // Formatted string for display
  const [fixedExpenses, setFixedExpenses] = useState<BudgetVariableEgreso[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>('');
  
  // Goals State
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState<string>('');

  const handleStartCreation = () => {
    // Reset state
    setStep('name');
    setNewEntityName('');
    setEntityType('personal');
    setCurrency('COP');
    setEmploymentType('employee');
    setPaymentFrequency('monthly');
    setInitialIncome(0);
    setIncomeDisplay('');
    setFixedExpenses([]);
    setGoals([]);
    setIsWizardOpen(true);
  };

  // --- Handlers ---

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    setStep('currency');
  };

  const handleCurrencySelect = (c: Currency) => {
      setCurrency(c);
      setStep('profile');
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setStep('income');
  }

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove non-numeric chars
      const rawValue = e.target.value.replace(/\D/g, '');
      if (!rawValue) {
          setInitialIncome(0);
          setIncomeDisplay('');
          return;
      }
      const numericValue = parseInt(rawValue, 10);
      setInitialIncome(numericValue);
      setIncomeDisplay(formatCurrencyInput(numericValue, currency));
  }

  const handleIncomeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setStep('fixed_expenses');
  }

  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newExpenseName || !newExpenseAmount) return;
      const amount = parseInt(newExpenseAmount.replace(/\D/g, ''), 10);
      if (isNaN(amount) || amount <= 0) return;

      const newExpense: BudgetVariableEgreso = {
          id: uuidv4(),
          name: newExpenseName,
          totalAmount: amount,
          category: 'servicios' // Default to servicios for onboarding simplicity
      };

      setFixedExpenses([...fixedExpenses, newExpense]);
      setNewExpenseName('');
      setNewExpenseAmount('');
  }

  const handleRemoveExpense = (id: string) => {
      setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
  }
  
  const handleExpensesSubmit = () => {
      setStep('goals');
  }

  const handleAddGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGoalName || !newGoalAmount) return;
      const amount = parseInt(newGoalAmount.replace(/\D/g, ''), 10);
      if (isNaN(amount) || amount <= 0) return;

      const newGoal: SavingsGoal = {
          id: uuidv4(),
          name: newGoalName,
          targetAmount: amount,
          currentAmount: 0
      };

      setGoals([...goals, newGoal]);
      setNewGoalName('');
      setNewGoalAmount('');
  }

  const handleRemoveGoal = (id: string) => {
      setGoals(goals.filter(g => g.id !== id));
  }

  const handleFinish = async () => {
      setStep('creating');
      
      // Clone template
      const template: ConfigData = entityType === 'business' 
          ? JSON.parse(JSON.stringify(businessConfigData)) 
          : JSON.parse(JSON.stringify(initialConfigData));
      
      // Update with Wizard Data
      template.currency = currency;
      template.employmentType = entityType === 'business' ? 'business' : employmentType;
      template.paymentFrequency = paymentFrequency;

      // Set Income
      if (initialIncome > 0) {
          if (template.budgetVariables.ingresos.length === 0) {
              template.budgetVariables.ingresos.push({ id: uuidv4(), name: 'Ingreso Principal', totalAmount: initialIncome });
          } else {
              template.budgetVariables.ingresos[0].totalAmount = initialIncome;
          }
      }

      // Set Fixed Expenses
      if (fixedExpenses.length > 0) {
          template.budgetVariables.egresos = [...template.budgetVariables.egresos, ...fixedExpenses];
      }
      
      // Set Goals
      if (goals.length > 0) {
          template.savingsGoals = [...template.savingsGoals, ...goals];
      }

      await onCreateEntity(newEntityName, template);
      setIsWizardOpen(false);
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-900">
              <Spinner />
          </div>
      );
  }

  // --- Wizard Render ---
  if (isWizardOpen) {
      const progressMap: Record<Step, number> = {
          'name': 10, 'currency': 30, 'profile': 50, 'income': 65, 'fixed_expenses': 80, 'goals': 90, 'creating': 100
      };

      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
              <div className="absolute top-4 right-4">
                 <button onClick={() => setIsWizardOpen(false)} className="text-gray-500 hover:text-white text-sm">
                     Cancelar
                 </button>
              </div>
              <Card className="w-full max-w-lg border-2 border-gray-800">
                  <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold text-white">
                              {step === 'name' && 'Ponle nombre a tu espacio'}
                              {step === 'currency' && 'Selecciona tu moneda'}
                              {step === 'profile' && 'Detalles de tu perfil'}
                              {step === 'income' && 'Configura tus Ingresos'}
                              {step === 'fixed_expenses' && 'Gastos Fijos Mensuales'}
                              {step === 'goals' && 'Metas de Ahorro'}
                              {step === 'creating' && 'Finalizando...'}
                           </h2>
                           <div className="text-xs text-gray-500">
                               Progreso: {progressMap[step]}%
                           </div>
                      </div>
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progressMap[step]}%` }}
                          ></div>
                      </div>
                  </div>

                  {/* STEP 1: NAME */}
                  {step === 'name' && (
                      <form onSubmit={handleNameSubmit} className="space-y-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">Nombre del Espacio</label>
                              <input 
                                  autoFocus
                                  type="text" 
                                  value={newEntityName} 
                                  onChange={e => setNewEntityName(e.target.value)}
                                  placeholder="Ej: Finanzas Casa, Mi Negocio..."
                                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setEntityType('personal')}
                                    className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${entityType === 'personal' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <HomeIcon className="w-6 h-6" />
                                    <span className="font-medium">Personal</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEntityType('business')}
                                    className={`p-3 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${entityType === 'business' ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <BriefcaseIcon className="w-6 h-6" />
                                    <span className="font-medium">Negocio</span>
                                </button>
                          </div>

                          <div className="flex justify-end space-x-3 pt-4">
                              <button type="button" onClick={() => setIsWizardOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                              <button type="submit" disabled={!newEntityName.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Siguiente</button>
                          </div>
                      </form>
                  )}

                  {/* STEP 2: CURRENCY */}
                  {step === 'currency' && (
                      <div className="space-y-4">
                          <p className="text-gray-400 mb-4">Elige la moneda principal para tus reportes.</p>
                          <div className="grid grid-cols-2 gap-3">
                              {(['COP', 'USD', 'EUR', 'MXN'] as Currency[]).map(c => (
                                  <button 
                                    key={c}
                                    onClick={() => handleCurrencySelect(c)}
                                    className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-all text-left"
                                  >
                                      <span className="text-xl font-bold text-white">{c}</span>
                                  </button>
                              ))}
                          </div>
                          <div className="flex justify-start mt-6">
                              <button onClick={() => setStep('name')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                          </div>
                      </div>
                  )}

                  {/* STEP 3: PROFILE (Only if personal) */}
                  {step === 'profile' && (
                      entityType === 'personal' ? (
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">¿Cuál es tu situación laboral?</label>
                                <div className="space-y-2">
                                    <label className="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                                        <input type="radio" name="empType" checked={employmentType === 'employee'} onChange={() => setEmploymentType('employee')} className="form-radio text-blue-600" />
                                        <span className="ml-3 text-white">Empleado (Salario fijo)</span>
                                    </label>
                                    <label className="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
                                        <input type="radio" name="empType" checked={employmentType === 'independent'} onChange={() => setEmploymentType('independent')} className="form-radio text-blue-600" />
                                        <span className="ml-3 text-white">Independiente / Freelance</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">¿Con qué frecuencia recibes ingresos?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setPaymentFrequency('monthly')}
                                        className={`p-2 border rounded text-sm ${paymentFrequency === 'monthly' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-gray-600 text-gray-400'}`}
                                    >
                                        Mensual
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setPaymentFrequency('biweekly')}
                                        className={`p-2 border rounded text-sm ${paymentFrequency === 'biweekly' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-gray-600 text-gray-400'}`}
                                    >
                                        Quincenal
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <button type="button" onClick={() => setStep('currency')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Siguiente</button>
                            </div>
                        </form>
                      ) : (
                          // Skip profile for business for now
                          <div className="text-center py-8">
                              <p className="text-white mb-4">Configuración de empresa detectada.</p>
                              <button onClick={() => setStep('income')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Continuar</button>
                          </div>
                      )
                  )}

                  {/* STEP 4: INCOME */}
                  {step === 'income' && (
                      <form onSubmit={handleIncomeSubmit} className="space-y-6">
                           <div className="text-center mb-8">
                               <h3 className="text-gray-300 mb-2">¿Cuál es tu ingreso base estimado?</h3>
                               <p className="text-xs text-gray-500">Escribe el monto sin puntos ni símbolos</p>
                           </div>
                           
                           <div className="relative max-w-xs mx-auto">
                                <input 
                                  autoFocus
                                  type="text" 
                                  value={incomeDisplay}
                                  onChange={handleIncomeChange}
                                  placeholder="$ 0"
                                  className="w-full bg-transparent border-b-2 border-gray-600 text-center text-3xl font-bold text-white focus:border-blue-500 outline-none pb-2 placeholder-gray-700"
                                />
                           </div>
                           
                           <div className="flex justify-between items-center pt-8">
                              <button type="button" onClick={() => setStep('profile')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Siguiente</button>
                          </div>
                      </form>
                  )}

                  {/* STEP 5: FIXED EXPENSES */}
                  {step === 'fixed_expenses' && (
                      <div className="space-y-6">
                          <p className="text-sm text-gray-400">Agrega tus gastos fijos (Arriendo, Servicios, Gimnasio...). Estos se descontarán automáticamente.</p>
                          
                          <div className="bg-gray-800/50 p-4 rounded-lg space-y-3 border border-gray-700">
                               <div className="flex space-x-2">
                                   <input 
                                        type="text" 
                                        placeholder="Concepto (Ej: Arriendo)" 
                                        value={newExpenseName}
                                        onChange={e => setNewExpenseName(e.target.value)}
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                   />
                                   <input 
                                        type="text" 
                                        placeholder="Monto" 
                                        value={newExpenseAmount}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setNewExpenseAmount(val ? formatCurrencyInput(parseInt(val), currency) : '');
                                        }}
                                        className="w-32 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm text-right"
                                   />
                                   <button onClick={handleAddExpense} disabled={!newExpenseName || !newExpenseAmount} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 disabled:opacity-50">+</button>
                               </div>
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-2">
                              {fixedExpenses.length === 0 && <p className="text-center text-xs text-gray-600 italic py-2">No has agregado gastos fijos aún.</p>}
                              {fixedExpenses.map(expense => (
                                  <div key={expense.id} className="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
                                      <span className="text-gray-200">{expense.name}</span>
                                      <div className="flex items-center space-x-3">
                                          <span className="font-mono text-blue-400">{formatCurrencyInput(expense.totalAmount, currency)}</span>
                                          <button onClick={() => handleRemoveExpense(expense.id)} className="text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>

                           <div className="flex justify-between items-center pt-4">
                              <button onClick={() => setStep('income')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                              <button onClick={handleExpensesSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Siguiente</button>
                          </div>
                      </div>
                  )}
                  
                  {/* STEP 6: GOALS */}
                  {step === 'goals' && (
                      <div className="space-y-6">
                          <p className="text-sm text-gray-400">¿Tienes metas de ahorro? (Ej: Comprar Carro, Vacaciones, Fondo de Emergencia).</p>
                          
                          <div className="bg-gray-800/50 p-4 rounded-lg space-y-3 border border-gray-700">
                               <div className="flex space-x-2">
                                   <input 
                                        type="text" 
                                        placeholder="Meta (Ej: Carro)" 
                                        value={newGoalName}
                                        onChange={e => setNewGoalName(e.target.value)}
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                   />
                                   <input 
                                        type="text" 
                                        placeholder="Monto Objetivo" 
                                        value={newGoalAmount}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setNewGoalAmount(val ? formatCurrencyInput(parseInt(val), currency) : '');
                                        }}
                                        className="w-32 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm text-right"
                                   />
                                   <button onClick={handleAddGoal} disabled={!newGoalName || !newGoalAmount} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 disabled:opacity-50">+</button>
                               </div>
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-2">
                              {goals.length === 0 && <p className="text-center text-xs text-gray-600 italic py-2">No has agregado metas aún.</p>}
                              {goals.map(goal => (
                                  <div key={goal.id} className="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
                                      <span className="text-gray-200">{goal.name}</span>
                                      <div className="flex items-center space-x-3">
                                          <span className="font-mono text-blue-400">{formatCurrencyInput(goal.targetAmount, currency)}</span>
                                          <button onClick={() => handleRemoveGoal(goal.id)} className="text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>

                           <div className="flex justify-between items-center pt-4">
                              <button onClick={() => setStep('fixed_expenses')} className="text-sm text-gray-400 hover:text-white">Atrás</button>
                              <button onClick={handleFinish} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center shadow-lg shadow-green-900/20">
                                  Terminar Configuración
                              </button>
                          </div>
                      </div>
                  )}

                  {step === 'creating' && (
                      <div className="flex flex-col items-center justify-center py-12">
                          <Spinner />
                          <p className="text-gray-400 mt-4">Creando tu espacio financiero...</p>
                      </div>
                  )}
              </Card>
          </div>
      );
  }

  // Welcome Screen
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      
      {/* Sign Out Button */}
      <div className="absolute top-4 right-4">
          <button 
              onClick={onSignOut}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-semibold bg-gray-800/50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
          >
              <span>Cerrar Sesión</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
          </button>
      </div>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20">
                <span className="text-4xl font-bold text-white">G</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Gastón</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Tu asistente financiero inteligente.
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
                    <h3 className="text-xl font-bold text-white">¿Nuevo Objetivo?</h3>
                    <p className="text-gray-400 text-center">Crea un presupuesto separado para otro proyecto o negocio.</p>
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
            </div>
        )}
      </div>
    </div>
  );
};
