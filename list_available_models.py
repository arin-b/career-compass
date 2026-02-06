import os
import google.generativeai as genai

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("ERROR: GOOGLE_API_KEY environment variable not set")
    exit(1)

genai.configure(api_key=GOOGLE_API_KEY)

print("Available models from Google Generative AI API:\n")
print("=" * 60)

for model in genai.list_models():
    print(f"\nModel: {model.name}")
    print(f"Display Name: {model.display_name}")
    print(f"Supported Methods: {model.supported_generation_methods}")
    if hasattr(model, 'description'):
        print(f"Description: {model.description}")
