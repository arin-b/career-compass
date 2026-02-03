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

async def migrate_profile_enhancement():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment variables")
        return

    logger.info(f"Connecting to database to migrate Profile enhancement columns...")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"ssl": "require"})

    async with engine.begin() as conn:
        logger.info("Running ALTER TABLE commands for 'profiles'...")
        
        commands = [
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS transcript_metadata JSONB DEFAULT '[]';",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS additional_context TEXT;"
        ]

        for cmd in commands:
            logger.info(f"Executing: {cmd}")
            await conn.execute(text(cmd))
            
        logger.info("Profile enhancement migration completed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_profile_enhancement())
