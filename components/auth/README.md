# Authentication System

This folder contains all authentication-related components for the ALFI CRM application.

## Overview

The authentication system uses:
- **NextAuth v5** (Auth.js) for authentication
- **Prisma** for database access
- **bcryptjs** for password hashing
- **JWT** for session management
- **Zod** for validation

## Components

### LoginForm
The main login form component with email/password authentication.

**Features:**
- Email and password validation
- Error handling with user-friendly messages
- Loading states
- Forgot password link
- Redirect to callback URL after login

**Usage:**
```tsx
import { LoginForm } from '@/components/auth'

<LoginForm />
```

## Authentication Flow

1. User enters email and password
2. Form validates input with Zod
3. NextAuth credentials provider checks:
   - SuperAdmin table first
   - Then User table
   - Verifies password with bcrypt
   - Checks account status
4. JWT token is created with user data
5. Session is established
6. User is redirected to dashboard

## API Routes

### POST /api/auth/signin
Handles login requests via NextAuth.

### POST /api/auth/signout
Handles logout requests.

### GET /api/auth/session
Returns current session data.

## Middleware

The middleware (`middleware.ts`) protects routes:
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login`
- Preserves callback URL for post-login redirect

## User Types

### SuperAdmin
- Full system access
- No cabinet association
- Roles: OWNER, ADMIN, DEVELOPER, SUPPORT

### Regular User
- Cabinet-specific access
- Roles: ADMIN, ADVISOR, ASSISTANT
- Multi-tenant isolation via cabinetId

## Session Data

The session contains:
```typescript
{
  user: {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    role: string
    cabinetId: string | null
    cabinetName?: string
    cabinetSlug?: string
    isSuperAdmin: boolean
  }
}
```

## Testing

### Create Test Users

Run the test script to create test accounts:

```bash
npm run tsx scripts/test-auth.ts
```

This creates:
- SuperAdmin: `admin@alfi-crm.com` / `admin123456`
- Advisor: `advisor@test-cabinet.com` / `user123456`

### Manual Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Use test credentials to login
4. Verify redirect to dashboard
5. Check session data in browser DevTools

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT sessions (7 day expiry)
- ✅ Account status checking
- ✅ Cabinet status validation
- ✅ Protected routes via middleware
- ✅ CSRF protection (NextAuth built-in)
- ✅ Secure cookies (httpOnly, sameSite)

## Error Handling

The system handles various error cases:
- Invalid credentials
- Account not active
- Cabinet suspended
- No user found
- Invalid email format
- Password too short

All errors are mapped to user-friendly French messages.

## Integration with Existing Code

The authentication system integrates with:
- `lib/auth-helpers.ts` - Updated to use NextAuth
- `lib/auth-types.ts` - Existing types preserved
- `lib/prisma.ts` - RLS context setting
- All API routes using `requireAuth()`

## Next Steps

### Recommended Enhancements

1. **Password Reset Flow**
   - Forgot password page
   - Email with reset token
   - Reset password page

2. **Email Verification**
   - Send verification email on signup
   - Verify email before allowing login

3. **Two-Factor Authentication**
   - TOTP support
   - Backup codes

4. **OAuth Providers**
   - Google Sign-In
   - Microsoft Sign-In

5. **Account Locking**
   - Lock after N failed attempts
   - Unlock after time period

6. **Audit Logging**
   - Log all login attempts
   - Log password changes
   - Log session activity

## Troubleshooting

### "Invalid credentials" error
- Check password is correct
- Verify user exists in database
- Check account is active

### Redirect loop
- Clear cookies
- Check middleware configuration
- Verify callback URL

### Session not persisting
- Check NEXTAUTH_SECRET is set
- Verify cookies are enabled
- Check domain configuration

## Environment Variables

Required in `.env`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=your-database-url
DIRECT_URL=your-direct-url
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Dependencies

Required packages (add to package.json):

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.4",
    "bcryptjs": "^3.0.3",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

Install with:
```bash
npm install next-auth@beta @auth/prisma-adapter
```
