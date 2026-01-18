from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.models.models import User, Profile
from app.schemas.profile import ProfileUpdate, ProfileResponse

router = APIRouter()

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_in: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch profile
    result = await db.execute(select(Profile).where(Profile.id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Create if not exists
        profile = Profile(id=current_user.id)
        db.add(profile)
    
    # Update fields
    if profile_in.bio is not None:
        profile.bio = profile_in.bio
    if profile_in.hobbies is not None:
        profile.hobbies = profile_in.hobbies
    if profile_in.extracurriculars is not None:
        profile.extracurriculars = profile_in.extracurriculars
    if profile_in.manual_gpa is not None:
        profile.manual_gpa = profile_in.manual_gpa
    if profile_in.manual_major is not None:
        profile.manual_major = profile_in.manual_major
        
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/", response_model=ProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Profile).where(Profile.id == current_user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        # Auto-create empty profile
        profile = Profile(id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
    return profile
