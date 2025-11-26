import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { asuUnit1Api, ASUMachine, ASUProductionEntry, ProductionStats } from '../../api/asuUnit1Api';

export interface DateFilter {
    dateFrom?: string;
    dateTo?: string;
}

export interface UseProductionDataReturn {
    machines: ASUMachine[];
    productionEntries: ASUProductionEntry[];
    stats: ProductionStats | null;
    loading: boolean;
    error: string | null;
    loadData: (machineId?: number, dateFilter?: DateFilter) => Promise<void>;
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
    
    // Ref to track if initial load is complete
    const initialLoadComplete = useRef(false);

    const loadData = useCallback(async (machineId?: number, dateFilter?: DateFilter) => {
        setLoading(true);
        setError(null);
        try {
            const filters: any = {};
            if (machineId) filters.machineId = machineId;
            if (dateFilter?.dateFrom) filters.dateFrom = dateFilter.dateFrom;
            if (dateFilter?.dateTo) filters.dateTo = dateFilter.dateTo;
            // Increase limit to get more entries when filtering by date
            if (dateFilter?.dateFrom || dateFilter?.dateTo) {
                filters.limit = 1000;
            }

            const [fetchedMachines, fetchedEntries, fetchedStats] = await Promise.all([
                asuUnit1Api.getAllMachines(),
                asuUnit1Api.getProductionEntries(filters),
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
            initialLoadComplete.current = true;
        } catch (err: any) {
            console.error('Error loading production data:', err);
            setError(err.message || 'Failed to load data');
            toast.error('Failed to load production data');
        } finally {
            setLoading(false);
        }
    }, []);

    // OPTIMISTIC UPDATE for adding entries - instant UI feedback
    const addEntry = useCallback(async (data: any, machineId?: number) => {
        // Create optimistic entry for immediate UI update
        const optimisticId = Date.now();
        const machine = machines.find(m => m.id === data.machineId);
        const productionAt100 = machine?.productionAt100 ? Number(machine.productionAt100) : 400;
        const total = (Number(data.dayShift) || 0) + (Number(data.nightShift) || 0);
        
        const optimisticEntry: ASUProductionEntry = {
            id: optimisticId,
            machineId: data.machineId,
            machineNumber: machine?.machineNo ? Number(machine.machineNo) : 0,
            date: data.date,
            dayShift: Number(data.dayShift) || 0,
            nightShift: Number(data.nightShift) || 0,
            total,
            percentage: productionAt100 > 0 ? (total / productionAt100) * 100 : 0,
            yarnType: data.yarnType || machine?.yarnType || 'Cotton',
            productionAt100,
            machine,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Immediately add to UI (optimistic update)
        setProductionEntries(prev => [optimisticEntry, ...prev]);
        
        // Update stats optimistically
        setStats(prev => prev ? {
            ...prev,
            todayEntries: prev.todayEntries + 1
        } : null);

        // Show success toast IMMEDIATELY (optimistic)
        toast.success('Entry added!');

        try {
            await asuUnit1Api.createProductionEntry(data);
            
            // Silently reload data to get actual IDs from server (no loading state)
            loadData(machineId);
            return true;
        } catch (err: any) {
            console.error('Error adding entry:', err);
            // Rollback optimistic update on error
            setProductionEntries(prev => prev.filter(e => e.id !== optimisticId));
            setStats(prev => prev ? {
                ...prev,
                todayEntries: Math.max(0, prev.todayEntries - 1)
            } : null);
            toast.error(err.message || 'Failed to add entry - rolled back');
            return false;
        }
    }, [machines, loadData]);

    // OPTIMISTIC UPDATE for updating entries
    const updateEntry = useCallback(async (id: number, data: any, machineId?: number) => {
        // Store original entry for potential rollback
        const originalEntry = productionEntries.find(e => e.id === id);
        if (!originalEntry) {
            toast.error('Entry not found');
            return false;
        }

        // Calculate new values
        const dayShift = Number(data.dayShift) || 0;
        const nightShift = Number(data.nightShift) || 0;
        const total = dayShift + nightShift;
        const productionAt100 = originalEntry.productionAt100 || 400;

        // Create optimistically updated entry
        const optimisticEntry: ASUProductionEntry = {
            ...originalEntry,
            dayShift,
            nightShift,
            total,
            percentage: productionAt100 > 0 ? (total / productionAt100) * 100 : 0,
            updatedAt: new Date().toISOString(),
        };

        // Update UI immediately
        setProductionEntries(prev => 
            prev.map(e => e.id === id ? optimisticEntry : e)
        );

        // Show success toast IMMEDIATELY (optimistic)
        toast.success('Entry updated!');

        try {
            // Pass the existing entry data to skip the GET call (ultra fast!)
            await asuUnit1Api.updateProductionEntry(id, data, {
                machineNumber: originalEntry.machineNumber || originalEntry.machineId,
                machineId: originalEntry.machineId,
                date: originalEntry.date,
                dayShift: originalEntry.dayShift,
                nightShift: originalEntry.nightShift,
                yarnType: originalEntry.yarnType
            });
            return true;
        } catch (err: any) {
            console.error('Error updating entry:', err);
            // Rollback on error
            setProductionEntries(prev => 
                prev.map(e => e.id === id ? originalEntry : e)
            );
            toast.error(err.message || 'Failed to update - rolled back');
            return false;
        }
    }, [productionEntries]);

    // OPTIMISTIC UPDATE for deleting entries
    const deleteEntry = useCallback(async (id: number, machineId?: number) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return false;

        // Store original entry for potential rollback
        const originalEntry = productionEntries.find(e => e.id === id);
        const originalIndex = productionEntries.findIndex(e => e.id === id);

        // Remove from UI immediately (optimistic)
        setProductionEntries(prev => prev.filter(e => e.id !== id));
        
        // Update stats optimistically
        setStats(prev => prev ? {
            ...prev,
            todayEntries: Math.max(0, prev.todayEntries - 1)
        } : null);

        // Show success toast IMMEDIATELY (optimistic)
        toast.success('Entry deleted!');

        try {
            await asuUnit1Api.deleteProductionEntry(id);
            return true;
        } catch (err: any) {
            console.error('Error deleting entry:', err);
            // Rollback on error - restore entry at original position
            if (originalEntry) {
                setProductionEntries(prev => {
                    const newEntries = [...prev];
                    newEntries.splice(originalIndex, 0, originalEntry);
                    return newEntries;
                });
            }
            setStats(prev => prev ? {
                ...prev,
                todayEntries: prev.todayEntries + 1
            } : null);
            toast.error(err.message || 'Failed to delete - rolled back');
            return false;
        }
    }, [productionEntries]);

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
