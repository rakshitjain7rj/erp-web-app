// This is the fixed structure of the problematic part of the code
  deleteProductionEntry: async (id: number): Promise<void> => {
    try {
      console.log('Frontend: Preparing to delete entry with ID:', id);
      
      // First check if this entry exists in localStorage
      // We need to check all possible machine IDs
      const allStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('local_production_entries_'));
      let foundInLocalStorage = false;
      
      for (const key of allStorageKeys) {
        const localEntries = JSON.parse(localStorage.getItem(key) || '[]');
        const entryIndex = localEntries.findIndex((e: any) => e.id === id);
        
        if (entryIndex >= 0) {
          // Found the entry in localStorage, remove it
          console.log('Found entry to delete in localStorage:', localEntries[entryIndex]);
          localEntries.splice(entryIndex, 1);
          localStorage.setItem(key, JSON.stringify(localEntries));
          console.log('Deleted production entry from localStorage');
          foundInLocalStorage = true;
          return; // Exit after removing from localStorage
        }
      }
      
      // Rest of the function...
      // ...
      
      return deleteResponse.data;
    } catch (error) {
      console.error('Frontend: Error in deleteProductionEntry:', error);
      throw error;
    }
  },

  // Get production statistics
  getProductionStats: async (): Promise<ProductionStats> => {
    // Method implementation
  },
