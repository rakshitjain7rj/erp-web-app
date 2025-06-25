import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Settings, Plus, RefreshCw, Pencil, Trash2, FileDown, Play, Pause, CheckCircle, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import {
  getAllProductionJobs,
  updateJobStatus,
  deleteProductionJob,
  getJobStatusColor,
  getJobPriorityColor,
  isJobOverdue,
  getMachines
} from "../api/productionApi";
import { ProductionJob, Machine } from "../types/production";
import {
  exportTableToExcel,
  exportTableToPDF,
  exportTableToPNG,
} from "../utils/exportUtils";

const formatSafeDate = (dateString: string | null | undefined, fallback: string = "Invalid date"): string => {
  if (!dateString) return fallback;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return format(date, "MMM dd, yyyy");
  } catch {
    return fallback;
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProductionJobs Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-64">
          <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
              <Settings className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-medium">Error Loading Production Jobs</h3>
                <p className="mt-1 text-sm">Please refresh the page or contact support if the issue persists.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 mt-3 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProductionJobs = () => {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ProductionJob[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<ProductionJob | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "overdue" | "high_priority">("all");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const { user } = useAuth();
  const role = user?.role || "storekeeper";
  const canCreateJobs = role === "admin" || role === "manager";
  const canUpdateStatus = role === "admin" || role === "manager";
  const canDeleteJobs = role === "admin";
  const canManageJobs = role === "admin" || role === "manager";

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllProductionJobs();
      setJobs(data.jobs || []);
      toast.success("Production jobs loaded successfully");
    } catch (error: unknown) {
      console.error("Failed to fetch production jobs:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load production jobs";
      toast.error(errorMessage);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const data = await getMachines();
      setMachines(data);
    } catch (error) {
      console.error("Failed to fetch machines:", error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMachines();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    switch (filter) {
      case "pending":
        filtered = jobs.filter(j => j.status === 'pending');
        break;
      case "in_progress":
        filtered = jobs.filter(j => j.status === 'in_progress');
        break;
      case "completed":
        filtered = jobs.filter(j => j.status === 'completed');
        break;
      case "overdue":
        filtered = jobs.filter(j => isJobOverdue(j));
        break;
      case "high_priority":
        filtered = jobs.filter(j => j.priority === 'high');
        break;
    }
    setFilteredJobs(filtered);
  }, [jobs, filter]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setStatusUpdatingId(id);
    try {
      const updated = await updateJobStatus(id, newStatus);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      toast.error(errorMessage);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this production job?")) return;
    setIsDeletingId(id);
    try {
      await deleteProductionJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Job deleted");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete job";
      toast.error(errorMessage);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleExport = (type: "excel" | "pdf" | "png") => {
    if (type === "excel") exportTableToExcel("production-table", `ProductionJobs-${filter}`);
    else if (type === "pdf") exportTableToPDF("production-table", `ProductionJobs-${filter}`);
    else exportTableToPNG("production-table", `ProductionJobs-${filter}`);
  };

  const filterCounts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    overdue: jobs.filter(j => isJobOverdue(j)).length,
    high_priority: jobs.filter(j => j.priority === 'high').length,
  };

  const getRowBackground = (job: ProductionJob): string => {
    if (isJobOverdue(job)) return "bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500";
    if (job.priority === 'high') return "bg-orange-50/50 dark:bg-orange-900/10 border-l-4 border-orange-500";
    return "";
  };

  const getMachineName = (machineId?: number): string => {
    if (!machineId) return "No machine assigned";
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.machineName : `Machine #${machineId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <span className="text-lg">Loading Production Jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-4 transition-colors duration-200 bg-gray-50 dark:bg-gray-900 sm:p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="relative mb-8 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            <div className="relative px-6 py-8 sm:px-8 sm:py-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 shadow-lg bg-white/20 backdrop-blur-sm rounded-xl">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">Production Jobs</h1>
                    <p className="mt-2 text-lg text-blue-100">Comprehensive production job card management system</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg shadow-md bg-white/20 backdrop-blur-sm">
                    <span className="text-sm font-medium text-white">Active Jobs: {jobs.length}</span>
                  </div>
                  {canCreateJobs && (
                    <button 
                      onClick={() => { setJobToEdit(null); setShowCreateForm(true); }}
                      className="flex items-center gap-2 px-4 py-2 text-white transition-all duration-200 border rounded-lg shadow-md bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                    >
                      <Plus className="w-4 h-4" />
                      Create Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="p-4 mb-8 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filterCounts.all}</div>
                  <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Total Jobs</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{filterCounts.pending}</div>
                  <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Pending</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{filterCounts.in_progress}</div>
                  <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">In Progress</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{filterCounts.completed}</div>
                  <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Completed</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{filterCounts.overdue}</div>
                  <div className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Overdue</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Overdue</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-10"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{filterCounts.all}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">All production jobs</p>
                </div>
              </div>
            </div>

            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-10"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                  <Pause className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-yellow-600 uppercase dark:text-yellow-400">Pending Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{filterCounts.pending}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Awaiting start</p>
                </div>
              </div>
            </div>

            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 opacity-10"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{filterCounts.in_progress}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Currently running</p>
                </div>
              </div>
            </div>

            <div className="relative p-6 overflow-hidden transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl dark:bg-gray-800 group hover:shadow-xl">
              <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-10"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-3 shadow-lg bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{filterCounts.completed}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Finished jobs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="p-6 mb-8 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="relative max-w-md">
                  <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="Search jobs by name, party, or order..."
                    className="w-full py-3 pl-10 pr-4 text-sm transition-colors border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:bg-gray-600"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "in_progress", "completed", "overdue", "high_priority"].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType as any)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                      filter === filterType
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {filterType.replace("_", " ").toUpperCase()} ({filterCounts[filterType as keyof typeof filterCounts]})
                  </button>
                ))}
              </div>
              
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-700">
                <button 
                  onClick={() => handleExport("excel")}
                  className="px-3 py-2 text-sm text-gray-600 transition-colors rounded hover:bg-green-100 hover:text-green-700 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                >
                  <FileDown className="w-4 h-4 mr-1" /> Excel
                </button>
                <button 
                  onClick={() => handleExport("pdf")}
                  className="px-3 py-2 text-sm text-gray-600 transition-colors rounded hover:bg-red-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <FileDown className="w-4 h-4 mr-1" /> PDF
                </button>
                <button 
                  onClick={() => handleExport("png")}
                  className="px-3 py-2 text-sm text-gray-600 transition-colors rounded hover:bg-blue-100 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                  <FileDown className="w-4 h-4 mr-1" /> PNG
                </button>
              </div>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table id="production-table" className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Job Details
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Party & Order
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Machine & Quantity
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Settings className="w-12 h-12 text-gray-400" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No production jobs found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {filter === "all" 
                                ? "Get started by creating your first production job." 
                                : `No jobs match the "${filter.replace('_', ' ')}" filter.`
                              }
                            </p>
                            {canCreateJobs && filter === "all" && (
                              <button
                                onClick={() => { setJobToEdit(null); setShowCreateForm(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                              >
                                <Plus className="w-4 h-4" />
                                Create First Job
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${getRowBackground(job)}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {job.jobId}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {job.productName || 'Unnamed Job'}
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobPriorityColor(job.priority)}`}>
                              {job.priority} priority
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {job.partyName || 'No Party'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Order: {job.dyeingOrderId || 'N/A'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getMachineName(job.machineId)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {job.quantity} {job.unit || 'units'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              Start: {formatSafeDate(job.startDate)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Due: {formatSafeDate(job.dueDate)}
                            </div>
                            {isJobOverdue(job) && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-400">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                              {job.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {canUpdateStatus && (
                              <select
                                value={job.status}
                                onChange={(e) => handleStatusUpdate(job.id, e.target.value)}
                                disabled={statusUpdatingId === job.id}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {canManageJobs && (
                              <button
                                onClick={() => { setJobToEdit(job); setShowCreateForm(true); }}
                                className="p-2 text-blue-600 transition-colors hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20"
                                title="Edit Job"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteJobs && (
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                disabled={isDeletingId === job.id}
                                className="p-2 text-red-600 transition-colors hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                                title="Delete Job"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create/Edit Job Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                {jobToEdit ? 'Edit Production Job' : 'Create New Production Job'}
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Production job form will be implemented here.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    toast.success("Job form functionality will be implemented soon!");
                  }}
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProductionJobs;
