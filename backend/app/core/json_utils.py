import re
import json

def extract_json(text):
    """
    Extracts JSON object from a string using regex.
    Matches everything between the first { and the last }.
    """
    # Remove markdown code blocks if present
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```', '', text)
    
    # regex to find the outer-most braces
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    return text.strip()
