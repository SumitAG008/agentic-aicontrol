# Meldra Login System - Setup Guide

## Overview

This document explains how the meldra login system is configured to work with **different URLs for demo and production environments**.

---

## 🌐 URL Structure

### **Demo Environment**
- **Frontend**: `https://demo.meldra.ai`
- **Backend API**: `https://demo-api.meldra.ai`
- **Purpose**: Testing, demonstrations, sandbox environment

### **Production Environment**
- **Frontend**: `https://app.meldra.ai` (or `https://login.meldra.ai`)
- **Backend API**: `https://api.meldra.ai`
- **Purpose**: Live production system

### **Local Development**
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`

---

## 📁 Files Created

### Frontend (Next.js)
```
frontend/
├── src/app/login/
│   ├── page.tsx          # Login page component
│   └── login.css         # Login styles (Modern Clean design)
├── .env.example          # Template for environment variables
├── .env.demo             # Demo environment configuration
└── .env.production       # Production environment configuration
```

### Backend (Express.js)
```
backend/
└── src/routes/
    └── auth.ts           # Authentication endpoints
```

---

## 🔧 Environment Configuration

### `.env.example` (Template)
```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="meldra"

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### `.env.demo` (Demo Environment)
```env
NEXT_PUBLIC_APP_URL=https://demo.meldra.ai
NEXT_PUBLIC_APP_NAME="meldra"
NEXT_PUBLIC_ENVIRONMENT=demo
NEXT_PUBLIC_API_URL=https://demo-api.meldra.ai
```

### `.env.production` (Production Environment)
```env
NEXT_PUBLIC_APP_URL=https://app.meldra.ai
NEXT_PUBLIC_APP_NAME="meldra"
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_API_URL=https://api.meldra.ai
```

---

## 🚀 Deployment

### **Local Development**
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

Access at: `http://localhost:3000/login`

### **Deploy to Demo**
```bash
# Frontend
cd frontend
cp .env.demo .env
npm run build
# Deploy to demo.meldra.ai

# Backend
cd backend
# Set environment variables on demo server
# Deploy to demo-api.meldra.ai
```

### **Deploy to Production**
```bash
# Frontend
cd frontend
cp .env.production .env
npm run build
# Deploy to app.meldra.ai

# Backend
cd backend
# Set environment variables on production server
# Deploy to api.meldra.ai
```

---

## 🔐 Authentication Flow

### 1. **User visits login page**
- Demo: `https://demo.meldra.ai/login`
- Production: `https://app.meldra.ai/login`

### 2. **User enters credentials**
- Email: `demo@meldra.ai`
- Password: `demo123` (for demo only)

### 3. **Frontend sends request to API**
```javascript
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password, rememberMe })
})
```

### 4. **Backend validates and returns JWT token**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "demo@meldra.ai",
    "firstName": "Demo",
    "lastName": "User"
  }
}
```

### 5. **Frontend stores token and redirects**
- Token stored in `localStorage` (if "Remember me" checked)
- Or `sessionStorage` (for single session)
- Redirects to `/dashboard`

---

## 🎨 Login Page Features

### ✅ **Modern Clean Design**
- Meldra branding always visible
- Clean card-based layout
- Responsive (mobile & desktop)
- Light & dark theme support

### ✅ **Form Features**
- Email/password inputs
- Show/hide password toggle
- "Remember me" checkbox
- "Forgot password?" link
- Error message display
- Loading states
- Form validation

### ✅ **No Demo Button**
- Clean, production-ready design
- Same UI for both demo and production
- Different backends handle environment separation

---

## 🔒 Security Features

### **Password Hashing**
- Uses `bcryptjs` for password hashing
- Salt rounds: 10

### **JWT Tokens**
- Secure token generation
- Configurable expiration (24h or 7d)
- Secret key from environment variable

### **HTTPS Required**
- All production/demo traffic over HTTPS
- Secure cookie handling

---

## 📝 API Endpoints

### **POST /api/auth/login**
Login user and return JWT token

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "1",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### **POST /api/auth/register**
Register new user

### **POST /api/auth/verify**
Verify JWT token validity

### **POST /api/auth/logout**
Logout user (client-side clears token)

---

## 🧪 Testing

### **Demo Login Credentials**
```
Email: demo@meldra.ai
Password: demo123
```

### **Test Locally**
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Visit: http://localhost:3000/login
```

---

## 🎯 Next Steps

### **Immediate**
1. ✅ Login page created with Modern Clean design
2. ✅ Environment configuration set up
3. ✅ Backend authentication routes created
4. ✅ Meldra branding integrated

### **To Do**
1. **Set up real user database** (replace mock users in `auth.ts`)
2. **Implement "Forgot Password" flow**
3. **Create sign-up page** at `/signup`
4. **Add protected route middleware** for dashboard
5. **Configure actual domain names** (demo.meldra.ai, api.meldra.ai)
6. **Set up SSL certificates** for HTTPS
7. **Add social login** (Google, GitHub, etc.) - optional
8. **Add 2FA/MFA** - optional

---

## 🆘 Troubleshooting

### **CORS Issues**
Make sure backend allows frontend domain:
```javascript
app.use(cors({
  origin: ['https://demo.meldra.ai', 'https://app.meldra.ai'],
  credentials: true
}));
```

### **API Not Reachable**
Check environment variable is set correctly:
```bash
echo $NEXT_PUBLIC_API_URL
```

### **Token Not Persisting**
Check browser console for localStorage/sessionStorage errors

---

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [JWT Authentication Best Practices](https://jwt.io/introduction)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)

---

## 🎨 Design Samples

All 4 design samples are available:
1. **Modern Clean** (✅ Implemented) - Clean card design
2. **Premium Gradient** - Split-screen with gradient
3. **Dark Professional** - Glassmorphic card
4. **Minimalist** - Ultra-clean underline inputs

The Modern Clean design is now integrated into your Next.js app at `/login`.

---

**Built with ❤️ for meldra - Zero-Replication Lakehouse**
