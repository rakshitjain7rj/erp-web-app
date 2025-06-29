import {
  ProductionJob,
  DetailedProductionJob,
  ProductionJobFormData,
  ProductionJobFilters,
  ProductionJobStats,
  Machine,
  ApiResponse,
  PaginatedResponse
} from '../types/production';

const API_BASE_URL = 'http://localhost:5000/api';

// Utility function to handle nested API response structures
const unwrapNestedResponse = <T>(response: ApiResponse<unknown>): ApiResponse<T> => {
  if (response.success && response.data) {
    // Check if we have a nested structure (data.data contains the actual data)
    if (
      typeof response.data === 'object' && 
      response.data !== null &&
      'data' in response.data
    ) {
      // Return the unwrapped data
      const nestedData = response.data as { data: unknown };
      return {
        success: true,
        data: nestedData.data as T
      };
    }
  }
  
  // If not a nested structure or not successful, return as is
  return response as unknown as ApiResponse<T>;
};

// API utility function
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  console.log(`API call to ${endpoint} with options:`, {
    method: options.method || 'GET',
    hasBody: !!options.body
  });
  
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    if (options.body && typeof options.body === 'string') {
      try {
        // Log parsed body for debugging (avoid sensitive data)
        const parsedBody = JSON.parse(options.body);
        console.log(`Request body for ${endpoint}:`, {
          ...parsedBody,
          // Don't log sensitive fields if any
        });
      } catch (_) {
        console.error('Failed to parse request body for logging');
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`Response status for ${endpoint}:`, response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error(`API error response for ${endpoint}:`, errorData);
      } catch (_) {
        console.error(`Failed to parse error response for ${endpoint}`);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // ✅ Enhanced API response validation
    if (typeof data !== 'object' || data === null) {
      console.error(`API response from ${endpoint} is not an object:`, data);
      return { 
        success: false, 
        error: 'Invalid API response format: Not an object'
      };
    }
    
    // Log detailed response structure for debugging
    console.log(`Success response for ${endpoint}:`, {
      structure: typeof data,
      hasDataProperty: 'data' in data,
      dataType: data.data ? typeof data.data : 'undefined',
      isPaginated: !!(data.data && data.data.data),
      isArray: Array.isArray(data.data),
      isDirectArray: data.data && Array.isArray(data.data),
      success: !!data.success
    });
    
    // All API responses should have success flag
    if (data.success !== true) {
      console.warn(`API response from ${endpoint} missing success flag:`, data);
      // Keep going if data looks valid despite missing success flag
      if (!('data' in data)) {
        console.error(`API response from ${endpoint} has no data property:`, data);
        return { 
          success: false, 
          error: 'Invalid API response format: No data property'
        };
      }
    }

    // Check for paginated data structure and validate it
    if (data.data && typeof data.data === 'object' && 'data' in data.data) {
      const paginatedData = data.data;
      // Check if the nested data array exists
      if (!Array.isArray(paginatedData.data)) {
        console.error(`API response from ${endpoint} has invalid paginated data structure - expected data.data to be an array:`, data);
        console.error(`data.data type: ${typeof paginatedData.data}`);
        return { 
          success: false, 
          error: 'Invalid paginated response format: data.data is not an array'
        };
      }
      
      // Ensure other pagination properties exist
      const missingFields = [];
      if (typeof paginatedData.total !== 'number') missingFields.push('total');
      if (typeof paginatedData.page !== 'number') missingFields.push('page'); 
      if (typeof paginatedData.totalPages !== 'number') missingFields.push('totalPages');
      
      if (missingFields.length > 0) {
        console.warn(`API response from ${endpoint} has incomplete pagination metadata. Missing: ${missingFields.join(', ')}`, paginatedData);
      } else {
        console.log(`Validated paginated response from ${endpoint}: ${paginatedData.data.length} items, page ${paginatedData.page} of ${paginatedData.totalPages}`);
      }
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Production Job API
export const productionApi = {
  // Get all production jobs with filters and pagination
  getAll: async (
    filters: ProductionJobFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<ProductionJob>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    });

    const result = await apiCall<unknown>(`/production?${params}`);
    console.log('Production API getAll response:', result);
    console.log('Raw result.data:', JSON.stringify(result.data, null, 2));
    
    // Add detailed logging for debugging
    if (result.success && result.data) {
      console.log('Response data structure analysis:', {
        dataType: typeof result.data,
        isObject: typeof result.data === 'object',
        isNotNull: result.data !== null,
        hasDataProp: result.data && typeof result.data === 'object' && 'data' in result.data,
        dataValue: result.data && typeof result.data === 'object' && 'data' in result.data ? (result.data as any).data : 'no data prop',
        isDataArray: result.data && typeof result.data === 'object' && 'data' in result.data ? Array.isArray((result.data as any).data) : false,
        fullResponse: JSON.stringify(result.data, null, 2)
      });
    }
    
    // Unwrap the nested response to match our expected type structure
    if (result.success && result.data) {
      // Check if the data structure is paginated with the expected structure
      if (
        typeof result.data === 'object' &&
        result.data !== null &&
        'data' in result.data
      ) {
        const potentialPaginated = result.data as any;
        console.log('Found data property, checking if data.data is array:', {
          hasDataData: 'data' in potentialPaginated,
          dataDataType: typeof potentialPaginated.data,
          isArray: Array.isArray(potentialPaginated.data),
          dataDataValue: potentialPaginated.data,
          dataDataKeys: typeof potentialPaginated.data === 'object' && potentialPaginated.data !== null ? Object.keys(potentialPaginated.data) : 'not an object',
          fullDataStructure: JSON.stringify(potentialPaginated.data).substring(0, 200) + '...',
          potentialPaginatedKeys: Object.keys(potentialPaginated),
          potentialPaginatedStructure: JSON.stringify(potentialPaginated).substring(0, 300) + '...'
        });
        
        // Handle case where data.data might be null or undefined
        if (potentialPaginated.data === null || potentialPaginated.data === undefined) {
          console.warn('data.data is null or undefined, treating as empty array');
          potentialPaginated.data = [];
        }
        
        if (Array.isArray(potentialPaginated.data)) {
          // Case: result.data.data is directly an array
          console.log('Processing direct array in result.data.data');
          const paginated = result.data as {
            data: ProductionJob[];
            total: number;
            page?: number;
            limit?: number;
            totalPages?: number;
          };

          const finalResponse = {
            success: true,
            data: {
              data: paginated.data || [],
              total: typeof paginated.total === 'number' ? paginated.total : (paginated.data || []).length,
              page: typeof paginated.page === 'number' ? paginated.page : page,
              limit: typeof paginated.limit === 'number' ? paginated.limit : limit,
              totalPages: typeof paginated.totalPages === 'number' ? paginated.totalPages : 
                         (typeof paginated.total === 'number' ? Math.ceil(paginated.total / limit) : 1)
            }
          };

          console.log('Final processed response being returned (direct array):', {
            success: finalResponse.success,
            dataLength: finalResponse.data.data.length,
            total: finalResponse.data.total,
            page: finalResponse.data.page,
            firstJob: finalResponse.data.data[0] ? {
              id: finalResponse.data.data[0].id,
              jobId: finalResponse.data.data[0].jobId,
              productType: finalResponse.data.data[0].productType
            } : 'no jobs'
          });

          return finalResponse;
        } else if (
          typeof potentialPaginated.data === 'object' &&
          potentialPaginated.data !== null &&
          'data' in potentialPaginated.data &&
          Array.isArray(potentialPaginated.data.data)
        ) {
          // Case: result.data.data.data is the array (nested pagination structure)
          console.log('Processing nested paginated response format');
          const nestedPaginated = potentialPaginated.data as {
            data: ProductionJob[];
            total: number;
            page?: number;
            limit?: number;
            totalPages?: number;
          };

          const finalResponse = {
            success: true,
            data: {
              data: nestedPaginated.data || [],
              total: typeof nestedPaginated.total === 'number' ? nestedPaginated.total : (nestedPaginated.data || []).length,
              page: typeof nestedPaginated.page === 'number' ? nestedPaginated.page : page,
              limit: typeof nestedPaginated.limit === 'number' ? nestedPaginated.limit : limit,
              totalPages: typeof nestedPaginated.totalPages === 'number' ? nestedPaginated.totalPages : 
                         (typeof nestedPaginated.total === 'number' ? Math.ceil(nestedPaginated.total / limit) : 1)
            }
          };

          console.log('Final processed response being returned (nested):', {
            success: finalResponse.success,
            dataLength: finalResponse.data.data.length,
            total: finalResponse.data.total,
            page: finalResponse.data.page,
            firstJob: finalResponse.data.data[0] ? {
              id: finalResponse.data.data[0].id,
              jobId: finalResponse.data.data[0].jobId,
              productType: finalResponse.data.data[0].productType
            } : 'no jobs'
          });

          return finalResponse;
        }
      } else if (Array.isArray(result.data)) {
        // Handle case where API returns a direct array (not paginated)
        console.log('API returned direct array instead of paginated response');
        return {
          success: true,
          data: {
            data: result.data,
            total: result.data.length,
            page: 1,
            limit: result.data.length,
            totalPages: 1
          }
        };
      } else if (typeof result.data === 'object' && result.data !== null && 'rows' in result.data && Array.isArray((result.data as any).rows)) {
        // Handle legacy format with rows and count
        console.log('Processing legacy response format with rows/count');
        const legacyData = result.data as {
          rows: ProductionJob[];
          count: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
        
        return {
          success: true,
          data: {
            data: legacyData.rows,
            total: typeof legacyData.count === 'number' ? legacyData.count : legacyData.rows.length,
            page: typeof legacyData.page === 'number' ? legacyData.page : page,
            limit: typeof legacyData.limit === 'number' ? legacyData.limit : limit,
            totalPages: typeof legacyData.totalPages === 'number' ? legacyData.totalPages : 
                       (typeof legacyData.count === 'number' ? Math.ceil(legacyData.count / limit) : 1)
          }
        };
      }
      
      // Try to find any array-like data in the response as a fallback
      console.log('Attempting fallback data extraction from response:', result.data);
      let fallbackData: any[] = [];
      
      // Check various possible locations for array data
      if (Array.isArray(result.data)) {
        fallbackData = result.data;
        console.log('Found direct array data');
      } else if (result.data && typeof result.data === 'object') {
        // Look for common array properties
        const possibleArrayKeys = ['data', 'rows', 'items', 'results', 'jobs'];
        for (const key of possibleArrayKeys) {
          if (key in result.data && Array.isArray((result.data as any)[key])) {
            fallbackData = (result.data as any)[key];
            console.log(`Found array data in ${key} property`);
            break;
          }
        }
      }
      
      if (fallbackData.length >= 0) {
        console.log(`Using fallback data extraction: found ${fallbackData.length} items`);
        return {
          success: true,
          data: {
            data: fallbackData,
            total: fallbackData.length,
            page: 1,
            limit: fallbackData.length,
            totalPages: 1
          }
        };
      }
      
      // Invalid data structure
      console.error('Invalid data structure in getAll response - no recoverable data found:', {
        type: typeof result.data,
        isPaginated: typeof result.data === 'object' && result.data !== null && 'data' in result.data,
        isArray: Array.isArray(result.data),
        hasRows: typeof result.data === 'object' && result.data !== null && 'rows' in result.data,
        hasData: typeof result.data === 'object' && result.data !== null && 'data' in result.data,
        keys: typeof result.data === 'object' && result.data !== null ? Object.keys(result.data) : [],
        dataValue: result.data
      });
      
      return {
        success: false,
        error: 'Invalid data structure in API response',
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
    }
    
    // Pass through error responses
    console.error('API call was not successful:', result.error);
    return result as ApiResponse<PaginatedResponse<ProductionJob>>;
  },

  // Get production job by ID
  getById: async (id: number): Promise<ApiResponse<DetailedProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}`);
    return unwrapNestedResponse<DetailedProductionJob>(result);
  },

  // Create new production job
  create: async (jobData: ProductionJobFormData): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>('/production', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },

  // Create detailed production job with all job card data
  createDetailed: async (jobData: ProductionJobFormData): Promise<ApiResponse<DetailedProductionJob>> => {
   
    console.log('Creating detailed production job with data:', {
      productName: jobData.productName,
      productType: jobData.productType,
      quantity: jobData.quantity,
      unit: jobData.unit,
      machineId: jobData.machineId,
      priority: jobData.priority,
      // Don't log entire object which might be large
    });
    
    try {
      const result = await apiCall<unknown>('/production/detailed', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      
      // Use our unwrapping utility and additional validation
      const unwrappedResult = unwrapNestedResponse<DetailedProductionJob>(result);
      console.log('Unwrapped detailed job result:', unwrappedResult);
      if (unwrappedResult.success) {
        // Verify we have a valid job object with ID
        if (unwrappedResult.data && 'id' in unwrappedResult.data) {
          console.log('Job created successfully with ID:', unwrappedResult.data.id);
          return unwrappedResult;
        }
        
        console.warn('Response does not contain a valid job object with ID:', unwrappedResult.data);
        return {
          success: false,
          error: 'Invalid job data returned from server'
        };
      } else {
        console.error('Failed to create job:', unwrappedResult.error);
        return unwrappedResult;
      }
    } catch (error) {
      console.error('Exception in createDetailed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating job'
      };
    }
  },

  // Update production job
  update: async (id: number, jobData: Partial<ProductionJobFormData>): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },

  // Update job status
  updateStatus: async (id: number, status: ProductionJob['status']): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },

  // Start production job
  start: async (id: number): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}/start`, {
      method: 'POST',
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },

  // Complete production job
  complete: async (id: number, completionData?: {
    actualHours?: number;
    finalUtilityReadings?: Record<string, string | number>;
    qualityControlData?: Record<string, string | number>;
    notes?: string;
  }): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData || {}),
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },

  // Delete production job
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const result = await apiCall<unknown>(`/production/${id}`, {
      method: 'DELETE',
    });
    // For DELETE operations, we typically don't need to unwrap the data
    // but we should still handle success/error properly
    return {
      success: result.success,
      error: result.error
    };
  },

  // Get production job statistics
  getStats: async (filters: ProductionJobFilters = {}): Promise<ApiResponse<ProductionJobStats>> => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
      )
    );
    
    const result = await apiCall<unknown>(`/production/stats?${params}`);
    return unwrapNestedResponse<ProductionJobStats>(result);
  },

  // Add hourly efficiency entry
  addHourlyEfficiency: async (id: number, efficiencyData: {
    hour: number;
    actualProduction: number;
    targetProduction: number;
    downtimeMinutes?: number;
    qualityIssues?: number;
    notes?: string;
  }): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}/efficiency`, {
      method: 'POST',
      body: JSON.stringify(efficiencyData),
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },

  // Add utility reading
  addUtilityReading: async (id: number, readingData: {
    timestamp?: string;
    steamPressure?: number;
    waterTemperature?: number;
    powerConsumption?: number;
    gasConsumption?: number;
    steamConsumption?: number;
    waterConsumption?: number;
  }): Promise<ApiResponse<ProductionJob>> => {
    const result = await apiCall<unknown>(`/production/${id}/utility-reading`, {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...readingData,
      }),
    });
    return unwrapNestedResponse<ProductionJob>(result);
  },
};

// Machine API
export const machineApi = {
  // Get all machines
  getAll: async (): Promise<ApiResponse<Machine[]>> => {
    const result = await apiCall<unknown>('/production/machines');
    return unwrapNestedResponse<Machine[]>(result);
  },

  // Get machine by ID
  getById: async (id: number): Promise<ApiResponse<Machine>> => {
    const result = await apiCall<unknown>(`/production/machines/${id}`);
    return unwrapNestedResponse<Machine>(result);
  },

  // Create new machine
  create: async (machineData: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Machine>> => {
    const result = await apiCall<unknown>('/production/machines', {
      method: 'POST',
      body: JSON.stringify(machineData),
    });
    return unwrapNestedResponse<Machine>(result);
  },

  // Update machine
  update: async (id: number, machineData: Partial<Machine>): Promise<ApiResponse<Machine>> => {
    const result = await apiCall<unknown>(`/production/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(machineData),
    });
    return unwrapNestedResponse<Machine>(result);
  },

  // Delete machine
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const result = await apiCall<unknown>(`/production/machines/${id}`, {
      method: 'DELETE',
    });
    return {
      success: result.success,
      error: result.error
    };
  },

  // Get machines by type
  getByType: async (type: Machine['type']): Promise<ApiResponse<Machine[]>> => {
    const result = await apiCall<unknown>(`/production/machines/type/${type}`);
    return unwrapNestedResponse<Machine[]>(result);
  },

  // Get active machines
  getActive: async (): Promise<ApiResponse<Machine[]>> => {
    const result = await apiCall<unknown>('/production/machines/active');
    return unwrapNestedResponse<Machine[]>(result);
  },
};

// Export default
export default {
  production: productionApi,
  machines: machineApi,
};
