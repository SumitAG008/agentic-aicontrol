import axios, { AxiosInstance } from 'axios';

export interface SFAuthConfig {
  instanceUrl: string;
  companyId: string;
  username: string;
  password: string;
  apiKey?: string;
}

export interface CompensationWorksheet {
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  currentSalary: number;
  proposedSalary: number;
  salaryIncrease: number;
  increasePercentage: number;
  effectiveDate: string;
  currency: string;
  department: string;
  jobTitle: string;
  customFields?: Record<string, any>;
}

export interface SFQueryOptions {
  filter?: string;
  select?: string[];
  expand?: string[];
  top?: number;
  skip?: number;
}

/**
 * SAP SuccessFactors OData API Client
 * Handles GET operations for compensation data retrieval
 */
export class SuccessFactorsAPIClient {
  private client: AxiosInstance;
  private config: SFAuthConfig;

  constructor(config: SFAuthConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.instanceUrl}/odata/v2`,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.apiKey && { 'APIKey': config.apiKey }),
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[SF API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`[SF API Error] ${error.response.status}: ${error.response.data?.error?.message || error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get employee compensation data
   */
  async getEmployeeCompensation(userId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/User('${userId}')?$select=userId,username,firstName,lastName,department,jobTitle,empInfo&$expand=empInfo/jobInfoNav,empInfo/compensationNav`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch employee compensation: ${error}`);
    }
  }

  /**
   * Get all employees in compensation plan
   */
  async getCompensationPlanEmployees(planId: string, options?: SFQueryOptions): Promise<any[]> {
    try {
      const params = new URLSearchParams();

      if (options?.filter) params.append('$filter', options.filter);
      if (options?.select) params.append('$select', options.select.join(','));
      if (options?.expand) params.append('$expand', options.expand.join(','));
      if (options?.top) params.append('$top', options.top.toString());
      if (options?.skip) params.append('$skip', options.skip.toString());

      const response = await this.client.get(
        `/CompensationPlan('${planId}')/employees?${params.toString()}`
      );

      return response.data.d?.results || [];
    } catch (error) {
      throw new Error(`Failed to fetch compensation plan employees: ${error}`);
    }
  }

  /**
   * Get compensation worksheet data (read-only)
   */
  async getCompensationWorksheet(worksheetId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/FOCompensationWorksheet('${worksheetId}')?$expand=compensationColumns,employees`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch compensation worksheet: ${error}`);
    }
  }

  /**
   * Get all compensation worksheets for a plan
   */
  async getCompensationWorksheets(planId: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/FOCompensationWorksheet?$filter=planId eq '${planId}'&$expand=employees,compensationColumns`
      );
      return response.data.d?.results || [];
    } catch (error) {
      throw new Error(`Failed to fetch compensation worksheets: ${error}`);
    }
  }

  /**
   * Get employee by userId
   */
  async getEmployee(userId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/User('${userId}')?$select=userId,username,firstName,lastName,email,department,division,location,jobCode,jobTitle,empInfo&$expand=empInfo`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch employee: ${error}`);
    }
  }

  /**
   * Search employees by criteria
   */
  async searchEmployees(filter: string, options?: SFQueryOptions): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('$filter', filter);

      if (options?.select) params.append('$select', options.select.join(','));
      if (options?.expand) params.append('$expand', options.expand.join(','));
      if (options?.top) params.append('$top', options.top.toString());
      if (options?.skip) params.append('$skip', options.skip.toString());

      const response = await this.client.get(`/User?${params.toString()}`);
      return response.data.d?.results || [];
    } catch (error) {
      throw new Error(`Failed to search employees: ${error}`);
    }
  }

  /**
   * Get pay grade information
   */
  async getPayGrade(payGradeId: string): Promise<any> {
    try {
      const response = await this.client.get(`/FOPayGrade('${payGradeId}')`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch pay grade: ${error}`);
    }
  }

  /**
   * Get salary ranges for a pay grade
   */
  async getSalaryRanges(payGradeId: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/FOPayRange?$filter=payGrade eq '${payGradeId}'`
      );
      return response.data.d?.results || [];
    } catch (error) {
      throw new Error(`Failed to fetch salary ranges: ${error}`);
    }
  }

  /**
   * Get current compensation info for employee
   */
  async getCurrentCompensation(userId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/EmpCompensation?$filter=userId eq '${userId}'&$orderby=startDate desc&$top=1`
      );
      return response.data.d?.results?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch current compensation: ${error}`);
    }
  }

  /**
   * Generic OData query
   */
  async query(entity: string, params?: Record<string, string>): Promise<any> {
    try {
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : '';

      const response = await this.client.get(`/${entity}${queryString}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to query ${entity}: ${error}`);
    }
  }
}
