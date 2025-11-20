
import type { GastosData, ConfigData, ViajeData } from '../types';

export const initialConfigData: ConfigData = {
    currency: 'COP',
    employmentType: 'employee',
    paymentFrequency: 'monthly',
    categories: ['servicios', 'mercado', 'transporte', 'comida_calle', 'domicilios', 'regalos', 'deudas', 'otro'],
    savingsGoals: [], 
    budgetVariables: {
        ingresos: [], 
        egresos: []   
    },
    financialGoals: [],
    debts: [],
    projects: []
};

export const businessConfigData: ConfigData = {
    currency: 'COP',
    employmentType: 'business',
    paymentFrequency: 'monthly',
    categories: ['nomina', 'impuestos', 'materia_prima', 'logistica', 'marketing', 'alquiler', 'servicios', 'otro'],
    savingsGoals: [], 
    budgetVariables: {
        ingresos: [], 
        egresos: []   
    },
    financialGoals: [],
    debts: [],
    projects: []
};

// A blank structure for a new month's gastos.
export const blankGastosData: GastosData = {
    q1: {
        ingresos: [],
        egresos: [],
        ahorros: 0,
    },
    q2: {
        ingresos: [],
        egresos: [],
        ahorros: 0,
    }
};

export const initialGastosData: GastosData = {
    "q1": {
        "ingresos": [],
        "egresos": [],
        "ahorros": 0
    },
    "q2": {
        "ingresos": [],
        "egresos": [],
        "ahorros": 0
    }
};

export const initialViajeData: ViajeData = {
    groups: [],
    abonos: {
        eliza: [],
        camilo: []
    }
};