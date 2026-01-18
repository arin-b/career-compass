import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class AcademicLevel(str, enum.Enum):
    HIGH_SCHOOL = "HighSchool"
    UNDERGRADUATE = "Undergraduate"
    GRADUATE = "Graduate"
    OTHER = "Other"

class RoadmapStatus(str, enum.Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    ARCHIVED = "Archived"

class MilestoneStatus(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In_Progress"
    DONE = "Done"

class ChatRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    academic_level = Column(Enum(AcademicLevel), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Identity Management
    display_name = Column(String, nullable=True)
    avatar_base64 = Column(Text, nullable=True) # Storing base64 string directly

    profile = relationship("Profile", back_populates="user", uselist=False)
    roadmaps = relationship("Roadmap", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    interests = Column(JSONB, default=list)
    transcript_summary = Column(Text, nullable=True)
    skills = Column(JSONB, default=list)
    
    # New Fields for Profile Upgrade
    bio = Column(Text, nullable=True)
    hobbies = Column(JSONB, default=list)
    extracurriculars = Column(JSONB, default=list)
    manual_gpa = Column(Float, nullable=True)
    manual_major = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(JSONB, nullable=False) # Structured roadmap data
    status = Column(Enum(RoadmapStatus), default=RoadmapStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    milestones = relationship("RoadmapMilestone", back_populates="roadmap")

class RoadmapMilestone(Base):
    __tablename__ = "roadmap_milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("roadmaps.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    info = Column(JSONB, default={}) # Stores unstructured data like projects, skills

    roadmap = relationship("Roadmap", back_populates="milestones")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(Enum(ChatRole), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class VectorStore(Base):
    __tablename__ = "vector_store"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSONB, default={}) # metadata is a reserved word in some contexts, but valid column name
    embedding = Column(Vector(768)) # Gemini Embeddings dimension
