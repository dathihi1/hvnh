from pydantic import BaseModel, Field
from typing import Optional, List

class PastActivity(BaseModel):
    name: str
    category: Optional[str] = None
    organization: Optional[str] = None

class UserProfile(BaseModel):
    pastActivities: List[PastActivity] = []
    clubMemberships: List[str] = []

class UpcomingActivity(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    organization: Optional[str] = None
    startTime: Optional[str] = None

class RecommendRequest(BaseModel):
    limit: int = Field(default=5, ge=1, le=20)
    userProfile: UserProfile
    upcomingActivities: List[UpcomingActivity] = Field(..., min_length=1)
