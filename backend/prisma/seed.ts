// Seed Data for AI Control Room
// Focus: HR/CRM Domain with Compensation, Payroll, Time Off, and ERP Integration

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================================================
  // 1. CREATE DEMO TENANT
  // ============================================================================
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-hrtech' },
    update: {},
    create: {
      name: 'Demo HRTech Company',
      slug: 'demo-hrtech',
      logo: '/logos/demo-hrtech.svg',
      plan: 'PROFESSIONAL',
      industry: 'hrtech',
      size: 'medium',
      limits: {
        maxAgents: 25,
        maxUsers: 25,
        maxExecutionsPerMonth: 5000,
        storageGB: 10,
      },
      settings: {
        theme: 'dark',
        timezone: 'America/New_York',
        language: 'en',
        notifications: {
          email: true,
          slack: true,
          inApp: true,
        },
      },
    },
  });
  console.log(`✅ Created tenant: ${tenant.name}`);

  // ============================================================================
  // 2. CREATE DEMO USER
  // ============================================================================
  const passwordHash = await bcrypt.hash('demo123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@hrtech.example.com' },
    update: {},
    create: {
      email: 'demo@hrtech.example.com',
      passwordHash,
      name: 'Demo Admin',
      avatar: '/avatars/demo-admin.jpg',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // ============================================================================
  // 3. CREATE HR/CRM TOOLS - Including ERP Integration Tools
  // ============================================================================
  const tools = await Promise.all([
    // Communication Tools
    prisma.tool.upsert({
      where: { slug: 'slack' },
      update: {},
      create: {
        name: 'Slack',
        slug: 'slack',
        description: 'Team messaging and collaboration platform',
        icon: 'slack',
        category: 'COMMUNICATION',
        provider: 'Slack Technologies',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string' },
            message: { type: 'string' },
          },
        },
        rateLimit: { requests: 50, window: 60 },
        documentation: 'https://api.slack.com/docs',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'ms-teams' },
      update: {},
      create: {
        name: 'Microsoft Teams',
        slug: 'ms-teams',
        description: 'Enterprise collaboration and communication',
        icon: 'microsoft',
        category: 'COMMUNICATION',
        provider: 'Microsoft',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            teamId: { type: 'string' },
            channelId: { type: 'string' },
            message: { type: 'string' },
          },
        },
        rateLimit: { requests: 30, window: 60 },
        documentation: 'https://docs.microsoft.com/en-us/graph/teams-concept-overview',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'email-smtp' },
      update: {},
      create: {
        name: 'Email (SMTP)',
        slug: 'email-smtp',
        description: 'Send emails via SMTP server',
        icon: 'mail',
        category: 'COMMUNICATION',
        provider: 'Generic',
        authType: 'BASIC',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string' },
            subject: { type: 'string' },
            body: { type: 'string' },
            html: { type: 'boolean' },
          },
          required: ['to', 'subject', 'body'],
        },
        rateLimit: { requests: 100, window: 3600 },
      },
    }),

    // HR/ATS Tools
    prisma.tool.upsert({
      where: { slug: 'greenhouse' },
      update: {},
      create: {
        name: 'Greenhouse',
        slug: 'greenhouse',
        description: 'Applicant Tracking System for recruiting',
        icon: 'greenhouse',
        category: 'HRTECH',
        provider: 'Greenhouse Software',
        authType: 'API_KEY',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['list_candidates', 'get_candidate', 'update_stage', 'add_note'] },
            candidateId: { type: 'string' },
            jobId: { type: 'string' },
          },
        },
        rateLimit: { requests: 50, window: 60 },
        documentation: 'https://developers.greenhouse.io/harvest.html',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'lever' },
      update: {},
      create: {
        name: 'Lever',
        slug: 'lever',
        description: 'Modern recruiting platform',
        icon: 'lever',
        category: 'HRTECH',
        provider: 'Lever',
        authType: 'API_KEY',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['list_opportunities', 'get_opportunity', 'advance_stage'] },
            opportunityId: { type: 'string' },
          },
        },
        rateLimit: { requests: 50, window: 60 },
        documentation: 'https://hire.lever.co/developer/documentation',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'workday' },
      update: {},
      create: {
        name: 'Workday',
        slug: 'workday',
        description: 'Enterprise HRIS, Payroll, and Finance',
        icon: 'workday',
        category: 'HRTECH',
        provider: 'Workday',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['get_employee', 'list_employees', 'get_compensation', 'get_timeoff'] },
            employeeId: { type: 'string' },
            workerId: { type: 'string' },
          },
        },
        rateLimit: { requests: 100, window: 60 },
        documentation: 'https://community.workday.com/api',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'bamboohr' },
      update: {},
      create: {
        name: 'BambooHR',
        slug: 'bamboohr',
        description: 'HR software for small and medium businesses',
        icon: 'bamboo',
        category: 'HRTECH',
        provider: 'BambooHR',
        authType: 'API_KEY',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['get_employee', 'list_employees', 'get_timeoff', 'request_timeoff'] },
            employeeId: { type: 'number' },
          },
        },
        rateLimit: { requests: 100, window: 60 },
        documentation: 'https://documentation.bamboohr.com/reference',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'adp' },
      update: {},
      create: {
        name: 'ADP Workforce Now',
        slug: 'adp',
        description: 'Payroll and HR management platform',
        icon: 'adp',
        category: 'HRTECH',
        provider: 'ADP',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['get_worker', 'get_payroll', 'get_benefits', 'get_timeoff_balance'] },
            associateOID: { type: 'string' },
          },
        },
        rateLimit: { requests: 50, window: 60 },
        documentation: 'https://developers.adp.com/',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'gusto' },
      update: {},
      create: {
        name: 'Gusto',
        slug: 'gusto',
        description: 'Modern payroll, benefits, and HR',
        icon: 'gusto',
        category: 'HRTECH',
        provider: 'Gusto',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['get_employee', 'list_employees', 'get_payroll', 'get_benefits'] },
            employeeId: { type: 'string' },
            companyId: { type: 'string' },
          },
        },
        rateLimit: { requests: 60, window: 60 },
        documentation: 'https://docs.gusto.com/',
      },
    }),

    // CRM Tools
    prisma.tool.upsert({
      where: { slug: 'salesforce' },
      update: {},
      create: {
        name: 'Salesforce',
        slug: 'salesforce',
        description: 'Enterprise CRM platform',
        icon: 'salesforce',
        category: 'HRTECH',
        provider: 'Salesforce',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['query', 'get_record', 'create_record', 'update_record'] },
            sobject: { type: 'string' },
            recordId: { type: 'string' },
            fields: { type: 'object' },
          },
        },
        rateLimit: { requests: 100, window: 60 },
        documentation: 'https://developer.salesforce.com/docs',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'hubspot' },
      update: {},
      create: {
        name: 'HubSpot',
        slug: 'hubspot',
        description: 'CRM, Marketing, and Sales platform',
        icon: 'hubspot',
        category: 'HRTECH',
        provider: 'HubSpot',
        authType: 'API_KEY',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['get_contact', 'list_contacts', 'create_contact', 'create_deal'] },
            contactId: { type: 'string' },
          },
        },
        rateLimit: { requests: 100, window: 10 },
        documentation: 'https://developers.hubspot.com/docs/api',
      },
    }),

    // Data Tools
    prisma.tool.upsert({
      where: { slug: 'postgresql' },
      update: {},
      create: {
        name: 'PostgreSQL',
        slug: 'postgresql',
        description: 'Query PostgreSQL databases',
        icon: 'database',
        category: 'DATA',
        provider: 'PostgreSQL',
        authType: 'CUSTOM',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            parameters: { type: 'array' },
          },
          required: ['query'],
        },
        rateLimit: { requests: 200, window: 60 },
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'google-sheets' },
      update: {},
      create: {
        name: 'Google Sheets',
        slug: 'google-sheets',
        description: 'Read and write to Google Sheets',
        icon: 'sheets',
        category: 'DATA',
        provider: 'Google',
        authType: 'OAUTH2',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['read', 'write', 'append'] },
            spreadsheetId: { type: 'string' },
            range: { type: 'string' },
            values: { type: 'array' },
          },
        },
        rateLimit: { requests: 100, window: 100 },
        documentation: 'https://developers.google.com/sheets/api',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'notion' },
      update: {},
      create: {
        name: 'Notion',
        slug: 'notion',
        description: 'Documentation and knowledge base',
        icon: 'notion',
        category: 'DATA',
        provider: 'Notion',
        authType: 'BEARER',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['query_database', 'get_page', 'create_page', 'update_page'] },
            databaseId: { type: 'string' },
            pageId: { type: 'string' },
          },
        },
        rateLimit: { requests: 3, window: 1 },
        documentation: 'https://developers.notion.com/',
      },
    }),

    // API Integration Tools (Smart API-based approaches)
    prisma.tool.upsert({
      where: { slug: 'doc-reader' },
      update: {},
      create: {
        name: 'Documentation Reader',
        slug: 'doc-reader',
        description: 'Fetch and analyze ERP/CRM documentation to understand API capabilities',
        icon: 'book-open',
        category: 'INTEGRATION',
        provider: 'Built-in',
        authType: 'NONE',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['fetch_docs', 'search_api', 'get_endpoints', 'get_auth_guide'] },
            system: { enum: ['workday', 'bamboohr', 'greenhouse', 'lever', 'adp', 'gusto', 'salesforce'] },
            topic: { type: 'string' },
          },
        },
        rateLimit: { requests: 30, window: 60 },
        documentation: 'Internal tool for reading vendor documentation',
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'api-tester' },
      update: {},
      create: {
        name: 'API Connection Tester',
        slug: 'api-tester',
        description: 'Test API connections and validate credentials for ERP/CRM systems',
        icon: 'plug',
        category: 'INTEGRATION',
        provider: 'Built-in',
        authType: 'NONE',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['test_connection', 'validate_credentials', 'check_permissions'] },
            system: { type: 'string' },
            credentials: { type: 'object' },
          },
        },
        rateLimit: { requests: 20, window: 60 },
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'webhook-receiver' },
      update: {},
      create: {
        name: 'Webhook Receiver',
        slug: 'webhook-receiver',
        description: 'Receive real-time data from ERP/CRM systems via webhooks',
        icon: 'webhook',
        category: 'INTEGRATION',
        provider: 'Built-in',
        authType: 'API_KEY',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['create_endpoint', 'get_data', 'ack_message'] },
            endpointId: { type: 'string' },
          },
        },
        rateLimit: { requests: 1000, window: 60 },
      },
    }),
    prisma.tool.upsert({
      where: { slug: 'data-transformer' },
      update: {},
      create: {
        name: 'Data Transformer',
        slug: 'data-transformer',
        description: 'Transform data between different ERP/CRM formats via API',
        icon: 'shuffle',
        category: 'INTEGRATION',
        provider: 'Built-in',
        authType: 'NONE',
        isBuiltIn: true,
        inputSchema: {
          type: 'object',
          properties: {
            action: { enum: ['transform', 'map_fields', 'validate_schema'] },
            sourceFormat: { type: 'string' },
            targetFormat: { type: 'string' },
            data: { type: 'object' },
            mapping: { type: 'object' },
          },
        },
        rateLimit: { requests: 100, window: 60 },
      },
    }),
  ]);
  console.log(`✅ Created ${tools.length} tools`);

  // ============================================================================
  // 4. CREATE HR/CRM DOMAIN PACKS
  // ============================================================================
  const hrCrmPack = await prisma.domainPack.upsert({
    where: { slug: 'hr-recruiting' },
    update: {},
    create: {
      name: 'HR & Recruiting',
      slug: 'hr-recruiting',
      description: 'Complete HR automation including recruiting, onboarding, and employee management',
      icon: 'users',
      category: 'HR_CRM',
      industry: 'recruiting',
      isOfficial: true,
      toolSuggestions: ['greenhouse', 'lever', 'bamboohr', 'slack', 'email-smtp'],
      agentTemplates: [
        {
          name: 'Resume Screener',
          description: 'AI-powered resume screening and candidate ranking',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.3,
            systemPrompt: 'You are an expert HR recruiter. Screen resumes against job requirements and provide detailed assessments.',
          },
          hrConfig: {
            resumeScreening: true,
            candidateSourcing: false,
          },
        },
        {
          name: 'Interview Scheduler',
          description: 'Automate interview scheduling across time zones',
          configuration: {
            model: 'claude-3-haiku',
            temperature: 0.2,
            systemPrompt: 'You are an interview scheduling assistant. Coordinate interviews efficiently across multiple time zones.',
          },
        },
        {
          name: 'Candidate Communicator',
          description: 'Personalized candidate outreach and follow-ups',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.7,
            systemPrompt: 'You are a friendly recruiting coordinator. Write personalized, professional communications to candidates.',
          },
        },
      ],
    },
  });

  const compensationPack = await prisma.domainPack.upsert({
    where: { slug: 'compensation-payroll' },
    update: {},
    create: {
      name: 'Compensation & Payroll',
      slug: 'compensation-payroll',
      description: 'Payroll processing, compensation analysis, and benefits administration',
      icon: 'dollar-sign',
      category: 'HR_CRM',
      industry: 'payroll',
      isOfficial: true,
      toolSuggestions: ['workday', 'adp', 'gusto', 'google-sheets', 'email-smtp'],
      agentTemplates: [
        {
          name: 'Payroll Auditor',
          description: 'Audit payroll data for errors and compliance issues',
          configuration: {
            model: 'claude-3-opus',
            temperature: 0.1,
            systemPrompt: 'You are a payroll compliance expert. Carefully review payroll data for errors, missing information, and compliance issues.',
          },
        },
        {
          name: 'Compensation Analyst',
          description: 'Analyze compensation data and generate market benchmarks',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.4,
            systemPrompt: 'You are a compensation analyst. Analyze salary data, identify trends, and provide market benchmarking insights.',
          },
        },
        {
          name: 'Benefits Enrollment Assistant',
          description: 'Guide employees through benefits selection',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.5,
            systemPrompt: 'You are a benefits counselor. Help employees understand and select appropriate benefits packages.',
          },
        },
      ],
    },
  });

  const timeOffPack = await prisma.domainPack.upsert({
    where: { slug: 'time-attendance' },
    update: {},
    create: {
      name: 'Time & Attendance',
      slug: 'time-attendance',
      description: 'Time off management, attendance tracking, and scheduling',
      icon: 'calendar',
      category: 'HR_CRM',
      industry: 'workforce-management',
      isOfficial: true,
      toolSuggestions: ['bamboohr', 'workday', 'slack', 'google-sheets'],
      agentTemplates: [
        {
          name: 'PTO Request Handler',
          description: 'Process and route time off requests automatically',
          configuration: {
            model: 'claude-3-haiku',
            temperature: 0.2,
            systemPrompt: 'You are a time off coordinator. Process PTO requests, check balances, and coordinate approvals.',
          },
        },
        {
          name: 'Attendance Monitor',
          description: 'Track attendance patterns and flag issues',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.3,
            systemPrompt: 'You are an attendance analyst. Monitor attendance data, identify patterns, and flag potential issues.',
          },
        },
        {
          name: 'Schedule Optimizer',
          description: 'Create and optimize team schedules',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.4,
            systemPrompt: 'You are a scheduling expert. Create optimal schedules considering availability, skills, and workload.',
          },
        },
      ],
    },
  });

  const employeeServicesPack = await prisma.domainPack.upsert({
    where: { slug: 'employee-services' },
    update: {},
    create: {
      name: 'Employee Self-Service',
      slug: 'employee-services',
      description: 'Employee queries, policy Q&A, and HR service desk automation',
      icon: 'help-circle',
      category: 'HR_CRM',
      industry: 'employee-experience',
      isOfficial: true,
      toolSuggestions: ['slack', 'ms-teams', 'notion', 'bamboohr'],
      agentTemplates: [
        {
          name: 'HR Policy Assistant',
          description: 'Answer employee questions about HR policies',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.3,
            systemPrompt: 'You are an HR policy expert. Answer employee questions accurately based on company policies.',
          },
          hrConfig: {
            policyQA: true,
          },
        },
        {
          name: 'Onboarding Buddy',
          description: 'Guide new hires through onboarding process',
          configuration: {
            model: 'claude-3-sonnet',
            temperature: 0.6,
            systemPrompt: 'You are a friendly onboarding guide. Help new employees navigate their first days and answer common questions.',
          },
          hrConfig: {
            employeeOnboarding: true,
          },
        },
        {
          name: 'IT Support Triage',
          description: 'Triage IT support requests and route appropriately',
          configuration: {
            model: 'claude-3-haiku',
            temperature: 0.2,
            systemPrompt: 'You are an IT support assistant. Categorize support requests and provide initial troubleshooting.',
          },
        },
      ],
    },
  });

  console.log('✅ Created HR/CRM domain packs');

  // ============================================================================
  // 5. CREATE SAMPLE AGENTS
  // ============================================================================
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: 'Resume Screener Pro',
        description: 'AI-powered resume screening with automatic candidate ranking based on job requirements',
        avatar: '/avatars/agent-resume.svg',
        status: 'RUNNING',
        tenantId: tenant.id,
        createdById: user.id,
        domainPackId: hrCrmPack.id,
        configuration: {
          model: 'claude-3-sonnet',
          temperature: 0.3,
          maxTokens: 4096,
          systemPrompt: 'You are an expert HR recruiter with 15 years of experience. Screen resumes against job requirements and provide detailed assessments with specific reasons for your rankings.',
          tools: ['greenhouse', 'lever', 'email-smtp'],
          memory: 'long-term',
          autonomyLevel: 'semi-autonomous',
        },
        schedule: {
          enabled: true,
          cron: '0 8 * * 1-5',
          timezone: 'America/New_York',
        },
        metrics: {
          totalRuns: 1247,
          successRate: 98.5,
          avgExecutionTime: 2340,
          lastRunAt: new Date().toISOString(),
          tokensUsed: 450000,
          costTotal: 12.50,
        },
        hrConfig: {
          resumeScreening: true,
          candidateSourcing: false,
          integrations: ['greenhouse', 'lever'],
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'Payroll Validator',
        description: 'Automated payroll data validation and error detection before processing',
        avatar: '/avatars/agent-payroll.svg',
        status: 'IDLE',
        tenantId: tenant.id,
        createdById: user.id,
        domainPackId: compensationPack.id,
        configuration: {
          model: 'claude-3-opus',
          temperature: 0.1,
          maxTokens: 8192,
          systemPrompt: 'You are a payroll compliance expert. Carefully review all payroll data for errors, missing information, duplicate entries, and compliance issues. Flag any discrepancies with specific details.',
          tools: ['workday', 'adp', 'google-sheets'],
          memory: 'short-term',
          autonomyLevel: 'supervised',
        },
        schedule: {
          enabled: true,
          cron: '0 6 1,15 * *',
          timezone: 'America/New_York',
        },
        metrics: {
          totalRuns: 52,
          successRate: 100,
          avgExecutionTime: 45000,
          lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          tokensUsed: 125000,
          costTotal: 8.75,
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'PTO Manager',
        description: 'Handles time off requests, checks balances, and coordinates approvals',
        avatar: '/avatars/agent-calendar.svg',
        status: 'RUNNING',
        tenantId: tenant.id,
        createdById: user.id,
        domainPackId: timeOffPack.id,
        configuration: {
          model: 'claude-3-haiku',
          temperature: 0.2,
          maxTokens: 2048,
          systemPrompt: 'You are a time off coordinator. Process PTO requests efficiently, verify balances, check for conflicts, and route approvals to managers.',
          tools: ['bamboohr', 'slack', 'google-sheets'],
          memory: 'short-term',
          autonomyLevel: 'autonomous',
        },
        schedule: {
          enabled: false,
          cron: null,
          timezone: 'America/New_York',
        },
        metrics: {
          totalRuns: 423,
          successRate: 99.5,
          avgExecutionTime: 1200,
          lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          tokensUsed: 85000,
          costTotal: 2.10,
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'HR Policy Assistant',
        description: 'Answers employee questions about company policies and procedures',
        avatar: '/avatars/agent-help.svg',
        status: 'RUNNING',
        tenantId: tenant.id,
        createdById: user.id,
        domainPackId: employeeServicesPack.id,
        configuration: {
          model: 'claude-3-sonnet',
          temperature: 0.4,
          maxTokens: 4096,
          systemPrompt: 'You are a helpful HR assistant. Answer employee questions about company policies accurately and compassionately. If unsure, direct them to the appropriate HR contact.',
          tools: ['slack', 'notion', 'bamboohr'],
          memory: 'long-term',
          autonomyLevel: 'autonomous',
        },
        metrics: {
          totalRuns: 2156,
          successRate: 97.2,
          avgExecutionTime: 1800,
          lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          tokensUsed: 680000,
          costTotal: 18.90,
        },
        hrConfig: {
          policyQA: true,
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'Compensation Benchmarker',
        description: 'Analyzes compensation data and provides market benchmark insights',
        avatar: '/avatars/agent-chart.svg',
        status: 'PAUSED',
        tenantId: tenant.id,
        createdById: user.id,
        domainPackId: compensationPack.id,
        configuration: {
          model: 'claude-3-sonnet',
          temperature: 0.4,
          maxTokens: 8192,
          systemPrompt: 'You are a compensation analyst. Analyze salary data, compare against market benchmarks, identify pay equity issues, and provide actionable recommendations.',
          tools: ['workday', 'google-sheets', 'postgresql'],
          memory: 'long-term',
          autonomyLevel: 'semi-autonomous',
        },
        metrics: {
          totalRuns: 24,
          successRate: 95.8,
          avgExecutionTime: 120000,
          lastRunAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          tokensUsed: 320000,
          costTotal: 22.40,
        },
      },
    }),
    prisma.agent.create({
      data: {
        name: 'New Hire Onboarder',
        description: 'Guides new employees through their first 90 days',
        avatar: '/avatars/agent-wave.svg',
        status: 'IDLE',
        tenantId: tenant.id,
        createdById: user.id,
        domainPackId: employeeServicesPack.id,
        configuration: {
          model: 'claude-3-sonnet',
          temperature: 0.6,
          maxTokens: 4096,
          systemPrompt: 'You are a warm and helpful onboarding buddy. Guide new hires through their first days, answer questions, introduce them to resources, and check in on their progress.',
          tools: ['slack', 'ms-teams', 'notion', 'bamboohr'],
          memory: 'long-term',
          autonomyLevel: 'semi-autonomous',
        },
        metrics: {
          totalRuns: 89,
          successRate: 100,
          avgExecutionTime: 3500,
          lastRunAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          tokensUsed: 156000,
          costTotal: 4.30,
        },
        hrConfig: {
          employeeOnboarding: true,
        },
      },
    }),
  ]);
  console.log(`✅ Created ${agents.length} sample agents`);

  // ============================================================================
  // 6. CREATE SAMPLE RUNS
  // ============================================================================
  const runs = await Promise.all([
    prisma.agentRun.create({
      data: {
        agentId: agents[0].id,
        tenantId: tenant.id,
        status: 'COMPLETED',
        trigger: 'SCHEDULED',
        input: { jobId: 'JOB-2024-001', resumeCount: 45 },
        output: { screened: 45, qualified: 12, rejected: 33 },
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        completedAt: new Date(Date.now() - 28 * 60 * 1000),
        metrics: { duration: 120000, tokensUsed: 3500, toolCalls: 12, cost: 0.095 },
      },
    }),
    prisma.agentRun.create({
      data: {
        agentId: agents[2].id,
        tenantId: tenant.id,
        status: 'COMPLETED',
        trigger: 'MANUAL',
        input: { requestType: 'vacation', employeeId: 'EMP-001', days: 5 },
        output: { approved: true, remainingBalance: 12 },
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        completedAt: new Date(Date.now() - 9 * 60 * 1000),
        metrics: { duration: 45000, tokensUsed: 450, toolCalls: 3, cost: 0.012 },
      },
    }),
    prisma.agentRun.create({
      data: {
        agentId: agents[3].id,
        tenantId: tenant.id,
        status: 'RUNNING',
        trigger: 'EVENT',
        input: { question: 'What is the policy for remote work?', channel: '#hr-questions' },
        startedAt: new Date(Date.now() - 2 * 60 * 1000),
        metrics: { duration: null, tokensUsed: 0, toolCalls: 0, cost: 0 },
      },
    }),
    prisma.agentRun.create({
      data: {
        agentId: agents[0].id,
        tenantId: tenant.id,
        status: 'FAILED',
        trigger: 'MANUAL',
        input: { jobId: 'JOB-2024-002', resumeCount: 12 },
        error: { code: 'TOOL_ERROR', message: 'Greenhouse API rate limit exceeded', toolId: 'greenhouse' },
        startedAt: new Date(Date.now() - 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 59 * 60 * 1000),
        metrics: { duration: 60000, tokensUsed: 500, toolCalls: 1, cost: 0.015 },
      },
    }),
  ]);
  console.log(`✅ Created ${runs.length} sample runs`);

  // ============================================================================
  // 7. CREATE AUDIT LOGS
  // ============================================================================
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: user.id,
        action: 'CREATE',
        resource: 'agent',
        resourceId: agents[0].id,
        changes: { after: { name: agents[0].name } },
        severity: 'INFO',
      },
      {
        tenantId: tenant.id,
        userId: user.id,
        action: 'START',
        resource: 'agent',
        resourceId: agents[0].id,
        changes: { before: { status: 'IDLE' }, after: { status: 'RUNNING' } },
        severity: 'INFO',
      },
      {
        tenantId: tenant.id,
        userId: user.id,
        action: 'LOGIN',
        resource: 'user',
        resourceId: user.id,
        changes: {},
        ip: '192.168.1.1',
        severity: 'INFO',
      },
    ],
  });
  console.log('✅ Created audit logs');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📝 Demo credentials:');
  console.log('   Email: demo@hrtech.example.com');
  console.log('   Password: demo123456');
  console.log('   Tenant: demo-hrtech');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
