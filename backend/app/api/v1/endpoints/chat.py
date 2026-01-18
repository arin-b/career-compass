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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"Receiving upload: {file.filename}, content_type: {file.content_type}")
        return await process_transcript(current_user.id, file, db)
    except Exception as e:
        print(f"CRITICAL ERROR in /upload-transcript: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/chat")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # RAG: Retrieve context + LLM Response
        result = await query_vector_db(request.query, db)
        # Debug: Print the LLM response
        print(f"LLM Response: {result}")
        
        # Map 'reply' to 'response' for frontend standardization
        return {
            "response": result.get("reply"),
            "context": result.get("context", [])
        }
    except Exception as e:
        print(f"CRITICAL ERROR in /chat: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e)})
