
import { initializeApp } from 'firebase/app';
import { getFirestore, doc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Module } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDRyx4JBubCKB7hK7vTZRguEAKUn7EFAdg",
  authDomain: "app-gastos-a3ed0.firebaseapp.com",
  projectId: "app-gastos-a3ed0",
  storageBucket: "app-gastos-a3ed0.firebasestorage.app",
  messagingSenderId: "875451346404",
  appId: "1:875451346404:web:62b828eb7c53a6a7dbabf1",
  measurementId: "G-28D98VZDZ6"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export singleton instances of Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const appId = firebaseConfig.projectId;

export const getConfigHistoryDocRef = (entityId: string, yearMonth: string) => {
    return doc(db, 'artifacts', appId, 'entities', entityId, 'config_history', yearMonth);
}

export const getDataDocRef = (entityId: string, module: Module, yearMonth?: string) => {
    if (module === 'gastos' && yearMonth) {
        return doc(db, 'artifacts', appId, 'entities', entityId, module, yearMonth);
    }
    
    if (['resumen', 'configuracion', 'deudas', 'proyectos'].includes(module)) {
        return doc(db, 'artifacts', appId, 'entities', entityId, 'config', 'data');
    }
    
    return doc(db, 'artifacts', appId, 'entities', entityId, module, 'data');
};
