
import type { GastosData, ViajeData, ConfigData } from '../types';

export const initialConfigData: ConfigData = {
    categories: ['servicios', 'mercado', 'transporte', 'comida_calle', 'domicilios', 'regalos', 'deudas', 'otro'],
    savingsGoals: [
        {
            id: 'sg-moto-1',
            name: "Meta Ejemplo (Moto)",
            targetAmount: 15000000,
            currentAmount: 1200000,
        }
    ],
    budgetVariables: {
        ingresos: [
            { id: 'budget-i-1', name: 'Sueldo Base', totalAmount: 2000000 }
        ],
        egresos: [
            { id: 'budget-e-1', name: 'Mercado', totalAmount: 400000, category: 'mercado' },
            { id: 'budget-e-2', name: 'Transporte', totalAmount: 120000, category: 'transporte' },
            { id: 'budget-e-3', name: 'Servicios Públicos', totalAmount: 200000, category: 'servicios' }
        ]
    },
    projects: [],
    debts: []
};

export const businessConfigData: ConfigData = {
    categories: ['nomina', 'impuestos', 'materia_prima', 'logistica', 'marketing', 'alquiler', 'servicios', 'otro'],
    savingsGoals: [
        { id: 'sg-exp-1', name: 'Fondo de Expansión', targetAmount: 50000000, currentAmount: 0 }
    ],
    budgetVariables: {
        ingresos: [
            { id: 'bi-1', name: 'Ventas Mensuales Est.', totalAmount: 10000000 }
        ],
        egresos: [
            { id: 'be-1', name: 'Nómina', totalAmount: 4000000, category: 'nomina' },
            { id: 'be-2', name: 'Alquiler Local', totalAmount: 1500000, category: 'alquiler' },
            { id: 'be-3', name: 'Impuestos', totalAmount: 500000, category: 'impuestos' }
        ]
    },
    projects: [],
    debts: []
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
    "groups": [],
    "abonos": {
        "eliza": [],
        "camilo": []
    }
};
