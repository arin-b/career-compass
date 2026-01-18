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

async def migrate_identity():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment variables")
        return

    logger.info(f"Connecting to database to migrate Identity columns...")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"ssl": "require"})

    async with engine.begin() as conn:
        logger.info("Running ALTER TABLE commands for 'users'...")
        
        commands = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_base64 TEXT;"
        ]

        for cmd in commands:
            logger.info(f"Executing: {cmd}")
            await conn.execute(text(cmd))
            
        logger.info("Identity migration completed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_identity())
