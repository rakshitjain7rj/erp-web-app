import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Settings, Plus, Pencil, Trash2, FileDown, Play, Pause, CheckCircle, Search, X, ChevronLeft, ChevronRight, Clock, Gauge, Target, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllProductionJobs,
  updateJobStatus,
  deleteProductionJob,
  getJobStatusColor,
  getJobPriorityColor,
  isJobOverdue,
  getMachines,
  createDetailedProductionJob
} from "../api/productionApi";
import { ProductionJob, Machine, CreateDetailedJobRequest, TheoreticalEfficiency, DailyUtilityReading } from "../types/production";
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
  
  // Form state for detailed job creation
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState<CreateDetailedJobRequest>({
    productName: '',
    quantity: 0,
    unit: 'kg',
    priority: 'medium',
    theoreticalEfficiency: {
      numberOfThreads: 0,
      yarnWeight10Min: 0,
      idealPerformance12Hours: 0,
      benchmarkEfficiency: 85,
      machineSpeed: 0
    },
    qualityTargets: {
      targetYarnCount: '',
      minStrength: 0,
      maxUnevenness: 0,
      maxHairiness: 0
    },
    shiftAssignments: [
      { shift: 'A' },
      { shift: 'B' },
      { shift: 'C' }
    ]
  });

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

  // Form handling functions
  const resetForm = () => {
    setFormStep(1);
    setFormData({
      productName: '',
      quantity: 0,
      unit: 'kg',
      priority: 'medium',
      theoreticalEfficiency: {
        numberOfThreads: 0,
        yarnWeight10Min: 0,
        idealPerformance12Hours: 0,
        benchmarkEfficiency: 85,
        machineSpeed: 0
      },
      qualityTargets: {
        targetYarnCount: '',
        minStrength: 0,
        maxUnevenness: 0,
        maxHairiness: 0
      },
      shiftAssignments: [
        { shift: 'A' },
        { shift: 'B' },
        { shift: 'C' }
      ]
    });
  };
  const handleFormSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.productName || !formData.quantity) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Create the detailed job using the comprehensive API
      await createDetailedProductionJob(formData);
      toast.success("Production job created successfully!");
      setShowCreateForm(false);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error("Failed to create production job");
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedFormData = (parentField: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof CreateDetailedJobRequest],
        [field]: value
      }
    }));
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
                    onClick={() => setFilter(filterType as typeof filter)}
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
        </div>        {/* Create/Edit Job Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {jobToEdit ? 'Edit Production Job' : 'Create New Production Job'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Step {formStep} of 4 - Comprehensive job card creation
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowCreateForm(false); resetForm(); }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  {['Basic Info', 'Machine Setup', 'Quality & Efficiency', 'Shift Planning'].map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        formStep > index + 1 ? 'bg-green-600 text-white' :
                        formStep === index + 1 ? 'bg-blue-600 text-white' :
                        'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {formStep > index + 1 ? '✓' : index + 1}
                      </div>
                      <span className={`ml-2 text-sm ${
                        formStep === index + 1 ? 'text-blue-600 font-medium dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {step}
                      </span>
                      {index < 3 && (
                        <div className={`w-12 h-0.5 mx-4 ${
                          formStep > index + 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {formStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Basic Job Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={formData.productName}
                          onChange={(e) => updateFormData('productName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., Cotton Yarn 20s"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Party Name
                        </label>
                        <input
                          type="text"
                          value={formData.partyName || ''}
                          onChange={(e) => updateFormData('partyName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., ABC Textiles"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Target Quantity *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => updateFormData('quantity', parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="500"
                          />
                          <select
                            value={formData.unit}
                            onChange={(e) => updateFormData('unit', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="kg">kg</option>
                            <option value="meters">meters</option>
                            <option value="units">units</option>
                            <option value="bales">bales</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => updateFormData('priority', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Machine Assignment
                        </label>
                        <select
                          value={formData.machineId || ''}
                          onChange={(e) => updateFormData('machineId', parseInt(e.target.value) || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select Machine</option>
                          {machines.map(machine => (
                            <option key={machine.id} value={machine.id}>
                              {machine.machineName} ({machine.machineType})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate || ''}
                          onChange={(e) => updateFormData('dueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Notes
                      </label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => updateFormData('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Additional notes or special instructions..."
                      />
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-blue-600" />
                      Machine Setup & Theoretical Parameters
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Number of Threads *
                        </label>
                        <input
                          type="number"
                          value={formData.theoreticalEfficiency.numberOfThreads}
                          onChange={(e) => updateNestedFormData('theoreticalEfficiency', 'numberOfThreads', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 144"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Machine Speed (RPM/m/min) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.theoreticalEfficiency.machineSpeed}
                          onChange={(e) => updateNestedFormData('theoreticalEfficiency', 'machineSpeed', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 1200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Yarn Weight (10 min) - kg *
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData.theoreticalEfficiency.yarnWeight10Min}
                          onChange={(e) => updateNestedFormData('theoreticalEfficiency', 'yarnWeight10Min', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 0.125"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ideal Performance (12 hrs) - kg *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.theoreticalEfficiency.idealPerformance12Hours}
                          onChange={(e) => updateNestedFormData('theoreticalEfficiency', 'idealPerformance12Hours', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 90"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Benchmark Efficiency (%) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.theoreticalEfficiency.benchmarkEfficiency}
                          onChange={(e) => updateNestedFormData('theoreticalEfficiency', 'benchmarkEfficiency', parseFloat(e.target.value) || 85)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="85"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Calculated Metrics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Hourly Target:</span>
                          <span className="ml-2 font-medium">{(formData.theoreticalEfficiency.idealPerformance12Hours / 12).toFixed(2)} kg/hr</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Benchmark Target:</span>
                          <span className="ml-2 font-medium">{((formData.theoreticalEfficiency.idealPerformance12Hours * formData.theoreticalEfficiency.benchmarkEfficiency) / 100 / 12).toFixed(2)} kg/hr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Quality Parameters & Targets
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Target Yarn Count
                        </label>
                        <input
                          type="text"
                          value={formData.qualityTargets?.targetYarnCount || ''}
                          onChange={(e) => updateNestedFormData('qualityTargets', 'targetYarnCount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 20s, 30s, 40s"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Minimum Strength (gf/tex)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.qualityTargets?.minStrength || ''}
                          onChange={(e) => updateNestedFormData('qualityTargets', 'minStrength', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 15.5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Unevenness (CV%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.qualityTargets?.maxUnevenness || ''}
                          onChange={(e) => updateNestedFormData('qualityTargets', 'maxUnevenness', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 12.5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Hairiness Index
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.qualityTargets?.maxHairiness || ''}
                          onChange={(e) => updateNestedFormData('qualityTargets', 'maxHairiness', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="e.g., 5.2"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Initial Utility Readings (8:00 AM)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Electricity (kWh)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Current reading"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gas (m³)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Current reading"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Water (L)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Current reading"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Steam (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Current reading"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Shift Planning & Assignments
                    </h3>
                    
                    {formData.shiftAssignments?.map((shift, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Shift {shift.shift} ({shift.shift === 'A' ? '6AM - 2PM' : shift.shift === 'B' ? '2PM - 10PM' : '10PM - 6AM'})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Supervisor
                            </label>
                            <input
                              type="text"
                              value={shift.supervisor || ''}
                              onChange={(e) => {
                                const newShifts = [...(formData.shiftAssignments || [])];
                                newShifts[index] = { ...newShifts[index], supervisor: e.target.value };
                                updateFormData('shiftAssignments', newShifts);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="Supervisor name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Operators (comma separated)
                            </label>
                            <input
                              type="text"
                              value={shift.operators?.join(', ') || ''}
                              onChange={(e) => {
                                const newShifts = [...(formData.shiftAssignments || [])];
                                newShifts[index] = { ...newShifts[index], operators: e.target.value.split(',').map(s => s.trim()).filter(s => s) };
                                updateFormData('shiftAssignments', newShifts);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="Operator1, Operator2, Operator3"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Job Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Product:</span>
                          <span className="ml-2 font-medium">{formData.productName || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                          <span className="ml-2 font-medium">{formData.quantity} {formData.unit}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Machine:</span>
                          <span className="ml-2 font-medium">{machines.find(m => m.id === formData.machineId)?.machineName || 'Not assigned'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Target Efficiency:</span>
                          <span className="ml-2 font-medium">{formData.theoreticalEfficiency.benchmarkEfficiency}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex gap-3">
                  {formStep > 1 && (
                    <button
                      onClick={() => setFormStep(formStep - 1)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCreateForm(false); resetForm(); }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  
                  {formStep < 4 ? (
                    <button
                      onClick={() => setFormStep(formStep + 1)}
                      className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFormSubmit}
                      className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Create Job Card
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProductionJobs;
