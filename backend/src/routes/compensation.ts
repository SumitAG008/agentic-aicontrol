import { Router, Request, Response } from 'express';
import { SuccessFactorsAPIClient, SFAuthConfig } from '../services/successfactors/sf-api-client';
import { SuccessFactorsSFTPService, SFTPConfig } from '../services/successfactors/sftp-service';
import { AITransformationService } from '../services/successfactors/ai-transformation-service';
import { SuccessFactorsOrchestrationService } from '../services/successfactors/orchestration-service';

const router = Router();

// Initialize services (in production, these would be dependency injected)
function initializeServices() {
  const sfAuthConfig: SFAuthConfig = {
    instanceUrl: process.env.SF_INSTANCE_URL || 'https://api.successfactors.com',
    companyId: process.env.SF_COMPANY_ID || '',
    username: process.env.SF_USERNAME || '',
    password: process.env.SF_PASSWORD || '',
    apiKey: process.env.SF_API_KEY,
  };

  const sftpConfig: SFTPConfig = {
    host: process.env.SF_SFTP_HOST || 'sftp.successfactors.com',
    port: parseInt(process.env.SF_SFTP_PORT || '22'),
    username: process.env.SF_SFTP_USERNAME || '',
    password: process.env.SF_SFTP_PASSWORD,
    privateKey: process.env.SF_SFTP_PRIVATE_KEY,
    remotePath: process.env.SF_SFTP_REMOTE_PATH || '/upload',
  };

  const apiClient = new SuccessFactorsAPIClient(sfAuthConfig);
  const sftpService = new SuccessFactorsSFTPService(sftpConfig);
  const aiService = new AITransformationService(process.env.ANTHROPIC_API_KEY || '');
  const orchestrationService = new SuccessFactorsOrchestrationService(
    apiClient,
    sftpService,
    aiService
  );

  return { apiClient, sftpService, aiService, orchestrationService };
}

/**
 * GET /api/compensation/employees/:userId
 * Get employee compensation data
 */
router.get('/employees/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { apiClient } = initializeServices();

    const compensation = await apiClient.getEmployeeCompensation(userId);

    res.json({
      success: true,
      data: compensation,
    });
  } catch (error) {
    console.error('Error fetching employee compensation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/compensation/worksheets/:worksheetId
 * Get compensation worksheet data (read-only via API)
 */
router.get('/worksheets/:worksheetId', async (req: Request, res: Response) => {
  try {
    const { worksheetId } = req.params;
    const { apiClient } = initializeServices();

    const worksheet = await apiClient.getCompensationWorksheet(worksheetId);

    res.json({
      success: true,
      data: worksheet,
    });
  } catch (error) {
    console.error('Error fetching compensation worksheet:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/compensation/plans/:planId/worksheets
 * Get all worksheets for a compensation plan
 */
router.get('/plans/:planId/worksheets', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const { apiClient } = initializeServices();

    const worksheets = await apiClient.getCompensationWorksheets(planId);

    res.json({
      success: true,
      data: worksheets,
      count: worksheets.length,
    });
  } catch (error) {
    console.error('Error fetching compensation worksheets:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/compensation/worksheets/upsert
 * Upsert compensation worksheets via SFTP automation
 *
 * Body:
 * {
 *   "worksheets": [...],
 *   "options": {
 *     "validateBeforeUpload": true,
 *     "useAIValidation": true,
 *     "useAITransformation": true,
 *     "detectAnomalies": true,
 *     "dryRun": false
 *   }
 * }
 */
router.post('/worksheets/upsert', async (req: Request, res: Response) => {
  try {
    const { worksheets, options = {} } = req.body;

    if (!worksheets || !Array.isArray(worksheets)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: worksheets array is required',
      });
    }

    const { orchestrationService } = initializeServices();

    console.log(`[API] Starting upsert workflow for ${worksheets.length} worksheets`);

    const result = await orchestrationService.upsertCompensationWorksheets(
      worksheets,
      options
    );

    const statusCode = result.success ? 200 : 400;

    res.status(statusCode).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Error upserting compensation worksheets:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/compensation/worksheets/prepare
 * Fetch current data and prepare worksheets for upsert
 *
 * Body:
 * {
 *   "employeeIds": ["user1", "user2"],
 *   "proposedChanges": {
 *     "user1": { "proposedSalary": 120000, "effectiveDate": "2026-04-01" },
 *     "user2": { "proposedSalary": 95000, "effectiveDate": "2026-04-01" }
 *   }
 * }
 */
router.post('/worksheets/prepare', async (req: Request, res: Response) => {
  try {
    const { employeeIds, proposedChanges } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: employeeIds array is required',
      });
    }

    const { orchestrationService } = initializeServices();

    const worksheets = await orchestrationService.fetchAndPrepareWorksheets(
      employeeIds,
      proposedChanges || {}
    );

    res.json({
      success: true,
      data: worksheets,
      count: worksheets.length,
    });
  } catch (error) {
    console.error('Error preparing worksheets:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/compensation/validate
 * Validate compensation worksheets using AI
 *
 * Body:
 * {
 *   "worksheets": [...],
 *   "validationRules": {...}
 * }
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { worksheets, validationRules = {} } = req.body;

    if (!worksheets || !Array.isArray(worksheets)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: worksheets array is required',
      });
    }

    const { aiService } = initializeServices();

    const validationResult = await aiService.validateWorksheets(
      worksheets,
      validationRules
    );

    res.json({
      success: validationResult.isValid,
      data: validationResult,
    });
  } catch (error) {
    console.error('Error validating worksheets:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/compensation/detect-anomalies
 * Detect anomalies in compensation data using AI
 *
 * Body:
 * {
 *   "worksheets": [...],
 *   "historicalData": [...]
 * }
 */
router.post('/detect-anomalies', async (req: Request, res: Response) => {
  try {
    const { worksheets, historicalData } = req.body;

    if (!worksheets || !Array.isArray(worksheets)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: worksheets array is required',
      });
    }

    const { aiService } = initializeServices();

    const result = await aiService.detectAnomalies(worksheets, historicalData);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/compensation/recommend
 * Generate AI-powered compensation recommendations for an employee
 *
 * Body:
 * {
 *   "employee": {...},
 *   "context": {...}
 * }
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { employee, context } = req.body;

    if (!employee || !context) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: employee and context are required',
      });
    }

    const { aiService } = initializeServices();

    const recommendation = await aiService.generateRecommendations(employee, context);

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/compensation/sftp/files
 * List files on SFTP server
 */
router.get('/sftp/files', async (req: Request, res: Response) => {
  try {
    const { directory } = req.query;
    const { sftpService } = initializeServices();

    const files = await sftpService.listFiles(directory as string);

    res.json({
      success: true,
      data: files,
      count: files.length,
    });
  } catch (error) {
    console.error('Error listing SFTP files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/compensation/health
 * Health check for SuccessFactors integration
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const { apiClient, sftpService } = initializeServices();

    const checks = {
      api: false,
      sftp: false,
    };

    // Test API connection
    try {
      await apiClient.query('User', { $top: '1' });
      checks.api = true;
    } catch (error) {
      console.error('API health check failed:', error);
    }

    // Test SFTP connection
    try {
      await sftpService.connect();
      await sftpService.disconnect();
      checks.sftp = true;
    } catch (error) {
      console.error('SFTP health check failed:', error);
    }

    const allHealthy = checks.api && checks.sftp;

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: checks,
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
