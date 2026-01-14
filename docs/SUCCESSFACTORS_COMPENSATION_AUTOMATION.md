# SAP SuccessFactors Compensation Worksheet Automation

## Overview

This document explains how to automate SAP SuccessFactors compensation worksheet operations when **direct Update/Upsert APIs are not available**, using a hybrid approach combining REST API (read-only) and SFTP (write operations).

## The Challenge

SAP SuccessFactors compensation worksheets have limited API capabilities:

- ✅ **REST API**: Only `GET` operations (read-only)
- ❌ **REST API**: No `UPDATE` or `UPSERT` operations
- ✅ **SFTP**: Can upload files for upsert operations
- ❌ **Real-time feedback**: File processing is asynchronous

## Solution Architecture

### 🏗️ Hybrid Approach: API + SFTP + AI

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATION WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

Step 1: FETCH DATA (via REST API)
┌──────────────────────────────────────────────────────────────────┐
│  SuccessFactors OData API (GET operations)                       │
│  • Get employee compensation data                                │
│  • Get salary ranges and pay grades                              │
│  • Get current worksheet data                                    │
│  • Get organizational data                                       │
└──────────────────────────────────────────────────────────────────┘
                            ↓
Step 2: TRANSFORM & VALIDATE (AI-Powered)
┌──────────────────────────────────────────────────────────────────┐
│  Claude AI Processing                                            │
│  • Data transformation and enrichment                            │
│  • Intelligent validation (salary ranges, budgets, equity)       │
│  • Anomaly detection (unusual increases, compression issues)     │
│  • Compensation recommendations                                  │
└──────────────────────────────────────────────────────────────────┘
                            ↓
Step 3: UPLOAD FOR UPSERT (via SFTP)
┌──────────────────────────────────────────────────────────────────┐
│  SFTP File Upload                                                │
│  • Generate Excel/CSV/XML file                                   │
│  • Upload to SuccessFactors SFTP server                          │
│  • SuccessFactors processes file and performs upsert            │
└──────────────────────────────────────────────────────────────────┘
                            ↓
Step 4: MONITOR & REPORT
┌──────────────────────────────────────────────────────────────────┐
│  Results & Monitoring                                            │
│  • Track upload status                                           │
│  • Error reporting and alerting                                  │
│  • Audit trail                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Components

### 1. SuccessFactors API Client (`sf-api-client.ts`)

Handles READ operations via OData API:

- Get employee compensation data
- Get pay grades and salary ranges
- Get compensation worksheets (read-only)
- Search and filter employees

### 2. SFTP Service (`sftp-service.ts`)

Handles WRITE operations via file uploads:

- Connect to SuccessFactors SFTP server
- Generate Excel/CSV/XML files from data
- Upload files for upsert operations
- Download and list files
- Backup existing files

### 3. AI Transformation Service (`ai-transformation-service.ts`)

AI-powered data processing using Claude:

- **Transform**: Clean, enrich, and standardize compensation data
- **Validate**: Check salary ranges, budget compliance, policy rules
- **Detect Anomalies**: Find unusual patterns, compression issues, equity problems
- **Recommend**: Generate AI-powered compensation recommendations

### 4. Orchestration Service (`orchestration-service.ts`)

Coordinates the complete workflow:

- Orchestrates all services
- Manages workflow steps
- Error handling and recovery
- Rollback capabilities

### 5. REST API (`compensation.ts`)

Provides HTTP endpoints for the entire workflow:

```
GET    /api/compensation/employees/:userId
GET    /api/compensation/worksheets/:worksheetId
GET    /api/compensation/plans/:planId/worksheets
POST   /api/compensation/worksheets/upsert
POST   /api/compensation/worksheets/prepare
POST   /api/compensation/validate
POST   /api/compensation/detect-anomalies
POST   /api/compensation/recommend
GET    /api/compensation/sftp/files
GET    /api/compensation/health
```

## Setup & Configuration

### 1. Install Dependencies

```bash
cd backend
npm install
```

New dependencies added:
- `@anthropic-ai/sdk` - Claude AI integration
- `axios` - HTTP client for SuccessFactors API
- `ssh2-sftp-client` - SFTP client
- `xlsx` - Excel file generation

### 2. Configure Environment Variables

Copy and edit `.env.example`:

```bash
cp .env.example .env
```

Configure SuccessFactors credentials:

```env
# SuccessFactors OData API
SF_INSTANCE_URL=https://apiXXXX.successfactors.com
SF_COMPANY_ID=YourCompanyID
SF_USERNAME=your-api-username
SF_PASSWORD=your-api-password
SF_API_KEY=your-api-key-if-required

# SuccessFactors SFTP
SF_SFTP_HOST=sftp.successfactors.com
SF_SFTP_PORT=22
SF_SFTP_USERNAME=your-sftp-username
SF_SFTP_PASSWORD=your-sftp-password
SF_SFTP_REMOTE_PATH=/upload/compensation

# Anthropic API for AI features
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

### 3. Start the Server

```bash
npm run dev
```

## Usage Examples

### Example 1: Simple Upsert Workflow

```javascript
// Prepare compensation changes
const response = await fetch('http://localhost:3001/api/compensation/worksheets/upsert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    worksheets: [
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
        jobTitle: 'Senior Engineer'
      }
    ],
    options: {
      validateBeforeUpload: true,
      useAIValidation: true,
      useAITransformation: true,
      detectAnomalies: true,
      dryRun: false
    }
  })
});

const result = await response.json();
console.log(result);
```

### Example 2: Fetch Current Data & Prepare Worksheets

```javascript
// Fetch current employee data and prepare worksheets
const response = await fetch('http://localhost:3001/api/compensation/worksheets/prepare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeIds: ['jsmith', 'mjones', 'bwilson'],
    proposedChanges: {
      'jsmith': { proposedSalary: 110000, effectiveDate: '2026-04-01' },
      'mjones': { proposedSalary: 95000, effectiveDate: '2026-04-01' },
      'bwilson': { proposedSalary: 125000, effectiveDate: '2026-04-01' }
    }
  })
});

const worksheets = await response.json();
console.log(worksheets);
```

### Example 3: AI-Powered Validation

```javascript
const response = await fetch('http://localhost:3001/api/compensation/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    worksheets: [/* your worksheets */],
    validationRules: {
      salaryRanges: {
        'Senior Engineer': { min: 80000, max: 150000 },
        'Staff Engineer': { min: 120000, max: 200000 }
      },
      budgetConstraints: {
        'Engineering': 500000,
        'Product': 300000
      },
      policyRules: [
        'Salary increases must be between 0% and 50%',
        'Proposed salary must be within pay grade range'
      ]
    }
  })
});

const validation = await response.json();
console.log('Valid:', validation.data.isValid);
console.log('Errors:', validation.data.errors);
console.log('Warnings:', validation.data.warnings);
console.log('Suggestions:', validation.data.suggestions);
```

### Example 4: Detect Anomalies

```javascript
const response = await fetch('http://localhost:3001/api/compensation/detect-anomalies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    worksheets: [/* current worksheets */],
    historicalData: [/* previous year's data */]
  })
});

const result = await response.json();
result.data.anomalies.forEach(anomaly => {
  console.log(`${anomaly.severity.toUpperCase()}: ${anomaly.type}`);
  console.log(`Employee: ${anomaly.employeeId}`);
  console.log(`Description: ${anomaly.description}`);
  console.log(`Recommendation: ${anomaly.recommendation}`);
});
```

### Example 5: Get AI Recommendations

```javascript
const response = await fetch('http://localhost:3001/api/compensation/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employee: {
      userId: 'jsmith',
      currentSalary: 100000,
      performanceRating: 4.5,
      yearsInRole: 2,
      jobTitle: 'Senior Engineer',
      department: 'Engineering'
    },
    context: {
      salaryRange: { min: 80000, max: 150000 },
      marketData: { p50: 105000, p75: 120000, p90: 135000 },
      budgetAvailable: 50000,
      peerComparisons: [
        { salary: 110000, title: 'Senior Engineer' },
        { salary: 115000, title: 'Senior Engineer' }
      ]
    }
  })
});

const recommendation = await response.json();
console.log('Recommended Salary:', recommendation.data.recommendedSalary);
console.log('Rationale:', recommendation.data.rationale);
console.log('Alternatives:', recommendation.data.alternatives);
```

## AI-Powered Features

### 1. Intelligent Validation

The AI service validates compensation data against multiple criteria:

- **Salary Range Compliance**: Ensures proposed salaries are within pay grade ranges
- **Budget Compliance**: Checks that total increases don't exceed department budgets
- **Equity Analysis**: Compares increases across similar roles to detect inequities
- **Anomaly Detection**: Flags unusual patterns (e.g., 50% increases)
- **Data Completeness**: Validates all required fields are present
- **Policy Compliance**: Checks against company compensation policies

### 2. Anomaly Detection

AI detects various types of anomalies:

- **Salary Spikes**: Increases > 20% without clear justification
- **Compression Issues**: Subordinates earning more than managers
- **Out-of-Range**: Salaries outside pay grade ranges
- **Inconsistencies**: Similar employees receiving vastly different increases
- **Budget Red Flags**: Departments exceeding budget allocations

### 3. Smart Recommendations

AI generates compensation recommendations considering:

- Current position in salary range (compa-ratio)
- Performance ratings
- Market competitiveness
- Internal equity with peers
- Budget constraints
- Time in role and career progression

## File Format Support

The system supports multiple file formats for SFTP upload:

### Excel (`.xlsx`) - Recommended

```
User ID | Employee ID | First Name | Last Name | Current Salary | Proposed Salary | ...
jsmith  | 12345       | John       | Smith     | 100000        | 110000         | ...
```

### CSV (`.csv`)

```csv
"User ID","Employee ID","First Name","Last Name","Current Salary","Proposed Salary",...
"jsmith","12345","John","Smith","100000","110000",...
```

### XML (`.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CompensationData>
  <Employee>
    <userId>jsmith</userId>
    <employeeId>12345</employeeId>
    <currentSalary>100000</currentSalary>
    <proposedSalary>110000</proposedSalary>
    ...
  </Employee>
</CompensationData>
```

## Error Handling & Recovery

### Validation Errors

If validation fails, the workflow stops and returns detailed errors:

```json
{
  "success": false,
  "data": {
    "isValid": false,
    "errors": [
      "Row 3: Proposed salary $200,000 exceeds pay grade max $150,000",
      "Row 7: Missing effective date"
    ],
    "warnings": [
      "Row 5: Increase of 45% is unusually high"
    ]
  }
}
```

### Upload Failures

If SFTP upload fails:

1. Error is logged with details
2. Original data is preserved
3. Previous file backup remains intact
4. Client receives error response

### Rollback

To rollback to a previous version:

```javascript
const result = await orchestrationService.rollbackChanges('compensation_upsert_1234567890.xlsx.1234567890.bak');
```

## Monitoring & Observability

### Health Check

```bash
curl http://localhost:3001/api/compensation/health
```

Returns status of API and SFTP connections:

```json
{
  "success": true,
  "data": {
    "api": true,
    "sftp": true
  }
}
```

### Audit Trail

All operations are logged for audit purposes:

- Timestamp of operation
- User who initiated
- Number of records processed
- Validation results
- Upload status
- Errors and warnings

## Best Practices

### 1. Always Validate Before Upload

```javascript
options: {
  validateBeforeUpload: true,
  useAIValidation: true
}
```

### 2. Use Dry Run for Testing

```javascript
options: {
  dryRun: true  // Validates but doesn't upload
}
```

### 3. Enable Anomaly Detection

```javascript
options: {
  detectAnomalies: true  // Catches unusual patterns
}
```

### 4. Backup Existing Files

```javascript
options: {
  backupExisting: true  // Creates backup before overwriting
}
```

### 5. Batch Large Datasets

For large employee populations, process in batches:

```javascript
const batchSize = 100;
const results = await aiService.batchTransform(worksheets, batchSize);
```

## Security Considerations

1. **Credentials**: Store SF credentials securely in environment variables
2. **SFTP**: Use SSH key authentication instead of passwords in production
3. **API Keys**: Rotate API keys regularly
4. **Encryption**: Ensure SFTP transfers use encryption
5. **Audit Logs**: Maintain detailed logs of all compensation changes
6. **Access Control**: Implement role-based access control (future enhancement)

## Limitations & Workarounds

### Limitation 1: No Real-Time Feedback

**Problem**: SFTP uploads are processed asynchronously by SuccessFactors

**Workaround**:
- Implement polling to check file processing status
- Use SuccessFactors job monitoring API
- Set up email notifications from SF

### Limitation 2: No Direct Update API

**Problem**: Can't update individual records via API

**Workaround**:
- Use SFTP file upload for bulk updates
- This solution automates the entire process

### Limitation 3: File Format Requirements

**Problem**: SuccessFactors has specific file format requirements

**Workaround**:
- Use templates for each compensation plan
- AI transformation ensures correct formatting
- Validation catches format errors before upload

## Future Enhancements

1. **Real-time Monitoring**: WebSocket connection for live status updates
2. **Scheduled Processing**: Cron jobs for periodic uploads
3. **Approval Workflows**: Multi-level approval before upload
4. **Version Control**: Track changes to compensation data over time
5. **Advanced Analytics**: Compensation trends and forecasting
6. **Integration with HR Systems**: Sync with other HRIS platforms

## Troubleshooting

### Connection Issues

```bash
# Test API connection
curl http://localhost:3001/api/compensation/health

# Test SFTP connection
# Check SF_SFTP_* environment variables
```

### Validation Failures

- Review validation errors in response
- Check salary ranges in SuccessFactors
- Verify budget allocations
- Confirm pay grade mappings

### Upload Failures

- Check SFTP credentials
- Verify remote path exists
- Ensure file permissions
- Check SuccessFactors import job status

## Support & Resources

- **SuccessFactors API Documentation**: https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM
- **OData V2 Guide**: https://www.odata.org/documentation/
- **SFTP Configuration**: Contact your SuccessFactors admin
- **Claude AI Documentation**: https://docs.anthropic.com/

---

## Summary

This solution provides **end-to-end automation** for SAP SuccessFactors compensation worksheet operations when direct APIs are limited:

✅ **Hybrid Approach**: Combines REST API (read) + SFTP (write)
✅ **AI-Powered**: Intelligent validation, anomaly detection, recommendations
✅ **Automated Workflow**: Fetch → Transform → Validate → Upload
✅ **Error Handling**: Robust validation and rollback capabilities
✅ **Scalable**: Handles large employee populations with batch processing
✅ **Secure**: Encrypted transfers, audit logs, credential management

The system is production-ready and can be extended with additional features as needed.
