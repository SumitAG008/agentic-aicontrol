// Tool Service - Database operations for tools and tenant configurations
// Tools are global, but configurations are per-tenant

import prisma from '../lib/prisma';
import { ToolCategory, ToolStatus, Prisma } from '@prisma/client';
import { ToolFiltersInput } from '../lib/validators';
import { TenantContext } from '../types';

export class ToolService {
  /**
   * List all available tools with optional filters
   */
  async list(filters: ToolFiltersInput) {
    const { category, status, search, page, pageSize } = filters;

    const where: Prisma.ToolWhereInput = {
      ...(category && { category }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        orderBy: [
          { isBuiltIn: 'desc' },
          { name: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tool.count({ where }),
    ]);

    return {
      data: tools,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * List tools with tenant-specific connection status
   */
  async listWithTenantStatus(ctx: TenantContext, filters: ToolFiltersInput) {
    const { category, status, search, page, pageSize } = filters;

    const where: Prisma.ToolWhereInput = {
      ...(category && { category }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          tenantConfigs: {
            where: { tenantId: ctx.tenantId },
            select: {
              isConnected: true,
              lastTestedAt: true,
              lastError: true,
            },
          },
        },
        orderBy: [
          { isBuiltIn: 'desc' },
          { name: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tool.count({ where }),
    ]);

    // Transform to include connection status
    const toolsWithStatus = tools.map(tool => ({
      ...tool,
      isConnected: tool.tenantConfigs[0]?.isConnected || false,
      lastTestedAt: tool.tenantConfigs[0]?.lastTestedAt || null,
      lastError: tool.tenantConfigs[0]?.lastError || null,
      tenantConfigs: undefined, // Remove raw relation
    }));

    return {
      data: toolsWithStatus,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single tool by ID
   */
  async getById(toolId: string) {
    return prisma.tool.findUnique({
      where: { id: toolId },
    });
  }

  /**
   * Get a tool by slug
   */
  async getBySlug(slug: string) {
    return prisma.tool.findUnique({
      where: { slug },
    });
  }

  /**
   * Get tool with tenant configuration
   */
  async getWithTenantConfig(ctx: TenantContext, toolId: string) {
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      include: {
        tenantConfigs: {
          where: { tenantId: ctx.tenantId },
        },
      },
    });

    if (!tool) {
      return null;
    }

    return {
      ...tool,
      tenantConfig: tool.tenantConfigs[0] || null,
      tenantConfigs: undefined,
    };
  }

  /**
   * Update or create tenant tool configuration
   */
  async updateTenantConfig(
    ctx: TenantContext,
    toolId: string,
    data: {
      credentials?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    }
  ) {
    // Verify tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return null;
    }

    const config = await prisma.tenantToolConfig.upsert({
      where: {
        tenantId_toolId: {
          tenantId: ctx.tenantId,
          toolId,
        },
      },
      update: {
        ...(data.credentials && { credentials: data.credentials as Prisma.JsonObject }),
        ...(data.settings && { settings: data.settings as Prisma.JsonObject }),
      },
      create: {
        tenantId: ctx.tenantId,
        toolId,
        credentials: (data.credentials || {}) as Prisma.JsonObject,
        settings: (data.settings || {}) as Prisma.JsonObject,
      },
    });

    return config;
  }

  /**
   * Test tool connection (mock implementation)
   */
  async testConnection(ctx: TenantContext, toolId: string) {
    const config = await prisma.tenantToolConfig.findUnique({
      where: {
        tenantId_toolId: {
          tenantId: ctx.tenantId,
          toolId,
        },
      },
    });

    // Mock test - in production this would actually test the connection
    const success = Math.random() > 0.2; // 80% success rate for demo

    if (config) {
      await prisma.tenantToolConfig.update({
        where: { id: config.id },
        data: {
          isConnected: success,
          lastTestedAt: new Date(),
          lastError: success ? null : 'Connection test failed: timeout',
        },
      });
    } else {
      await prisma.tenantToolConfig.create({
        data: {
          tenantId: ctx.tenantId,
          toolId,
          isConnected: success,
          lastTestedAt: new Date(),
          lastError: success ? null : 'Connection test failed: timeout',
        },
      });
    }

    return {
      success,
      message: success ? 'Connection successful' : 'Connection test failed',
      testedAt: new Date(),
    };
  }

  /**
   * Get tools by category
   */
  async getByCategory(category: ToolCategory) {
    return prisma.tool.findMany({
      where: {
        category,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get HR-specific tools
   */
  async getHRTools() {
    return prisma.tool.findMany({
      where: {
        category: 'HRTECH',
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new tool (admin only)
   */
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    category: ToolCategory;
    provider?: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    authType?: 'NONE' | 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'CUSTOM';
    authSchema?: Record<string, unknown>;
    isBuiltIn?: boolean;
    documentation?: string;
  }) {
    return prisma.tool.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        category: data.category,
        provider: data.provider,
        inputSchema: (data.inputSchema || {}) as Prisma.JsonObject,
        outputSchema: (data.outputSchema || {}) as Prisma.JsonObject,
        authType: data.authType || 'NONE',
        authSchema: (data.authSchema || {}) as Prisma.JsonObject,
        isBuiltIn: data.isBuiltIn || false,
        documentation: data.documentation,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get connected tools count for a tenant
   */
  async getConnectedCount(ctx: TenantContext) {
    return prisma.tenantToolConfig.count({
      where: {
        tenantId: ctx.tenantId,
        isConnected: true,
      },
    });
  }
}

export const toolService = new ToolService();
