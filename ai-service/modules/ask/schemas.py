from pydantic import BaseModel, Field
from typing import Optional, List

class ActivityContext(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    startTime: Optional[str] = None
    organization: Optional[str] = None
    category: Optional[str] = None
    approvalStatus: Optional[str] = None

class OrganizationContext(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None

class AskContext(BaseModel):
    activities: List[ActivityContext] = []
    organizations: List[OrganizationContext] = []

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    context: AskContext = AskContext()
