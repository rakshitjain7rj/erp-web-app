// Consolidated TypeScript implementation of TotalASUUnit1YarnSummary (migrated from .jsx)
import React, { useState, useEffect } from 'react';
// Debug marker to ensure this TSX file is the one actually loaded at runtime.
// If you don't see this in the browser console, Vite is resolving a stale file/cached module.
console.debug('[TotalASUUnit1YarnSummary.tsx] Loaded TS implementation');
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TotalASUUnit1YarnSummaryProps { days?: number; showRefreshButton?: boolean; compact?: boolean; }

// Minimal local types for fetched entries
interface ProductionEntry { id?: number; yarnType?: string; machine?: { yarnType?: string }; actualProduction?: number | string; shift?: string; date?: string; }

// Custom simple components (kept inline to avoid extra imports churn)
const CardDescription: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
	<p className={`text-sm text-gray-500 dark:text-gray-300 ${className || ''}`}>{children}</p>
);

const TotalASUUnit1YarnSummary: React.FC<TotalASUUnit1YarnSummaryProps> = ({ days = 31, showRefreshButton = false, compact = true }) => {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [yarnTypeBreakdown, setYarnTypeBreakdown] = useState<{ type: string; total: number }[]>([]);
	const [totalProduction, setTotalProduction] = useState(0);
	const [refreshing, setRefreshing] = useState(false);
	const [showAllYarns, setShowAllYarns] = useState(false);

	const todayIso = () => new Date().toISOString().split('T')[0];
	const pastDaysIso = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
	const startOfMonthIso = () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return s.toISOString().split('T')[0]; };

	const [dateFrom, setDateFrom] = useState(pastDaysIso(days));
	const [dateTo, setDateTo] = useState(todayIso());

	const processProductionEntries = (entries: ProductionEntry[]) => {
		try {
			const typeMap = new Map<string, number>();
			let total = 0;
			entries.forEach(entry => {
				const yarnType = entry.yarnType || entry.machine?.yarnType || 'Unknown';
				const actualProduction = parseFloat(String(entry.actualProduction || 0)) || 0;
				typeMap.set(yarnType, (typeMap.get(yarnType) || 0) + actualProduction);
				total += actualProduction;
			});
			const typeBreakdown = Array.from(typeMap.entries()).map(([type, total]) => ({ type, total })).sort((a, b) => b.total - a.total);
			setYarnTypeBreakdown(typeBreakdown); setTotalProduction(total);
			setError(typeBreakdown.length ? null : 'No ASU Unit 1 production data for selected period');
		} catch (e) {
			console.error(e); setError('Error processing ASU Unit 1 data');
		}
	};

	const generateMockData = (n: number) => {
		const yarnTypes = ['Cotton', 'Polyester', 'Cotton/Polyester Blend', 'Viscose', 'Modal', 'Bamboo'];
		const out: ProductionEntry[] = [];
		for (let i = 0; i < n; i++) {
			const date = new Date(); date.setDate(date.getDate() - i); const dateStr = date.toISOString().split('T')[0];
			const count = 1 + Math.floor(Math.random() * 3);
			const shuffled = [...yarnTypes].sort(() => 0.5 - Math.random());
			for (let j = 0; j < count; j++) out.push({ date: dateStr, yarnType: shuffled[j], actualProduction: 20 + Math.floor(Math.random() * 150) });
		}
		return out;
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const from = dateFrom || pastDaysIso(days); const to = dateTo || todayIso();
			const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
			const apiEndpoint = `${baseUrl}/asu-unit1/production-entries`;
			const token = user?.token; const headers = token ? { Authorization: `Bearer ${token}` } : {};
			const response = await axios.get(apiEndpoint, { params: { dateFrom: from, dateTo: to, limit: 1000 }, headers });
			if (response.data?.success && response.data.data?.items) {
				processProductionEntries(response.data.data.items as ProductionEntry[]);
			} else { throw new Error('Invalid data format'); }
		} catch (err) {
			console.error('Fetch error, using mock data', err); setError('Using mock data'); processProductionEntries(generateMockData(days));
		} finally { setLoading(false); setRefreshing(false); }
	};

	useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

	const handleRefresh = () => { setRefreshing(true); fetchData(); };

	if (loading) return <Card className="w-full"><CardHeader><CardTitle>ASU Unit 1 Yarn Production (Last {days} Days)</CardTitle><CardDescription>Loading…</CardDescription></CardHeader><CardContent><div className="h-24 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" /></CardContent></Card>;

	if (error && yarnTypeBreakdown.length === 0) return <Card className="w-full border border-red-300 dark:border-red-700"><CardHeader><CardTitle>ASU Unit 1 Yarn Production</CardTitle><CardDescription className="text-red-500">{error}</CardDescription></CardHeader><CardContent>No data.</CardContent></Card>;

	// Adjusted density for balanced compactness (optimize vertical space)
	const density = compact ? 'py-2.5 px-2 text-sm md:text-base' : 'py-3 px-3 text-base';
	return (
		<Card className="w-full bg-gray-50/70 dark:bg-gray-950/60 border-gray-200 dark:border-gray-700">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-4 flex-wrap">
					<div>
						<CardTitle className="text-xl font-bold">ASU Unit 1 Yarn Production</CardTitle>
						<CardDescription>Total Production: <span className="font-semibold text-green-600 dark:text-green-400">{totalProduction.toLocaleString()} kg</span>{error && <span className="ml-2 text-xs text-yellow-600">({error})</span>}</CardDescription>
					</div>
					{showRefreshButton && (
						<button onClick={handleRefresh} disabled={refreshing} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-60">{refreshing ? 'Refreshing…' : 'Refresh'}</button>
					)}
				</div>
				<div className="flex items-end gap-3 flex-wrap mt-4">
					<div>
						<div className="text-xs mb-1">From</div>
						<input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white/90 dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
					</div>
						<div>
						<div className="text-xs mb-1">To</div>
						<input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white/90 dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
					</div>
					<div className="flex gap-2">
						<button onClick={fetchData} className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors">Apply</button>
						<button onClick={() => { setDateFrom(startOfMonthIso()); setDateTo(todayIso()); setTimeout(fetchData, 0); }} className="px-3 py-1.5 rounded text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 transition-colors">This Month</button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0 space-y-4">
				{/* Compact stats bar */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs md:text-sm">
					<div className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-100/70 dark:bg-gray-800/40"><div className="text-gray-600 dark:text-gray-400 text-[11px] uppercase tracking-wide">Total</div><div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{totalProduction.toLocaleString()} kg</div></div>
					<div className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-100/70 dark:bg-gray-800/40"><div className="text-gray-600 dark:text-gray-400 text-[11px] uppercase tracking-wide">Types</div><div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{yarnTypeBreakdown.length}</div></div>
					<div className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-100/70 dark:bg-gray-800/40"><div className="text-gray-600 dark:text-gray-400 text-[11px] uppercase tracking-wide">Top</div><div className="mt-0.5 font-medium truncate text-gray-900 dark:text-gray-100 text-xs md:text-sm" title={yarnTypeBreakdown[0]?.type}>{yarnTypeBreakdown[0]?.type || '—'}</div></div>
					<div className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-100/70 dark:bg-gray-800/40"><div className="text-gray-600 dark:text-gray-400 text-[11px] uppercase tracking-wide">Avg/Day</div><div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base">{days ? Math.round(totalProduction / days) : 0} kg</div></div>
				</div>

				{/* Scrollable table wrapper */}
				<div className={`border border-gray-200 dark:border-gray-700 rounded ${compact ? 'shadow-sm' : ''} max-h-[520px] overflow-auto bg-gray-50/70 dark:bg-gray-900/30`}> 
					<table className={`w-full ${compact ? 'text-[11px] md:text-xs' : 'text-sm'} border-collapse`}> 
						<thead className="sticky top-0 z-10 bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur text-gray-800 dark:text-gray-200 shadow-sm">
							<tr><th className={`${density} text-left font-medium w-1/2`}>Yarn Type</th><th className={`${density} text-right font-medium whitespace-nowrap`}>Total (kg)</th><th className={`${density} text-right font-medium`}>Share</th></tr>
						</thead>
						<tbody className="bg-gray-50/40 dark:bg-gray-900/10">
							{(showAllYarns ? yarnTypeBreakdown : yarnTypeBreakdown.slice(0, 50)).map((item, idx) => {
								const pct = totalProduction ? (item.total / totalProduction) * 100 : 0;
								return (
									<tr
										key={item.type}
										className={`border-t border-gray-100 dark:border-gray-800 ${idx % 2 ? 'bg-gray-100/60 dark:bg-gray-800/30' : ''} hover:bg-gray-200/80 dark:hover:bg-gray-800/60 transition-colors`}
										style={{ height: '3.2rem' }}
									>
										<td className={`${density} pr-2 font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap`}>{item.type}</td>
										<td className={`${density} pl-2 pr-2 text-right tabular-nums text-gray-900 dark:text-gray-100 whitespace-nowrap`} style={{ minWidth: '80px' }}>{item.total.toFixed(2)}</td>
										<td className={`${density} pl-2 text-right text-gray-600 dark:text-gray-300 tabular-nums whitespace-nowrap`} style={{ minWidth: '60px' }}>{Math.round(pct)}%</td>
									</tr>
								);
							})}
							{!yarnTypeBreakdown.length && <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">No data</td></tr>}
						</tbody>
					</table>
				</div>

				{/* Toggle & info row */}
				<div className="flex items-center justify-between pt-1">
					{yarnTypeBreakdown.length > 12 && (
						<button onClick={() => setShowAllYarns(v => !v)} className="text-xs px-2 py-1 border rounded hover:bg-white dark:hover:bg-gray-700 transition-colors">
							{showAllYarns ? 'Show fewer' : `Show all (${yarnTypeBreakdown.length})`}
						</button>
					)}
					<span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 ml-auto">Showing {Math.min(yarnTypeBreakdown.length, showAllYarns ? yarnTypeBreakdown.length : 50)} of {yarnTypeBreakdown.length}</span>
				</div>
			</CardContent>
		</Card>
	);
};

export default TotalASUUnit1YarnSummary;
