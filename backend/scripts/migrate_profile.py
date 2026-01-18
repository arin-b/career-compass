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

async def migrate_profile():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment variables")
        return

    logger.info(f"Connecting to database to migrate Profile table...")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"ssl": "require"})

    async with engine.begin() as conn:
        logger.info("Running ALTER TABLE commands for 'profiles'...")
        
        # Add columns if they don't exist
        # We use IF NOT EXISTS logic via checking information_schema logic or just try/catch blocks in SQL 
        # But simpler logic for Postgres is often just attempting to add and catching duplicate error, 
        # OR using specific "ADD COLUMN IF NOT EXISTS" syntax which Postgres supports.
        
        commands = [
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hobbies JSONB DEFAULT '[]';",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extracurriculars JSONB DEFAULT '[]';",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manual_gpa FLOAT;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manual_major VARCHAR;"
        ]

        for cmd in commands:
            logger.info(f"Executing: {cmd}")
            await conn.execute(text(cmd))
            
        logger.info("Profile migration completed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_profile())
