# ScentlyMax Learning Log

## Session 1: Frontend Setup - Project Initialization

### What Changed
**Files modified:**
- Created `apps/web/package.json` - Next.js project configuration

**Summary:** Started scaffolding the Next.js frontend application by defining the project structure and dependencies.

---

### Why It Was Necessary
**Problem being solved:**
The `apps/web` directory was empty. We need a Next.js application with TypeScript, Tailwind CSS, and Supabase authentication to build the fragrance discovery MVP frontend.

**Context:**
- Users need to authenticate (login/signup) using email/password
- The app needs to display personalized content based on authentication
- The frontend must communicate with a backend API using Bearer tokens
- The monorepo structure requires explicit project setup in the apps/web directory

---

### How It Works

#### Package.json Structure
```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": { ... },
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

**Control Flow:**
1. `npm run dev` → triggers `next dev` command
2. Next.js reads this package.json to understand project configuration
3. Next.js loads dependencies and starts development server
4. The server watches for file changes and hot-reloads

**Data Flow:**
- npm reads package.json to understand what packages to install
- Dependencies are downloaded from npm registry
- Packages are stored in `node_modules/`
- Next.js uses these packages at runtime

---

### Key Concepts

#### 1. **Next.js App Router**
- Modern Next.js routing system using the `app/` directory
- File-system based routing: `app/login/page.tsx` → `/login` route
- Built-in support for React Server Components and Client Components

#### 2. **Supabase Client Library**
- `@supabase/supabase-js` provides authentication methods
- Uses environment variables for configuration (URL + anon key)
- Manages sessions, tokens, and auth state automatically

#### 3. **TypeScript + React 19**
- Type safety for catching errors at compile time
- React 19 includes performance improvements and new hooks
- Type definitions (`@types/*`) provide IDE autocomplete

#### 4. **Tailwind CSS**
- Utility-first CSS framework
- Requires PostCSS and Autoprefixer for processing
- Styles applied via className attributes

#### 5. **Monorepo Structure**
- Multiple projects (apps/web, apps/api) in one repository
- Each app has its own package.json
- Allows code sharing and coordinated development

---

### Interview-Ready Explanation

**If asked: "How did you set up the Next.js project?"**

- "I initialized a Next.js 15 application with TypeScript and Tailwind CSS in the apps/web directory of the monorepo. I chose Next.js for its App Router which provides file-based routing, server-side rendering capabilities, and excellent developer experience."

- "I added @supabase/supabase-js as the authentication client library because it handles all the complexity of JWT token management, session persistence, and auth state. It works seamlessly with environment variables for configuration."

- "The project uses React 19 with TypeScript for type safety, and Tailwind CSS for rapid UI development. The package.json defines scripts for dev server, production builds, and linting."

---

### One Gotcha

**Problem:** npm cache permission errors (EACCES)

**Why it happens:**
When you run npm with `sudo` (or when npm is installed globally with sudo), it creates cache files owned by root. Later, when running npm without sudo, you get permission denied errors because your user account can't write to root-owned directories.

**How we avoided/will fix it:**
```bash
sudo chown -R 501:20 "/Users/vibhav/.npm"
```
This recursively changes ownership of the npm cache to your user account (UID 501, GID 20), allowing npm to work without sudo.

**Best practice:** Never use `sudo npm install` for project dependencies. Only use sudo for global npm package installations if absolutely necessary.

---

### Mini-Check Questions

1. **What is the purpose of the `@supabase/supabase-js` package, and why do we need it?**
   <details>
   <summary>Answer</summary>
   It's the Supabase client library that provides methods for authentication (login, signup, session management) and handles JWT token storage/refresh automatically. We need it because our app requires email/password authentication and secure communication with the backend using Bearer tokens.
   </details>

2. **Why do we have both `dependencies` and `devDependencies` in package.json? What's the difference?**
   <details>
   <summary>Answer</summary>
   - `dependencies`: Packages needed at runtime (Next.js, React, Supabase client) - these get bundled with the production app
   - `devDependencies`: Packages only needed during development (TypeScript compiler, type definitions, linters) - these don't ship to production, keeping bundle size smaller
   </details>

3. **In a Next.js App Router project, how do you create a route at /login?**
   <details>
   <summary>Answer</summary>
   Create a file at `app/login/page.tsx`. The file-system structure maps directly to URLs: app/[route]/page.tsx becomes /[route]
   </details>

---

---

## Step 2: Next.js Configuration Files

### What changed
- `next.config.ts` - Next.js config
- `tsconfig.json` - TypeScript compiler settings
- `tailwind.config.ts` - Tailwind CSS purge paths
- `postcss.config.mjs` - PostCSS plugin chain
- `.eslintrc.json` - ESLint extends Next.js rules
- `app/globals.css` - Tailwind directives + CSS variables
- `app/layout.tsx` - Root layout with metadata

### Why
Next.js requires specific config files to know how to compile TypeScript, process Tailwind classes, and structure the app. Without these, `npm run dev` would fail.

### How it works
1. Next.js reads `next.config.ts` for build settings
2. TypeScript compiler uses `tsconfig.json` for type checking (`strict: true`, path aliases `@/*`)
3. Tailwind scans files in `content` array, purges unused classes
4. PostCSS runs `tailwindcss` plugin → processes `@tailwind` directives → runs `autoprefixer` for browser compatibility
5. `app/layout.tsx` wraps all pages, imports `globals.css` once globally

### Key concepts
- **Path aliases (`@/*`)**: Import `@/components/Button` instead of `../../components/Button`
- **CSS-in-JS (Tailwind)**: Utility classes compiled to minimal CSS at build time
- **PostCSS pipeline**: Transforms modern CSS (Tailwind directives) into browser-compatible CSS

### Interview explanation
- "I configured TypeScript with strict mode and path aliases for cleaner imports. Tailwind is set to scan all app files and purge unused styles in production."
- "The root layout in `app/layout.tsx` loads global CSS once and provides metadata like page title. All routes inherit this layout automatically."

### Gotcha
**Problem:** Forgetting to include all content paths in `tailwind.config.ts` means Tailwind won't detect classes in those files, and styles will be missing in production.

**How we avoided it:** Added glob patterns for `pages/`, `components/`, and `app/` directories to ensure complete coverage.

**Check:** Why does Tailwind need the `content` array in its config?

---

## Backend Setup: API Dependencies

### What changed
Added 7 Python packages to `apps/api/requirements.txt`

### Why
Each package has a specific role in the auth flow and API infrastructure

### How it works
- `fastapi` - web framework for building the API endpoints
- `uvicorn` - ASGI server to run FastAPI locally (like nodemon for Python)
- `supabase` - official client for connecting to Supabase database
- `python-jose` - JWT encoding/decoding library with crypto support
- `pydantic-settings` - loads environment variables into typed config objects
- `python-dotenv` - reads `.env` files into environment variables

**JWT verification flow:**
1. Frontend sends request with `Authorization: Bearer <jwt_token>`
2. FastAPI dependency extracts token from header
3. `python-jose` decodes token using `SUPABASE_JWT_SECRET`
4. Validates signature (proves token wasn't tampered with)
5. Extracts payload containing `user_id` and `email`
6. Returns user info to route handler

### Key concept
JWT verification needs `python-jose` to decode the token and validate the signature using the JWT secret from Supabase. The secret proves the token was issued by Supabase and hasn't been modified.

### Interview explanation
"We use python-jose to verify JWTs because it handles the cryptographic signature validation. We pass it the JWT_SECRET from Supabase, and it confirms the token wasn't tampered with and extracts the payload containing user_id and email."

### Gotcha
**Problem:** `python-jose[cryptography]` needs the `[cryptography]` extra for RS256/HS256 algorithms. Without it, JWT validation will fail at runtime with "Algorithm not supported" error.

**How we avoided it:** Specified `python-jose[cryptography]==3.3.0` to install the crypto extras.

---

