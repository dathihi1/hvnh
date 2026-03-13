import os
import google.generativeai as genai

_configured = False

def _ensure_configured():
    global _configured
    if not _configured:
        api_key = os.getenv("GEMINI_API_KEY", "").strip('"')
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        genai.configure(api_key=api_key)
        _configured = True

def get_model(model_name: str = None) -> genai.GenerativeModel:
    _ensure_configured()
    name = model_name or os.getenv("GEMINI_MODEL", "gemini-flash-latest")
    return genai.GenerativeModel(name)
