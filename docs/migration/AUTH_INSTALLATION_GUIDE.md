# Authentication Installation Guide

## Quick Start

Follow these steps to complete the authentication setup:

### 1. Install Dependencies

```bash
cd alfi-crm
npm install next-auth@beta @auth/prisma-adapter
```

### 2. Generate NEXTAUTH_SECRET

```bash
# Generate a secure secret
openssl rand -base64 32
```

Copy the output and add to your `.env` file:

```env
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Create Test Accounts

```bash
npm run tsx scripts/test-auth.ts
```

This will create:
- SuperAdmin: `admin@alfi-crm.com` / `admin123456`
- Advisor: `advisor@test-cabinet.com` / `user123456`

### 4. Start Development Server

```bash
npm run dev
```

### 5. Test Login

Navigate to: `http://localhost:3000/login`

Try logging in with the test credentials.

## Verification Checklist

- [ ] Dependencies installed
- [ ] NEXTAUTH_SECRET set in .env
- [ ] Test accounts created
- [ ] Can access /login page
- [ ] Can login with SuperAdmin
- [ ] Redirected to /dashboard after login
- [ ] Can logout
- [ ] Can login with Advisor
- [ ] Protected routes work
- [ ] Unauthenticated users redirected to /login

## Troubleshooting

### Error: "Module not found: next-auth"

**Solution:**
```bash
npm install next-auth@beta @auth/prisma-adapter
```

### Error: "NEXTAUTH_SECRET is not defined"

**Solution:**
Add to `.env`:
```env
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Error: "Prisma Client not generated"

**Solution:**
```bash
npm run db:generate
```

### Login doesn't work

**Check:**
1. Test accounts created? Run `npm run tsx scripts/test-auth.ts`
2. Database connected? Check DATABASE_URL in .env
3. Prisma generated? Run `npm run db:generate`
4. Check browser console for errors

## Production Deployment

### 1. Update Environment Variables

```env
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-production-secret
```

### 2. Build Application

```bash
npm run build
```

### 3. Start Production Server

```bash
npm run start
```

### 4. Test Production Login

- Navigate to your production URL
- Test login with real accounts
- Verify all routes work
- Check session persistence

## Security Checklist

- [ ] NEXTAUTH_SECRET is strong (32+ characters)
- [ ] NEXTAUTH_SECRET is different in production
- [ ] NEXTAUTH_URL matches your domain
- [ ] HTTPS enabled in production
- [ ] Cookies are secure in production
- [ ] Test accounts removed/disabled in production
- [ ] Database backups configured
- [ ] Audit logging enabled

## Next Steps

After authentication is working:

1. **Remove Test Accounts** (in production)
2. **Create Real Admin Account**
3. **Set up Password Reset Flow**
4. **Configure Email Verification**
5. **Add 2FA** (optional)
6. **Set up Audit Logging**
7. **Configure OAuth Providers** (optional)

## Support

If you encounter issues:

1. Check the logs: `npm run dev` output
2. Check browser console
3. Review `docs/migration/TASK_26_AUTHENTICATION_COMPLETE.md`
4. Review `components/auth/README.md`

## Package Versions

Tested with:
- next-auth: ^5.0.0-beta.25
- @auth/prisma-adapter: ^2.7.4
- bcryptjs: ^3.0.3
- zod: ^4.1.12
- @prisma/client: ^6.19.0
- next: 16.0.2
- react: 19.2.0
