from fastapi import APIRouter, Depends, UploadFile, File, Form
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.ai_service import process_transcript, query_vector_db
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

from app.api.deps import get_current_user
from app.models.models import User

@router.post("/upload-transcript")
async def upload_transcript(
    file: UploadFile = File(...), 
    mode: str = "replace",  # 'replace' | 'append'
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"Receiving upload: {file.filename}, mode: {mode}, content_type: {file.content_type}")
        return await process_transcript(current_user.id, file, db, mode)
    except Exception as e:
        print(f"CRITICAL ERROR in /upload-transcript: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/chat")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = await query_vector_db(request.query, db, current_user.id)
        print(f"LLM Response: {result}")
        
        # Normalize the reply - LangChain may return various formats
        reply = result.get("reply")
        
        # Handle array of message parts: [{"type": "text", "text": "...", "extras": {...}}]
        if isinstance(reply, list):
            text_parts = []
            for part in reply:
                if isinstance(part, dict) and "text" in part:
                    text_parts.append(part["text"])
                elif isinstance(part, str):
                    text_parts.append(part)
            reply = " ".join(text_parts)
        # Handle single object with text property
        elif isinstance(reply, dict):
            reply = reply.get("text") or reply.get("content") or str(reply)
        
        return {
            "response": reply,
            "context": result.get("context", [])
        }
    except Exception as e:
        print(f"CRITICAL ERROR in /chat: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e)})

