import requests
import json
import sys

def test_ai():
    url = "http://localhost:8000/api/v1/chat"
    query = "What should I study next?"
    
    print(f"Testing AI Chat with query: '{query}'")
    
    try:
        response = requests.post(url, json={"query": query})
        response.raise_for_status()
        data = response.json()
        
        print("\n--- AI Response ---")
        print(f"Reply: {data.get('reply')}")
        print("\n--- Context Used ---")
        for ctx in data.get('context', []):
            print(f"- {ctx.get('content')[:100]}...")
            
    except Exception as e:
        print(f"Error: {e}")
        if response:
             print(response.text)

if __name__ == "__main__":
    test_ai()
