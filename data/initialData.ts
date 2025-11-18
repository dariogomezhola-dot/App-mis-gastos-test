import type { GastosData, ViajeData, ConfigData } from '../types';

export const initialConfigData: ConfigData = {
    savingsGoals: [
        {
            id: 'sg-moto-1',
            name: "Moto",
            targetAmount: 15000000,
            currentAmount: 1200000,
        }
    ],
    budgetVariables: {
        ingresos: [
            { id: 'budget-i-1', name: 'Sueldo', totalAmount: 2130000 }
        ],
        egresos: [
            { id: 'budget-e-1', name: 'Mercado', totalAmount: 400000, category: 'mercado' },
            { id: 'budget-e-2', name: 'Transporte', totalAmount: 120000, category: 'transporte' },
            { id: 'budget-e-3', name: 'Servicios Públicos', totalAmount: 200000, category: 'servicios' }
        ]
    },
    projects: [
        {
            "id": "p-1",
            "name": "PÁGINA WEB CONCRETO",
            "expenses": [
                { "id": "p1-e1", "desc": "DISEÑO PÁGINA WEB", "monto": 300000 },
                { "id": "p1-e2", "desc": "IDENTIDAD VISUAL", "monto": 50000 },
                { "id": "p1-e3", "desc": "HOSTING", "monto": 179400 },
                { "id": "p1-e4", "desc": "DOMINIO", "monto": 59797 }
            ],
            "abono": 200000
        },
        {
            "id": "p-2",
            "name": "iprint",
            "expenses": [
                { "id": "p2-e1", "desc": "Diseño e implementación", "monto": 2000000 }
            ],
            "abono": 500000
        },
        {
            "id": "p-3",
            "name": "Marketing up",
            "expenses": [
                { "id": "p3-e1", "desc": "Diseño e implementación", "monto": 250000 },
                { "id": "p3-e2", "desc": "Módulos", "monto": 250000 }
            ],
            "abono": 250000
        }
    ],
    debts: [
        {
            "id": "d-1",
            "name": "ADDI",
            "totalAmount": 690000,
            "paidAmount": 100000,
            "installments": 6,
            "notes": "Son 4M de mi deuda el resto lo paga otra persona que le presta"
        },
        {
            "id": "d-2",
            "name": "NEQUI",
            "totalAmount": 4665108,
            "paidAmount": 500000,
            "installments": 23,
            "notes": "Mas intereses, son 23 cuotas de 259mil"
        },
        {
            "id": "d-3",
            "name": "NU",
            "totalAmount": 10600000,
            "paidAmount": 200000,
            "installments": 36,
            "notes": "Tengo actualmente mora de 3 meses"
        }
    ]
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
        "ingresos": [
            { "id": "g-q1i-1", "desc": "Bono", "monto": 220000 },
            { "id": "g-q1i-2", "desc": "Salario", "monto": 1065000 },
            { "id": "g-q1i-3", "desc": "Prima", "monto": 1010000 },
            { "id": "g-q1i-4", "desc": "Fondo", "monto": 2450000 }
        ],
        "egresos": [
            { "id": "g-q1e-1", "desc": "MERCADO", "monto": 200000, "pagado": false, "category": "mercado" },
            { "id": "g-q1e-2", "desc": "Transporte", "monto": 60000, "pagado": false, "category": "transporte" },
            { "id": "g-q1e-3", "desc": "ENEL", "monto": 39000, "pagado": false, "category": "servicios" },
            { "id": "g-q1e-4", "desc": "CLARO", "monto": 116000, "pagado": false, "category": "servicios" },
            { "id": "g-q1e-5", "desc": "Gas", "monto": 18000, "pagado": false, "category": "servicios" },
            { "id": "g-q1e-6", "desc": "EAAB", "monto": 22000, "pagado": false, "category": "servicios" },
            { "id": "g-q1e-7", "desc": "Datos", "monto": 22000, "pagado": false, "category": "servicios" }
        ],
        "ahorros": 0
    },
    "q2": {
        "ingresos": [
            { "id": "g-q2i-1", "desc": "liquidación", "monto": 1010000 }
        ],
        "egresos": [
            { "id": "g-q2e-1", "desc": "MERCADO", "monto": 200000, "pagado": false, "category": "mercado" },
            { "id": "g-q2e-2", "desc": "Transporte", "monto": 60000, "pagado": false, "category": "transporte" },
            { "id": "g-q2e-3", "desc": "ADDI", "monto": 200000, "pagado": false, "category": "deudas" },
            { "id": "g-q2e-4", "desc": "NEQUI", "monto": 260000, "pagado": false, "category": "deudas" }
        ],
        "ahorros": 0
    }
};

export const initialViajeData: ViajeData = {
    "groups": [
        {
            "id": "v-g1",
            "name": "Estado (Grupo 1)",
            "participants": [
                { "id": "v-p1", "name": "Eli", "monto": 290000, "pagado": false },
                { "id": "v-p2", "name": "Sebas", "monto": 290000, "pagado": false },
                { "id": "v-p3", "name": "Fernando", "monto": 290000, "pagado": false },
                { "id": "v-p4", "name": "Johana", "monto": 290000, "pagado": true },
                { "id": "v-p5", "name": "Sergio", "monto": 290000, "pagado": true },
                { "id": "v-p6", "name": "Diego", "monto": 290000, "pagado": true },
                { "id": "v-p7", "name": "Andres", "monto": 290000, "pagado": true },
                { "id": "v-p8", "name": "Ivan", "monto": 290000, "pagado": true },
                { "id": "v-p9", "name": "Felipe", "monto": 290000, "pagado": true },
                { "id": "v-p10", "name": "Tia B", "monto": 290000, "pagado": true },
                { "id": "v-p11", "name": "Jacque", "monto": 290000, "pagado": false },
                { "id": "v-p12", "name": "Yo", "monto": 290000, "pagado": false },
                { "id": "v-p13", "name": "Mamá", "monto": 290000, "pagado": true }
            ]
        },
        {
            "id": "v-g2",
            "name": "Mercado (Grupo 2)",
            "participants": [
                { "id": "v-p14", "name": "Eli", "monto": 48500, "pagado": false },
                { "id": "v-p15", "name": "Sebas", "monto": 48500, "pagado": true },
                { "id": "v-p16", "name": "Fernando", "monto": 48500, "pagado": true },
                { "id": "v-p17", "name": "Johana", "monto": 48500, "pagado": true },
                { "id": "v-p18", "name": "Sergio", "monto": 48500, "pagado": true },
                { "id": "v-p19", "name": "Diego", "monto": 48500, "pagado": false },
                { "id": "v-p20", "name": "Andres", "monto": 48500, "pagado": true },
                { "id": "v-p21", "name": "Ivan", "monto": 48500, "pagado": true },
                { "id": "v-p22", "name": "Felipe", "monto": 48500, "pagado": true },
                { "id": "v-p23", "name": "Tia B", "monto": 48500, "pagado": true },
                { "id": "v-p24", "name": "Jacque", "monto": 48500, "pagado": false },
                { "id": "v-p25", "name": "Yo", "monto": 48500, "pagado": false },
                { "id": "v-p26", "name": "Mamá", "monto": 48500, "pagado": false }
            ]
        },
        {
            "id": "v-g3",
            "name": "Estado (Camilo)",
            "participants": [
                { "id": "v-p27", "name": "Mamá", "monto": 150000, "pagado": false },
                { "id": "v-p28", "name": "Amor", "monto": 150000, "pagado": false },
                { "id": "v-p29", "name": "Camilo", "monto": 150000, "pagado": false }
            ]
        }
    ],
    "abonos": {
        "eliza": [
            { "id": "a-e-1", "monto": 70000 },
            { "id": "a-e-2", "monto": 75000 }
        ],
        "camilo": [
            { "id": "a-c-1", "monto": 70000 },
            { "id": "a-c-2", "monto": 300000 },
            { "id": "a-c-3", "monto": 75000 },
            { "id": "a-c-4", "monto": 300000 }
        ]
    }
};