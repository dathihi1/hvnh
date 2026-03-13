import os
import sys

REQUIRED_VARS = ["GEMINI_API_KEY", "AI_SERVICE_SECRET"]

def validate_env():
    missing = [key for key in REQUIRED_VARS if not os.getenv(key)]
    if missing:
        print(f"Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)
    print("All required environment variables are set")
