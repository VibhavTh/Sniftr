# ScentlyMax API Runbook

## Local Development Setup

### Prerequisites
- Python 3.10+ installed
- pip package manager
- Supabase project created

### 1. Install Dependencies

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the values from your Supabase project:

```bash
# Edit apps/api/.env and add your Supabase credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- `SUPABASE_URL`: Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (under "Project API keys")
- `SUPABASE_JWT_SECRET`: JWT Secret (under "JWT Settings")

### 3. Run the Development Server

```bash
cd apps/api
uvicorn main:app --reload --port 8000
```

The API will be available at:
- http://localhost:8000
- Interactive docs: http://localhost:8000/docs

### 4. Test the Endpoints

**Public health check:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

**Protected health check (requires JWT token):**
```bash
# First, get a token by logging in via the frontend at localhost:3000
# Then use it here:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/health-auth
# Expected: {"user_id":"...","email":"..."}
```

## Project Structure

```
apps/api/
├── main.py              # FastAPI app entry point
├── core/
│   ├── __init__.py
│   └── config.py        # Environment variable management
├── deps/
│   ├── __init__.py
│   └── auth.py          # JWT authentication dependency
├── routers/
│   ├── __init__.py
│   └── health.py        # Health check endpoints
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables (not committed)
```

## Common Issues

### ModuleNotFoundError
Make sure you're in the virtual environment and all dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### ValidationError on startup
Check that your `.env` file exists in `apps/api/` and contains all required variables.

### CORS errors from frontend
Verify that `http://localhost:3000` is in the `allow_origins` list in `main.py`.

### 401 Unauthorized on /health-auth
- Ensure you're sending the `Authorization: Bearer <token>` header
- Verify the JWT_SECRET in `.env` matches your Supabase project
- Check that the token hasn't expired
