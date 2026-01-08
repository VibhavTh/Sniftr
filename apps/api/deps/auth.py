"""
Purpose:
FastAPI dependency for JWT authentication and authorization.

Responsibilities:
- Extract JWT tokens from Authorization headers
- Verify token signature using Supabase JWT secret
- Decode token payload to extract user identity (user_id, email)
- Raise HTTP 401 errors for missing, malformed, or invalid tokens

System context:
- Used by protected route handlers via FastAPI's Depends() injection
- Validates tokens issued by Supabase auth service
- Centralizes auth logic to ensure consistent security across all protected endpoints
"""

import requests
from fastapi import HTTPException, Request

from jose import JWTError, jwt
from core.config import settings


async def get_current_user(request: Request):
    """
    Dependency function that verifies JWT Bearer tokens and returns user context.

    This function is injected into protected route handlers using FastAPI's
    Depends() mechanism. It extracts the Authorization header, validates the
    JWT signature against the Supabase secret, and returns the authenticated
    user's ID and email. Any authentication failures result in HTTP 401 errors.

    Args:
        request: FastAPI Request object containing HTTP headers

    Returns:
        dict: User context with keys 'user_id' and 'email'

    Raises:
        HTTPException(401): If Authorization header is missing, malformed, or invalid
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = parts[1]

    # Supabase uses ES256 (Elliptic Curve) for JWT signing. To verify ES256 tokens,
    # we fetch the public key from Supabase's JWKS (JSON Web Key Set) endpoint.
    # This is more secure than HS256 (HMAC) which uses a shared secret.
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"

    try:
        # Fetch the JWKS containing Supabase's public keys
        jwks_response = requests.get(jwks_url)
        jwks = jwks_response.json()

        # Verify the token signature using the public key from JWKS
        # python-jose automatically selects the correct key and algorithm (ES256)
        payload = jwt.decode(
            token,
            jwks,
            options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    return {"user_id": user_id, "email": email}