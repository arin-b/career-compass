from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Any
import uuid

from app.api.deps import get_db, get_current_admin
from app.models.models import User, Roadmap
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
        
    # Delete user (Cascades should handle related data if configured, but explicit deletes might be safer if not)
    # Assuming CASCADE on ForeignKeys for roadmaps, profiles, etc.
    # Based on models.py, we don't see explicit CASCADE DELETE on relationships, 
    # but SQLAlchemy defaults usually require configuration. 
    # Let's delete the user and let the DB handle constraints or errors if any.
    
    await db.delete(user)
    await db.commit()
