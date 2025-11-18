
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, DocumentData } from 'firebase/firestore';
import { getDataDocRef } from '../services/firebaseService';
import type { Module } from '../types';

interface UseFirestoreDoc<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    updateData: (newData: Partial<T>, options?: { merge?: boolean }) => Promise<void>;
}

export const useFirestoreDoc = <T extends DocumentData>(
    entityId: string | null,
    module: Module,
    initialData: T,
    yearMonth?: string,
): UseFirestoreDoc<T> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!entityId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setData(null);

        const docRef = getDataDocRef(entityId, module, yearMonth);

        const unsubscribe = onSnapshot(docRef, 
            (docSnap) => {
                if (docSnap.exists()) {
                    setData(docSnap.data() as T);
                } else {
                    console.log(`No document for ${module}/${yearMonth}, seeding initial data.`);
                    setDoc(docRef, initialData).then(() => {
                        setData(initialData);
                    }).catch(e => {
                        console.error("Error seeding data: ", e);
                        setError(e as Error);
                    });
                }
                setLoading(false);
            }, 
            (err) => {
                console.error(`Error fetching ${module} data:`, err);
                setError(err as unknown as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId, module, yearMonth]);

    const updateData = async (newData: Partial<T>, options?: { merge?: boolean }) => {
        if (!entityId) {
            console.error("Cannot update data: no entity selected.");
            return;
        }
        const docRef = getDataDocRef(entityId, module, yearMonth);
        try {
            await setDoc(docRef, newData, { merge: options?.merge ?? true });
        } catch (e) {
            console.error("Failed to update data:", e);
            setError(e as Error);
        }
    };

    return { data, loading, error, updateData };
};
