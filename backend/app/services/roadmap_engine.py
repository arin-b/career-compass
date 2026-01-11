from typing import List, Dict, Any
import os
import json
import ast
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.logger import get_logger
from app.core.json_utils import extract_json

logger = get_logger()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def get_llm():
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found")
    # Using a model capable of reliable JSON generation
    return ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=GOOGLE_API_KEY, temperature=0.2)

async def generate_career_roadmap(transcript_text: str, interests: List[str]) -> Dict[str, Any]:
    """
    Generates a structured career roadmap based on transcript and interests.
    """
    llm = get_llm()
    
    system_prompt = """You are an expert Career Counselor AI.
    Your goal is to create a detailed, semester-by-semester career roadmap for a student.
    
    Input:
    - Transcript Summary (Text)
    - Student Interests (List)
    
    Output:
    - Strictly valid JSON format.
    - No markdown formatting.
    - The JSON must follow this structure:
    {
      "title": "Roadmap Title",
      "summary": "Brief summary.",
      "milestones": [
        {
          "semester": "Semester 1",
          "title": "Title",
          "description": "Desc.",
          "status": "Upcoming",
          "projects": ["Project 1", "Project 2"],
          "skills": ["Skill 1", "Skill 2"]
        }
      ]
    }
    """
    
    user_input = f"""
    TRANSCRIPT SUMMARY:
    {transcript_text}
    
    INTERESTS:
    {", ".join(interests)}
    
    Generate the roadmap JSON now.
    """
    
    logger.info("Sending Roadmap Generation Request to Gemini...")
    
    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_input)
        ])
        
        content = response.content
        if isinstance(content, list):
            content = "".join([c if isinstance(c, str) else str(c) for c in content])
            
        content = extract_json(content)
        
        # Log content for debug
        with open("debug_output.txt", "w") as f:
            f.write(content)
            
        try:
            roadmap_data = json.loads(content)
        except json.JSONDecodeError:
            logger.warning("JSON parse failed, attempting AST literal eval fallback...")
            try:
                # Fallback for Python-style dicts (single quotes)
                roadmap_data = ast.literal_eval(content)
            except Exception as e:
                logger.error(f"AST eval failed: {e}")
                raise ValueError(f"AI generated invalid format: {content[:100]}...")

        return roadmap_data
        
    except Exception as e:
        logger.error(f"Error generating roadmap: {e}")
        raise e
