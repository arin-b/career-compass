import requests
import json
import sys

def test_roadmap_gen():
    url = "http://localhost:8000/api/v1/roadmaps/generate"
    # User ID for "Alex H."
    user_id = "7dd566d5-5571-40f6-b913-e5e681ea0cb1"
    
    payload = {
        "user_id": user_id,
        "interests": ["Software Engineering", "AI", "Distributed Systems"],
        "transcript_summary": "Student has completed Data Structures (A), Algorithms (A), and Intro to Systems (B+)."
    }
    
    print(f"Testing Roadmap Generation for User: {user_id}")
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("\n--- Response ---")
        print(f"Message: {data.get('message')}")
        print(f"Roadmap ID: {data.get('roadmap_id')}")
            
    except Exception as e:
        print(f"Error: {e}")
        if response:
             print(f"Status Code: {response.status_code}")
             print(f"Response: {response.text}")

if __name__ == "__main__":
    test_roadmap_gen()
