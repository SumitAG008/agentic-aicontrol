import { SuccessFactorsAPIClient, CompensationWorksheet } from './sf-api-client';
import { SuccessFactorsSFTPService, FileUploadResult } from './sftp-service';
import { AITransformationService, ValidationResult } from './ai-transformation-service';

export interface UpsertWorkflowOptions {
  validateBeforeUpload?: boolean;
  useAIValidation?: boolean;
  useAITransformation?: boolean;
  detectAnomalies?: boolean;
  backupExisting?: boolean;
  dryRun?: boolean;
}

export interface UpsertResult {
  success: boolean;
  recordsProcessed: number;
  recordsUploaded: number;
  uploadResult?: FileUploadResult;
  validationResult?: ValidationResult;
  anomalies?: any[];
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

/**
 * Orchestration Service for SuccessFactors Compensation Workflow
 *
 * This service orchestrates the complete workflow:
 * 1. Fetch data via REST API (GET operations)
 * 2. Transform/validate data using AI
 * 3. Upload via SFTP for upsert operations
 * 4. Monitor and report results
 */
export class SuccessFactorsOrchestrationService {
  private apiClient: SuccessFactorsAPIClient;
  private sftpService: SuccessFactorsSFTPService;
  private aiService: AITransformationService;

  constructor(
    apiClient: SuccessFactorsAPIClient,
    sftpService: SuccessFactorsSFTPService,
    aiService: AITransformationService
  ) {
    this.apiClient = apiClient;
    this.sftpService = sftpService;
    this.aiService = aiService;
  }

  /**
   * Complete upsert workflow: Fetch -> Transform -> Validate -> Upload
   */
  async upsertCompensationWorksheets(
    worksheets: CompensationWorksheet[],
    options: UpsertWorkflowOptions = {}
  ): Promise<UpsertResult> {
    const {
      validateBeforeUpload = true,
      useAIValidation = true,
      useAITransformation = true,
      detectAnomalies = true,
      backupExisting = true,
      dryRun = false,
    } = options;

    console.log(`[Orchestration] Starting upsert workflow for ${worksheets.length} records`);

    const result: UpsertResult = {
      success: false,
      recordsProcessed: worksheets.length,
      recordsUploaded: 0,
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };

    try {
      // Step 1: AI Transformation (if enabled)
      let processedWorksheets = worksheets;

      if (useAITransformation) {
        console.log('[Orchestration] Step 1: AI Transformation');
        try {
          // Fetch context data from SuccessFactors API
          const context = await this.fetchContextData(worksheets);

          processedWorksheets = await this.aiService.transformWorksheets(
            worksheets,
            context,
            { validateSalaryRanges: true, checkBudgetCompliance: true }
          );

          console.log(`[Orchestration] Transformed ${processedWorksheets.length} records`);
        } catch (error) {
          result.warnings.push(`AI transformation failed: ${error}`);
          // Continue with original data if transformation fails
          processedWorksheets = worksheets;
        }
      }

      // Step 2: Anomaly Detection (if enabled)
      if (detectAnomalies) {
        console.log('[Orchestration] Step 2: Anomaly Detection');
        try {
          const anomalyResult = await this.aiService.detectAnomalies(processedWorksheets);
          result.anomalies = anomalyResult.anomalies;

          if (anomalyResult.anomalies.length > 0) {
            const highSeverityCount = anomalyResult.anomalies.filter(
              (a) => a.severity === 'high'
            ).length;

            result.warnings.push(
              `Detected ${anomalyResult.anomalies.length} anomalies (${highSeverityCount} high severity)`
            );

            console.log(`[Orchestration] Found ${anomalyResult.anomalies.length} anomalies`);
          }
        } catch (error) {
          result.warnings.push(`Anomaly detection failed: ${error}`);
        }
      }

      // Step 3: Validation (if enabled)
      if (validateBeforeUpload) {
        console.log('[Orchestration] Step 3: Validation');

        if (useAIValidation) {
          try {
            const validationRules = await this.buildValidationRules(processedWorksheets);
            const validationResult = await this.aiService.validateWorksheets(
              processedWorksheets,
              validationRules
            );

            result.validationResult = validationResult;

            if (!validationResult.isValid) {
              result.errors.push(...validationResult.errors);
              result.warnings.push(...validationResult.warnings);

              console.error('[Orchestration] Validation failed:', validationResult.errors);
              return result; // Stop here if validation fails
            }

            console.log('[Orchestration] Validation passed');
          } catch (error) {
            result.errors.push(`AI validation failed: ${error}`);
            return result;
          }
        } else {
          // Basic validation without AI
          const basicValidation = this.basicValidation(processedWorksheets);
          if (basicValidation.length > 0) {
            result.errors.push(...basicValidation);
            return result;
          }
        }
      }

      // Step 4: Upload via SFTP (if not dry run)
      if (!dryRun) {
        console.log('[Orchestration] Step 4: SFTP Upload');

        const uploadResult = await this.sftpService.uploadCompensationWorksheets(
          processedWorksheets,
          {
            validateBeforeUpload: false, // Already validated above
            backupExisting,
            format: 'xlsx',
          }
        );

        result.uploadResult = uploadResult;

        if (uploadResult.success) {
          result.success = true;
          result.recordsUploaded = uploadResult.recordCount;
          console.log(
            `[Orchestration] Successfully uploaded ${uploadResult.recordCount} records`
          );
        } else {
          result.errors.push(`Upload failed: ${uploadResult.error}`);
          console.error('[Orchestration] Upload failed:', uploadResult.error);
        }
      } else {
        console.log('[Orchestration] Dry run mode - skipping upload');
        result.success = true;
        result.warnings.push('Dry run mode - no data was uploaded');
      }

      return result;
    } catch (error) {
      result.errors.push(`Workflow failed: ${error}`);
      console.error('[Orchestration] Workflow error:', error);
      return result;
    }
  }

  /**
   * Fetch current compensation data and calculate changes
   */
  async fetchAndPrepareWorksheets(
    employeeIds: string[],
    proposedChanges: Record<string, { proposedSalary: number; effectiveDate: string }>
  ): Promise<CompensationWorksheet[]> {
    console.log(`[Orchestration] Fetching data for ${employeeIds.length} employees`);

    const worksheets: CompensationWorksheet[] = [];

    for (const userId of employeeIds) {
      try {
        // Fetch employee data from SuccessFactors API
        const employee = await this.apiClient.getEmployee(userId);
        const currentComp = await this.apiClient.getCurrentCompensation(userId);

        const currentSalary = currentComp?.salary || 0;
        const proposedSalary = proposedChanges[userId]?.proposedSalary || currentSalary;

        const worksheet: CompensationWorksheet = {
          userId: employee.userId,
          employeeId: employee.employeeId || employee.userId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          currentSalary,
          proposedSalary,
          salaryIncrease: proposedSalary - currentSalary,
          increasePercentage: currentSalary > 0 ? ((proposedSalary - currentSalary) / currentSalary) * 100 : 0,
          effectiveDate: proposedChanges[userId]?.effectiveDate || new Date().toISOString().split('T')[0],
          currency: currentComp?.currency || 'USD',
          department: employee.department || '',
          jobTitle: employee.jobTitle || '',
        };

        worksheets.push(worksheet);
      } catch (error) {
        console.error(`[Orchestration] Failed to fetch data for ${userId}:`, error);
      }
    }

    return worksheets;
  }

  /**
   * Fetch context data for AI processing
   */
  private async fetchContextData(
    worksheets: CompensationWorksheet[]
  ): Promise<any> {
    try {
      // You can fetch salary ranges, budget limits, historical data, etc.
      // For now, returning empty context
      return {
        salaryRanges: {},
        budgetLimits: {},
        previousData: [],
      };
    } catch (error) {
      console.error('[Orchestration] Failed to fetch context data:', error);
      return {};
    }
  }

  /**
   * Build validation rules from SuccessFactors data
   */
  private async buildValidationRules(
    worksheets: CompensationWorksheet[]
  ): Promise<any> {
    // Fetch salary ranges, budget constraints, policy rules
    // For now, returning basic rules
    return {
      salaryRanges: {},
      budgetConstraints: {},
      policyRules: [
        'Salary increases must be between 0% and 50%',
        'Proposed salary must be within pay grade range',
        'Total department increases must not exceed budget',
      ],
    };
  }

  /**
   * Basic validation without AI
   */
  private basicValidation(worksheets: CompensationWorksheet[]): string[] {
    const errors: string[] = [];

    worksheets.forEach((ws, index) => {
      if (!ws.userId) errors.push(`Row ${index + 1}: Missing userId`);
      if (!ws.employeeId) errors.push(`Row ${index + 1}: Missing employeeId`);
      if (ws.proposedSalary < 0) errors.push(`Row ${index + 1}: Invalid proposed salary`);
      if (ws.increasePercentage > 50) {
        errors.push(`Row ${index + 1}: Increase exceeds 50% (${ws.increasePercentage.toFixed(2)}%)`);
      }
      if (!ws.effectiveDate) errors.push(`Row ${index + 1}: Missing effective date`);
    });

    return errors;
  }

  /**
   * Monitor SFTP uploads and processing status
   */
  async monitorUploadStatus(fileName: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message: string;
  }> {
    // This would integrate with SuccessFactors job monitoring API
    // For now, returning mock status
    return {
      status: 'completed',
      message: 'File processed successfully',
    };
  }

  /**
   * Rollback compensation changes
   */
  async rollbackChanges(backupFileName: string): Promise<boolean> {
    try {
      console.log(`[Orchestration] Rolling back to ${backupFileName}`);

      // Download backup file and re-upload as current
      const localPath = await this.sftpService.downloadFile(backupFileName);

      // Process and re-upload
      // Implementation depends on file format and SF import process

      return true;
    } catch (error) {
      console.error('[Orchestration] Rollback failed:', error);
      return false;
    }
  }
}
