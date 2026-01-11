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

    # 3. Create Dummy User
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.ext.asyncio import AsyncSession
    
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT * FROM users WHERE email = 'alex@example.com'"))
        existing_user = result.scalar()
        
        if not existing_user:
            logger.info("Creating dummy user Alex...")
            new_user = User(
                email="alex@example.com",
                hashed_password="mock_hashed_password",
                full_name="Alex Hamilton",
                academic_level=AcademicLevel.UNDERGRADUATE
            )
            session.add(new_user)
            await session.commit()
            logger.info(f"User Alex created with ID: {new_user.id}")
        else:
            logger.info("User Alex already exists.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
