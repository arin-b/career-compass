from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.models.models import User, Roadmap, RoadmapMilestone, MilestoneStatus, Profile
from app.services.roadmap_engine import generate_career_roadmap
from app.core.logger import get_logger

router = APIRouter()
logger = get_logger()

class GenerateRoadmapRequest(BaseModel):
    user_id: uuid.UUID
    interests: List[str]
    transcript_summary: str = "No transcript provided"

from app.api.deps import get_current_user

@router.post("/generate")
async def generate_roadmap(request: GenerateRoadmapRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Generates a career roadmap for the given user.
    """
    logger.info(f"Received generation request for user {current_user.id}")
    
    # Verify user exists (from token)
    user = current_user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch Profile for Transcript if not provided in request
    transcript_text = request.transcript_summary
    if not transcript_text or transcript_text == "No transcript provided":
        profile_result = await db.execute(select(Profile).where(Profile.id == request.user_id))
        profile = profile_result.scalar_one_or_none()
        if profile and profile.transcript_summary:
            transcript_text = profile.transcript_summary
            
    if not transcript_text:
         # Fix: Return 400 instead of generic interest to force user to upload transcript
         raise HTTPException(
             status_code=400, 
             detail="Please upload a transcript first so we can generate a personalized roadmap."
         )

    try:
         # Call AI Engine
        roadmap_json = await generate_career_roadmap(transcript_text, request.interests)
        
        # Save to DB
        new_roadmap = Roadmap(
            user_id=user.id,
            title=roadmap_json.get("title", "Generated Career Roadmap"),
            description=roadmap_json.get("summary", ""),
            content=roadmap_json
        )
        db.add(new_roadmap)
        await db.flush()  # to get new_roadmap.id
        
        for ms in roadmap_json.get("milestones", []):
            milestone = RoadmapMilestone(
                roadmap_id=new_roadmap.id,
                title=ms.get("title"),
                description=ms.get("description"),
                status=MilestoneStatus.PENDING,
                info={
                    "projects": ms.get("projects", []),
                    "skills": ms.get("skills", []),
                    "semester": ms.get("semester", "")
                }
            )
            db.add(milestone)
            
        await db.commit()
        await db.refresh(new_roadmap)
        
        # Fetch created milestones with IDs
        milestones_result = await db.execute(
            select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == new_roadmap.id)
        )
        created_milestones = milestones_result.scalars().all()
        
        # Add IDs to the roadmap JSON
        roadmap_with_ids = roadmap_json.copy()
        if "milestones" in roadmap_with_ids and created_milestones:
            for i, milestone_db in enumerate(created_milestones):
                if i < len(roadmap_with_ids["milestones"]):
                    roadmap_with_ids["milestones"][i]["id"] = str(milestone_db.id)
        
        return {
            "message": "Roadmap generated successfully", 
            "roadmap_id": new_roadmap.id,
            "roadmap": roadmap_with_ids
        }

    except Exception as e:
        logger.error(f"Failed to generate roadmap: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class UpdateMilestoneRequest(BaseModel):
    status: MilestoneStatus

@router.patch("/milestones/{milestone_id}")
async def update_milestone_status(
    milestone_id: uuid.UUID,
    request: UpdateMilestoneRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the status of a milestone.
    """
    logger.info(f"Updating milestone {milestone_id} to status {request.status}")
    
    # Fetch milestone
    result = await db.execute(
        select(RoadmapMilestone).where(RoadmapMilestone.id == milestone_id)
    )
    milestone = result.scalar_one_or_none()
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Update status
    milestone.status = request.status
    await db.commit()
    await db.refresh(milestone)
    
    return {
        "id": milestone.id,
        "status": milestone.status,
        "title": milestone.title
    }
