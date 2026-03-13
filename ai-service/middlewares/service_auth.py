import os
from fastapi import Header, HTTPException

async def verify_service_key(x_service_key: str = Header(...)):
    expected = os.getenv("AI_SERVICE_SECRET")
    if not x_service_key or x_service_key != expected:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED_SERVICE", "message": "Invalid or missing service key"},
        )
