# NextAuth.js CLIENT_FETCH_ERROR Fix Plan

## Status: 🔄 Planning → Execution (approved)

## ✅ Information Gathered
- NextAuth v4 with CredentialsProvider + Prisma User auth
- Route exists: src/app/api/auth/[...nextauth]/route.ts
- Client setup correct: SessionProvider, useSession(), signIn()
- DB likely Neon PG (from tabs), Prisma v7 with adapters
- Error: Client receives HTML (404/500) instead of JSON from auth endpoints

## 🔍 Root Causes Identified
1. **NEXTAUTH_SECRET mismatch** - hardcoded vs env var
2. **DATABASE_URL missing/invalid** - Prisma fails → 500
3. **Prisma client generation** - MODULE_NOT_FOUND in check-db.js
4. **Neon connection pool issues** (evident from open tabs)

## 📋 Detailed Plan

### Phase 1: Environment & Prisma (Immediate)
```
1. Generate Prisma client
2. Fix check-db.js import path
3. Add .env.local vars:
   NEXTAUTH_SECRET=your-long-random-secret-here
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=your-neon-or-local-url
```

### Phase 2: Code Updates
**src/app/api/auth/[...nextauth]/route.ts**
```
- Replace hardcoded secret: process.env.NEXTAUTH_SECRET!
- Add try-catch around Prisma query with logging
- Export authOptions separately
```

**src/lib/prisma.ts** 
```
- Add auth-specific logging
- Connection health check
```

### Phase 3: Test & Deploy
```
1. npm run dev
2. Test login flow
3. Check server console for DB/Prisma logs
```

## Files to Edit\n```\n✅ next.config.ts (disabled static export)\n✅ src/app/api/auth/[...nextauth]/route.ts (env secret + prisma-fixed)\n✅ src/lib/prisma*.ts (import fixes)\n[ ] .env.local (add NEXTAUTH_SECRET/NEXTAUTH_URL)
[ ] src/app/api/auth/[...nextauth]/route.ts
[ ] src/lib/prisma.ts  
✅ check-db.js (Prisma import fixed)
[ ] prisma/schema.prisma (if needed)
```

## Next Steps After Edits
```
1. User confirms .env.local vars
2. Execute `npx prisma generate`
3. `node check-db.js` → verify DB
4. `npm run dev` → test auth
5. attempt_completion
```

**Ready for Phase 1 execution after DB test success.**

