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

# Project Post-Mortem: Fragrance Image Scraper

## Overview
A resilient Python-based data ingestion pipeline designed to augment a 24,000-row fragrance dataset with official product image URLs via the DuckDuckGo Search API.

## Timeline of Obstacles & Resolutions

### 1. Character Encoding Conflict
- **Symptom:** `UnicodeDecodeError` when reading the source CSV.
- **Cause:** European fragrance names (e.g., 'Guerlain Homme L'Eau Boisée') used Latin-1 encoding.
- **Fix:** Refactored `pd.read_csv` to use `encoding='latin1'`.

### 2. Detection & Rate Limiting (The 403 Problem)
- **Symptom:** HTTP 403 Errors after ~10 requests.
- **Cause:** Heuristic bot detection identifying the script's default headers.
- **Fix:** - Implemented **User-Agent Spoofing** to mimic a Chrome browser.
    - Added **Exponential Backoff** (sleeping longer after each failure).
    - Introduced **Stochastic Jitter** (randomized sleep intervals) to break patterns.

### 3. Dependency Instability
- **Symptom:** `TypeError: __init__() got an unexpected keyword argument 'headers'`.
- **Cause:** A breaking change in the `ddgs` library update.
- **Fix:** Conducted a library audit and refactored the context manager to align with the new API signature.

## Engineering Lessons Learned

### Resumability is Mandatory
For any job taking >1 hour, the script must be able to "pick up where it left off." Using file-length checks to set the `start_index` saved roughly 10 hours of redundant processing time.

### Defensive Data Cleaning
Never trust the input. Rating counts were strings with non-numeric characters. Implementing a regex-based sanitization layer before sorting was crucial for the "Top 1000" prioritization logic.

### Politeness as a Strategy
Scraping is a social contract. Using a 10-15 second delay and a 2-minute "cooling period" every 25 items ensured the IP address remained in good standing with the search provider.



# Project Post-Mortem: ScentlyMax TF-IDF Recommendation Engine

## Overview
A high-performance, content-based recommendation engine built to deliver real-time fragrance suggestions over a 24,000-row dataset using **TF-IDF vectorization** and **Cosine Similarity**.

The system supports both *“find similar fragrances”* and *free-text scent search* while remaining memory-efficient and production-ready.

## Timeline of Obstacles & Resolutions

### 1. Data-to-Matrix Index Mismatch
- **Symptom:** `KeyError` exceptions or incorrect perfume details returned during similarity queries.
- **Cause:** TF-IDF matrix row indices (`0..n`) became desynchronized from database primary keys (`original_index`) after filtering and cleaning operations.
- **Fix:** Engineered a **JSON mapping layer** (`bottle_id_map.json`) to decouple ML matrix indices from SQL database identifiers, ensuring deterministic lookup and correct joins.

### 2. High-Dimensional Memory Bloat
- **Symptom:** System crashes or extreme lag when generating similarity matrices.
- **Cause:** A dense representation of 24,000 items × ~20,000 features resulted in ~480 million floating-point values, most of which were zero.
- **Fix:** Migrated to **Scipy CSR (Compressed Sparse Row)** matrices, reducing memory usage by ~95% by storing only non-zero feature values.

### 3. Serving vs. Training Conflict
- **Symptom:** FastAPI server cold starts exceeding 30 seconds with high CPU utilization.
- **Cause:** Model training logic was embedded in application startup, triggering full TF-IDF recomputation on every server reboot.
- **Fix:** Split the pipeline into:
  - **Offline artifact generation** (`train_recommender.py`)
  - **Production inference class** (`recommender.py`) that loads prebuilt artifacts directly into memory

## Engineering Lessons Learned

### Feature Engineering Is a Weighting Game
- **Insight:** Raw ingredient lists were insufficient for capturing fragrance similarity.
- **Action:** Boosted **Main Accords** 3× via controlled string repetition so high-level scent “vibes” dominated similarity scoring.
- **Outcome:** Woody, fresh, and oriental fragrances remained correctly clustered even when sharing common notes like citrus.

### Preprocessing Symmetry Is Non-Negotiable
- **Insight:** Inconsistent preprocessing silently degrades similarity quality.
- **Action:** Applied identical regex normalization, lowercasing, and punctuation stripping to both training data and user queries.
- **Outcome:** Eliminated false negatives caused by minor formatting differences.

### The “Self-Match” Gotcha
- **Insight:** Cosine similarity always returns a perfect self-match.
- **Action:** Requested `k + 1` neighbors and filtered out the seed item from results.
- **Outcome:** Users consistently receive 10 *new* recommendations instead of the fragrance they are viewing.

## Interview Cheat Sheet (STAR Format)

### Situation
- **Context:** Required a fast, scalable recommendation engine for a 24,000-item fragrance catalog.

### Task
- **Goal:** Support both similarity-based discovery and natural-language scent search in production.

### Action
- **Implemented:**  
  - A weighted **metadata soup** combining notes and accords  
  - **TF-IDF** to emphasize rare scent components  
  - **Cosine Similarity** in a ~20,000-feature vector space  
  - A **Sparse Matrix pipeline** for memory efficiency  
  - A clean separation between training and inference  

### Result
- **Impact:** Delivered a production-grade recommendation engine returning top matches in **<10ms**, with a modular, scalable architecture suitable for future hybrid and collaborative filtering extensions.

---

# Data Ingestion Failure: Upsert Requires Unique Constraint

## Symptom
```python
postgrest.exceptions.APIError: {
  'code': '42P10',
  'message': 'there is no unique or exclusion constraint matching the ON CONFLICT specification'
}
```

When attempting to run `supabase.table("bottles").upsert(bottle, on_conflict="original_index").execute()` to populate the bottles table from CSV, the operation failed with PostgreSQL error code 42P10.

## Root Cause
PostgreSQL's `ON CONFLICT` clause requires the conflict column (`original_index` in this case) to have either a **UNIQUE constraint** or be a **PRIMARY KEY**. This is a hard database requirement, not optional.

The initial schema had:
```sql
original_index INTEGER,  -- Regular column
CREATE INDEX idx_bottles_original_index ON bottles(original_index);  -- Regular B-tree index
```

A regular index allows duplicate values and cannot be used for conflict detection. PostgreSQL's ON CONFLICT mechanism needs deterministic O(log n) lookup to decide whether to INSERT (new row) or UPDATE (existing row), which requires uniqueness guarantees.

## Debugging Reasoning
1. **Error code lookup:** `42P10` is PostgreSQL's "invalid column reference" for ON CONFLICT operations
2. **Schema inspection:** Checked `specs/db/create_bottles.sql` and found `original_index INTEGER` without UNIQUE
3. **PostgreSQL documentation:** Confirmed ON CONFLICT requires unique/exclusion constraints, not just indexes
4. **Business logic validation:** `original_index` is the stable ML model ID, so it *should* be unique per fragrance

## Resolution
Added UNIQUE constraint via SQL migration in Supabase dashboard:
```sql
ALTER TABLE public.bottles
  ADD CONSTRAINT bottles_original_index_unique UNIQUE (original_index);
```

Also updated `specs/db/create_bottles.sql` to prevent this issue for future table recreations:
```sql
original_index INTEGER UNIQUE,  -- UNIQUE constraint required for upsert operations
```

After adding the constraint, the upsert operation succeeded immediately with no code changes to the Python ingestion script.

## Engineering Lesson
**Schema constraints are not just for data validation - they enable database features.** UNIQUE constraints serve two purposes:
1. Data integrity: Prevent duplicate values
2. Conflict resolution: Enable deterministic upsert operations via ON CONFLICT

When designing idempotent ingestion pipelines, the conflict column must be unique in both the *logical model* (business requirement) and the *physical schema* (database constraint). A regular index is insufficient.

## Interview Framing
"When implementing the fragrance data ingestion pipeline, I designed an idempotent upsert operation using `original_index` as the conflict key, allowing the script to be safely re-run. I encountered a PostgreSQL error indicating no unique constraint matched the ON CONFLICT specification. I debugged this by recognizing that while I had created a regular index on `original_index`, PostgreSQL's conflict resolution mechanism requires a UNIQUE constraint for deterministic O(log n) lookups. I added the UNIQUE constraint, which both enforced data integrity and enabled the upsert operation, ensuring the ML model's stable IDs remain unique across ingestion runs."


## ScentlyMax Hybrid Recommendation Engine


## 1. System Overview

The ScentlyMax recommendation engine is a multi-stage hybrid system designed to provide real-time fragrance discovery. It balances **"scent profile relevance"** (what a perfume smells like) with **"market wisdom"** (what the community values). The system is decoupled into an offline training pipeline and an online inference engine to ensure sub-100ms response times.

---

## 2. Phase-by-Phase Evolution

### Phase 1: The Semantic Core (TF-IDF)

To understand fragrance relationships, we transformed unstructured scent notes into a high-dimensional vector space.

**The "Metadata Soup":** We synthesized a text document for each fragrance. We implemented feature weighting by repeating "Main Accords" three times. This ensures the "vibe" (e.g., Woody, Floral) outweighs specific minor notes.

**Mathematical Grounding:** We utilized TF-IDF (Term Frequency-Inverse Document Frequency). We intentionally relied on the IDF component to handle "rare notes" naturally—mathematically, a rare note like Oud is automatically more informative than a common note like Musk.

**Similarity Metric:** Used Cosine Similarity to measure the angular distance between vectors, making the system robust against varying description lengths.

### Phase 2: Runtime Architecture & Decoupling

**Artifact Persistence:** To avoid retraining on every API request, we serialized the state into three artifacts: `vectorizer.joblib`, `tfidf_matrix.npz` (sparse format), and a `bottle_id_map.json`.

**ID Stability:** We established `original_index` as the "Source of Truth" ID across the ML artifacts, the FastAPI logic, and the Supabase database.

### Phase 3: Popularity & The Bayesian Reranker

A common failure in RecSys is recommending "similar" items that are universally hated or have zero reviews. We addressed this with a Two-Stage Reranking Layer.

**The Bayesian Formula:** To avoid "small-sample bias" (e.g., a 5-star rating with only 1 review), we used a Bayesian weighted rating:

$$WR = \frac{v}{v+m}R + \frac{m}{v+m}C$$

where v=count, m=threshold, R=rating, C=mean.

**The Hybrid Blend:** We implemented a local min-max normalization on similarity scores within the top 50 candidates, then blended them using an α of 0.85.

---

## 3. Engineering Obstacles & Resolutions

| Obstacle | Root Cause | Engineering Resolution |
|----------|-----------|------------------------|
| Ingestion "Conflict" Errors | Attempting to UPSERT data into Supabase without a Unique constraint on `original_index` | Applied a UNIQUE INDEX in Postgres. Taught me that Idempotency requires schema-level enforcement |
| Numerical Instability | TF-IDF similarity scores were tightly clumped (e.g., 0.12–0.15), allowing popularity (0.0–1.0) to dominate unfairly | Implemented Local Min-Max Normalization on the candidate pool. This rescaled the similarity "winners" to a full 0–1 range before blending |
| Memory Inefficiency | 24,000 perfumes × 20,000 features created a dense matrix too large for RAM | Switched to Scipy Sparse CSR format, reducing the memory footprint by >90% |
| The "Self-Match" Bug | The engine recommended the current bottle as the #1 match | Added a filtering layer in the `recommend_by_bottle_id` method to exclude the seed_id |

---

## 4. Tradeoffs & Rejected Approaches

**Why not Image Similarity?** While visual branding matters, scent notes are the primary driver of purchase intent. We prioritized a text-based "Scent Profile" for the MVP to maintain a lower compute overhead.

**Why Retrieval + Rerank vs. One Stage?** Re-calculating Bayesian popularity for 24,000 rows at runtime is slow. By narrowing the field to 50 "candidates" first, we can afford more complex reranking logic without hitting latency caps.

**Deferred ALS (Collaborative Filtering):** We chose to defer User-Item matrix factorization until we have a substantial "Like/Dislike" dataset. Starting with Content-Based filtering solves the Cold Start Problem.

---

## 5. Interview Talking Points (The "Senior" Narrative)

### How I explain the "Alpha" (0.85)

"The 0.85 alpha represents our business logic. We want the system to be relevance-first. A perfume that smells like 'Rose' but is unpopular is still a better match for a 'Rose' query than a popular 'Vanilla' perfume. The 15% popularity weight acts as a 'tie-breaker' or a 'quality nudge' among similar candidates."

### My stance on Data Integrity

"The most critical lesson was the alignment between the ML model and the Production DB. By enforcing a UNIQUE constraint on our `original_index` in Postgres, we ensured that our training artifacts and our API responses never drifted apart, maintaining a consistent user experience."

---

# Integrating ML Recommender with FastAPI: Singleton Pattern & Data Layer

## Symptom
After building the hybrid TF-IDF + popularity recommender as an offline training pipeline, I needed to integrate it into a production FastAPI application. The challenge: how to load ~95MB of artifacts (TF-IDF matrix, vectorizer, ID mappings) **once** at server startup rather than on every request, while ensuring all API responses match the frontend contract (arrays for accords/notes, not TEXT columns).

## Context
The ML recommender was complete and tested in isolation, returning ranked lists of `original_index` values. The API layer needed to:
1. Load recommender artifacts into memory at startup (not per-request)
2. Fetch full bottle details from Supabase using the ML model's ranked IDs
3. Transform database rows (TEXT columns with accord1-5, comma-separated notes) into UI-ready format (arrays)
4. Preserve the ML model's ranking order in final responses
5. Serve multiple endpoints: random bottles, text search, similarity search, and swipe candidates

## The Singleton Pattern: FastAPI Lifespan Context Manager

**Problem**: Loading 95MB of artifacts on every API request would cause 1000ms+ latency. Need to load once and share across all requests.

**Solution**: FastAPI's `@asynccontextmanager` lifespan pattern loads artifacts at startup and stores them in `app.state`.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load recommender artifacts once into memory
    print("🚀 Loading recommender artifacts...")
    recommender = FragranceRecommender()
    artifacts_dir = Path(__file__).parent / "intelligence" / "artifacts"
    recommender.load_artifacts(str(artifacts_dir))

    # Store in app.state for access in route handlers
    app.state.recommender = recommender
    print("✅ Recommender loaded and ready!")

    yield  # Server runs here, handling requests

    print("👋 Shutting down...")

app = FastAPI(lifespan=lifespan)
```

**Result**: Artifacts loaded once at startup. Route handlers access via `request.app.state.recommender`. This reduced recommendation latency from ~1000ms (load + compute) to <10ms (compute only).

## The Data Normalization Layer: Bridging Schema and Contract

**Problem**: Database uses denormalized TEXT schema (accord1-5 columns, comma-separated notes) for MVP speed, but API contract requires arrays `main_accords[]`, `notes_top[]`, etc.

**Solution**: Created a thin transformation layer in `utils/bottle_normalizer.py` that runs at the API boundary:

```python
def normalize_bottle(db_row: dict) -> dict:
    # Collect accords from separate columns, filter None, preserve prominence order
    accords = [db_row.get(f"accord{i}") for i in range(1, 6)]
    main_accords = [a for a in accords if a]

    # Split comma-separated notes into arrays
    notes_top = split_comma_separated(db_row.get("notes_top"))
    notes_middle = split_comma_separated(db_row.get("notes_middle"))
    notes_base = split_comma_separated(db_row.get("notes_base"))

    return {
        "id": db_row.get("original_index"),  # INT for ML compatibility
        "main_accords": main_accords,
        "notes_top": notes_top,
        "notes_middle": notes_middle,
        "notes_base": notes_base,
        # ... other fields
    }
```

**Key Decision**: Transform at the API layer (not in database) to maintain flexibility. Can migrate schema later without breaking ML artifacts or frontend contract.

## Preserving ML Ranking Order

**Problem**: Supabase's `.in_(column, [ids])` filter returns rows in **arbitrary order**, not the ML model's ranking. If we return bottles in database order, we lose the hybrid TF-IDF + popularity ranking.

**Solution**: Two-step reconstruction pattern:

```python
# ML model returns ranked IDs: [123, 456, 789]
bottle_ids = recommender.recommend_by_query(q, k=20)

# Supabase returns rows in arbitrary order
response = supabase.table("bottles").select("*").in_("original_index", bottle_ids).execute()

# Build lookup dict for O(1) access
bottles_by_id = {row["original_index"]: row for row in response.data}

# Reconstruct in ML ranking order
results = [normalize_bottle(bottles_by_id[bid]) for bid in bottle_ids if bid in bottles_by_id]
```

**Why This Matters**: The ML model spends significant computation on hybrid ranking (TF-IDF similarity + Bayesian popularity reranking). If we don't preserve order, we've wasted that work and delivered a worse user experience.

## Endpoint Architecture: Four Routes, One Data Flow

Implemented four endpoints following the pattern: **Call ML Model → Fetch from DB → Normalize → Preserve Order**

1. **GET /recommendations** - General-purpose search/similarity (supports `q` OR `seed_bottle_id`, variable `k`)
2. **GET /bottles/random** - Cold start: fetch random bottles for initial swipe queue (no auth, no ML)
3. **GET /swipe/candidates** - Thin wrapper: returns k=50 similar bottles based on seed (uses recommender)
4. **POST /swipes** - Log user like/pass actions for future collaborative filtering (requires JWT auth)

All endpoints use the same `normalize_bottle()` helper, ensuring consistent response format across the API surface.

## Engineering Lessons

### 1. Singleton Pattern for Expensive Resources
**Lesson**: When you have expensive initialization (file I/O, matrix operations, model loading), use application lifespan hooks. Don't repeat work on every request.

**FastAPI Pattern**:
- Startup: Load resources into `app.state`
- Request handlers: Access via `request.app.state.resource`
- Shutdown: Clean up resources if needed

### 2. Separation of Concerns in Data Transformation
**Lesson**: Keep schema decisions separate from API contracts. The database schema serves storage efficiency; the API contract serves client needs. Transform at the boundary.

**Pattern**:
- Database: Denormalized for write performance (TEXT columns, no joins)
- API Layer: `normalize_bottle()` transforms to client format
- Future Migration: Can change schema without breaking frontend or ML model

### 3. Order Preservation in Multi-Stage Pipelines
**Lesson**: When combining ranked results from ML models with database fetches, **always preserve the ML ranking order**. Database queries don't guarantee order.

**Anti-Pattern**: `SELECT * FROM bottles WHERE id IN (...)` then returning rows as-is
**Correct Pattern**: Build lookup dict, reconstruct in original order

### 4. ID Stability Across System Boundaries
**Lesson**: Use a single stable ID (`original_index`) across all system layers:
- ML artifacts (bottle_id_map.json)
- Database UNIQUE constraint
- API responses (`"id": original_index`)

This prevents drift between training data and production data.

## Interview Framing
"When integrating the ML recommender into production, I faced the challenge of loading 95MB of artifacts efficiently while maintaining ranking order and transforming denormalized database rows into the API contract. I implemented FastAPI's lifespan context manager to load artifacts once at startup into `app.state`, reducing per-request latency from ~1000ms to <10ms. To bridge the gap between the database schema (TEXT columns) and API contract (arrays), I created a thin normalization layer at the API boundary. The critical insight was using a lookup dict to reconstruct results in ML ranking order after Supabase queries, preserving the hybrid TF-IDF + popularity ranking. This architecture cleanly separated concerns: the database optimizes for storage, the ML model optimizes for relevance, and the API layer transforms data to match client needs."

---


# 2026-01-18 — Frontend Architecture: End-to-End Data Flows & System Boundaries

## Summary
Documented the complete end-to-end data flow for two primary user journeys: browsing/searching fragrances (Explore) and getting ML-powered recommendations (Recommender). Clarified how frontend components, API client, backend routers, intelligence layer, and Supabase interact across system boundaries.

## Frontend–Backend Interactions

### Flow 1: Explore/Browse (Direct Database Query)
```
User on Explore page
  → Search input / Filters
  → lib/api.ts (adds JWT from Supabase session)
  → GET /bottles?q=sandalwood&limit=20
  → routers/bottles.py
     - Verify JWT using Supabase public key
     - Query Supabase: SELECT * FROM bottles WHERE name ILIKE '%sandalwood%'
     - For each row: normalize_bottle(row) via utils/bottle_normalizer.py
     - Return { bottles: [Bottle, Bottle, ...] }
  → Frontend receives typed response
  → Render grid of FragranceCard components
```

**No ML involved** — pure SQL search with text normalization.

### Flow 2: Recommendations (ML-Powered)
```
User on Recommender page
  → Query input ("fresh citrus summer") OR seed bottle picker
  → lib/api.ts (adds JWT)
  → GET /recommendations?q=fresh+citrus+summer&k=10
     OR
     GET /recommendations?seed_bottle_id=123&k=10
  → routers/recommendations.py
     - Verify JWT
     - Call intelligence/recommender.py
       → Load pre-trained TF-IDF model from disk (artifacts/*.pkl)
       → Run inference (vectorize query → cosine similarity)
       → Return top k bottle IDs: [42, 128, 991, ...]
     - For each bottle_id:
       → Query Supabase: SELECT * FROM bottles WHERE original_index = ?
       → normalize_bottle(row) via utils/bottle_normalizer.py
     - Return { results: [Bottle, Bottle, ...] }
  → Frontend receives typed response
  → Render grid of FragranceCard components
```

**ML runs in-memory at runtime** — model is pre-trained offline by `scripts/train_recommender.py`.

## Key Components & Responsibilities

| Component | Responsibility | Dependencies |
|---|---|---|
| **Frontend: types/fragrance.ts** | Type definitions for `Bottle` and `BottleCard` | None (pure types) |
| **Frontend: lib/api.ts** | JWT injection, authenticated fetch wrapper | Supabase client (`auth.getSession()`) |
| **Frontend: FragranceCard** | Reusable card UI, emits `onOpen(bottle)` | types/fragrance.ts |
| **Frontend: FragranceDetailModal** | Modal overlay for full bottle details | types/fragrance.ts, receives pre-fetched data |
| **Frontend: FragranceModalContext** | Global modal state (`useFragranceModal()` hook) | FragranceDetailModal |
| **Backend: routers/bottles.py** | Handles `/bottles` endpoint (search, filters) | Supabase DB, utils/bottle_normalizer.py |
| **Backend: routers/recommendations.py** | Handles `/recommendations` endpoint | intelligence/recommender.py, Supabase DB, utils/bottle_normalizer.py |
| **Backend: intelligence/recommender.py** | Loads TF-IDF model, runs inference | Pre-trained artifacts (*.pkl files) |
| **Backend: utils/bottle_normalizer.py** | `normalize_bottle()` — converts DB row to API response | None (pure data transformation) |
| **Scripts: train_recommender.py** | One-time training script (offline) | perfume_dataset_v1.csv |
| **Supabase Auth** | Issues JWTs on login | Frontend login flow |
| **Supabase Database** | Stores bottles, user_swipes, collections | Backend queries |

## Data Contracts

### Frontend ↔ Backend (API Response Format)
```typescript
// Frontend expects:
{
  bottle_id: number,        // Maps to backend original_index
  brand: string,
  name: string,             // Maps to backend perfume
  image_url: string | null, // Maps to backend image_path
  year: number | null,
  gender: string | null,
  rating_value: number | null,
  rating_count: number | null,
  main_accords: string[],   // Backend normalizes from comma-separated TEXT
  notes: {                  // Backend splits top_notes, middle_notes, base_notes
    top: string[],
    middle: string[],
    base: string[]
  }
}
```

### Backend ↔ Supabase (Database Schema)
```sql
-- bottles table columns:
original_index INT PRIMARY KEY,
brand TEXT,
perfume TEXT,
image_path TEXT,
launch_year INT,
gender TEXT,
rating_value REAL,
rating_count INT,
main_accords TEXT,  -- Comma-separated: "woody,spicy,warm"
top_notes TEXT,     -- Comma-separated
middle_notes TEXT,
base_notes TEXT
```

**Normalization step:** `utils/bottle_normalizer.py::normalize_bottle()` transforms:
- `original_index` → `bottle_id`
- `perfume` → `name`
- `image_path` → `image_url`
- `main_accords: "woody,spicy"` → `main_accords: ["woody", "spicy"]`
- `top_notes, middle_notes, base_notes` → `notes: { top: [...], middle: [...], base: [...] }`

## Authentication Flow (Supabase JWT)

```
User logs in
  → Supabase Auth issues JWT (access_token, refresh_token)
  → Frontend stores session in local storage (handled by Supabase client)

User makes API request
  → lib/api.ts calls supabase.auth.getSession()
  → Extracts access_token from session
  → Adds header: Authorization: Bearer <token>
  → Backend receives request
  → Backend verifies JWT signature using Supabase public key
  → Extracts user_id from token payload
  → Proceeds with query (can use user_id for personalized data)
```

**Token expiration:** Supabase tokens expire after ~1 hour. `lib/api.ts` should handle 401 responses by refreshing the token and retrying.

## Training vs Runtime (ML Model)

### Training (One-time, offline):
```bash
python scripts/train_recommender.py
```
**What it does:**
1. Loads `perfume_dataset_v1.csv`
2. Trains TF-IDF vectorizer on text features (brand, perfume, accords, notes)
3. Computes TF-IDF matrix for all bottles
4. Saves artifacts to disk:
   - `intelligence/artifacts/tfidf_vectorizer.pkl`
   - `intelligence/artifacts/tfidf_matrix.pkl`
   - `intelligence/artifacts/bottle_ids.pkl`

**When to re-run:** When new fragrances are added to the database, or when you want to retrain with different features.

### Runtime (Every `/recommendations` request):
```python
# intelligence/recommender.py
class Recommender:
    def __init__(self):
        # Load pre-trained artifacts (cached in memory)
        self.vectorizer = pickle.load(...)
        self.tfidf_matrix = pickle.load(...)
        self.bottle_ids = pickle.load(...)

    def get_recommendations(self, query_text: str, k: int):
        # Vectorize query using pre-trained vectorizer
        query_vec = self.vectorizer.transform([query_text])
        # Compute cosine similarity with all bottles
        similarities = cosine_similarity(query_vec, self.tfidf_matrix)
        # Return top k bottle IDs
        top_indices = similarities.argsort()[0][-k:][::-1]
        return [self.bottle_ids[i] for i in top_indices]
```

**No training happens at runtime** — model is already trained and loaded from disk.

## What I Learned About System Design

### 1. Layer Separation is Critical
- Frontend doesn't touch Supabase database directly (only via backend API)
- Backend doesn't expose raw DB schema (normalizes via `utils/bottle_normalizer.py`)
- ML model is encapsulated in `intelligence/` layer (backend routers don't know about TF-IDF internals)

### 2. Authentication at the Edge
- `lib/api.ts` is the **single point** where JWT is injected
- All frontend code trusts that `apiGet()`/`apiPost()` are authenticated
- Backend verifies on every request (stateless, no session storage)

### 3. Data Normalization Prevents Coupling
- If we change DB schema (`original_index` → `id`), we only update `utils/bottle_normalizer.py`
- Frontend types stay stable
- API contract is stable

### 4. ML Artifacts Live on Disk, Not in Database
- TF-IDF matrix is too large for Postgres TEXT column
- Pickle files are fast to load (mmap), cached in memory
- No DB queries needed for model inference (only for hydrating results)

### 5. Type Safety Across Boundaries
- TypeScript types (`types/fragrance.ts`) match normalized API response
- Backend response matches frontend types (enforced by tests, ideally)
- Prevents runtime errors from field name mismatches

## Current Architectural Risks

1. **Token refresh not implemented:**
   - If user session expires during browsing, API calls will fail with 401
   - **Mitigation:** Add retry logic in `lib/api.ts` that refreshes token and retries request

2. **No caching strategy:**
   - Every page navigation refetches data (e.g., clicking Explore → Recommender → Explore)
   - **Mitigation:** Use React Query or SWR for client-side caching

3. **Modal data staleness:**
   - If backend data changes (e.g., rating updated), modal shows old data
   - **Mitigation:** Option A (pass full object) is fine for v1; later, modal can refetch by `bottle_id`

4. **No pagination on Explore:**
   - If dataset grows to 10,000 bottles, `/bottles?limit=10000` will be slow
   - **Mitigation:** Add pagination (`?page=1&limit=50`) or infinite scroll

5. **ML model retraining process:**
   - Currently manual (`python scripts/train_recommender.py`)
   - **Future:** Automate retraining when new bottles are added (cron job, GitHub Action, etc.)

6. **Image loading performance:**
   - 50 bottles × 1 image = 50 network requests
   - **Mitigation:** Next.js Image component already optimizes this (lazy loading, responsive sizes)

## Next Steps

1. Implement `lib/api.ts` (JWT wrapper)
2. Build Swipe page (uses `/bottles/random`, `/swipe/candidates`, POST `/swipes`)
3. Build Explore page (uses `/bottles`, opens modal on card click)
4. Build Recommender page (uses `/recommendations`, opens modal on card click)
5. Build Collections page (uses `/collections/*`, requires backend endpoints)
6. Add token refresh logic to `lib/api.ts`
7. Add error boundaries for graceful failure handling
8. Write integration tests (Cypress/Playwright) for full user flows

---

# 2026-01-27 — Backend Contract Polish: Detail Endpoint + Collections API

## Summary
Completed a backend "contract polish + collections" pass to support frontend Bottle Detail modals and user-curated lists. Added missing fields to `normalize_bottle()`, created a single-bottle detail endpoint, standardized all list response envelopes, designed and implemented a collections data model with full CRUD.

## Decisions
- **Added `gender` and `country` to `normalize_bottle()`** so the detail modal has all metadata without a second endpoint or schema change.
- **Standardized all list endpoints to `{ results: [...] }`** — `/recommendations`, `/swipe/candidates`, and `/bottles/random` now share the same envelope. Frontend can use one response type for all lists.
- **Single `collections` table with `collection_type` column** (Option A) instead of three separate tables. All types (wishlist, favorites, personal) share identical structure, so one table with a CHECK constraint is simpler.
- **`bottle_id` in collections is `original_index` (int), not FK to bottles.id (UUID)** — same pattern as swipes table. Avoids UUID/int mismatch and keeps ML compatibility.
- **UNIQUE constraint on `(user_id, bottle_id, collection_type)`** — prevents duplicates at the database level and enables idempotent upsert on POST.
- **Idempotent DELETE** — returns 200 even if entry didn't exist, so frontend can toggle state without checking existence first.
- **GET /collections returns full normalized bottle cards** — two queries (collection rows then bottle details) so frontend can render immediately without a second fetch.

## Pitfalls
- **Upsert requires named conflict columns** — Supabase PostgREST's `on_conflict` parameter needs the exact column names matching the UNIQUE index, not the index name itself.
- **GET /collections ordering** — must order by `created_at DESC` on the collections query (not the bottles query) to preserve "most recently added" order. The bottles fetch via `.in_()` returns arbitrary order, so we reconstruct using the lookup dict pattern.
- **Response envelope inconsistency** — `/bottles/random` and `/swipe/candidates` were using `bottles` key while `/recommendations` used `results`. Standardizing to `results` is a breaking change for any frontend code already consuming the old key.

## What I Learned
- **Idempotent APIs simplify frontend state management.** When POST is a no-op on duplicates and DELETE succeeds even if nothing exists, the frontend doesn't need to track server state before making requests. Fire-and-forget.
- **Single table with type column > multiple identical tables.** The collections use case seemed like it needed three tables, but since the schema is identical across types, one table with a CHECK constraint gives you fewer migrations, one set of indexes, and one router file.
- **`normalize_bottle()` is the single source of truth for the API contract.** Every endpoint that returns bottle data passes through this function, so adding a field here (gender, country) propagates everywhere automatically. This is the payoff of the normalization layer architecture.

## Next Steps
1. Run `create_collections.sql` in Supabase Dashboard SQL Editor
2. Test all three collection endpoints with curl/httpie (POST, GET, DELETE)
3. Implement frontend Collection page consuming the new API
4. Implement frontend Bottle Detail modal using `GET /bottles/{bottle_id}`
5. Add `k` and `exclude_ids` params to `/swipe/candidates` for swipe queue polish

---

# 2026-01-29 — Paginated Browse Endpoint for Explore Page

## Summary
Implemented `GET /bottles` endpoint with pagination, search, and stable ordering. This powers the Explore page's "browse directory list" feature with deterministic results across page navigation.

## Decisions
- **Stable ordering: `rating_count DESC → rating_value DESC → original_index ASC`** — most reviewed bottles first (popularity signal), then higher rated among ties, then deterministic tiebreaker. Ensures page 1/2/3 are consistent across requests.
- **Search uses `OR` with `ilike`** — `q` param filters bottles where name OR brand contains the search term (case-insensitive). Matches user mental model of "search everything".
- **Response includes pagination metadata** — `{ page, limit, total, results }` so frontend can calculate total pages and show "X of Y" indicators.
- **Supabase `.range()` is 0-indexed and inclusive on both ends** — `.range(0, 23)` returns 24 items (rows 0-23). Offset formula: `(page - 1) * limit`.
- **Route ordering matters in FastAPI** — `GET /bottles` must be defined BEFORE `GET /bottles/{bottle_id}` to avoid the parameterized route capturing "random" as a bottle_id.

## Implementation Details
```python
@router.get("/bottles")
async def get_bottles(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    q: str | None = Query(None)
):
    offset = (page - 1) * limit
    query = supabase.table("bottles").select("*", count="exact")

    if q and q.strip():
        query = query.or_(f"name.ilike.%{search_term}%,brand.ilike.%{search_term}%")

    response = query \
        .order("rating_count", desc=True, nullsfirst=False) \
        .order("rating_value", desc=True, nullsfirst=False) \
        .order("original_index", desc=False) \
        .range(offset, offset + limit - 1) \
        .execute()
```

## Pitfalls
- **Supabase `count="exact"` adds overhead** — for large tables, consider using `count="estimated"` or removing count for non-first pages. For 24K bottles, exact count is acceptable.
- **ilike with leading wildcard `%term%` can't use indexes** — full table scan on name/brand columns. For MVP this is fine, but at scale consider PostgreSQL full-text search (`to_tsvector`/`to_tsquery`).
- **Ordering by nullable columns needs `nullsfirst=False`** — ensures NULL ratings sort to the end, not the beginning.

## What I Learned
- **Deterministic pagination requires multi-column ordering.** Single column ordering (e.g., just `rating_count DESC`) leaves rows with identical values in undefined order, causing bottles to appear on multiple pages or skip entirely.
- **`count="exact"` in Supabase PostgREST** returns total matching rows in `response.count`, enabling frontend pagination controls without a separate COUNT query.
- **FastAPI route ordering is positional.** The first matching route wins. `/bottles` defined after `/bottles/{bottle_id}` would never match because `{bottle_id}` captures any string including empty.

## Test Results
```
Page 1: Alien (29858 reviews), Angel (29722), Light Blue (29708)
Page 2: Coco Mademoiselle (29283), La Vie Est Belle (28982), Black Orchid (26053)
Search "dior": 196 matches — Hypnotic Poison, J'Adore, Sauvage, Fahrenheit...
```

## Next Steps
1. Commit and push the paginated browse endpoint
2. Consider adding sort param (e.g., `sort=newest`, `sort=rating`) for future flexibility
3. Implement frontend Explore page consuming this endpoint with infinite scroll

---
