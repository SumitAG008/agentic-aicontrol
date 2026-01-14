/**
 * Example: SAP SuccessFactors Compensation Worksheet Upsert
 *
 * This example demonstrates how to use the compensation automation system
 * to upsert compensation data when SuccessFactors doesn't provide direct Update APIs.
 *
 * Run with: npx tsx examples/compensation-upsert-example.ts
 */

import { SuccessFactorsAPIClient, SFAuthConfig, CompensationWorksheet } from '../src/services/successfactors/sf-api-client';
import { SuccessFactorsSFTPService, SFTPConfig } from '../src/services/successfactors/sftp-service';
import { AITransformationService } from '../src/services/successfactors/ai-transformation-service';
import { SuccessFactorsOrchestrationService } from '../src/services/successfactors/orchestration-service';
import dotenv from 'dotenv';

dotenv.config();

// ===================================================================
// Configuration
// ===================================================================

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

// Initialize services
const apiClient = new SuccessFactorsAPIClient(sfAuthConfig);
const sftpService = new SuccessFactorsSFTPService(sftpConfig);
const aiService = new AITransformationService(process.env.ANTHROPIC_API_KEY || '');
const orchestrationService = new SuccessFactorsOrchestrationService(
  apiClient,
  sftpService,
  aiService
);

// ===================================================================
// Example 1: Simple Upsert with Manual Data
// ===================================================================

async function example1_SimpleUpsert() {
  console.log('\n=== Example 1: Simple Upsert ===\n');

  const worksheets: CompensationWorksheet[] = [
    {
      userId: 'jsmith',
      employeeId: '12345',
      firstName: 'John',
      lastName: 'Smith',
      currentSalary: 100000,
      proposedSalary: 110000,
      salaryIncrease: 10000,
      increasePercentage: 10.0,
      effectiveDate: '2026-04-01',
      currency: 'USD',
      department: 'Engineering',
      jobTitle: 'Senior Engineer',
    },
    {
      userId: 'mjones',
      employeeId: '12346',
      firstName: 'Mary',
      lastName: 'Jones',
      currentSalary: 85000,
      proposedSalary: 90000,
      salaryIncrease: 5000,
      increasePercentage: 5.88,
      effectiveDate: '2026-04-01',
      currency: 'USD',
      department: 'Product',
      jobTitle: 'Product Manager',
    },
  ];

  try {
    const result = await orchestrationService.upsertCompensationWorksheets(worksheets, {
      validateBeforeUpload: true,
      useAIValidation: true,
      useAITransformation: false,
      detectAnomalies: true,
      dryRun: true, // Set to false to actually upload
    });

    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===================================================================
// Example 2: Fetch Current Data and Prepare Worksheets
// ===================================================================

async function example2_FetchAndPrepare() {
  console.log('\n=== Example 2: Fetch Current Data & Prepare ===\n');

  const employeeIds = ['jsmith', 'mjones', 'bwilson'];

  const proposedChanges = {
    jsmith: { proposedSalary: 110000, effectiveDate: '2026-04-01' },
    mjones: { proposedSalary: 95000, effectiveDate: '2026-04-01' },
    bwilson: { proposedSalary: 125000, effectiveDate: '2026-04-01' },
  };

  try {
    console.log(`Fetching current data for ${employeeIds.length} employees...`);

    const worksheets = await orchestrationService.fetchAndPrepareWorksheets(
      employeeIds,
      proposedChanges
    );

    console.log(`Prepared ${worksheets.length} worksheets`);
    console.log('Sample worksheet:', JSON.stringify(worksheets[0], null, 2));

    // Now upsert the prepared worksheets
    const result = await orchestrationService.upsertCompensationWorksheets(worksheets, {
      validateBeforeUpload: true,
      useAIValidation: true,
      detectAnomalies: true,
      dryRun: true,
    });

    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===================================================================
// Example 3: AI-Powered Validation Only
// ===================================================================

async function example3_AIValidation() {
  console.log('\n=== Example 3: AI-Powered Validation ===\n');

  const worksheets: CompensationWorksheet[] = [
    {
      userId: 'jsmith',
      employeeId: '12345',
      firstName: 'John',
      lastName: 'Smith',
      currentSalary: 100000,
      proposedSalary: 160000, // Way too high!
      salaryIncrease: 60000,
      increasePercentage: 60.0,
      effectiveDate: '2026-04-01',
      currency: 'USD',
      department: 'Engineering',
      jobTitle: 'Senior Engineer',
    },
  ];

  const validationRules = {
    salaryRanges: {
      'Senior Engineer': { min: 80000, max: 150000 },
    },
    budgetConstraints: {
      Engineering: 500000,
    },
    policyRules: [
      'Salary increases must be between 0% and 50%',
      'Proposed salary must be within pay grade range',
    ],
  };

  try {
    const result = await aiService.validateWorksheets(worksheets, validationRules);

    console.log('Validation Result:');
    console.log('  Valid:', result.isValid);
    console.log('  Errors:', result.errors);
    console.log('  Warnings:', result.warnings);
    console.log('  Suggestions:', result.suggestions);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===================================================================
// Example 4: Anomaly Detection
// ===================================================================

async function example4_AnomalyDetection() {
  console.log('\n=== Example 4: Anomaly Detection ===\n');

  const currentWorksheets: CompensationWorksheet[] = [
    {
      userId: 'jsmith',
      employeeId: '12345',
      firstName: 'John',
      lastName: 'Smith',
      currentSalary: 100000,
      proposedSalary: 150000, // 50% increase - suspicious!
      salaryIncrease: 50000,
      increasePercentage: 50.0,
      effectiveDate: '2026-04-01',
      currency: 'USD',
      department: 'Engineering',
      jobTitle: 'Senior Engineer',
    },
    {
      userId: 'mjones',
      employeeId: '12346',
      firstName: 'Mary',
      lastName: 'Jones',
      currentSalary: 85000,
      proposedSalary: 86000, // Only 1.2% increase
      salaryIncrease: 1000,
      increasePercentage: 1.18,
      effectiveDate: '2026-04-01',
      currency: 'USD',
      department: 'Product',
      jobTitle: 'Senior Product Manager',
    },
  ];

  try {
    const result = await aiService.detectAnomalies(currentWorksheets);

    console.log(`Found ${result.anomalies.length} anomalies:`);
    result.anomalies.forEach((anomaly) => {
      console.log(`\n  ${anomaly.severity.toUpperCase()}: ${anomaly.type}`);
      console.log(`  Employee: ${anomaly.employeeId}`);
      console.log(`  Description: ${anomaly.description}`);
      console.log(`  Recommendation: ${anomaly.recommendation}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===================================================================
// Example 5: AI Compensation Recommendations
// ===================================================================

async function example5_AIRecommendations() {
  console.log('\n=== Example 5: AI Compensation Recommendations ===\n');

  const employee = {
    userId: 'jsmith',
    currentSalary: 100000,
    performanceRating: 4.5,
    yearsInRole: 2,
    jobTitle: 'Senior Engineer',
    department: 'Engineering',
  };

  const context = {
    salaryRange: { min: 80000, max: 150000 },
    marketData: { p50: 105000, p75: 120000, p90: 135000 },
    budgetAvailable: 50000,
    peerComparisons: [
      { salary: 110000, title: 'Senior Engineer' },
      { salary: 115000, title: 'Senior Engineer' },
      { salary: 108000, title: 'Senior Engineer' },
    ],
  };

  try {
    const recommendation = await aiService.generateRecommendations(employee, context);

    console.log('Recommended Salary:', recommendation.recommendedSalary);
    console.log('Rationale:', recommendation.rationale);
    console.log('\nAlternative Scenarios:');
    recommendation.alternatives.forEach((alt) => {
      console.log(`  - ${alt.scenario}: $${alt.salary.toLocaleString()}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===================================================================
// Example 6: Complete End-to-End Workflow
// ===================================================================

async function example6_CompleteWorkflow() {
  console.log('\n=== Example 6: Complete End-to-End Workflow ===\n');

  // Step 1: Define employee changes
  const employeeIds = ['jsmith', 'mjones'];
  const proposedChanges = {
    jsmith: { proposedSalary: 110000, effectiveDate: '2026-04-01' },
    mjones: { proposedSalary: 92000, effectiveDate: '2026-04-01' },
  };

  try {
    // Step 2: Fetch current data
    console.log('Step 1: Fetching current employee data...');
    const worksheets = await orchestrationService.fetchAndPrepareWorksheets(
      employeeIds,
      proposedChanges
    );
    console.log(`  ✓ Prepared ${worksheets.length} worksheets\n`);

    // Step 3: AI Validation
    console.log('Step 2: Validating with AI...');
    const validationRules = {
      salaryRanges: { 'Senior Engineer': { min: 80000, max: 150000 } },
      budgetConstraints: { Engineering: 500000 },
    };
    const validation = await aiService.validateWorksheets(worksheets, validationRules);
    console.log(`  ✓ Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (!validation.isValid) {
      console.log('  Errors:', validation.errors);
      return;
    }
    console.log('');

    // Step 4: Detect Anomalies
    console.log('Step 3: Detecting anomalies...');
    const anomalies = await aiService.detectAnomalies(worksheets);
    console.log(`  ✓ Found ${anomalies.anomalies.length} anomalies\n`);

    // Step 5: Upload via SFTP (dry run)
    console.log('Step 4: Uploading to SuccessFactors...');
    const result = await orchestrationService.upsertCompensationWorksheets(worksheets, {
      validateBeforeUpload: false, // Already validated
      useAIValidation: false,
      detectAnomalies: false,
      dryRun: true, // Change to false for actual upload
    });

    console.log(`  ✓ Upload ${result.success ? 'SUCCEEDED' : 'FAILED'}`);
    console.log(`  Records processed: ${result.recordsProcessed}`);
    console.log(`  Records uploaded: ${result.recordsUploaded}`);

    if (result.errors.length > 0) {
      console.log('  Errors:', result.errors);
    }

    console.log('\n✓ Workflow completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===================================================================
// Main
// ===================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SAP SuccessFactors Compensation Worksheet Automation         ║');
  console.log('║  Examples: SFTP-based Upsert with AI Intelligence            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // Uncomment the examples you want to run:

  // await example1_SimpleUpsert();
  // await example2_FetchAndPrepare();
  // await example3_AIValidation();
  // await example4_AnomalyDetection();
  // await example5_AIRecommendations();
  await example6_CompleteWorkflow();

  console.log('\n✓ All examples completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  example1_SimpleUpsert,
  example2_FetchAndPrepare,
  example3_AIValidation,
  example4_AnomalyDetection,
  example5_AIRecommendations,
  example6_CompleteWorkflow,
};
