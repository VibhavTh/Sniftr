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

## Backend: Configuration Management

### apps/api/core/config.py
- Centralizes environment variable loading using Pydantic Settings for type safety.
- Loads Supabase URL, service role key, and JWT secret from `.env` file.
- Key concepts: Pydantic BaseSettings, environment variable validation, singleton pattern.
- Ensures configuration errors fail at startup rather than during request handling.

---

## Backend: JWT Authentication Dependency

### apps/api/deps/auth.py
- Extracts and verifies Supabase JWT tokens from Authorization headers on protected routes.
- Validates token signature using python-jose and returns user_id and email from payload.
- Key concepts: FastAPI dependencies, JWT validation, Bearer token parsing, HTTPException for auth errors.
- Centralizes authentication logic so route handlers receive trusted user context.

---

## Backend: Health Check Routers

### apps/api/routers/health.py
- Provides public `/health` endpoint for infrastructure monitoring (no auth required).
- Provides protected `/health-auth` endpoint that returns authenticated user info from JWT.
- Key concepts: FastAPI APIRouter, route handlers with @router.get decorator, Depends() injection.
- Demonstrates how protected routes use get_current_user dependency to enforce authentication.

---

## Backend: Main FastAPI Application

### apps/api/main.py
- Initializes the FastAPI app instance and configures CORS middleware for frontend communication.
- Registers health router and provides root endpoint with API information.
- Key concepts: FastAPI app initialization, CORS configuration, router inclusion, ASGI entry point.
- Serves as the application entry point that uvicorn loads when starting the server.

---

## Step 3: Login Page with Supabase Auth

### What changed
Created `app/login/page.tsx` - full login form with email/password authentication

### Why
Users need a way to sign into existing accounts. The login page authenticates with Supabase, manages loading/error states, and redirects on success.

### How it works
1. **Controlled inputs**: `value={email}` + `onChange={setEmail}` keeps React state synced with input fields
2. **Form submission**: `handleSubmit` prevents default refresh, calls `supabase.auth.signInWithPassword()`
3. **Loading state**: Button disabled while authenticating to prevent double-submission
4. **Error handling**: If `authError` exists, extract `.message` and show to user
5. **Success redirect**: If no error, `router.push('/')` navigates to home page
6. **Destructuring rename**: `{error: authError}` avoids conflict with state variable `error`

### Key concept
**Controlled components** - React state is the "single source of truth" for input values. Every keystroke updates state, state updates the input. This differs from uncontrolled inputs where the DOM holds the value.

### Interview explanation
"I built a login form using Supabase's `signInWithPassword` method. The form uses controlled inputs where React state manages the input values. I added loading state to disable the button during authentication and error state to display validation messages. On successful login, I use Next.js's `useRouter` to redirect to the home page."

### Gotcha
**Variable shadowing with destructuring** - `const {error} = await supabase.auth...` conflicts with `const [error, setError] = useState()`. You must rename during destructuring: `const {error: authError}` to avoid bugs where the wrong variable is referenced.

---

## Step 4: Signup Page with Supabase Auth

### What changed
Created `app/signup/page.tsx` - registration form for new user accounts

### Why
New users need a way to create accounts. Uses same pattern as login but calls `signUp()` instead of `signInWithPassword()`.

### How it works
1. Form structure identical to login (controlled inputs, loading/error states)
2. Calls `supabase.auth.signUp()` which creates new user in Supabase database
3. Supabase sends confirmation email (if email confirmation enabled)
4. On success, redirects to home page
5. Link points to `/login` for existing users (opposite of login page)

### Key concept
**signUp vs signInWithPassword** - `signUp()` creates a new user record in Supabase's auth system. `signInWithPassword()` authenticates an existing user. Both return the same response structure: `{data, error}`.

### Interview explanation
"The signup page mirrors the login page structure but uses Supabase's `signUp()` method to create new accounts. It follows the same controlled component pattern and error handling approach, ensuring consistent UX across auth flows."

### Gotcha
**Email confirmation** - By default, Supabase may require email confirmation before users can sign in. If `signUp()` succeeds but user can't log in immediately, check your Supabase project settings → Authentication → Email Auth → "Enable email confirmations".

---

## Step 5: Protected Home Page

### apps/web/app/page.tsx
- Protected dashboard showing logged-in user's email and backend connectivity test.
- Uses `useEffect` + `supabase.auth.getSession()` to check auth on mount, redirects to `/login` if unauthenticated.
- Button calls backend `GET /health-auth` with `Authorization: Bearer <token>` header, displays JSON response.
- Key concepts: Protected routes, useEffect lifecycle, JWT Bearer auth, fetch API with headers.
- Demonstrates complete auth flow: frontend session → backend JWT verification → response.

---

## Step 6: UI Styling with Tailwind CSS

### What changed
- `apps/web/app/login/page.tsx` - Added modern gradient background, centered card layout, purple brand colors
- `apps/web/app/signup/page.tsx` - Matching design with login page, consistent form styling
- `apps/web/app/page.tsx` - Professional dashboard with navbar, loading spinner, and color-coded response cards

### Why
Transform unstyled forms into a polished startup MVP with professional visual design.

### How to test
1. Run `npm run dev` in `apps/web`
2. Navigate to http://localhost:3000 → should redirect to `/login`
3. Check login page: gradient background, centered white card, purple buttons with hover states
4. Click "Register here" → signup page should match design
5. After login → dashboard with navbar, user email display, and backend test section

---

## Step 7: Email Confirmation UX

### What changed
- `apps/web/app/signup/page.tsx` - Added success state with email confirmation instructions

### Why
Supabase has email confirmation enabled by default. Users need clear guidance after signup to check their email and complete the confirmation process before they can log in.

### How to test
1. Sign up with a new email at `/signup`
2. After signup, success screen appears with:
   - Green checkmark icon
   - "Check your email!" message
   - Step-by-step instructions (open inbox, click link, return to login)
   - "Go to Login" button
   - Spam folder reminder
3. Check your email for Supabase confirmation link
4. Click link → redirected to homepage (logged in automatically)
5. Or return to `/login` and enter credentials

---

## Step 8: JWT Secret Base64 Decoding Fix

### What changed
- `apps/api/deps/auth.py` - Added base64 decoding of JWT secret before verification

### Why
Supabase provides the JWT secret as a base64-encoded string, but python-jose's HMAC signature verification (HS256 algorithm) requires raw bytes. Without decoding, JWT verification fails with authentication errors.

### How it works
1. Import base64 module at top of file
2. Before calling `jwt.decode()`, decode the secret: `jwt_secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)`
3. Pass decoded bytes to `jwt.decode()` instead of the base64 string
4. python-jose now correctly verifies the HMAC signature using raw bytes

**Data transformation:**
- `.env` stores: `SUPABASE_JWT_SECRET=EiAWu7sBXNhzrgTtJRD9lAfydodVMmnfkXWnZtfdh/4q7LqHMekjsBUQcXB2lbr4ECnsyKIKI+mc2RtjrGFpvw==`
- After `base64.b64decode()`: converts to raw bytes suitable for HMAC-SHA256 operations

### Key concept
**Base64 encoding** - A way to represent binary data as ASCII text. Supabase encodes the JWT secret so it can be safely stored in environment variables and config files. But cryptographic functions need the original binary data, not the text representation.

### Interview explanation
"I debugged a JWT verification failure by discovering that Supabase provides the JWT secret as a base64-encoded string, but python-jose's HMAC verification requires raw bytes. I added `base64.b64decode()` to convert the string to bytes before passing it to `jwt.decode()`. This is a common pattern when working with cryptographic secrets stored in environment variables."

### Gotcha
**Problem:** Forgetting to decode base64-encoded secrets leads to signature verification failures because HMAC algorithms operate on raw bytes, not base64 strings.

**How we fixed it:** Added `jwt_secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)` before JWT verification. This converts the base64 string to the raw bytes that python-jose expects.

### Check
Why does Supabase provide the JWT secret as base64-encoded instead of raw bytes?
<details>
<summary>Answer</summary>
Environment variables and config files can only store text (strings). Base64 encoding converts binary data into a text-safe format using only letters, numbers, and a few symbols. This allows the secret to be safely stored in `.env` files, environment variables, and config systems without corruption.
</details>

---

## Step 9: ES256 JWT Verification with JWKS

### What changed
- `apps/api/deps/auth.py` - Switched from manual secret decoding to JWKS endpoint fetching
- `apps/api/requirements.txt` - Added `requests==2.32.3` for HTTP calls

### Why
Supabase uses ES256 (Elliptic Curve Digital Signature Algorithm) for JWT signing, not HS256 (HMAC). ES256 requires a public/private key pair instead of a shared secret. The previous base64 decoding approach only works for symmetric algorithms like HS256.

### How it works
1. Extract JWT token from Authorization header
2. Fetch Supabase's public keys from JWKS endpoint: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
3. Pass JWKS to `jwt.decode()` - python-jose automatically:
   - Reads the token header to identify the algorithm (ES256)
   - Selects the matching public key from JWKS by `kid` (key ID)
   - Verifies the signature using Elliptic Curve cryptography
4. Extract `user_id` (from `sub` claim) and `email` from verified payload
5. Return user context to route handler

**Key difference from HS256:**
- HS256 (symmetric): Same secret signs AND verifies tokens
- ES256 (asymmetric): Private key signs, public key verifies (more secure - backend never has signing key)

### Key concept
**JWKS (JSON Web Key Set)** - A public endpoint that provides cryptographic public keys in JSON format. Clients fetch these keys to verify JWT signatures without needing access to private signing keys. This is standard for OAuth/OIDC providers like Supabase, Auth0, and Google.

### Interview explanation
"I debugged JWT verification by discovering Supabase uses ES256 (Elliptic Curve) instead of HS256 (HMAC). ES256 requires fetching the public key from Supabase's JWKS endpoint rather than using a shared secret. I added a `requests.get()` call to fetch the JWKS, then passed it to python-jose's `jwt.decode()` which automatically selects the correct key and verifies the signature. This is more secure because the backend never has access to the private signing key."

### Gotcha
**Problem:** Assuming all JWTs use HS256 (shared secret) when modern auth providers like Supabase use asymmetric algorithms (ES256, RS256) with public/private key pairs.

**How we fixed it:**
1. Inspected the JWT header (first 20 chars decoded from base64) which revealed `"alg":"ES256"`
2. Switched from using `SUPABASE_JWT_SECRET` directly to fetching public keys from the JWKS endpoint
3. Let python-jose handle algorithm detection and key selection automatically

### Check
Why is ES256 more secure than HS256 for JWT signing?
<details>
<summary>Answer</summary>
With HS256, both the token issuer (Supabase) and verifier (your backend) share the same secret. If your backend is compromised, attackers can forge valid tokens. With ES256, only Supabase has the private key for signing - your backend only has the public key for verification. Even if compromised, attackers cannot create valid tokens, only verify them.
</details>

---

## Frontend: API Utility Functions

### apps/web/lib/api.ts
- Provides reusable `apiGet<T>()` and `apiPost<T>()` functions for authenticated backend requests.
- Automatically retrieves Supabase session and includes JWT access token as Bearer token in Authorization header.
- Key concepts: TypeScript generics for type-safe responses, environment variables for API base URL, fetch API with headers.
- Eliminates code duplication by centralizing authentication logic across all API calls.

---

## Frontend: Browse Page with Pagination

### apps/web/app/browse/page.tsx
- Protected route that displays paginated fragrance bottles fetched from the backend API.
- Uses `apiGet<Bottle[]>()` to fetch bottles with page and limit query parameters.
- Key concepts: Protected routes with auth check, pagination state management, "Load More" pattern, TypeScript interfaces for API responses.
- Manages multiple states: `bottles` array, `loading` for initial load, `loadingMore` for pagination, `error` for failures, `pageNum` for tracking current page, `hasMore` flag to hide button when no more results.
- On page 1, replaces bottles array. On subsequent pages, appends new bottles to existing array using spread operator.
- Sets `hasMore` to false when fewer than 12 bottles returned, indicating end of results.
- useEffect runs auth check and initial fetch on mount, empty dependency array ensures it runs once.

---

## UI Implementation: Design System and Pages

### What changed
- `apps/web/app/globals.css` - Added Google Fonts import for Cormorant (serif) and Inter (sans-serif), updated body font and background color
- `apps/web/app/browse/page.tsx` - Implemented Explore page with search bar, filters button, and 3-column grid matching Figma design
- `apps/web/app/finder/page.tsx` - Created Finder page with centered card interface and Pass/Like actions
- `apps/web/app/collection/page.tsx` - Created Collection page with elegant empty state and CTA buttons

### Why
Transform the functional prototype into a polished, designer-led MVP by implementing the exact Figma designs. The design handoff specified an editorial/luxury aesthetic with calm whitespace, muted colors, and consistent typography using Cormorant for headings and Inter for body text.

### How it works

**Typography System:**
- Loaded via Google Fonts: `Cormorant:wght@300;400;500;600;700` and `Inter:wght@300;400;500;600`
- Headings use `font-serif` class (Cormorant) with `font-light` (300 weight) for elegant display
- Body text uses Inter via global body style with light font weights (300-400)
- All measurements in pixels `text-[15px]` instead of Tailwind's default rem scale for precise control
- Letter spacing via `tracking-[0.3em]` for logo, `tracking-widest` for brand names

**Color Palette:**
- Background: `bg-stone-50` (warm off-white) instead of pure white
- Text: `text-neutral-900` (near-black) for primary, `text-neutral-500` for secondary
- Borders: `border-neutral-200` (very light gray) for subtle separation
- Primary action: `bg-neutral-900` with `hover:bg-neutral-800` for buttons
- Secondary actions: `border border-neutral-300` with `hover:bg-neutral-50`

**Navigation Pattern:**
- Consistent across all three pages: logo left, nav center, user icon right
- Logo: "FRAGRANCE" in Cormorant serif, uppercase, wide letter-spacing (`tracking-[0.3em]`)
- Active page indicated with `underline underline-offset-4` instead of border-bottom
- Fixed height `h-[72px]` with horizontal padding `px-8 lg:px-14`

**Explore Page (Browse):**
- Page title: `font-serif text-[42px] font-light` with subtitle below
- Search bar with icon and filters button in flex row with `gap-3`
- 3-column grid: `grid-cols-3` with `gap-x-12 gap-y-20` for generous whitespace
- Card images: `aspect-[2/3]` (taller than previous 3:4) with `bg-neutral-200` placeholder
- Brand names: `text-[11px] uppercase tracking-widest` in light gray
- Fragrance names: `font-serif text-[24px] font-light` for hierarchy
- Accord tags: Semantic colors with `px-3 py-1.5 rounded-sm` (no borders)

**Finder Page:**
- Centered card with progress indicator (`1 of 8`)
- Card structure: Name/brand at top, tall image, accords section below
- Action buttons in 2-column grid: Pass (bordered) and Like (filled)
- Icons inline with button text using SVG stroke icons

**Collection Page:**
- Empty state: Centered white card with `border border-neutral-200 rounded-sm`
- Heart icon in circular gray background `w-20 h-20 rounded-full bg-neutral-100`
- Two action buttons side-by-side: "Start Finder" (primary) and "Explore" (secondary)
- When populated, uses same grid layout as Explore page

**Semantic Accord Colors:**
- Woody: `bg-amber-100 text-amber-900`
- Amber: `bg-orange-100 text-orange-900`
- Spicy: `bg-red-100 text-red-900`
- Floral: `bg-pink-100 text-pink-900`
- Fresh/Aromatic: `bg-green-100 text-green-900`
- Powdery: `bg-purple-100 text-purple-900`
- Aquatic: `bg-blue-100 text-blue-900`
- Citrus: `bg-yellow-100 text-yellow-900`
- Sweet/Fruity: `bg-rose-100 text-rose-900`
- Smoky: `bg-stone-200 text-stone-900`
- Default: `bg-neutral-100 text-neutral-700`

### Key concepts

**Design Protocol Compliance:**
- No bright colors, gradients, or heavy shadows (avoided generic SaaS look)
- Generous whitespace: `py-20` page padding, `mb-16` section spacing, `gap-y-20` grid rows
- Light font weights: `font-light` (300) for most text, `font-normal` (400) for small labels
- Muted semantic colors: Using `*-100` background shades with `*-900` text for subtle contrast
- Precise sizing: Pixel values `text-[15px]` `text-[11px]` instead of Tailwind's default scale

**Responsive Grid:**
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for mobile→tablet→desktop
- Larger screens show 3 columns at `lg:` breakpoint (1024px)
- Maintains consistent spacing across breakpoints

**Component Reusability:**
- Navigation bar HTML duplicated across pages (could be extracted to shared component)
- `getAccordColor()` function duplicated across pages (could be extracted to shared utility)
- Bottle card structure consistent between Explore and Collection pages

### Interview explanation
"I implemented a luxury editorial design system following Figma specs with Cormorant serif for headings and Inter for body text. The design emphasizes whitespace, muted colors, and light font weights to create an upscale fragrance catalog aesthetic. I used semantic color mapping for accord tags so users can instantly recognize fragrance families - woody is always amber, floral is always pink, etc. The three main pages share a consistent navigation pattern and grid layout, with the Collection page featuring an empty state that guides new users to start discovering fragrances."

### Gotcha
**Problem:** Using Tailwind's default text scale (`text-sm`, `text-base`) made it hard to match Figma's exact pixel sizes. Different designers expect different font sizes for "small" text.

**How we fixed it:** Used bracket notation for exact pixel values: `text-[15px]`, `text-[11px]`, `text-[42px]`. This gives precise control and makes the code match the Figma measurements directly.

**Best practice:** For design-heavy projects with specific mockups, use pixel values to match designer intent exactly. For design systems with semantic sizing (small/medium/large), use Tailwind's default scale.

### Check
Why use `aspect-[2/3]` instead of `aspect-[3/4]` for fragrance images?
<details>
<summary>Answer</summary>
The taller 2:3 aspect ratio (portrait) better matches the proportions of real perfume bottles and creates more elegant vertical cards. It also provides more visual prominence for the product images, which is important for a visually-driven fragrance discovery app. The Figma designs showed taller rectangles, so 2:3 more closely matches the design intent than the shorter 3:4 ratio.
</details>

---

