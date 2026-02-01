import asyncio
import os
import json
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.models import Roadmap

# Load environment variables
load_dotenv(os.path.join("backend", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment")
    sys.exit(1)

# Ensure async driver is used
if not "asyncpg" in DATABASE_URL:
     DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

print(f"Connecting to DB...")

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"ssl": "require"})
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    async with AsyncSessionLocal() as session:
        print("Fetching latest roadmap...")
        # Get the most recent roadmap
        result = await session.execute(
            select(Roadmap).order_by(Roadmap.created_at.desc()).limit(1)
        )
        roadmap = result.scalar_one_or_none()
        
        if not roadmap:
            print("No roadmaps found in database.")
            return

        print(f"\nTime: {roadmap.created_at}")
        print(f"Roadmap ID: {roadmap.id}")
        print(f"User ID: {roadmap.user_id}")
        
        print("\n--- TOP LEVEL KEYS ---")
        if roadmap.content:
            print(list(roadmap.content.keys()))
            
            print("\n--- MILESTONES CHECK ---")
            if "milestones" in roadmap.content:
                print(f"Found 'milestones' key with {len(roadmap.content['milestones'])} items.")
                if len(roadmap.content['milestones']) > 0:
                    print("First milestone sample:")
                    print(json.dumps(roadmap.content['milestones'][0], indent=2))
            else:
                print("KEY 'milestones' NOT FOUND in content root!")
                # check for nested 'roadmap' key
                if "roadmap" in roadmap.content:
                     print("Found nested 'roadmap' key. Checking inside...")
                     print(list(roadmap.content["roadmap"].keys()))
                     
        else:
             print("Roadmap content is empty/null")

        print("\n--- FULL CONTENT DUMP ---")
        print(json.dumps(roadmap.content, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
