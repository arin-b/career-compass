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
    previous_roadmap_summary: str = None  # Optional context from previous roadmap completion

from app.api.deps import get_current_user

@router.post("/generate")
async def generate_roadmap(request: GenerateRoadmapRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Generates a career roadmap for the given user using their profile data.
    """
    logger.info(f"Received generation request for user {current_user.id}")
    
    user = current_user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch Profile
    profile_result = await db.execute(select(Profile).where(Profile.id == current_user.id))
    profile = profile_result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found. Please complete your profile first.")

    transcript_preview = profile.transcript_summary[:100] if profile.transcript_summary else "None"
    logger.info(f"Profile data: manual_gpa={profile.manual_gpa}, manual_major={profile.manual_major}, hobbies={profile.hobbies}, extracurriculars={profile.extracurriculars}, bio={profile.bio}, additional_context={profile.additional_context}, transcript_summary={transcript_preview}...")

    manual_data = {
        "manual_gpa": profile.manual_gpa,
        "manual_major": profile.manual_major,
        "hobbies": profile.hobbies,
        "extracurriculars": profile.extracurriculars,
        "bio": profile.bio,
        "additional_context": profile.additional_context
    }
    
    transcript_text = profile.transcript_summary
    if not transcript_text:
         # Check if we should allow generation without transcript if manual data is rich enough?
         # For now, stick to the rule: Need transcript or detailed manual entry?
         # The prompt engine handles missing transcript gracefully if manual data exists, 
         # but let's warn if absolutely nothing.
         if not (profile.manual_major or profile.additional_context):
              raise HTTPException(
                  status_code=400, 
                  detail="Please upload a transcript or provide profile details to generate a roadmap."
              )
         transcript_text = "No transcript provided."

    # Derive interests from hobbies/extracurriculars if not explicitly passed (since we removed them from input)
    # We can treat hobbies as interests.
    interests = profile.hobbies if profile.hobbies else []
    if profile.extracurriculars:
        interests.extend(profile.extracurriculars)
    
    # If explicitly empty, maybe default to "General Career Advice" or similar
    if not interests:
        interests = ["General Career Growth"]

    try:
        roadmap_json = await generate_career_roadmap(
            transcript_text,
            interests,
            manual_data,
            previous_roadmap_context=request.previous_roadmap_summary if request.previous_roadmap_summary else None
        )
        
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
            select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == new_roadmap.id).order_by(RoadmapMilestone.id)
        )
        created_milestones = milestones_result.scalars().all()
        
        logger.info(f"Created {len(created_milestones)} milestones in DB for roadmap {new_roadmap.id}")
        for idx, m in enumerate(created_milestones):
            logger.info(f"  Milestone {idx}: ID={m.id}, Title={m.title}")
        
        import copy
        roadmap_with_ids = copy.deepcopy(roadmap_json)
        if "milestones" in roadmap_with_ids and created_milestones:
            logger.info(f"Injecting IDs into {len(roadmap_with_ids['milestones'])} JSON milestones")
            # Map created milestones by title (or sequence if titles assume uniqueness, which is risky but standard for initial generation)
            # Using index is safest for initial generation sequence mapping
            for i, milestone_db in enumerate(created_milestones):
                if i < len(roadmap_with_ids["milestones"]):
                    roadmap_with_ids["milestones"][i]["id"] = str(milestone_db.id)
                    logger.info(f"Injecting ID {milestone_db.id} for milestone {roadmap_with_ids['milestones'][i].get('title')}")
            # Save the IDs back to the database
            logger.info(f"Saving roadmap content with IDs to database")
            new_roadmap.content = roadmap_with_ids
            await db.commit()
            logger.info(f"Roadmap committed with IDs")
        else:
            logger.warning(f"Could not inject IDs: has milestones in JSON? {('milestones' in roadmap_with_ids)}, created_milestones count: {len(created_milestones)}")
        
        logger.info(f"Returning roadmap response with milestones: {len(roadmap_with_ids.get('milestones', []))}")
        logger.info(f"First milestone in response has ID? {roadmap_with_ids.get('milestones', [{}])[0].get('id') if roadmap_with_ids.get('milestones') else 'N/A'}")
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
        select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == roadmap.id).order_by(RoadmapMilestone.id)
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
    
    json_milestones = roadmap_data.get("milestones", [])
    
    if milestones:
        # Sort milestones by creation time or just assume list order matches if generated together
        # Beware: UUID sort is random. We rely on insertion order usually being preserved in 'all()', but explicit sort is better.
        # However, we don't have a reliable 'sequence_index' column yet.
        # We will attempt to match by Title first, then by index as fallback.
        
        db_milestones_map = {m.title: m for m in milestones}
        # Use list order as-is since milestones are created sequentially
        sorted_db_milestones = list(milestones)
        
        logger.info(f"Matching {len(json_milestones)} JSON milestones with {len(milestones)} DB milestones")
        
        # If JSON has no milestones but DB has them, reconstruct from DB
        if not json_milestones and milestones:
            logger.warning(f"No milestones in JSON content, reconstructing from DB...")
            for db_m in sorted_db_milestones:
                info = db_m.info or {}
                reconciled_milestones.append({
                    "id": str(db_m.id),
                    "title": db_m.title,
                    "description": db_m.description,
                    "status": db_m.status,
                    "projects": info.get("projects", []),
                    "skills": info.get("skills", []),
                    "semester": info.get("semester", "")
                })
        else:
            for i, ms_json in enumerate(json_milestones):
                title = ms_json.get("title")
                db_match = db_milestones_map.get(title)
                
                if db_match:
                    # Merge by title match
                    ms_json["id"] = str(db_match.id)
                    ms_json["status"] = db_match.status
                    reconciled_milestones.append(ms_json)
                    logger.info(f"Matched milestone '{title}' by title, assigned ID {db_match.id}")
                elif i < len(sorted_db_milestones):
                    # Fallback: match by index if title match fails
                    db_match = sorted_db_milestones[i]
                    logger.warning(f"Milestone '{title}' matched by index {i} instead of title for roadmap {roadmap.id}, assigned ID {db_match.id}")
                    ms_json["id"] = str(db_match.id)
                    ms_json["status"] = db_match.status
                    reconciled_milestones.append(ms_json)
                else:
                    # Milestone in JSON but not in DB? Should not happen if sync is correct.
                    # Try to assign a fallback ID from any remaining DB milestone
                    logger.warning(f"Milestone '{title}' at index {i} found in JSON but not in DB for roadmap {roadmap.id}")
                    # Last resort: use the last DB milestone if available
                    if sorted_db_milestones:
                        db_match = sorted_db_milestones[-1]
                        ms_json["id"] = str(db_match.id)
                        ms_json["status"] = db_match.status
                    reconciled_milestones.append(ms_json)
    else:
        # No DB milestones found - this is the critical case!
        # Auto-repair: create milestones in DB from JSON content
        logger.error(f"No milestones found in DB for roadmap {roadmap.id}, checking if JSON has milestones...")
        if json_milestones:
            logger.error(f"Found {len(json_milestones)} JSON milestones but 0 DB milestones for roadmap {roadmap.id}")
            logger.info("Auto-repairing: Creating milestones in DB from JSON content...")
            
            try:
                # Create milestones in DB from JSON
                for ms in json_milestones:
                    milestone = RoadmapMilestone(
                        roadmap_id=roadmap.id,
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
                
                await db.flush()
                
                # Fetch newly created milestones
                new_milestones_result = await db.execute(
                    select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == roadmap.id).order_by(RoadmapMilestone.id)
                )
                new_milestones = new_milestones_result.scalars().all()
                
                # Assign IDs to JSON milestones
                for i, (ms, db_m) in enumerate(zip(json_milestones, new_milestones)):
                    ms["id"] = str(db_m.id)
                    ms["status"] = db_m.status
                    reconciled_milestones.append(ms)
                    logger.info(f"Auto-repair: Created milestone '{ms.get('title')}' with ID {db_m.id}")
                
                # Update roadmap content with new IDs
                import copy
                updated_content = copy.deepcopy(roadmap_data)
                updated_content["milestones"] = reconciled_milestones
                roadmap.content = updated_content
                await db.commit()
                logger.info(f"Auto-repair complete: Created {len(new_milestones)} milestones for roadmap {roadmap.id}")
                
            except Exception as e:
                logger.error(f"Auto-repair failed: {e}")
                await db.rollback()
                reconciled_milestones = json_milestones
        else:
            reconciled_milestones = json_milestones
        
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

@router.get("/history")
async def get_roadmap_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the user's roadmap history (all roadmaps they've generated).
    """
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.created_at.desc())
    )
    roadmaps = result.scalars().all()
    
    roadmap_list = []
    for roadmap in roadmaps:
        # Count completed milestones
        milestones_result = await db.execute(
            select(RoadmapMilestone).where(RoadmapMilestone.roadmap_id == roadmap.id)
        )
        milestones = milestones_result.scalars().all()
        completed_count = sum(1 for m in milestones if m.status == MilestoneStatus.DONE)
        
        roadmap_list.append({
            "id": str(roadmap.id),
            "title": roadmap.title,
            "description": roadmap.description,
            "created_at": roadmap.created_at.isoformat(),
            "status": roadmap.status,
            "total_milestones": len(milestones),
            "completed_milestones": completed_count
        })
    
    return {
        "roadmaps": roadmap_list
    }

