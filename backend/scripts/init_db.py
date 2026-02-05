import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

# Ensure we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.models.models import Base, User, AcademicLevel
from app.core.logger import get_logger

load_dotenv()

logger = get_logger()

DATABASE_URL = os.getenv("DATABASE_URL")

async def init_db():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in environment variables")
        return

    logger.info(f"Connecting to database...")
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"ssl": "require"})

    async with engine.begin() as conn:
        # 1. Enable pgvector extension
        logger.info("Enabling pgvector extension...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        # 1.5 Drop VectorStore table to handle dimension change
        logger.info("Dropping tables if exists...")
        await conn.execute(text("DROP TABLE IF EXISTS vector_store CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS roadmap_milestones CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS roadmaps CASCADE"))
        
        # 2. Create Tables
        logger.info("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Tables created successfully.")

    # 3. Skip creating a dummy user in init scripts. Real user accounts
    # should be created through the signup flow or migrations.
    logger.info("Skipping dummy user creation (no hardcoded test user).")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
