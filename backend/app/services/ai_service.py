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

# Configure Google AI
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

# ... imports ...

async def process_transcript(user_id: UUID, file: UploadFile, db: AsyncSession):
    """
    Reads a PDF using pdfplumber, extracts text, saves to Profile, and updates VectorStore.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    content = await file.read()
    
    # Extract Text with pdfplumber
    text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    # Update Profile
    # Check if profile exists
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    
    if profile:
        profile.transcript_summary = text
    else:
        # Create new profile if it doesn't exist (though usually it should)
        profile = Profile(id=user_id, transcript_summary=text)
        db.add(profile)
    
    # We commit here to save the transcript text
    await db.commit()

    # Chunking for Vector Store (RAG)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_text(text)

    # Embedding
    embeddings_model = get_embeddings_model()
    vectors = embeddings_model.embed_documents(chunks)

    # Storage
    for chunk, vector in zip(chunks, vectors):
        db_item = VectorStore(
            content=chunk,
            embedding=vector,
            metadata_={"source": file.filename, "type": "transcript", "user_id": str(user_id)}
        )
        db.add(db_item)
    
    await db.commit()
    return {"message": f"Processed {len(chunks)} chunks from {file.filename}", "transcript_length": len(text)}

async def query_vector_db(query: str, db: AsyncSession, limit: int = 3):
    """
    1. Embeds query.
    2. Searches VectorDB.
    3. Calls LLM with context.
    """
    # 1. Embed Query
    embeddings_model = get_embeddings_model()
    query_vector = embeddings_model.embed_query(query)

    # 2. Search DB
    stmt = select(VectorStore).order_by(
        VectorStore.embedding.l2_distance(query_vector)
    ).limit(limit)
    
    result = await db.execute(stmt)
    matches = result.scalars().all()
    
    context_str = "\n\n".join([m.content for m in matches])
    sources = [m.metadata_ for m in matches]

    # 3. Call LLM
    llm = get_llm()
    
    system_prompt = """You are an expert Student Career Counselor AI. 
    Use the provided context (student transcripts, career info) to answer variables.
    If the context doesn't have enough info, say so, but try to be helpful based on general knowledge.
    """
    
    user_prompt = f"Context:\n{context_str}\n\nQuestion: {query}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ])

    return {
        "reply": response.content,
        "context": [{"content": m.content, "metadata": m.metadata_} for m in matches]
    }
