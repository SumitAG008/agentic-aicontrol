// Authentication Middleware
// Handles JWT verification and tenant context

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { TenantContext, JWTPayload, UserRole } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      context?: TenantContext;
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT and sets user context
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization header provided',
        },
      });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization header format',
        },
      });
    }

    const payload = authService.verifyToken(token);

    // Set user and context on request
    req.user = payload;
    req.context = {
      tenantId: payload.tenantId,
      userId: payload.userId,
      userRole: payload.role,
      permissions: [], // Could be loaded from DB if needed
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
    }

    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed token',
      },
    });
  }
}

/**
 * Optional authentication - sets context if token present, continues if not
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      const payload = authService.verifyToken(token);
      req.user = payload;
      req.context = {
        tenantId: payload.tenantId,
        userId: payload.userId,
        userRole: payload.role,
        permissions: [],
      };
    }
  } catch {
    // Ignore token errors for optional auth
  }

  next();
}

/**
 * Role-based access control middleware
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.context) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.context.userRole)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Requires role: ${roles.join(' or ')}`,
        },
      });
    }

    next();
  };
}

/**
 * Development-only mock auth - creates a demo context
 * Use this for testing without real authentication
 */
export function mockAuth(req: Request, res: Response, next: NextFunction) {
  // In development, use mock tenant/user if no auth provided
  if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
    req.context = {
      tenantId: 'demo-tenant-id',
      userId: 'demo-user-id',
      userRole: 'ADMIN',
      permissions: ['*'],
    };
    req.user = {
      userId: 'demo-user-id',
      email: 'demo@example.com',
      tenantId: 'demo-tenant-id',
      role: 'ADMIN',
    };
  }

  next();
}

/**
 * Tenant isolation check - ensures user can only access their tenant's data
 */
export function ensureTenant(paramName: string = 'tenantId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.context) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const requestedTenantId = req.params[paramName] || req.body?.tenantId;

    if (requestedTenantId && requestedTenantId !== req.context.tenantId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot access resources from another tenant',
        },
      });
    }

    next();
  };
}
