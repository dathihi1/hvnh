import os
from dotenv import load_dotenv

load_dotenv()

from config.env import validate_env
from app import create_app

validate_env()
app = create_app()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
