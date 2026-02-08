"""
Purpose:
Async database connection pool for RDS PostgreSQL.

Responsibilities:
- Create and manage asyncpg connection pool
- Provide helper functions for common query patterns
- Handle connection lifecycle in app lifespan

System context:
- Pool created at app startup, closed at shutdown
- Accessed in route handlers via: from db import db
- Uses DATABASE_URL from environment (RDS connection string)
"""

import asyncpg
from typing import Any, Optional


class Database:
    """Async PostgreSQL connection pool wrapper."""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self, dsn: str, min_size: int = 5, max_size: int = 20):
        """Create connection pool."""
        self.pool = await asyncpg.create_pool(
            dsn,
            min_size=min_size,
            max_size=max_size,
            command_timeout=30,
        )

    async def disconnect(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()

    async def fetch_all(self, query: str, *args) -> list[dict]:
        """Execute query and return all rows as dicts."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]

    async def fetch_one(self, query: str, *args) -> Optional[dict]:
        """Execute query and return single row as dict (or None)."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None

    async def fetch_val(self, query: str, *args) -> Any:
        """Execute query and return single value."""
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)

    async def execute(self, query: str, *args) -> str:
        """Execute query (INSERT/UPDATE/DELETE) and return status."""
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)


# Singleton instance - import this in routers
db = Database()
