// Auth Service - Authentication and user management

import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, Prisma } from '@prisma/client';
import { CreateUserInput, LoginInput, RegisterInput } from '../lib/validators';
import { TenantContext, JWTPayload, AuthTokens } from '../types';
import { tenantService } from './tenant.service';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Register a new tenant with owner user
   */
  async register(data: RegisterInput): Promise<AuthTokens & { user: { id: string; email: string; name: string; tenantId: string } }> {
    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if tenant slug is taken
    const existingTenant = await tenantService.getBySlug(data.tenantSlug);
    if (existingTenant) {
      throw new Error('Organization slug already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug,
          plan: 'STARTER',
          industry: 'hrtech', // Default for HRTech focus
          limits: {
            maxAgents: 3,
            maxUsers: 5,
            maxExecutionsPerMonth: 100,
            storageGB: 1,
          },
          settings: {
            theme: 'dark',
            timezone: 'UTC',
            language: 'en',
            notifications: { email: true, slack: false, inApp: true },
          },
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: 'OWNER',
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    // Generate tokens
    const tokens = this.generateTokens({
      userId: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: result.user.role,
    });

    return {
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        tenantId: result.tenant.id,
      },
    };
  }

  /**
   * Login with email and password
   */
  async login(data: LoginInput): Promise<AuthTokens & { user: { id: string; email: string; name: string; tenantId: string; role: UserRole } }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role,
      },
    };
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      accessToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });
  }

  /**
   * Create a new user (for existing tenant)
   */
  async createUser(ctx: TenantContext, data: CreateUserInput) {
    // Check limits
    const limitCheck = await tenantService.checkLimits(ctx.tenantId, 'users');
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.reason);
    }

    // Check if email is taken
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        avatar: data.avatar,
        role: data.role || 'VIEWER',
        tenantId: ctx.tenantId,
      },
    });
  }

  /**
   * List users in tenant
   */
  async listUsers(ctx: TenantContext, page: number = 1, pageSize: number = 20) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: ctx.tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          lastLoginAt: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where: { tenantId: ctx.tenantId } }),
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update user
   */
  async updateUser(ctx: TenantContext, userId: string, data: { name?: string; avatar?: string; role?: UserRole; isActive?: boolean }) {
    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: ctx.tenantId,
      },
    });

    if (!user) {
      return null;
    }

    // Prevent downgrading owner
    if (user.role === 'OWNER' && data.role && data.role !== 'OWNER') {
      throw new Error('Cannot change owner role');
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }
}

export const authService = new AuthService();
