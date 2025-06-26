import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { productionApi } from '../api/productionApi';
import {
  ProductionJob,
  ProductionJobFilters,
  ProductionJobStats,
  YarnProductionJobCard
} from '../types/production';
import YarnJobCardForm from '../components/YarnJobCardForm';

const ProductionJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [stats, setStats] = useState<ProductionJobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState<ProductionJobFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showYarnJobForm, setShowYarnJobForm] = useState(false);

  const reloadData = async () => {
    try {
      const [jobsResponse, statsResponse] = await Promise.all([
        productionApi.getAll({ ...filters, search: searchTerm }, currentPage, 20),
        productionApi.getStats(filters)
      ]);
      
      if (jobsResponse.success && jobsResponse.data) {
        setJobs(jobsResponse.data.data || []);
        setTotalPages(jobsResponse.data.totalPages || 1);
      } else {
        setJobs([]);
      }
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error('Error reloading data:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productionApi.getAll(
          { ...filters, search: searchTerm },
          currentPage,
          20
        );
        
        console.log('Production API Response:', response); // Debug log
        console.log('Response success:', response.success);
        console.log('Response data:', response.data);
        console.log('Response data.data:', response.data?.data);
        console.log('Is data.data an array?', Array.isArray(response.data?.data));
        
        if (response.success && response.data && response.data.data) {
          // Ensure we have an array
          const jobsData = Array.isArray(response.data.data) ? response.data.data : [];
          console.log('Setting jobs to:', jobsData);
          setJobs(jobsData);
          setTotalPages(response.data.totalPages || 1);
        } else if (response.success && response.data && Array.isArray(response.data)) {
          // Handle case where data is directly an array
          console.log('Setting jobs to direct array:', response.data);
          setJobs(response.data);
        } else {
          console.error('Invalid API response structure:', response);
          setJobs([]); // Ensure jobs is always an array
          setError(response.error || 'Failed to load production jobs');
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Error loading production jobs');
        setJobs([]); // Ensure jobs is always an array
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await productionApi.getStats(filters);
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          console.error('Failed to load stats:', response.error);
          // Set default stats if API fails
          setStats({
            totalJobs: 0,
            activeJobs: 0,
            completedJobs: 0,
            pendingJobs: 0,
            averageEfficiency: 0,
            totalDowntime: 0
          });
        }
      } catch (err) {
        console.error('Error loading stats:', err);
        // Set default stats if API fails
        setStats({
          totalJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          pendingJobs: 0,
          averageEfficiency: 0,
          totalDowntime: 0
        });
      }
    };

    fetchData();
    fetchStats();
  }, [filters, searchTerm, currentPage]);

  const handleYarnJobSubmit = async (jobData: YarnProductionJobCard) => {
    try {
      // Transform YarnProductionJobCard to ProductionJobFormData
      const formData = {
        productName: jobData.productType,
        productType: jobData.productType,
        quantity: jobData.quantity,
        unit: jobData.unit,
        machineId: jobData.machineId,
        assignedTo: jobData.workerId,
        priority: jobData.priority,
        dueDate: jobData.dueDate,
        estimatedHours: jobData.estimatedHours,
        partyName: jobData.partyName,
        dyeingOrderId: jobData.dyeingOrderId,
        notes: jobData.notes,
        // Map yarn-specific data to detailed job card fields
        theoreticalEfficiency: jobData.theoreticalParams ? {
          targetEfficiencyPercent: jobData.theoreticalParams.benchmarkEfficiency,
          standardProductionRate: jobData.theoreticalParams.theoreticalHourlyRate,
          idealCycleTime: 60, // Default value
          qualityTargetPercent: 95 // Default value
        } : undefined,
        shiftAssignments: jobData.shiftData ? [{
          shiftNumber: jobData.shiftData.shift === 'A' ? 1 : jobData.shiftData.shift === 'B' ? 2 : 3,
          startTime: jobData.shiftData.startTime,
          endTime: jobData.shiftData.endTime,
          supervisorName: jobData.shiftData.supervisor,
          operatorName: jobData.shiftData.operators[0] || ''
        }] : [],
        initialUtilityReadings: jobData.utilityReadings?.[0] ? {
          timestamp: jobData.utilityReadings[0].timestamp,
          powerConsumption: jobData.utilityReadings[0].electricity,
          waterConsumption: jobData.utilityReadings[0].water,
          steamConsumption: jobData.utilityReadings[0].steam
        } : undefined,
        processParameters: jobData.theoreticalParams ? {
          numberOfThreads: jobData.theoreticalParams.numberOfThreads.toString(),
          machineSpeed: jobData.theoreticalParams.machineSpeed.toString(),
          yarnWeight10Min: jobData.theoreticalParams.yarnWeight10Min.toString(),
          ideal12HourTarget: jobData.theoreticalParams.ideal12HourTarget.toString()
        } : undefined
      };

      const response = await productionApi.createDetailed(formData);
      if (response.success) {
        setShowYarnJobForm(false);
        reloadData();
      } else {
        setError(response.error || 'Failed to create yarn job card');
      }
    } catch (err) {
      setError('Error creating yarn job card');
      console.error('Error:', err);
    }
  };

  const handleStartJob = async (jobId: number) => {
    try {
      const response = await productionApi.start(jobId);
      if (response.success) {
        reloadData();
      } else {
        setError(response.error || 'Failed to start job');
      }
    } catch (err) {
      setError('Error starting job');
      console.error('Error:', err);
    }
  };

  const handleCompleteJob = async (jobId: number) => {
    try {
      const response = await productionApi.complete(jobId);
      if (response.success) {
        reloadData();
      } else {
        setError(response.error || 'Failed to complete job');
      }
    } catch (err) {
      setError('Error completing job');
      console.error('Error:', err);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this production job?')) return;
    
    try {
      const response = await productionApi.delete(jobId);
      if (response.success) {
        reloadData();
      } else {
        setError(response.error || 'Failed to delete job');
      }
    } catch (err) {
      setError('Error deleting job');
      console.error('Error:', err);
    }
  };

  const getStatusColor = (status: ProductionJob['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: ProductionJob['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Production Job Cards</h1>
              <p className="text-blue-100 mt-1">Manage and track production jobs</p>
            </div>
            <button
              onClick={() => setShowYarnJobForm(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Yarn Job Card
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingJobs || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeJobs || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedJobs || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageEfficiency ? stats.averageEfficiency.toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by job ID, product type, or party name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Jobs Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading production jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No production jobs found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first production job.</p>
              <p className="text-xs text-gray-400 mb-4">Debug: Jobs array length: {jobs.length}, Jobs: {JSON.stringify(jobs)}</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Production Job
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(Array.isArray(jobs) ? jobs : []).map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.jobId}</div>
                          <div className="text-sm text-gray-500">{job.partyName || 'No party assigned'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.productType}</div>
                          <div className="text-sm text-gray-500">{job.quantity} {job.unit}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.machine?.name || `Machine ${job.machineId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <br />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                            {job.priority.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(job.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {job.status === 'pending' && (
                            <button
                              onClick={() => handleStartJob(job.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Start Job"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          
                          {job.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteJob(job.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Complete Job"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => navigate(`/production-jobs/${job.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => navigate(`/production-jobs/${job.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Job"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Job"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Yarn Job Card Form Modal */}
      {showYarnJobForm && (
        <YarnJobCardForm
          isOpen={showYarnJobForm}
          onClose={() => setShowYarnJobForm(false)}
          onSave={handleYarnJobSubmit}
          editingJob={null}
        />
      )}

      {/* Create Job Modal Placeholder */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Production Job</h3>
              <p className="text-gray-500 mb-4">Production job creation form will be implemented here.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  Create Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionJobs;
