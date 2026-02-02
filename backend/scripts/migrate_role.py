import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

# Ensure we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.logger import get_logger

load_dotenv()

logger = get_logger()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate_role():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment variables")
        return

    logger.info(f"Connecting to database to migrate Role column...")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"ssl": "require"})

    async with engine.begin() as conn:
        logger.info("Running ALTER TABLE command for 'users'...")
        
        # Add role column with default value 'user'
        cmd = "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user' NOT NULL;"
        
        logger.info(f"Executing: {cmd}")
        await conn.execute(text(cmd))
            
        logger.info("Role migration completed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_role())
