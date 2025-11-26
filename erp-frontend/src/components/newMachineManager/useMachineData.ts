// useMachineData.ts - Simplified hook for machine config updates only
// Machines 1-9 are pre-seeded in database, no add/delete needed
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { asuUnit1Api, ASUMachine, invalidateMachinesCache } from '../../api/asuUnit1Api';

export interface UseMachineDataReturn {
  machines: ASUMachine[];
  loading: boolean;
  error: string | null;
  loadMachines: () => Promise<void>;
  updateMachine: (id: number, data: Partial<ASUMachine>) => Promise<boolean>;
}

export const useMachineData = (): UseMachineDataReturn => {
  const [machines, setMachines] = useState<ASUMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all machines
  const loadMachines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedMachines = await asuUnit1Api.getAllMachines();
      // Sort by machineNo for consistent display
      const sorted = (fetchedMachines || []).sort((a, b) => 
        (Number(a.machineNo) || 0) - (Number(b.machineNo) || 0)
      );
      setMachines(sorted);
    } catch (err: any) {
      console.error('Error loading machines:', err);
      setError(err.message || 'Failed to load machines');
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  }, []);

  // OPTIMISTIC UPDATE - instant UI feedback
  const updateMachine = useCallback(async (id: number, data: Partial<ASUMachine>): Promise<boolean> => {
    // Store original for rollback
    const originalMachine = machines.find(m => m.id === id);
    if (!originalMachine) {
      toast.error('Machine not found');
      return false;
    }

    // Create optimistic update
    const updatedMachine: ASUMachine = {
      ...originalMachine,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Update UI immediately
    setMachines(prev => prev.map(m => m.id === id ? updatedMachine : m));

    // Show success toast IMMEDIATELY (optimistic)
    toast.success('Machine updated!');

    try {
      await asuUnit1Api.updateMachine(id, {
        machineNo: data.machineNo !== undefined ? Number(data.machineNo) : undefined,
        machine_name: data.machineName,
        count: data.count,
        spindles: data.spindles ?? 0,
        speed: data.speed ?? 0,
        yarnType: data.yarnType,
        isActive: data.isActive,
        productionAt100: data.productionAt100,
      });
      invalidateMachinesCache();
      return true;
    } catch (err: any) {
      console.error('Error updating machine:', err);
      // Rollback
      setMachines(prev => prev.map(m => m.id === id ? originalMachine : m));
      toast.error(err.message || 'Update failed - rolled back');
      return false;
    }
  }, [machines]);

  // Initial load
  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  return {
    machines,
    loading,
    error,
    loadMachines,
    updateMachine,
  };
};
