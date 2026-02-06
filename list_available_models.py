import os
import google.generativeai as genai

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("ERROR: GOOGLE_API_KEY environment variable not set")
    exit(1)

try:
    genai.configure(api_key=GOOGLE_API_KEY)
except Exception:
    # configure may be optional depending on package version
    pass

print("Available models from Google Generative AI API:\n")
print("=" * 60)

embedding_candidates = []
for model in genai.list_models():
    name = getattr(model, "name", None) or getattr(model, "model", None) or "<unknown>"
    display = getattr(model, "display_name", "")
    supported = getattr(model, "supported_generation_methods", None) or getattr(model, "supported_methods", None) or []
    print(f"\nModel: {name}")
    print(f"Display Name: {display}")
    print(f"Supported Methods: {supported}")
    if hasattr(model, 'description'):
        print(f"Description: {model.description}")

    # mark embedding-capable models
    try:
        if supported and "embedContent" in supported:
            embedding_candidates.append(name)
        elif "embed" in name or "embedding" in name or "text-embedding" in name:
            embedding_candidates.append(name)
    except Exception:
        pass

print("\n\nEmbedding-capable models (detected):")
for m in embedding_candidates:
    print(" - " + m)
