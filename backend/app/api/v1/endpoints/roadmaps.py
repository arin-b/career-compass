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
    
    user = current_user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    manual_data = {}
    
    profile_result = await db.execute(select(Profile).where(Profile.id == request.user_id))
    profile = profile_result.scalar_one_or_none()
    
    transcript_text = request.transcript_summary
    if not transcript_text or transcript_text == "No transcript provided":
        if profile and profile.transcript_summary:
            transcript_text = profile.transcript_summary
            
    if profile:
        manual_data = {
            "manual_gpa": profile.manual_gpa,
            "manual_major": profile.manual_major,
            "hobbies": profile.hobbies,
            "extracurriculars": profile.extracurriculars,
            "hobbies": profile.hobbies,
            "extracurriculars": profile.extracurriculars,
            "bio": profile.bio,
            "additional_context": profile.additional_context
        }
            
    if not transcript_text:
         raise HTTPException(
             status_code=400, 
             detail="Please upload a transcript first so we can generate a personalized roadmap."
         )

    try:
        roadmap_json = await generate_career_roadmap(transcript_text, request.interests, manual_data)
        
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
        
        milestones_result = await db.execute(
            select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == new_roadmap.id)
        )
        created_milestones = milestones_result.scalars().all()
        
        roadmap_with_ids = roadmap_json.copy()
        if "milestones" in roadmap_with_ids and created_milestones:
            # Map created milestones by title (or sequence if titles assume uniqueness, which is risky but standard for initial generation)
            # Using index is safest for initial generation sequence mapping
            for i, milestone_db in enumerate(created_milestones):
                if i < len(roadmap_with_ids["milestones"]):
                    roadmap_with_ids["milestones"][i]["id"] = str(milestone_db.id)
                    logger.info(f"Injecting ID {milestone_db.id} for milestone {roadmap_with_ids['milestones'][i].get('title')}")
        
        return {
            "message": "Roadmap generated successfully", 
            "roadmap_id": new_roadmap.id,
            "roadmap": roadmap_with_ids
        }

    except Exception as e:
        logger.error(f"Failed to generate roadmap: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest")
async def get_latest_roadmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the user's latest active roadmap with real Milestone UUIDs.
    """
    # Fetch latest roadmap
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.created_at.desc())
        .limit(1)
    )
    roadmap = result.scalar_one_or_none()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="No roadmap found")
        
    # Fetch Milestones
    milestones_result = await db.execute(
        select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == roadmap.id)
    )
    milestones = milestones_result.scalars().all()
    
    # Construct Response
    # Merge DB data (ID, status) with the content JSON (structure, descriptions)
    # Note: Content JSON might be "stale" compared to DB milestones if we updated status
    
    roadmap_data = roadmap.content
    
    # Check if roadmap_data is nested in 'text' (legacy fix)
    if "text" in roadmap_data and isinstance(roadmap_data["text"], str):
         import json
         try:
             roadmap_data = json.loads(roadmap_data["text"])
         except:
             pass

    if "milestones" not in roadmap_data:
         # Fallback reconstruction if content is bad
         roadmap_data["milestones"] = []

    # Create a map of DB milestones for easy lookup
    # We try to match by title first, or index if title fails
    # Since generate creates them in order, index matching *should* be consistent if arrays align
    
    reconciled_milestones = []
    
    # We will prioritize DB milestones as source of truth for Status and ID
    # and use JSON content for 'static' data (description, projects, etc) if available
    
    if milestones:
        # Sort milestones by creation time or just assume list order matches if generated together
        # Beware: UUID sort is random. We rely on insertion order usually being preserved in 'all()', but explicit sort is better.
        # However, we don't have a reliable 'sequence_index' column yet.
        # We will attempt to match by Title.
        
        db_milestones_map = {m.title: m for m in milestones}
        
        for ms_json in roadmap_data.get("milestones", []):
            title = ms_json.get("title")
            db_match = db_milestones_map.get(title)
            
            if db_match:
                # Merge
                ms_json["id"] = str(db_match.id)
                ms_json["status"] = db_match.status
                reconciled_milestones.append(ms_json)
            else:
                # Milestone in JSON but not in DB? Should not happen if sync is correct.
                # Keep it but it has no ID -> Checkbox will fail.
                logger.warning(f"Milestone '{title}' found in JSON but not in DB for roadmap {roadmap.id}")
                reconciled_milestones.append(ms_json)
    else:
        # No DB milestones? Return JSON as is (will lack IDs)
        reconciled_milestones = roadmap_data.get("milestones", [])
        
    roadmap_data["milestones"] = reconciled_milestones
    
    return {
        "roadmap_id": roadmap.id,
        "roadmap": roadmap_data
    }

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
    
    result = await db.execute(
        select(RoadmapMilestone).where(RoadmapMilestone.id == milestone_id)
    )
    milestone = result.scalar_one_or_none()
    
    if not milestone:
        logger.error(f"Milestone {milestone_id} not found in DB")
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone.status = request.status
    await db.commit()
    await db.refresh(milestone)
    
    return {
        "id": milestone.id,
        "status": milestone.status,
        "title": milestone.title
    }
