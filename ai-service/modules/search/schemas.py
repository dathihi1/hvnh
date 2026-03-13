from pydantic import BaseModel, Field
from typing import Optional, List

class ActivityItem(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    startTime: Optional[str] = None
    organization: Optional[str] = None
    category: Optional[str] = None
    approvalStatus: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=50)
    activities: List[ActivityItem] = Field(..., min_length=1)
