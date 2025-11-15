#!/bin/bash

echo "🔐 Installing Authentication Dependencies..."
echo ""

# Install NextAuth v5 and Prisma adapter
npm install next-auth@beta @auth/prisma-adapter

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "📝 Next steps:"
echo "1. Generate NEXTAUTH_SECRET:"
echo "   openssl rand -base64 32"
echo ""
echo "2. Add to .env:"
echo "   NEXTAUTH_SECRET=your-generated-secret"
echo "   NEXTAUTH_URL=http://localhost:3000"
echo ""
echo "3. Create test accounts:"
echo "   npm run tsx scripts/test-auth.ts"
echo ""
echo "4. Start dev server:"
echo "   npm run dev"
echo ""
echo "5. Test login at:"
echo "   http://localhost:3000/login"
echo ""
