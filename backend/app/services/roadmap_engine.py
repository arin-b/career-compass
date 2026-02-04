from typing import List, Dict, Any
import os
import json
import ast
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.logger import get_logger
from app.core.json_utils import extract_json
from datetime import datetime

logger = get_logger()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def get_llm():
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found")
    return ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=GOOGLE_API_KEY, temperature=0)

async def generate_career_roadmap(transcript_text: str, interests: List[str], manual_profile_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generates a structured career roadmap based on transcript and interests, prioritizing manual profile data.
    """
    if manual_profile_data is None:
        manual_profile_data = {}

    llm = get_llm()
    
    manual_gpa = manual_profile_data.get("manual_gpa")
    manual_major = manual_profile_data.get("manual_major")
    hobbies = manual_profile_data.get("hobbies", [])
    extracurriculars = manual_profile_data.get("extracurriculars", [])
    bio = manual_profile_data.get("bio", "")
    additional_context = manual_profile_data.get("additional_context", "")

    # Construct formatted profile string for the prompt
    user_profile_str = f"""
    CURRENT USER PROFILE:
    - Transcript Major: {manual_major if manual_major else 'Extracted from Transcript'}
    - MANUAL TARGET MAJOR/FIELD: {manual_major if manual_major else 'N/A'}
    - GPA: {manual_gpa if manual_gpa else 'N/A'}
    - Hobbies/Interests: {', '.join(hobbies)}
    - Extracurriculars: {', '.join(extracurriculars)}
    - CRITICAL CONTEXT (USER GOALS): {additional_context}
    
    TRANSCRIPT DATA (Background):
    {transcript_text[:5000] if transcript_text else 'N/A'} 
    """

    logger.info(f"USER PROFILE DATA: {user_profile_str}")

    current_date = datetime.now().strftime("%B %d %Y")
    system_prompt = f"""
    Current Date: {current_date}
    You are an expert Career Counselor AI.
    Your goal is to create a detailed, semester-by-semester career roadmap based on the COMPLETE user profile provided.
    
    CRITICAL INSTRUCTIONS:
    1. **Holistic Analysis**: You MUST incorporate ALL details from the provided user profile, including manual major, GPA, hobbies, extracurriculars, bio, additional context, and transcript data.
    2. **Pivot Logic**: If the 'MANUAL TARGET MAJOR' or 'CRITICAL CONTEXT' indicates a desire to change fields (e.g., CS student wanting to be an Economist), YOU MUST PRIORITIZE THE USER'S GOAL over their transcript history. 
       - Create a roadmap for the new field.
       - Use the transcript only to identify transferable skills (math, logic, etc.).
       - Do NOT force them into a career path matching their transcript if they explicitly asked for something else.
    3. **Academic Alignment**: Use the transcript to gauge their current level if relevant to the target field.
    4. **Structure**: Output strictly valid JSON.
    
    Output:
    - Strictly valid JSON format.
    - No markdown formatting.
    - The JSON must have these top-level keys: title (string), summary (string), milestones (array)
    - Each milestone in the milestones array must have: semester (string), title (string), description (string), status (string), projects (array of strings), skills (array of strings)
    """
    
    user_input = f"""
    Based on the following STUDENT CONTEXT, generate a personalized career roadmap JSON that incorporates all the provided details, including hobbies, extracurriculars, manual major, GPA, bio, additional context, and transcript data. Do not generate a generic roadmap; tailor it specifically to this student's profile.

    STUDENT CONTEXT:
    {user_profile_str}
    
    Generate the roadmap JSON now.
    """
    
    logger.info(f"FINAL PROMPT SYSTEM:\n{system_prompt}")
    logger.info(f"FINAL PROMPT USER:\n{user_input}")
    
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
