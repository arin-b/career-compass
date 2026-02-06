import os
from typing import List
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from app.models.models import VectorStore
import io
from langchain_core.messages import HumanMessage, SystemMessage

def get_embeddings_model():
    if not os.getenv("GOOGLE_API_KEY"):
        raise ValueError("GOOGLE_API_KEY not found in environment")
    return GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=os.getenv("GOOGLE_API_KEY"))

def get_llm():
    if not os.getenv("GOOGLE_API_KEY"):
        raise ValueError("GOOGLE_API_KEY not found in environment")
    return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=os.getenv("GOOGLE_API_KEY"))

import pdfplumber
from app.models.models import VectorStore, Profile
from sqlalchemy import update
from uuid import UUID

async def process_transcript(user_id: UUID, file: UploadFile, db: AsyncSession, mode: str = "replace"):
    """
    Reads a PDF using pdfplumber, extracts text, saves to Profile, and updates VectorStore.
    Modes:
    - 'replace': Overwrites existing transcript text/metadata.
    - 'append': Appends new text/metadata to existing.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    content = await file.read()
    
    text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    
    from datetime import datetime
    new_metadata = {"name": file.filename, "date": datetime.utcnow().isoformat()}

    if profile:
        if mode == "append":
            # Append text with a separator
            current_text = profile.transcript_summary or ""
            profile.transcript_summary = current_text + "\n\n--- NEW FILE: " + file.filename + " ---\n\n" + text
            
            # Append metadata
            current_meta = profile.transcript_metadata or []
            # Ensure it's a list (in case of null/unexpected type from DB)
            if not isinstance(current_meta, list):
                current_meta = []
            current_meta.append(new_metadata)
            profile.transcript_metadata = list(current_meta) # Force update detection
        else:
            # Replace mode (default)
            profile.transcript_summary = text
            profile.transcript_metadata = [new_metadata]
    else:
        profile = Profile(
            id=user_id, 
            transcript_summary=text,
            transcript_metadata=[new_metadata]
        )
        db.add(profile)
    
    # We must explicitly flag JSON update if modifying in-place, but here we reassigned.
    db.add(profile)
    await db.commit()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_text(text)

    embeddings_model = get_embeddings_model()
    vectors = embeddings_model.embed_documents(chunks)

    for chunk, vector in zip(chunks, vectors):
        db_item = VectorStore(
            content=chunk,
            embedding=vector,
            metadata_={"source": file.filename, "type": "transcript", "user_id": str(user_id)}
        )
        db.add(db_item)
    
    await db.commit()
    return {"message": f"Processed {len(chunks)} chunks from {file.filename}", "transcript_length": len(text)}

async def query_vector_db(query: str, db: AsyncSession, user_id: UUID = None, limit: int = 3):
    """
    1. Embeds query.
    2. Searches VectorDB.
    3. Calls LLM with context.
    """
    embeddings_model = get_embeddings_model()
    query_vector = embeddings_model.embed_query(query)

    # Try to prioritize user-specific vectors when user_id is provided
    if user_id:
        stmt = (
            select(VectorStore)
            .where(VectorStore.metadata_.contains({"user_id": str(user_id)}))
            .order_by(VectorStore.embedding.l2_distance(query_vector))
            .limit(limit)
        )
    else:
        stmt = (
            select(VectorStore)
            .order_by(VectorStore.embedding.l2_distance(query_vector))
            .limit(limit)
        )

    result = await db.execute(stmt)
    matches = result.scalars().all()
    
    context_str = "\n\n".join([m.content for m in matches])
    sources = [m.metadata_ for m in matches]

    llm = get_llm()
    
    # Fetch user's Profile and include it in the prompt so the LLM retains full user context
    profile_context = ""
    if user_id:
        profile_res = await db.execute(select(Profile).where(Profile.id == user_id))
        profile = profile_res.scalar_one_or_none()
        if profile:
            pieces = []
            if profile.bio:
                pieces.append(f"Bio: {profile.bio}")
            if profile.transcript_summary:
                pieces.append(f"Transcript Summary: {profile.transcript_summary}")
            if profile.additional_context:
                pieces.append(f"Additional Context: {profile.additional_context}")
            if profile.skills:
                pieces.append(f"Skills: {profile.skills}")
            if profile.interests:
                pieces.append(f"Interests: {profile.interests}")
            if profile.manual_major:
                pieces.append(f"Declared Major: {profile.manual_major}")
            if profile.manual_gpa is not None:
                pieces.append(f"GPA: {profile.manual_gpa}")
            if profile.hobbies:
                pieces.append(f"Hobbies: {profile.hobbies}")
            if profile.extracurriculars:
                pieces.append(f"Extracurriculars: {profile.extracurriculars}")

            profile_context = "\n".join(pieces)

    system_prompt = """You are an expert Student Career Counselor AI.
Use the provided user profile and context (student transcripts, career info) to answer precisely and personally.
Keep your response SHORT and concise - 2-3 sentences max unless asked for detailed explanation.
Do NOT use markdown, bullet points, or special formatting. Plain text only.
If the context doesn't have enough info, say so briefly, but try to be helpful based on general knowledge.
"""

    user_prompt = f"User Profile:\n{profile_context}\n\nContext:\n{context_str}\n\nQuestion: {query}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ])

    return {
        "reply": response.content,
        "context": [{"content": m.content, "metadata": m.metadata_} for m in matches]
    }
