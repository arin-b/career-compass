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

import google.generativeai as genai

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("CRITICAL WARNING: GOOGLE_API_KEY is missing from environment variables! AI features will fail.")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

def get_embeddings_model():
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment")
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=GOOGLE_API_KEY)

def get_llm():
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment")
    return ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=GOOGLE_API_KEY)


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

    # VECTOR SEARCH DISABLED - Commented out for now
    # text_splitter = RecursiveCharacterTextSplitter(
    #     chunk_size=1000,
    #     chunk_overlap=200,
    #     length_function=len,
    # )
    # chunks = text_splitter.split_text(text)
    #
    # embeddings_model = get_embeddings_model()
    # vectors = embeddings_model.embed_documents(chunks)
    #
    # for chunk, vector in zip(chunks, vectors):
    #     db_item = VectorStore(
    #         content=chunk,
    #         embedding=vector,
    #         metadata_={"source": file.filename, "type": "transcript", "user_id": str(user_id)}
    #     )
    #     db.add(db_item)
    #
    # await db.commit()
    
    return {"message": f"Processed transcript from {file.filename}", "transcript_length": len(text)}

async def query_vector_db(query: str, db: AsyncSession, limit: int = 3):
    """
    VECTOR SEARCH DISABLED - Using LLM directly without vector context.
    
    Previously:
    1. Embeds query.
    2. Searches VectorDB.
    3. Calls LLM with context.
    
    Now: Just calls LLM with the query.
    """
    # VECTOR SEARCH DISABLED - Commented out for now
    # embeddings_model = get_embeddings_model()
    # query_vector = embeddings_model.embed_query(query)
    #
    # stmt = select(VectorStore).order_by(
    #     VectorStore.embedding.l2_distance(query_vector)
    # ).limit(limit)
    #
    # result = await db.execute(stmt)
    # matches = result.scalars().all()
    #
    # context_str = "\n\n".join([m.content for m in matches])
    # sources = [m.metadata_ for m in matches]

    llm = get_llm()

    system_prompt = """You are an expert Student Career Counselor AI. 
    Answer questions helpfully based on general knowledge.
    IMPORTANT: Respond ONLY in plain text. Do NOT use markdown, bullet points, bold, italics, or any special formatting. Keep your response clear and simple."""

    user_prompt = f"Question: {query}"

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ])

    return {
        "reply": response.content,
        # "context": [{"content": m.content, "metadata": m.metadata_} for m in matches]  # VECTOR SEARCH DISABLED
    }