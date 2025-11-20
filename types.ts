
export type Module = 'resumen' | 'gastos' | 'metas' | 'viaje' | 'deudas' | 'configuracion' | 'proyectos';

// Config - The single source of truth
export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
}

export interface BudgetVariableIngreso {
    id: string;
    name: string;
    totalAmount: number;
}

export interface BudgetVariableEgreso {
    id: string;
    name: string;
    totalAmount: number;
    category: string;
    paymentDay?: number; // 1-31 Tentative payment day
}

export interface FinancialGoalLog {
    id: string;
    date: string;
    amount: number;
    note?: string;
}

export interface FinancialGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    notes: string;
    logs: FinancialGoalLog[];
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    installments: number; // cuotas
    interestRate: number; // Tasa E.A. (Anual)
    notes: string;
    dueDate?: number; // Day of month (1-31)
    monthsInArrears?: number; // 0 if current
}

export interface ProjectExpense {
    id: string;
    desc: string;
    monto: number;
}

export interface Project {
    id: string;
    name: string;
    abono: number;
    expenses: ProjectExpense[];
}

export interface ConfigData {
    currency: string; // 'COP', 'USD', etc.
    employmentType: 'employee' | 'independent' | 'business'; 
    paymentFrequency: 'monthly' | 'biweekly' | 'weekly' | 'irregular';
    categories: string[];
    savingsGoals: SavingsGoal[];
    budgetVariables: {
        ingresos: BudgetVariableIngreso[];
        egresos: BudgetVariableEgreso[];
    };
    financialGoals: FinancialGoal[]; // Replaces projects
    debts: Debt[];
    projects: Project[];
}


// Viaje Module
export interface Participant {
    id: string;
    name: string;
    monto: number;
    pagado: boolean;
}

export interface ExpenseGroup {
    id: string;
    name: string;
    participants: Participant[];
}

export interface Abono {
    id: string;
    monto: number;
}

export interface ViajeData {
    groups: ExpenseGroup[];
    abonos: {
        eliza: Abono[];
        camilo: Abono[];
    };
}


// Gastos Module
export interface Ingreso {
    id: string;
    desc: string;
    monto: number;
    projectId?: string; // Optional legacy link
    date?: string; // ISO YYYY-MM-DD
}

// Changed from union type to string to allow custom categories
export type EgresoCategory = string;

export interface Egreso {
    id: string;
    desc: string;
    monto: number;
    pagado: boolean;
    category: EgresoCategory;
    debtId?: string; // Link to a specific debt
    goalId?: string; // Link to a financial goal
    date?: string; // ISO YYYY-MM-DD
}

export interface Quincena {
    ingresos: Ingreso[];
    egresos: Egreso[];
    ahorros: number;
}

export interface GastosData {
    q1: Quincena;
    q2: Quincena;
}
