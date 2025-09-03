import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export interface SidebarItemProps {
	id: string;
	label: string;
	path: string;
	icon?: React.ReactNode;
	description?: string;
	badge?: string;
	badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
	onClick?: () => void;
}

const badgeStyles: Record<string, string> = {
	primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
	success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
	warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
	danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
	info: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
};

const SidebarItem: React.FC<SidebarItemProps> = ({
	label,
	path,
	icon,
	description,
	badge,
	badgeVariant = 'primary',
	onClick
}) => {
	const navigate = useNavigate();

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		navigate(path);
		onClick?.();
	};

	return (
		<NavLink
			to={path}
			onClick={handleClick}
			className={({ isActive }) => `
				group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer select-none
				transition-all duration-200 ease-out
				${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
			`}
		>
			<span className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">
				{icon}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm truncate">{label}</p>
				{description && (
					<span className="block text-[10px] mt-0.5 text-gray-400 dark:text-gray-500 truncate">
						{description}
					</span>
				)}
			</div>
			{badge && (
				<span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeStyles[badgeVariant]}`}>{badge}</span>
			)}
			<span className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-800 pointer-events-none" />
		</NavLink>
	);
};

export default SidebarItem;
