import Anthropic from '@anthropic-ai/sdk';
import { CompensationWorksheet } from './sf-api-client';

export interface TransformationRule {
  field: string;
  rule: string;
  priority: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface AITransformationOptions {
  rules?: TransformationRule[];
  validateSalaryRanges?: boolean;
  checkBudgetCompliance?: boolean;
  detectAnomalies?: boolean;
}

/**
 * AI-powered Data Transformation and Validation Service
 * Uses Claude to intelligently process and validate compensation data
 */
export class AITransformationService {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Transform and enrich compensation data using AI
   */
  async transformWorksheets(
    worksheets: CompensationWorksheet[],
    context: {
      salaryRanges?: Record<string, { min: number; max: number }>;
      budgetLimits?: Record<string, number>;
      previousData?: CompensationWorksheet[];
    },
    options: AITransformationOptions = {}
  ): Promise<CompensationWorksheet[]> {
    console.log(`[AI Transform] Processing ${worksheets.length} worksheets`);

    const prompt = this.buildTransformationPrompt(worksheets, context, options);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const transformedData = this.parseAIResponse(responseText);

      return transformedData;
    } catch (error) {
      console.error('[AI Transform] Error:', error);
      throw new Error(`AI transformation failed: ${error}`);
    }
  }

  /**
   * Validate compensation worksheets using AI
   */
  async validateWorksheets(
    worksheets: CompensationWorksheet[],
    validationRules: {
      salaryRanges?: Record<string, { min: number; max: number }>;
      budgetConstraints?: Record<string, number>;
      policyRules?: string[];
      historicalData?: CompensationWorksheet[];
    }
  ): Promise<ValidationResult> {
    console.log(`[AI Validate] Validating ${worksheets.length} worksheets`);

    const prompt = `You are a compensation analyst AI. Validate the following compensation data against the provided rules and constraints.

<compensation_data>
${JSON.stringify(worksheets, null, 2)}
</compensation_data>

<validation_rules>
${JSON.stringify(validationRules, null, 2)}
</validation_rules>

Analyze the data and respond with a JSON object containing:
- isValid: boolean (true if no critical errors)
- errors: array of critical validation errors that must be fixed
- warnings: array of issues that should be reviewed
- suggestions: array of recommendations for improvement

Focus on:
1. Salary range compliance (proposed salaries within pay grade ranges)
2. Budget compliance (total increases within department budgets)
3. Equity analysis (compare increases across similar roles)
4. Anomaly detection (unusually high/low increases)
5. Data completeness and accuracy
6. Policy compliance

Respond ONLY with the JSON object, no additional text.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const validationResult: ValidationResult = JSON.parse(responseText);

      return validationResult;
    } catch (error) {
      console.error('[AI Validate] Error:', error);
      return {
        isValid: false,
        errors: [`AI validation failed: ${error}`],
        warnings: [],
        suggestions: [],
      };
    }
  }

  /**
   * Detect anomalies in compensation data using AI
   */
  async detectAnomalies(
    worksheets: CompensationWorksheet[],
    historicalData?: CompensationWorksheet[]
  ): Promise<{
    anomalies: Array<{
      employeeId: string;
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      recommendation: string;
    }>;
  }> {
    console.log(`[AI Anomaly] Detecting anomalies in ${worksheets.length} records`);

    const prompt = `You are an AI compensation analyst. Detect anomalies and unusual patterns in this compensation data.

<current_data>
${JSON.stringify(worksheets, null, 2)}
</current_data>

${
  historicalData
    ? `<historical_data>
${JSON.stringify(historicalData.slice(0, 100), null, 2)}
</historical_data>`
    : ''
}

Analyze for:
1. Unusually high salary increases (> 20%)
2. Unusually low increases (< 2%) for high performers
3. Compression issues (subordinates earning more than managers)
4. Out-of-range salaries for pay grades
5. Inconsistent increases within same job/level
6. Budget red flags

Respond with a JSON object:
{
  "anomalies": [
    {
      "employeeId": "string",
      "type": "salary_spike|compression|out_of_range|inconsistency",
      "severity": "high|medium|low",
      "description": "detailed explanation",
      "recommendation": "suggested action"
    }
  ]
}

Respond ONLY with JSON, no additional text.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const result = JSON.parse(responseText);

      return result;
    } catch (error) {
      console.error('[AI Anomaly] Error:', error);
      return { anomalies: [] };
    }
  }

  /**
   * Generate compensation recommendations using AI
   */
  async generateRecommendations(
    employee: {
      userId: string;
      currentSalary: number;
      performanceRating?: number;
      yearsInRole?: number;
      jobTitle: string;
      department: string;
    },
    context: {
      salaryRange: { min: number; max: number };
      marketData?: { p50: number; p75: number; p90: number };
      budgetAvailable: number;
      peerComparisons?: Array<{ salary: number; title: string }>;
    }
  ): Promise<{
    recommendedSalary: number;
    rationale: string;
    alternatives: Array<{ salary: number; scenario: string }>;
  }> {
    const prompt = `You are a compensation strategy AI. Generate a salary recommendation for this employee.

<employee>
${JSON.stringify(employee, null, 2)}
</employee>

<context>
${JSON.stringify(context, null, 2)}
</context>

Consider:
1. Current position in salary range (compa-ratio)
2. Performance rating
3. Market competitiveness
4. Internal equity with peers
5. Budget constraints
6. Time in role and career progression

Respond with JSON:
{
  "recommendedSalary": number,
  "rationale": "detailed explanation of the recommendation",
  "alternatives": [
    { "salary": number, "scenario": "if budget constrained" },
    { "salary": number, "scenario": "if retention critical" }
  ]
}

Respond ONLY with JSON.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      return JSON.parse(responseText);
    } catch (error) {
      console.error('[AI Recommend] Error:', error);
      throw new Error(`Failed to generate recommendations: ${error}`);
    }
  }

  /**
   * Build transformation prompt
   */
  private buildTransformationPrompt(
    worksheets: CompensationWorksheet[],
    context: any,
    options: AITransformationOptions
  ): string {
    return `You are a data transformation AI for compensation management. Transform and enrich this compensation data.

<input_data>
${JSON.stringify(worksheets, null, 2)}
</input_data>

<context>
${JSON.stringify(context, null, 2)}
</context>

<options>
${JSON.stringify(options, null, 2)}
</options>

Tasks:
1. Ensure all calculations are correct (salary increase = proposed - current)
2. Calculate increase percentages
3. Apply any transformation rules provided
4. Enrich with missing data if possible
5. Standardize formats (dates, currency)
6. Flag any data quality issues

Respond with a JSON array of transformed CompensationWorksheet objects.
Respond ONLY with the JSON array, no additional text.`;
  }

  /**
   * Parse AI response into worksheets
   */
  private parseAIResponse(response: string): CompensationWorksheet[] {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonString.trim());
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('[AI Transform] Failed to parse response:', error);
      throw new Error('Failed to parse AI transformation response');
    }
  }

  /**
   * Batch process large datasets
   */
  async batchTransform(
    worksheets: CompensationWorksheet[],
    batchSize: number = 100
  ): Promise<CompensationWorksheet[]> {
    const results: CompensationWorksheet[] = [];

    for (let i = 0; i < worksheets.length; i += batchSize) {
      const batch = worksheets.slice(i, i + batchSize);
      console.log(`[AI Transform] Processing batch ${i / batchSize + 1} of ${Math.ceil(worksheets.length / batchSize)}`);

      const transformed = await this.transformWorksheets(batch, {});
      results.push(...transformed);
    }

    return results;
  }
}
