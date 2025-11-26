import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { asuUnit1Api, ASUMachine, ASUProductionEntry, ProductionStats } from '../../api/asuUnit1Api';

export interface UseProductionDataReturn {
    machines: ASUMachine[];
    productionEntries: ASUProductionEntry[];
    stats: ProductionStats | null;
    loading: boolean;
    error: string | null;
    loadData: (machineId?: number) => Promise<void>;
    addEntry: (data: any, machineId?: number) => Promise<boolean>;
    updateEntry: (id: number, data: any, machineId?: number) => Promise<boolean>;
    deleteEntry: (id: number, machineId?: number) => Promise<boolean>;
}

export const useProductionData = (): UseProductionDataReturn => {
    const [machines, setMachines] = useState<ASUMachine[]>([]);
    const [productionEntries, setProductionEntries] = useState<ASUProductionEntry[]>([]);
    const [stats, setStats] = useState<ProductionStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (machineId?: number) => {
        setLoading(true);
        setError(null);
        try {
            const [fetchedMachines, fetchedEntries, fetchedStats] = await Promise.all([
                asuUnit1Api.getAllMachines(),
                asuUnit1Api.getProductionEntries(machineId ? { machineId } : {}),
                asuUnit1Api.getProductionStats()
            ]);

            setMachines(fetchedMachines || []);
            // Handle paginated response structure
            if (fetchedEntries && 'items' in fetchedEntries) {
                setProductionEntries(fetchedEntries.items || []);
            } else {
                setProductionEntries((fetchedEntries as any) || []);
            }
            setStats(fetchedStats || null);
        } catch (err: any) {
            console.error('Error loading production data:', err);
            setError(err.message || 'Failed to load data');
            toast.error('Failed to load production data');
        } finally {
            setLoading(false);
        }
    }, []);

    const addEntry = useCallback(async (data: any, machineId?: number) => {
        setLoading(true);
        try {
            await asuUnit1Api.createProductionEntry(data);
            toast.success('Entry added successfully');
            await loadData(machineId); // Reload with filter
            return true;
        } catch (err: any) {
            console.error('Error adding entry:', err);
            toast.error(err.message || 'Failed to add entry');
            return false;
        } finally {
            setLoading(false);
        }
    }, [loadData]);

    const updateEntry = useCallback(async (id: number, data: any, machineId?: number) => {
        setLoading(true);
        try {
            await asuUnit1Api.updateProductionEntry(id, data);
            toast.success('Entry updated successfully');
            await loadData(machineId); // Reload with filter
            return true;
        } catch (err: any) {
            console.error('Error updating entry:', err);
            toast.error(err.message || 'Failed to update entry');
            return false;
        } finally {
            setLoading(false);
        }
    }, [loadData]);

    const deleteEntry = useCallback(async (id: number, machineId?: number) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return false;

        setLoading(true);
        try {
            await asuUnit1Api.deleteProductionEntry(id);
            toast.success('Entry deleted successfully');
            await loadData(machineId); // Reload with filter
            return true;
        } catch (err: any) {
            console.error('Error deleting entry:', err);
            toast.error(err.message || 'Failed to delete entry');
            return false;
        } finally {
            setLoading(false);
        }
    }, [loadData]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        machines,
        productionEntries,
        stats,
        loading,
        error,
        loadData,
        addEntry,
        updateEntry,
        deleteEntry
    };
};
