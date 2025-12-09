// Auth Routes - Authentication and user management
import { Router } from 'express';
import { authService } from '../services';
import { authenticate, mockAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { LoginSchema, RegisterSchema, CreateUserSchema } from '../lib/validators';

const router = Router();

// POST /api/auth/register - Register new tenant and user
router.post('/register', validateBody(RegisterSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already registered',
          },
        });
      }
      if (error.message === 'Organization slug already taken') {
        return res.status(409).json({
          error: {
            code: 'SLUG_EXISTS',
            message: 'Organization slug already taken',
          },
        });
      }
    }
    next(error);
  }
});

// POST /api/auth/login - Login with email and password
router.post('/login', validateBody(LoginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }
      if (error.message === 'Account is deactivated') {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_DEACTIVATED',
            message: 'Account is deactivated',
          },
        });
      }
    }
    next(error);
  }
});

// Protected routes below
if (process.env.NODE_ENV === 'development') {
  router.use(mockAuth);
}
router.use(authenticate);

// GET /api/auth/me - Get current user
router.get('/me', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await authService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/users - List users in tenant
router.get('/users', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await authService.listUsers(req.context, page, pageSize);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/users - Create new user in tenant
router.post('/users', validateBody(CreateUserSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await authService.createUser(req.context, req.body);

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already registered',
          },
        });
      }
      if (error.message.includes('limit reached')) {
        return res.status(403).json({
          error: {
            code: 'LIMIT_REACHED',
            message: error.message,
          },
        });
      }
    }
    next(error);
  }
});

export { router as authRoutes };
