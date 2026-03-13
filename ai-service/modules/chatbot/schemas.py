from pydantic import BaseModel, Field
from typing import Literal, List, Optional


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    content: str


class PortalContext(BaseModel):
    """Optional context about the portal to inject into system prompt."""
    activities: List[dict] = []
    organizations: List[dict] = []
    currentUser: Optional[dict] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: List[ChatMessage] = []
    context: PortalContext = PortalContext()


class ChatResponse(BaseModel):
    reply: str
    history: List[ChatMessage]
