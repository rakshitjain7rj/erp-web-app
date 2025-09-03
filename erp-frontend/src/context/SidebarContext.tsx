import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SidebarContextValue {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false);

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen(o => !o), []);

	// Close on ESC key for accessibility
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false);
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	const value: SidebarContextValue = { isOpen, open, close, toggle };
	return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = (): SidebarContextValue => {
	const ctx = useContext(SidebarContext);
	if (!ctx) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return ctx;
};

export default SidebarProvider;
