from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Any
import uuid

from app.api.deps import get_db, get_current_admin
from app.models.models import User, Roadmap, Profile, RoadmapMilestone
from app.schemas.profile import ProfileResponse

router = APIRouter()

@router.get("/users", response_model=List[Any])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Retrieve all users.
    Only accessible by superuser.
    """
    query = select(User).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Return a simplified structure or use a proper schema
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at,
            "display_name": u.display_name,
            "avatar_base64": u.avatar_base64
        }
        for u in users
    ]

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a user.
    Only accessible by superuser.
    """
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Delete the user with all related data (roadmaps, profile, chat sessions)
    # Must use session.delete() for ORM cascade="all, delete-orphan" to work
    try:
        await db.delete(user)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )


@router.get("/users/{user_id}/full-details")
async def get_user_full_details(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Retrieve full details for a specific user.
    Includes profile data and latest roadmap with milestones.
    Only accessible by superuser.
    """
    # Fetch User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch Profile
    profile_result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = profile_result.scalar_one_or_none()

    profile_data = None
    if profile:
        profile_data = {
            "bio": profile.bio,
            "hobbies": profile.hobbies or [],
            "extracurriculars": profile.extracurriculars or [],
            "manual_gpa": profile.manual_gpa,
            "manual_major": profile.manual_major,
            "transcript_summary": profile.transcript_summary,
            "transcript_metadata": profile.transcript_metadata or [],
            "additional_context": profile.additional_context,
        }

    # Fetch latest Roadmap
    roadmap_result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == user_id)
        .order_by(Roadmap.created_at.desc())
        .limit(1)
    )
    roadmap = roadmap_result.scalar_one_or_none()

    roadmap_data = None
    if roadmap:
        # Fetch milestones from DB
        milestones_result = await db.execute(
            select(RoadmapMilestone)
            .where(RoadmapMilestone.roadmap_id == roadmap.id)
            .order_by(RoadmapMilestone.id)
        )
        milestones = milestones_result.scalars().all()

        roadmap_content = roadmap.content or {}

        # Handle legacy nested 'text' format
        if "text" in roadmap_content and isinstance(roadmap_content["text"], str):
            import json
            try:
                roadmap_content = json.loads(roadmap_content["text"])
            except Exception:
                pass

        json_milestones = roadmap_content.get("milestones", [])

        # Reconcile DB milestones with JSON content (same logic as /roadmaps/latest)
        reconciled_milestones = []
        if milestones:
            db_milestones_map = {m.title: m for m in milestones}
            sorted_db_milestones = list(milestones)

            if not json_milestones and milestones:
                for db_m in sorted_db_milestones:
                    info = db_m.info or {}
                    reconciled_milestones.append({
                        "id": str(db_m.id),
                        "title": db_m.title,
                        "description": db_m.description,
                        "status": db_m.status,
                        "projects": info.get("projects", []),
                        "skills": info.get("skills", []),
                        "semester": info.get("semester", ""),
                    })
            else:
                for i, ms_json in enumerate(json_milestones):
                    title = ms_json.get("title")
                    db_match = db_milestones_map.get(title)
                    if db_match:
                        ms_json["id"] = str(db_match.id)
                        ms_json["status"] = db_match.status
                        reconciled_milestones.append(ms_json)
                    elif i < len(sorted_db_milestones):
                        db_match = sorted_db_milestones[i]
                        ms_json["id"] = str(db_match.id)
                        ms_json["status"] = db_match.status
                        reconciled_milestones.append(ms_json)
                    else:
                        reconciled_milestones.append(ms_json)
        else:
            reconciled_milestones = json_milestones

        roadmap_content["milestones"] = reconciled_milestones
        roadmap_data = {
            "roadmap_id": str(roadmap.id),
            "title": roadmap.title,
            "description": roadmap.description,
            "status": str(roadmap.status) if roadmap.status else None,
            "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
            "content": roadmap_content,
        }

    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "display_name": user.display_name,
            "avatar_base64": user.avatar_base64,
        },
        "profile": profile_data,
        "roadmap": roadmap_data,
    }

