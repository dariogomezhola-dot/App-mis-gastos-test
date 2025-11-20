
export type Module = 'resumen' | 'gastos' | 'proyectos' | 'viaje' | 'deudas' | 'configuracion';

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
}

export interface ProjectExpense {
    id: string;
    desc: string;
    monto: number;
}

export interface Project {
    id: string;
    name: string;
    expenses: ProjectExpense[];
    abono: number;
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    installments: number; // cuotas
    notes: string;
}

export interface ConfigData {
    categories: string[];
    savingsGoals: SavingsGoal[];
    budgetVariables: {
        ingresos: BudgetVariableIngreso[];
        egresos: BudgetVariableEgreso[];
    };
    projects: Project[];
    debts: Debt[];
}


// Gastos Module
export interface Ingreso {
    id: string;
    desc: string;
    monto: number;
    projectId?: string; // Link to a specific project
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
