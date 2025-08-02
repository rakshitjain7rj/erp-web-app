// Custom hook for managing dyeing firm persistence
import { useState, useEffect, useCallback } from 'react';
import { getAllDyeingFirms, findOrCreateDyeingFirm, DyeingFirm } from '../api/dyeingFirmApi';

const LOCALSTORAGE_KEY = 'dyeingFirms';

export const useDyeingFirmPersistence = () => {
  const [dyeingFirms, setDyeingFirms] = useState<DyeingFirm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Save to localStorage whenever dyeingFirms changes
  const saveToLocalStorage = useCallback((firms: DyeingFirm[]) => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(firms));
      console.log('💾 Saved dyeing firms to localStorage:', firms.map(f => f.name));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): DyeingFirm[] => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        const firms = JSON.parse(saved);
        console.log('📋 Loaded dyeing firms from localStorage:', firms.map((f: DyeingFirm) => f.name));
        return firms;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return [];
  }, []);

  // Fetch from API with localStorage fallback
  const fetchDyeingFirms = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Fetching dyeing firms from API...');
      const firms = await getAllDyeingFirms();
      
      if (Array.isArray(firms) && firms.length > 0) {
        const validFirms = firms.filter(firm => firm && firm.name);
        const sortedFirms = validFirms.sort((a, b) => a.name.localeCompare(b.name));
        
        setDyeingFirms(sortedFirms);
        saveToLocalStorage(sortedFirms);
        console.log('✅ Loaded firms from API:', sortedFirms.map(f => f.name));
        return sortedFirms;
      } else {
        throw new Error('No valid firms from API');
      }
    } catch (error) {
      console.warn('⚠️ API failed, trying localStorage:', error);
      
      // Try localStorage backup
      const savedFirms = loadFromLocalStorage();
      if (savedFirms.length > 0) {
        setDyeingFirms(savedFirms);
        return savedFirms;
      }
      
      // Final fallback
      const fallbackFirms = [
        { id: 1, name: "Rainbow Dyers", isActive: true, createdAt: "", updatedAt: "" },
        { id: 2, name: "ColorTech Solutions", isActive: true, createdAt: "", updatedAt: "" },
        { id: 3, name: "Premium Dye Works", isActive: true, createdAt: "", updatedAt: "" }
      ];
      
      setDyeingFirms(fallbackFirms);
      saveToLocalStorage(fallbackFirms);
      console.log('🔧 Using fallback firms:', fallbackFirms.map(f => f.name));
      return fallbackFirms;
    } finally {
      setIsLoading(false);
    }
  }, [saveToLocalStorage, loadFromLocalStorage]);

  // Add new firm with persistence
  const addDyeingFirm = useCallback(async (firmName: string): Promise<DyeingFirm | null> => {
    if (!firmName || firmName.trim() === "") return null;
    
    // Check if firm already exists
    const existingFirm = dyeingFirms.find(firm => 
      firm.name.toLowerCase() === firmName.toLowerCase()
    );
    
    if (existingFirm) {
      console.log('📋 Firm already exists:', existingFirm.name);
      return existingFirm;
    }

    try {
      console.log(`🏭 Creating new dyeing firm: ${firmName}`);
      const response = await findOrCreateDyeingFirm({ name: firmName.trim() });
      const newFirm = response.data;
      
      // Add to state and localStorage
      setDyeingFirms(prev => {
        const updatedFirms = [...prev, newFirm].sort((a, b) => a.name.localeCompare(b.name));
        saveToLocalStorage(updatedFirms);
        return updatedFirms;
      });
      
      console.log(`✅ Firm ${response.created ? 'created' : 'found'}:`, newFirm.name);
      return newFirm;
    } catch (error) {
      console.error('Failed to create firm via API, creating fallback:', error);
      
      // Create fallback firm
      const fallbackFirm: DyeingFirm = {
        id: Date.now(),
        name: firmName.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setDyeingFirms(prev => {
        const updatedFirms = [...prev, fallbackFirm].sort((a, b) => a.name.localeCompare(b.name));
        saveToLocalStorage(updatedFirms);
        return updatedFirms;
      });
      
      console.log('🔧 Created fallback firm:', fallbackFirm.name);
      return fallbackFirm;
    }
  }, [dyeingFirms, saveToLocalStorage]);

  // Initialize on mount
  useEffect(() => {
    fetchDyeingFirms();
  }, [fetchDyeingFirms]);

  return {
    dyeingFirms,
    isLoading,
    fetchDyeingFirms,
    addDyeingFirm,
    saveToLocalStorage
  };
};
