from pydantic import BaseModel, Field
from typing import Optional, Literal

class ScanIdRequest(BaseModel):
    image: str = Field(..., min_length=1)
    mimeType: Literal["image/jpeg","image/png","image/webp","image/heif","image/heic"] = "image/jpeg"

class ExtractedInfo(BaseModel):
    studentId: Optional[str] = None
    fullName: Optional[str] = None
    university: Optional[str] = None
    dateOfBirth: Optional[str] = None
    majorOrClass: Optional[str] = None
    confidence: Literal["HIGH","MEDIUM","LOW"] = "LOW"
