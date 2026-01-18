from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    hobbies: Optional[List[str]] = []
    extracurriculars: Optional[List[str]] = []
    manual_gpa: Optional[float] = None
    manual_major: Optional[str] = None
    
    # Identity
    display_name: Optional[str] = None
    avatar_base64: Optional[str] = None

class ProfileResponse(BaseModel):
    id: UUID
    bio: Optional[str] = None
    hobbies: List[str] = []
    extracurriculars: List[str] = []
    manual_gpa: Optional[float] = None
    manual_major: Optional[str] = None
    transcript_summary: Optional[str] = None
    
    # Identity
    display_name: Optional[str] = None
    avatar_base64: Optional[str] = None

    class Config:
        from_attributes = True
